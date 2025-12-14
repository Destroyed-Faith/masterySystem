/**
 * Radial Menu for Combat Action Selection
 * PIXI-based radial menu that appears on the canvas around tokens
 * Replaces the dialog-based option selection
 */

import { getAvailableManeuvers, CombatManeuver } from './system/combat-maneuvers';
import type { CombatSlot } from './system/combat-maneuvers';
import { handleChosenCombatOption } from './token-action-selector';

/**
 * Range category for combat options
 */
export type RangeCategory = 'melee' | 'ranged' | 'self' | 'area';

/**
 * Target group for utility powers
 */
export type TargetGroup = 'self' | 'ally' | 'enemy' | 'creature' | 'any';

/**
 * AoE shape for utility powers
 */
export type AoEShape = 'none' | 'radius' | 'cone' | 'line';

/**
 * Combat option interface for the radial menu
 */
export interface RadialCombatOption {
  id: string;
  name: string;
  description: string;
  slot: CombatSlot;  // "attack" | "movement" | "utility" | "reaction"
  source: 'power' | 'maneuver';
  range?: number; // numeric range in meters
  rangeCategory?: RangeCategory; // Category of range (melee, ranged, self, area)
  meleeReachMeters?: number; // Optional override for melee reach in meters
  // Utility targeting fields
  rangeMeters?: number; // Max distance to center or target (for utilities)
  aoeShape?: AoEShape; // AoE shape: "none" | "radius" | "cone" | "line"
  aoeRadiusMeters?: number; // For radius utilities
  defaultTargetGroup?: TargetGroup; // "ally" / "enemy" / "creature" / "any"
  allowManualTargetSelection?: boolean; // Default true for Utilities
  item?: any;  // The item document if source is 'power'
  maneuver?: CombatManeuver;  // The maneuver definition if source is 'maneuver'
  powerType?: string; // e.g. "active" | "active-buff" | "movement" | "utility" | "reaction"
  tags?: string[];  // Tags for additional filtering (e.g. ["buff", "stance"])
}

/**
 * Inner segment definition
 */
interface InnerSegment {
  id: 'movement' | 'attack' | 'utility' | 'active-buff';
  color: number;
  label: string;
}

const MS_INNER_SEGMENTS: InnerSegment[] = [
  { id: 'movement', color: 0xffe066, label: 'Move' },
  { id: 'attack', color: 0xff6666, label: 'Atk' },
  { id: 'utility', color: 0x66aaff, label: 'Util' },
  { id: 'active-buff', color: 0xcc88ff, label: 'Buff' }
];

const MS_INNER_RADIUS = 60;
const MS_OUTER_RING_INNER = 80;  // Inner radius of outer ring (where wedges start)
const MS_OUTER_RING_OUTER = 140;  // Outer radius of outer ring (where wedges end)

// Global state
let msRadialMenu: PIXI.Container | null = null;
let msRangePreviewGfx: PIXI.Graphics | null = null;
let msRadialCloseHandler: ((event: MouseEvent) => void) | null = null;
let msTokenHUD: JQuery | null = null; // Reference to the Token HUD element to hide/show
let msCurrentTokenId: string | null = null; // ID of token with open radial menu

/**
 * Parse range string (e.g., "8m", "12m", "Self") to numeric meters
 */
function parseRange(rangeStr: string | undefined): number | undefined {
  if (!rangeStr) return undefined;
  
  // Handle "Self" or "0m" as 0
  if (rangeStr.toLowerCase() === 'self' || rangeStr === '0m') {
    return 0;
  }
  
  // Extract numeric value from strings like "8m", "12m", "24m"
  const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return undefined;
}

/**
 * Convert system units (meters) to pixels
 */
function unitsToPixels(units: number): number {
  // 1 unit = 1 grid square
  // canvas.grid.size = pixels per square
  return units * (canvas.grid?.size || 100);
}

/**
 * Clear the range preview graphics
 */
function clearRangePreview(): void {
  if (msRangePreviewGfx && msRangePreviewGfx.parent) {
    msRangePreviewGfx.parent.removeChild(msRangePreviewGfx);
  }
  msRangePreviewGfx = null;
  
  // Also clear hex highlights
  if (canvas.grid) {
    let highlight: any = null;
    try {
      if (canvas.interface?.grid?.highlight) {
        highlight = canvas.interface.grid.highlight;
      } else if (canvas.grid?.highlight) {
        highlight = canvas.grid.highlight;
      } else if ((canvas.grid as any).getHighlightLayer) {
        highlight = (canvas.grid as any).getHighlightLayer('mastery-range-preview');
      }
    } catch (error) {
      // Ignore errors
    }
    
    if (highlight && typeof highlight.clear === 'function') {
      highlight.clear();
    }
  }
}

/**
 * Show range preview circle around token
 * If a grid is present, also highlights hex fields within range
 */
function showRangePreview(token: any, rangeUnits: number): void {
  clearRangePreview();
  
  if (!rangeUnits || rangeUnits <= 0) return;
  
  const tokenCenter = token.center;
  const radiusPx = unitsToPixels(rangeUnits);
  const gfx = new PIXI.Graphics();
  
  // Only draw circle if no grid is present, or as a fallback
  // If grid is present, we'll highlight hexes instead
  if (!canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) {
    // Cyan circle with transparency
    gfx.lineStyle(2, 0x00ffff, 0.8);
    gfx.beginFill(0x00ffff, 0.1);
    gfx.drawCircle(0, 0, radiusPx);
    gfx.endFill();
  }
  
  msRangePreviewGfx = gfx;
  
  // Add to effects layer so it appears above tokens
  // Try multiple approaches for Foundry v13 compatibility
  let effectsContainer: PIXI.Container | null = null;
  
  if (canvas.effects) {
    // Try v13 structure first (container property)
    if ((canvas.effects as any).container && typeof (canvas.effects as any).container.addChild === 'function') {
      effectsContainer = (canvas.effects as any).container;
    }
    // Try direct addChild (older versions)
    else if (typeof (canvas.effects as any).addChild === 'function') {
      effectsContainer = canvas.effects as any;
    }
  }
  
  // Fallback to foreground if effects doesn't work
  if (!effectsContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      effectsContainer = (canvas.foreground as any).container;
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      effectsContainer = canvas.foreground as any;
    }
  }
  
  if (effectsContainer) {
    effectsContainer.addChild(gfx);
    // Position at token center
    gfx.position.set(tokenCenter.x, tokenCenter.y);
  } else {
    console.warn('Mastery System | Could not find effects layer for range preview');
  }
  
  // If grid is present, highlight hex fields within range
  if (canvas.grid && canvas.grid.type !== CONST.GRID_TYPES.GRIDLESS) {
    highlightRangeHexes(tokenCenter, rangeUnits, 'mastery-range-preview');
  }
}

/**
 * Highlight hex fields within range on the grid
 * @param center - Center point in pixels
 * @param rangeUnits - Range in grid units (1m = 1 hex)
 * @param highlightId - Unique ID for this highlight layer
 */
function highlightRangeHexes(center: { x: number; y: number }, rangeUnits: number, highlightId: string): void {
  if (!canvas.grid) return;
  
  // Get highlight layer
  let highlight: any = null;
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
      highlight = canvas.grid.highlight;
    } else if ((canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(highlightId);
      if (!highlight && (canvas.grid as any).addHighlightLayer) {
        highlight = (canvas.grid as any).addHighlightLayer(highlightId);
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not get highlight layer for range preview', error);
    return;
  }
  
  if (!highlight) {
    console.warn('Mastery System | No highlight layer available for range preview');
    return;
  }
  
  // Clear previous highlights
  if (typeof highlight.clear === 'function') {
    highlight.clear();
  }
  
  // Get grid position of center using new v13 API
  let centerGrid: { col: number; row: number } | null = null;
  try {
    if (canvas.grid?.getOffset) {
      // New v13 API: getOffset returns {col, row}
      const offset = canvas.grid.getOffset(center.x, center.y);
      centerGrid = { col: offset.col, row: offset.row };
    } else if (canvas.grid?.getGridPositionFromPixels) {
      // Fallback to old API
      const oldGrid = canvas.grid.getGridPositionFromPixels(center.x, center.y);
      if (oldGrid) {
        centerGrid = { col: oldGrid.x, row: oldGrid.y };
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not get grid position for range preview', error);
    return;
  }
  
  if (!centerGrid) return;
  
  // Calculate max hex distance (round up to include all hexes within range)
  const maxHexDistance = Math.ceil(rangeUnits);
  
  // Iterate through all hexes within range
  for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
    for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
      const gridCol = centerGrid.col + q;
      const gridRow = centerGrid.row + r;
      
      // Get hex center position
      let hexCenter: { x: number; y: number } | null = null;
      try {
        if (canvas.grid?.getTopLeftPoint) {
          // New v13 API: getTopLeftPoint(col, row) returns center point
          hexCenter = canvas.grid.getTopLeftPoint(gridCol, gridRow);
        } else if (canvas.grid?.getPixelsFromGridPosition) {
          // Fallback to old API
          hexCenter = canvas.grid.getPixelsFromGridPosition(gridCol, gridRow);
        }
      } catch (error) {
        // Skip this hex if we can't get its position
        continue;
      }
      
      if (!hexCenter) continue;
      
      // Calculate distance from center to this hex
      const dx = hexCenter.x - center.x;
      const dy = hexCenter.y - center.y;
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      const gridDistance = pixelDistance / (canvas.grid.size || 1);
      
      // Use Foundry's distance measurement if available (for hex grids)
      let distanceInUnits = gridDistance;
      try {
        if (canvas.grid?.measurePath) {
          // New v13 API: measurePath returns array of distances
          const waypoints = [
            { x: center.x, y: center.y },
            { x: hexCenter.x, y: hexCenter.y }
          ];
          const measurement = canvas.grid.measurePath(waypoints, {});
          if (measurement && measurement.length > 0) {
            distanceInUnits = measurement[0];
          }
        } else if (canvas.grid?.measureDistances) {
          // Fallback to old API
          const waypoints = [
            { x: center.x, y: center.y },
            { x: hexCenter.x, y: hexCenter.y }
          ];
          const measurement = canvas.grid.measureDistances(waypoints, {});
          if (measurement && measurement.length > 0) {
            distanceInUnits = measurement[0];
          }
        }
      } catch (error) {
        // Use fallback distance
      }
      
      // If hex is within range, highlight it
      if (distanceInUnits <= rangeUnits) {
        // Try different methods to highlight the hex
        try {
          if (highlight && typeof highlight.highlightPosition === 'function') {
            highlight.highlightPosition(gridCol, gridRow, { color: 0x00ffff, alpha: 0.4 });
          } else if (highlight && typeof highlight.highlightGridPosition === 'function') {
            highlight.highlightGridPosition(gridCol, gridRow, { color: 0x00ffff, alpha: 0.4 });
          } else if (highlight && typeof highlight.highlight === 'function') {
            highlight.highlight(gridCol, gridRow, { color: 0x00ffff, alpha: 0.4 });
          }
        } catch (error) {
          // Silently fail if highlighting doesn't work
        }
      }
    }
  }
}

/**
 * Close the radial menu and clean up
 */
export function closeRadialMenu(): void {
  clearRangePreview();
  hideRadialInfoPanel();
  
  const previousTokenId = msCurrentTokenId;
  msCurrentTokenId = null;
  
  if (msRadialMenu && msRadialMenu.parent) {
    msRadialMenu.parent.removeChild(msRadialMenu);
  }
  msRadialMenu = null;
  
  if (msRadialCloseHandler) {
    window.removeEventListener('mousedown', msRadialCloseHandler, true);
    msRadialCloseHandler = null;
  }
  
  // Notify turn indicator that radial menu closed
  if (previousTokenId) {
    Hooks.call('masterySystem.radialMenuClosed', previousTokenId);
  }
  
  // Show Token HUD again if it was hidden
  if (msTokenHUD && msTokenHUD.length > 0) {
    msTokenHUD.css('display', '');
    msTokenHUD = null;
    console.log('Mastery System | Token HUD restored');
  }
  
  // Don't cancel melee/utility targeting when menu closes
  // The targeting modes should remain active so the user can select targets
  // They will be cancelled when the user clicks outside or presses ESC
}

/**
 * Map an option to one of the 4 inner segment IDs
 * This determines which inner quadrant (Buff/Move/Util/Atk) an option belongs to
 */
function getSegmentIdForOption(option: RadialCombatOption): InnerSegment['id'] {
  // Active Buff powers get their own segment
  // Check if it's a power with buff/active-buff type that requires an action
  if (option.source === 'power' && option.item) {
    const powerType = option.powerType || (option.item.system as any)?.powerType;
    const cost = (option.item.system as any)?.cost;
    
    // If it's explicitly an active-buff or buff power that requires an action, it's an active buff
    if ((powerType === 'active-buff' || powerType === 'buff') && cost?.action === true) {
      return 'active-buff';
    }
    
    // Check tags for active-buff indicators
    const tags = option.tags || [];
    if (tags.includes('active-buff') || tags.includes('buff') || tags.includes('stance')) {
      if (cost?.action === true) {
        return 'active-buff';
      }
    }
    
    // Also check if power type is 'active' but has buff-like characteristics
    if (powerType === 'active' && option.slot === 'attack') {
      // Check if description or name suggests it's a buff
      const nameLower = option.name.toLowerCase();
      const descLower = (option.description || '').toLowerCase();
      if (nameLower.includes('buff') || descLower.includes('buff') || 
          nameLower.includes('stance') || descLower.includes('stance')) {
        return 'active-buff';
      }
    }
  }
  
  // Map by slot
  switch (option.slot) {
    case 'movement':
      return 'movement';
    case 'attack':
      return 'attack';
    case 'utility':
      return 'utility';
    case 'reaction':
      // Reactions go to utility segment
      return 'utility';
    default:
      // Default to attack for offensive actions
      return 'attack';
  }
}

/**
 * Get all combat options for an actor (all categories)
 * Collects all Powers and Maneuvers available to the actor
 */
export async function getAllCombatOptionsForActor(actor: any): Promise<RadialCombatOption[]> {
  const options: RadialCombatOption[] = [];
  
  if (!actor) {
    console.warn('Mastery System | getAllCombatOptionsForActor: No actor provided');
    return options;
  }
  
  // Pre-load power definitions for range lookup
  let getPowerFn: ((treeName: string, powerName: string) => any) | null = null;
  try {
    // Foundry resolves dynamic imports relative to the current file location
    // From dist/token-radial-menu.js to dist/utils/powers/index.js
    const powerModule = await import('./utils/powers/index.js' as any);
    getPowerFn = powerModule.getPower;
  } catch (error) {
    console.warn('Mastery System | Could not load power definitions module:', error);
  }
  
  // --- POWERS (from Actor items) ---
  const items = actor.items || [];
  
  for (const item of items) {
    // Powers are stored as items with type "special"
    if (item.type !== 'special') continue;
    
    const powerType = (item.system as any)?.powerType;
    if (!powerType) continue;
    
    // Only include combat-usable powers
    // Include: movement, active, active-buff, buff, utility, reaction
    // Exclude: passive (these are not combat actions)
    if (!['movement', 'active', 'active-buff', 'buff', 'utility', 'reaction'].includes(powerType)) {
      continue;
    }
    
    // Map power type to slot
    const slot = mapPowerTypeToSlot(powerType);
    
    // Parse range from system.range (e.g., "8m", "12m", "Self")
    let rangeStr = (item.system as any)?.range;
    let range = parseRange(rangeStr);
    let levelData: any = undefined;
    
    // If range is missing or empty, try to get it from the power definition
    // This handles cases where the level was changed but range wasn't updated
    if ((!rangeStr || !range) && getPowerFn) {
      const treeName = (item.system as any)?.tree;
      const powerName = item.name;
      const level = (item.system as any)?.level || 1;
      
      if (treeName && powerName) {
        try {
          const powerDef = getPowerFn(treeName, powerName);
          
          if (powerDef && powerDef.levels) {
            levelData = powerDef.levels.find((l: any) => l.level === level);
            if (levelData && levelData.range) {
              rangeStr = levelData.range;
              range = parseRange(rangeStr);
            }
          }
        } catch (error) {
          // If lookup fails, just use the existing range (or undefined)
          console.warn('Mastery System | Could not lookup power definition for range:', error);
        }
      }
    }
    
    // Determine range category
    const rangeCategory = determineRangeCategory(rangeStr, powerType, levelData);
    
    // Parse AoE information for utilities
    let aoeShape: AoEShape = 'none';
    let aoeRadiusMeters: number | undefined = undefined;
    let rangeMeters: number | undefined = range;
    
    if (slot === 'utility' || powerType === 'utility') {
      // Get AoE from system or level data
      let aoeStr = (item.system as any)?.aoe;
      if (!aoeStr && levelData && levelData.aoe) {
        aoeStr = levelData.aoe;
      }
      
      aoeShape = parseAoEShape(aoeStr);
      aoeRadiusMeters = parseAoERadius(aoeStr);
      
      // For utilities, rangeMeters is the max distance to center
      rangeMeters = range;
      
      // If range is "Self" or 0 and has AoE, it's a self-aura
      if ((!rangeStr || rangeStr.toLowerCase() === 'self' || range === 0) && aoeShape !== 'none') {
        rangeMeters = 0; // Self-aura
      }
    }
    
    // Get tags if available
    const tags = (item.system as any)?.tags || [];
    
    const option: RadialCombatOption = {
      id: item.id,
      name: item.name,
      description: (item.system as any)?.description || (item.system as any)?.effect || '',
      slot: slot,
      source: 'power',
      range: range,
      rangeCategory: rangeCategory,
      item: item,
      powerType: powerType,
      tags: Array.isArray(tags) ? tags : []
    };
    
    // Add utility targeting fields if this is a utility
    if (slot === 'utility' || powerType === 'utility') {
      option.rangeMeters = rangeMeters;
      option.aoeShape = aoeShape;
      option.aoeRadiusMeters = aoeRadiusMeters;
      option.defaultTargetGroup = determineTargetGroup(option);
      option.allowManualTargetSelection = true; // Default true for utilities
    }
    
    options.push(option);
  }
  
  // --- MANEUVERS (generic combat maneuvers) ---
  // Get available maneuvers for this actor (filters by requirements)
  const availableManeuvers = getAvailableManeuvers(actor);
  
  // Get actor's speed for movement maneuvers
  const actorSpeed = (actor.system as any)?.combat?.speed || 6; // Default to 6m if not set
  
  for (const maneuver of availableManeuvers) {
    // Filter out Multiattacks from the radial menu
    if (maneuver.tags?.includes('multiattack') || maneuver.id?.includes('multiattack')) {
      continue; // Skip Multiattack maneuvers
    }
    
    // For attack slot: only allow Weapon Attack and the two main stances (Parry Stance and Dodge Stance)
    if (maneuver.slot === 'attack') {
      // Only allow Parry Stance and Dodge Stance
      if (maneuver.id !== 'parry-stance' && maneuver.id !== 'dodge-stance') {
        // Check if it's a "Weapon Attack" - this might be a special case or we need to add it
        // For now, skip all other attack maneuvers except the two stances
        continue;
      }
    }
    
    // Maneuvers have their slot defined in the maneuver data
    // For "move" maneuver, use the actor's speed as range
    let maneuverRange: number | undefined = undefined;
    
    if (maneuver.id === 'move') {
      maneuverRange = actorSpeed;
    }
    // Other movement maneuvers might also benefit from speed-based range
    else if (maneuver.slot === 'movement' && maneuver.tags?.includes('speed')) {
      // For maneuvers that mention speed (like Dash), calculate based on speed
      if (maneuver.id === 'dash') {
        maneuverRange = actorSpeed * 2;
      } else if (maneuver.id === 'flee-you-fools') {
        maneuverRange = actorSpeed * 3;
      }
    }
    
    // Determine range category for maneuvers
    let maneuverRangeCategory: RangeCategory = 'melee'; // Default
    if (maneuver.id === 'move' || maneuver.slot === 'movement') {
      maneuverRangeCategory = 'self';
    } else if (maneuver.slot === 'attack') {
      // Weapon Attack and melee stances are melee
      maneuverRangeCategory = 'melee';
    }
    
    options.push({
      id: maneuver.id,
      name: maneuver.name,
      description: maneuver.description || (maneuver.effect || ''),
      slot: maneuver.slot,
      source: 'maneuver',
      range: maneuverRange,
      rangeCategory: maneuverRangeCategory,
      maneuver: maneuver,
      tags: maneuver.tags || []
    });
  }
  
  // Add "Weapon Attack" as a standard attack option if not already present
  // Check if we already have a weapon attack option
  const hasWeaponAttack = options.some(opt => 
    opt.slot === 'attack' && (opt.id === 'weapon-attack' || opt.name.toLowerCase() === 'weapon attack')
  );
  
  if (!hasWeaponAttack) {
    // Add Weapon Attack as a standard maneuver option
    options.push({
      id: 'weapon-attack',
      name: 'Weapon Attack',
      description: 'Make a standard attack with your equipped weapon.',
      slot: 'attack',
      source: 'maneuver',
      range: undefined,
      rangeCategory: 'melee', // Weapon Attack is melee
      maneuver: {
        id: 'weapon-attack',
        name: 'Weapon Attack',
        description: 'Make a standard attack with your equipped weapon.',
        slot: 'attack',
        category: 'combat-action',
        tags: ['attack', 'weapon'],
        effect: 'Make a standard attack with your equipped weapon. Roll attack dice against the target\'s Evade.'
      } as CombatManeuver,
      tags: ['attack', 'weapon']
    });
  }
  
  console.log(`Mastery System | Collected ${options.length} combat options for actor:`, {
    powers: options.filter(o => o.source === 'power').length,
    maneuvers: options.filter(o => o.source === 'maneuver').length,
    bySegment: {
      movement: options.filter(o => getSegmentIdForOption(o) === 'movement').length,
      attack: options.filter(o => getSegmentIdForOption(o) === 'attack').length,
      utility: options.filter(o => getSegmentIdForOption(o) === 'utility').length,
      'active-buff': options.filter(o => getSegmentIdForOption(o) === 'active-buff').length
    }
  });
  
  return options;
}

/**
 * Map power type to combat slot
 */
function mapPowerTypeToSlot(powerType: string): CombatSlot {
  switch (powerType) {
    case 'movement':
      return 'movement';
    case 'reaction':
      return 'reaction';
    case 'utility':
      return 'utility';
    case 'active':
    case 'active-buff':
    case 'buff':
    default:
      return 'attack';
  }
}

/**
 * Parse AoE radius from string (e.g., "Radius 2m", "Radius 4m")
 */
function parseAoERadius(aoeStr: string | undefined): number | undefined {
  if (!aoeStr) return undefined;
  
  const match = aoeStr.match(/radius\s*(\d+(?:\.\d+)?)\s*m/i);
  if (match) {
    return parseFloat(match[1]);
  }
  
  return undefined;
}

/**
 * Parse AoE shape from string
 */
function parseAoEShape(aoeStr: string | undefined): AoEShape {
  if (!aoeStr) return 'none';
  
  const lower = aoeStr.toLowerCase();
  if (lower.includes('radius')) {
    return 'radius';
  }
  if (lower.includes('cone')) {
    return 'cone';
  }
  if (lower.includes('line')) {
    return 'line';
  }
  
  return 'none';
}

/**
 * Determine default target group from power description and type
 */
function determineTargetGroup(option: RadialCombatOption): TargetGroup {
  // Check if explicitly set
  if (option.defaultTargetGroup) {
    return option.defaultTargetGroup;
  }
  
  // Check description for keywords
  const desc = (option.description || '').toLowerCase();
  const name = (option.name || '').toLowerCase();
  
  // Check for "allies" keywords
  if (desc.includes('allies') || desc.includes('ally') || 
      name.includes('bless') || name.includes('beacon') || name.includes('healing')) {
    return 'ally';
  }
  
  // Check for "enemies" keywords
  if (desc.includes('enemies') || desc.includes('enemy') || desc.includes('hostile')) {
    return 'enemy';
  }
  
  // Check for "creatures" or "all creatures"
  if (desc.includes('creatures') || desc.includes('all creatures') || 
      name.includes('feather fall')) {
    return 'creature';
  }
  
  // Default for utilities: ally
  if (option.slot === 'utility') {
    return 'ally';
  }
  
  return 'any';
}

/**
 * Determine range category from power/option data
 * @param rangeStr - Range string (e.g., "0m", "8m", "Self", "Self + Radius 5m")
 * @param powerType - Power type (e.g., "active", "movement")
 * @param levelData - Level data from power definition (optional)
 * @returns Range category
 */
function determineRangeCategory(rangeStr: string | undefined, powerType: string, levelData?: any): RangeCategory {
  if (!rangeStr) {
    // Default based on power type
    if (powerType === 'movement') {
      return 'self';
    }
    return 'melee'; // Default for attacks
  }
  
  const rangeLower = rangeStr.toLowerCase();
  
  // Check for self-centered AoE
  if (rangeLower.includes('self') && (rangeLower.includes('radius') || rangeLower.includes('area'))) {
    return 'area';
  }
  
  // Check for "Self" or "0m" - melee
  if (rangeLower === 'self' || rangeLower === '0m' || rangeStr === '0') {
    return 'melee';
  }
  
  // Check level data type if available
  if (levelData && levelData.type) {
    const typeLower = levelData.type.toLowerCase();
    if (typeLower === 'melee') {
      return 'melee';
    }
    if (typeLower === 'ranged') {
      return 'ranged';
    }
  }
  
  // Parse numeric range
  const match = rangeStr.match(/(\d+(?:\.\d+)?)\s*m/i);
  if (match) {
    const rangeMeters = parseFloat(match[1]);
    if (rangeMeters === 0) {
      return 'melee';
    }
    // For now, assume anything with range > 0 is ranged
    // TODO: Could check if it's actually a ranged attack vs melee with reach
    return 'ranged';
  }
  
  // Default fallback
  return 'melee';
}

/**
 * Shorten option name for display
 */
function shortenOptionName(name: string): string {
  if (!name) return '';
  if (name.length <= 12) return name;
  return name.slice(0, 11) + '…';
}

/**
 * Convert world coordinates to screen coordinates
 */
function worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
  // Try multiple methods for Foundry v13 compatibility
  let screenX = 0;
  let screenY = 0;
  
  // Method 1: Use canvas stage toGlobal (if available)
  if (canvas.stage && typeof canvas.stage.toGlobal === 'function') {
    const worldPoint = new PIXI.Point(worldX, worldY);
    const globalPoint = canvas.stage.toGlobal(worldPoint);
    screenX = globalPoint.x;
    screenY = globalPoint.y;
  }
  // Method 2: Use renderer plugins interaction (older API)
  else if (canvas.app?.renderer?.plugins?.interaction?.mapPositionToPoint) {
    const point = new PIXI.Point();
    canvas.app.renderer.plugins.interaction.mapPositionToPoint(point, worldX, worldY);
    screenX = point.x;
    screenY = point.y;
  }
  // Method 3: Manual calculation using stage transform
  else if (canvas.stage) {
    const stage = canvas.stage;
    const transform = stage.worldTransform;
    screenX = transform.a * worldX + transform.c * worldY + transform.tx;
    screenY = transform.b * worldX + transform.d * worldY + transform.ty;
  }
  // Fallback: use canvas dimensions and grid
  else {
    // Rough approximation using stage scale
    const scale = canvas.stage?.scale?.x || 1;
    screenX = worldX * scale;
    screenY = worldY * scale;
  }
  
  return { x: screenX, y: screenY };
}

/**
 * Get or create the info panel div
 */
function getOrCreateInfoDiv(): HTMLElement {
  let infoDiv = document.getElementById('ms-radial-info');
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.id = 'ms-radial-info';
    infoDiv.className = 'ms-radial-info hidden';
    document.body.appendChild(infoDiv);
  }
  return infoDiv;
}

/**
 * Show the info panel with option details
 */
function showRadialInfoPanel(token: any, option: RadialCombatOption): void {
  const info = getOrCreateInfoDiv();
  info.classList.remove('hidden');
  
  const screenPos = worldToScreen(token.center.x, token.center.y);
  // Position to the right of the token center
  info.style.left = `${screenPos.x + 200}px`;
  info.style.top = `${screenPos.y - 100}px`;
  
  const segmentId = getSegmentIdForOption(option);
  const category = segmentId === 'active-buff' ? 'attack' : segmentId;
  const rangeText = option.range !== undefined ? `${option.range}m` : '–';
  
  // Get weapon damage if this is a weapon attack
  let damageText = '';
  let reachText = '';
  let specialText = '';
  
  if (option.slot === 'attack' && token.actor) {
    // Try to get equipped weapon
    const actor = token.actor;
    const items = (actor as any).items || [];
    const equippedWeapon = items.find((item: any) => 
      item.type === 'weapon' && (item.system as any)?.equipped === true
    );
    
    if (equippedWeapon) {
      const weaponSystem = equippedWeapon.system as any;
      damageText = weaponSystem.damage || weaponSystem.weaponDamage || '';
      
      // Get reach from weapon
      const innateAbilities = weaponSystem.innateAbilities || [];
      const reachAbility = innateAbilities.find((a: string) => a.includes('Reach'));
      if (reachAbility) {
        // Match new format: "Reach (+1 m)" or "Reach (+2 m)"
        const bonusMatch = reachAbility.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
        if (bonusMatch) {
          const bonus = parseInt(bonusMatch[1], 10);
          const totalReach = 2 + bonus; // 2m base + bonus
          reachText = `Reach: ${totalReach}m`;
        } else {
          // Legacy support: Match old format: "Reach (2 m)" or "Reach (3 m)"
          const legacyMatch = reachAbility.match(/Reach\s*\((\d+)\s*m\)/i);
          if (legacyMatch) {
            reachText = `Reach: ${legacyMatch[1]}m`;
          }
        }
      }
      
      // Get special ability
      if (weaponSystem.special && weaponSystem.special !== '—') {
        specialText = weaponSystem.special;
      }
    }
  }
  
  // Build info HTML
  let infoHTML = `
    <div class="ms-info-title">${option.name}</div>
    <div class="ms-info-meta">
      <span class="ms-info-source">${option.source}</span> · <span class="ms-info-slot">${category}</span>
    </div>
  `;
  
  if (damageText) {
    infoHTML += `<div class="ms-info-damage"><strong>Damage:</strong> ${damageText}</div>`;
  }
  
  if (reachText) {
    infoHTML += `<div class="ms-info-reach">${reachText}</div>`;
  } else {
    infoHTML += `<div class="ms-info-range">Range: ${rangeText}</div>`;
  }
  
  if (specialText) {
    infoHTML += `<div class="ms-info-special"><strong>Special:</strong> ${specialText}</div>`;
  }
  
  infoHTML += `<div class="ms-info-desc">${option.description || 'No description available'}</div>`;
  
  info.innerHTML = infoHTML;
}

/**
 * Hide the info panel
 */
function hideRadialInfoPanel(): void {
  const info = document.getElementById('ms-radial-info');
  if (info) {
    info.classList.add('hidden');
  }
}

/**
 * Create a radial option wedge/slice for the outer ring
 */
function createRadialOptionSlice(
  option: RadialCombatOption,
  startAngle: number,
  endAngle: number,
  token: any,
  ringColor: number
): PIXI.Container {
  const container = new PIXI.Container();
  
  // Create the wedge graphics
  const wedge = new PIXI.Graphics();
  
  // Draw the wedge as a ring segment (donut slice)
  // Start from inner radius at startAngle
  const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
  const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
  const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
  const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
  
  wedge.beginFill(ringColor, 0.6); // Default alpha
  wedge.moveTo(innerStartX, innerStartY);
  // Arc along outer radius
  wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
  // Line to inner radius at endAngle
  wedge.lineTo(innerEndX, innerEndY);
  // Arc back along inner radius
  wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
  wedge.closePath();
  wedge.endFill();
  
  // Add border
  wedge.lineStyle(2, ringColor, 0.8);
  // Outer arc
  wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
  // Line from outer to inner at endAngle
  wedge.moveTo(innerEndX, innerEndY);
  wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
  // Inner arc
  wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
  // Line from inner to outer at startAngle
  wedge.moveTo(innerStartX, innerStartY);
  wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
  
  container.addChild(wedge);
  
  // Calculate text position (center of the wedge)
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = (MS_OUTER_RING_INNER + MS_OUTER_RING_OUTER) / 2;
  const textX = Math.cos(midAngle) * textRadius;
  const textY = Math.sin(midAngle) * textRadius;
  
  // Label text
  const label = new PIXI.Text(shortenOptionName(option.name), {
    fontSize: 11,
    fill: 0xffffff,
    align: 'center',
    fontWeight: 'bold',
    wordWrap: true,
    wordWrapWidth: (MS_OUTER_RING_OUTER - MS_OUTER_RING_INNER) * 0.8
  });
  label.anchor.set(0.5);
  label.position.set(textX, textY);
  container.addChild(label);
  
  // Make the entire wedge interactive
  container.interactive = true;
  container.buttonMode = true;
  
  // Store reference to wedge graphics for hover effects
  (container as any).wedgeGfx = wedge;
  (container as any).defaultAlpha = 0.6;
  
  // Hover: highlight wedge, show range preview, and update info panel
  container.on('pointerover', () => {
    // Visual highlight - increase alpha and redraw
    const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
    const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
    const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
    const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
    
    wedge.clear();
    wedge.beginFill(ringColor, 1.0); // Full alpha on hover
    wedge.moveTo(innerStartX, innerStartY);
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    wedge.lineTo(innerEndX, innerEndY);
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    wedge.closePath();
    wedge.endFill();
    
    // Add brighter border
    wedge.lineStyle(3, ringColor, 1.0);
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    wedge.moveTo(innerEndX, innerEndY);
    wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    wedge.moveTo(innerStartX, innerStartY);
    wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
    
    // Range preview
    if (option.range !== undefined) {
      showRangePreview(token, option.range);
    }
    
    // Info panel
    showRadialInfoPanel(token, option);
  });
  
  container.on('pointerout', () => {
    // Restore default appearance
    const innerStartX = Math.cos(startAngle) * MS_OUTER_RING_INNER;
    const innerStartY = Math.sin(startAngle) * MS_OUTER_RING_INNER;
    const innerEndX = Math.cos(endAngle) * MS_OUTER_RING_INNER;
    const innerEndY = Math.sin(endAngle) * MS_OUTER_RING_INNER;
    
    wedge.clear();
    wedge.beginFill(ringColor, 0.6); // Default alpha
    wedge.moveTo(innerStartX, innerStartY);
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    wedge.lineTo(innerEndX, innerEndY);
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    wedge.closePath();
    wedge.endFill();
    
    // Default border
    wedge.lineStyle(2, ringColor, 0.8);
    wedge.arc(0, 0, MS_OUTER_RING_OUTER, startAngle, endAngle);
    wedge.moveTo(innerEndX, innerEndY);
    wedge.lineTo(Math.cos(endAngle) * MS_OUTER_RING_OUTER, Math.sin(endAngle) * MS_OUTER_RING_OUTER);
    wedge.arc(0, 0, MS_OUTER_RING_INNER, endAngle, startAngle, true);
    wedge.moveTo(innerStartX, innerStartY);
    wedge.lineTo(Math.cos(startAngle) * MS_OUTER_RING_OUTER, Math.sin(startAngle) * MS_OUTER_RING_OUTER);
    
    clearRangePreview();
    hideRadialInfoPanel();
  });
  
  // Click: select option
  container.on('pointertap', async () => {
    // Store the chosen option as a flag
    const segmentId = getSegmentIdForOption(option);
    
    // Store segment in flag (this is the quadrant the option came from)
    await token.document.setFlag('mastery-system', 'currentAction', {
      segment: segmentId,  // "movement" | "attack" | "utility" | "active-buff"
      category: segmentId === 'active-buff' ? 'attack' : segmentId as CombatSlot,  // For backward compatibility
      kind: option.source === 'power' ? 'power' : 'maneuver',
      optionId: option.id,
      optionSource: option.source
    });
    
    console.log('Mastery System | Selected combat option:', {
      segment: segmentId,
      optionId: option.id,
      name: option.name,
      source: option.source
    });
    
    // Trigger handler
    handleChosenCombatOption(token, option);
    
    closeRadialMenu();
  });
  
  return container;
}

/**
 * Render the outer ring of option wedges
 */
function renderOuterRing(
  root: PIXI.Container,
  token: any,
  bySegment: Record<InnerSegment['id'], RadialCombatOption[]>,
  segmentId: InnerSegment['id']
): void {
  // Remove existing outer ring elements
  const toRemove: PIXI.DisplayObject[] = [];
  root.children.forEach((child: any) => {
    if (child.msOuterSlice === true || child.msOuterRing === true) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(child => root.removeChild(child));
  
  // Get segment metadata
  const segMeta = getSegmentMeta(segmentId);
  const ringColor = segMeta.color;
  
  // Get options for this segment
  const options = bySegment[segmentId] ?? [];
  
  console.log(`Mastery System | Rendering outer ring for segment "${segmentId}" with ${options.length} options`);
  
  // Faint background ring
  const ringGfx = new PIXI.Graphics();
  ringGfx.lineStyle(2, ringColor, 0.3);
  ringGfx.beginFill(ringColor, 0.05);
  ringGfx.drawCircle(0, 0, MS_OUTER_RING_OUTER);
  ringGfx.endFill();
  (ringGfx as any).msOuterRing = true;
  ringGfx.interactive = false; // Background ring should not capture events
  root.addChild(ringGfx);
  
  if (!options.length) {
    // Show "No options" text
    const noOptionsText = new PIXI.Text('No options', {
      fontSize: 14,
      fill: ringColor,
      align: 'center'
    });
    noOptionsText.anchor.set(0.5);
    (noOptionsText as any).msOuterRing = true;
    root.addChild(noOptionsText);
    return;
  }
  
  // Distribute wedges evenly around the ring
  const count = options.length;
  const angleStep = (Math.PI * 2) / count;
  const startAngle = -Math.PI / 2; // Start at top
  
  options.forEach((option, index) => {
    const baseAngle = startAngle + index * angleStep;
    const endAngle = baseAngle + angleStep;
    
    const slice = createRadialOptionSlice(option, baseAngle, endAngle, token, ringColor);
    (slice as any).msOuterSlice = true;
    root.addChild(slice);
  });
}

/**
 * Render the inner segmented circle
 * The inner quadrants (Buff/Move/Util/Atk) act as clickable filters
 */
function renderInnerSegments(
  root: PIXI.Container,
  getCurrentSegmentId: () => InnerSegment['id'],
  setCurrentSegmentId: (id: InnerSegment['id']) => void
): void {
  // Remove existing inner segments
  const toRemove: PIXI.DisplayObject[] = [];
  root.children.forEach((child: any) => {
    if (child.msInnerSegment === true) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(child => root.removeChild(child));
  
  const segmentCount = MS_INNER_SEGMENTS.length;
  const angleStep = (Math.PI * 2) / segmentCount;
  const startAngle = -Math.PI / 2; // Start at top
  
  console.log('Mastery System | Rendering inner segments, current segment:', getCurrentSegmentId());
  
  MS_INNER_SEGMENTS.forEach((seg, index) => {
    const container = new PIXI.Container();
    (container as any).msInnerSegment = true;
    (container as any).msSegmentId = seg.id; // Store segment ID for visual refresh
    container.name = `ms-inner-${seg.id}`;
    
    const baseAngle = startAngle + index * angleStep;
    const endAngle = baseAngle + angleStep;
    const isActive = getCurrentSegmentId() === seg.id;
    
    console.log(`Mastery System | Creating inner segment "${seg.id}" (index ${index}), active: ${isActive}, angles: ${baseAngle.toFixed(2)} to ${endAngle.toFixed(2)}`);
    
    const gfx = new PIXI.Graphics();
    
    // Draw pie slice with visual feedback for active state
    const fillAlpha = isActive ? 0.9 : 0.6;
    gfx.beginFill(seg.color, fillAlpha);
    gfx.moveTo(0, 0);
    gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
    gfx.lineTo(0, 0);
    gfx.endFill();
    
    // Add border (stronger for active segment)
    gfx.lineStyle(2, 0x000000, isActive ? 0.8 : 0.5);
    gfx.moveTo(0, 0);
    gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
    gfx.lineTo(0, 0);
    
    container.addChild(gfx);
    
    // Label in the middle of the slice
    const midAngle = baseAngle + angleStep / 2;
    const labelRadius = MS_INNER_RADIUS * 0.6;
    const lx = Math.cos(midAngle) * labelRadius;
    const ly = Math.sin(midAngle) * labelRadius;
    
    const text = new PIXI.Text(seg.label, {
      fontSize: 12,
      fill: 0x000000,
      align: 'center',
      fontWeight: isActive ? 'bold' : 'normal'
    });
    text.anchor.set(0.5);
    text.position.set(lx, ly);
    text.interactive = false; // Text should not capture events
    container.addChild(text);
    
    // Make container interactive - this is critical for click functionality
    container.interactive = true;
    container.buttonMode = true;
    container.cursor = 'pointer';
    
    // Create a polygon hit area for better click detection
    // Generate points along the arc for the hit area
    const hitPoints: number[] = [0, 0]; // Start at center
    const numPoints = 16; // Number of points along the arc
    for (let i = 0; i <= numPoints; i++) {
      const angle = baseAngle + (endAngle - baseAngle) * (i / numPoints);
      const x = Math.cos(angle) * MS_INNER_RADIUS;
      const y = Math.sin(angle) * MS_INNER_RADIUS;
      hitPoints.push(x, y);
    }
    hitPoints.push(0, 0); // Close the polygon
    
    // Use PIXI.Polygon for hitArea (more reliable than Graphics)
    const hitPolygon = new PIXI.Polygon(hitPoints);
    container.hitArea = hitPolygon;
    
    console.log(`Mastery System | Inner segment "${seg.id}": interactive=${container.interactive}, hitArea=${!!container.hitArea}, children=${container.children.length}`);
    
    // Ensure the graphics don't capture events - container should handle them
    gfx.interactive = false;
    
    // Click handler - this should trigger segment change
    const handleClick = (event: any) => {
      event.stopPropagation(); // Prevent event from bubbling to parent
      event.stopImmediatePropagation(); // Prevent other handlers
      console.log(`Mastery System | [CLICK] Inner segment "${seg.id}" clicked! (was: ${getCurrentSegmentId()})`, {
        eventType: event.type,
        target: event.target?.constructor?.name,
        currentTarget: event.currentTarget?.constructor?.name,
        data: event.data
      });
      setCurrentSegmentId(seg.id);
    };
    
    container.on('pointertap', handleClick);
    container.on('click', handleClick); // Some PIXI versions use 'click'
    
    // Also handle pointerdown as a fallback (some PIXI versions use this)
    container.on('pointerdown', (event: any) => {
      event.stopPropagation();
      event.stopImmediatePropagation();
      console.log(`Mastery System | [POINTERDOWN] Inner segment "${seg.id}" pointerdown`, {
        eventType: event.type,
        target: event.target?.constructor?.name
      });
      // Don't call setCurrentSegmentId here to avoid double-triggering
      // Only use pointertap/click for actual selection
    });
    
    // Add hover feedback with debug logs
    container.on('pointerover', (event: any) => {
      console.log(`Mastery System | [HOVER] Inner segment "${seg.id}" hovered`, {
        eventType: event.type,
        target: event.target?.constructor?.name
      });
      if (!isActive) {
        gfx.clear();
        gfx.beginFill(seg.color, 0.75); // Slightly brighter on hover
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        gfx.endFill();
        gfx.lineStyle(2, 0x000000, 0.6);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
      }
    });
    
    container.on('pointerout', (_event: any) => {
      console.log(`Mastery System | [HOVER OUT] Inner segment "${seg.id}" hover out`);
      if (!isActive) {
        // Restore default appearance
        gfx.clear();
        gfx.beginFill(seg.color, 0.6);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
        gfx.endFill();
        gfx.lineStyle(2, 0x000000, 0.5);
        gfx.moveTo(0, 0);
        gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
        gfx.lineTo(0, 0);
      }
    });
    
    // Add to root AFTER setting up all properties
    root.addChild(container);
    
    console.log(`Mastery System | Inner segment "${seg.id}" added to root, zIndex: ${root.getChildIndex(container)}`);
  });
}

/**
 * Get segment metadata (color, label) by segment ID
 */
function getSegmentMeta(segmentId: InnerSegment['id']): { color: number; label: string } {
  const seg = MS_INNER_SEGMENTS.find(s => s.id === segmentId);
  return seg ? { color: seg.color, label: seg.label } : { color: 0xffffff, label: '?' };
}

/**
 * Refresh inner segments visual state (update appearance based on active segment)
 * This is called when the segment changes to update the visual highlighting
 */
function refreshInnerSegmentsVisual(
  root: PIXI.Container,
  getCurrentSegmentId: () => InnerSegment['id']
): void {
  const current = getCurrentSegmentId();
  console.log(`Mastery System | Refreshing inner segments visual, active: ${current}`);
  
  for (const child of root.children) {
    if (!(child as any).msInnerSegment) continue;
    
    const container = child as PIXI.Container;
    const segId = (container as any).msSegmentId as InnerSegment['id'] | undefined;
    if (!segId) continue;
    
    const isActive = segId === current;
    const gfx = container.children.find((c: any) => c instanceof PIXI.Graphics) as PIXI.Graphics | undefined;
    const text = container.children.find((c: any) => c instanceof PIXI.Text) as PIXI.Text | undefined;
    
    if (!gfx) continue;
    
    // Get segment metadata
    const seg = MS_INNER_SEGMENTS.find(s => s.id === segId);
    if (!seg) continue;
    
    // Calculate angles for this segment
    const segmentCount = MS_INNER_SEGMENTS.length;
    const angleStep = (Math.PI * 2) / segmentCount;
    const startAngle = -Math.PI / 2;
    const index = MS_INNER_SEGMENTS.findIndex(s => s.id === segId);
    const baseAngle = startAngle + index * angleStep;
    const endAngle = baseAngle + angleStep;
    
    // Redraw with correct active state
    gfx.clear();
    gfx.beginFill(seg.color, isActive ? 0.9 : 0.6);
    gfx.moveTo(0, 0);
    gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
    gfx.lineTo(0, 0);
    gfx.endFill();
    
    // Update border
    gfx.lineStyle(2, 0x000000, isActive ? 0.8 : 0.5);
    gfx.moveTo(0, 0);
    gfx.arc(0, 0, MS_INNER_RADIUS, baseAngle, endAngle);
    gfx.lineTo(0, 0);
    
    // Update text weight
    if (text) {
      text.style.fontWeight = isActive ? 'bold' : 'normal';
    }
  }
}

/**
 * Open the radial menu for an actor's token
 */
export function openRadialMenuForActor(token: any, allOptions: RadialCombatOption[]): void {
  closeRadialMenu();
  
  // Hide Token HUD to show only the radial menu
  // Find the Token HUD element for this token
  const tokenHUD = canvas.hud?.token;
  if (tokenHUD) {
    // Try to find the HTML element
    // In Foundry v13, the TokenHUD might have different structure
    let hudElement: JQuery | null = null;
    
    // Method 1: Try to get the element from the TokenHUD app
    if ((tokenHUD as any).element) {
      hudElement = $(tokenHUD.element);
    }
    // Method 2: Try to find by token ID in the DOM
    else {
      const tokenId = token.id;
      hudElement = $(`.token-hud[data-token-id="${tokenId}"]`);
      if (hudElement.length === 0) {
        // Try alternative selector
        hudElement = $(`[data-token-id="${tokenId}"]`).closest('.token-hud, .hud');
      }
    }
    
    // Method 3: Try to find any visible Token HUD
    if (!hudElement || hudElement.length === 0) {
      hudElement = $('.token-hud:visible');
      if (hudElement.length === 0) {
        hudElement = $('.hud.token-hud:visible');
      }
    }
    
    if (hudElement && hudElement.length > 0) {
      msTokenHUD = hudElement;
      hudElement.css('display', 'none');
      console.log('Mastery System | Token HUD hidden');
    } else {
      console.warn('Mastery System | Could not find Token HUD element to hide');
    }
  }
  
  // Build bySegment structure from allOptions
  const bySegment: Record<InnerSegment['id'], RadialCombatOption[]> = {
    'movement': [],
    'attack': [],
    'utility': [],
    'active-buff': []
  };
  
  for (const option of allOptions) {
    const segmentId = getSegmentIdForOption(option);
    bySegment[segmentId].push(option);
  }
  
  console.log('Mastery System | Options by segment:', {
    movement: bySegment.movement.length,
    attack: bySegment.attack.length,
    utility: bySegment.utility.length,
    'active-buff': bySegment['active-buff'].length
  });
  
  // Determine initial segment (first non-empty segment, default to movement)
  const segments: InnerSegment['id'][] = ['movement', 'attack', 'utility', 'active-buff'];
  let currentSegmentId: InnerSegment['id'] = segments.find(id => (bySegment[id]?.length ?? 0) > 0) ?? 'movement';
  
  // In Foundry v13, canvas layers may have different structure
  // Try multiple approaches for compatibility
  let hudContainer: PIXI.Container | null = null;
  
  if (canvas.hud) {
    // Debug: log canvas.hud structure
    const hudKeys = Object.keys(canvas.hud as any);
    const hudKeyTypes: Record<string, string> = {};
    hudKeys.forEach(key => {
      const value = (canvas.hud as any)[key];
      hudKeyTypes[key] = typeof value;
      if (value && typeof value.addChild === 'function') {
        hudKeyTypes[key] += ' (has addChild)';
      }
    });
    
    console.log('Mastery System | canvas.hud structure:', {
      hasAddChild: typeof (canvas.hud as any).addChild === 'function',
      hasContainer: !!(canvas.hud as any).container,
      hasObjects: !!(canvas.hud as any).objects,
      keys: hudKeys,
      keyTypes: hudKeyTypes
    });
    
    // Try v13 structure - check for layers property
    if ((canvas.hud as any).layers) {
      // Foundry v13 uses layers array/object
      const layers = (canvas.hud as any).layers;
      if (layers instanceof Array && layers.length > 0) {
        // Try first layer
        const firstLayer = layers[0];
        if (firstLayer && typeof firstLayer.addChild === 'function') {
          hudContainer = firstLayer;
          console.log('Mastery System | Using canvas.hud.layers[0]');
        } else if (firstLayer && firstLayer.container && typeof firstLayer.container.addChild === 'function') {
          hudContainer = firstLayer.container;
          console.log('Mastery System | Using canvas.hud.layers[0].container');
        }
      } else if (layers && typeof layers.addChild === 'function') {
        hudContainer = layers;
        console.log('Mastery System | Using canvas.hud.layers');
      }
    }
    
    // Try v13 structure - check for interactive property (TokenHUD)
    if (!hudContainer && (canvas.hud as any).interactive && typeof (canvas.hud as any).interactive.addChild === 'function') {
      hudContainer = (canvas.hud as any).interactive;
      console.log('Mastery System | Using canvas.hud.interactive');
    }
    
    // Try v13 structure - check for children property
    if (!hudContainer && (canvas.hud as any).children && Array.isArray((canvas.hud as any).children)) {
      // If it has children, it might be a container itself
      if (typeof (canvas.hud as any).addChild === 'function') {
        hudContainer = canvas.hud as any;
        console.log('Mastery System | Using canvas.hud (has children array)');
      }
    }
    
    // Try container property
    if (!hudContainer && (canvas.hud as any).container && typeof (canvas.hud as any).container.addChild === 'function') {
      hudContainer = (canvas.hud as any).container;
      console.log('Mastery System | Using canvas.hud.container');
    }
    
    // Try direct addChild (older versions)
    if (!hudContainer && typeof (canvas.hud as any).addChild === 'function') {
      hudContainer = canvas.hud as any;
      console.log('Mastery System | Using canvas.hud directly');
    }
    
    // Try objects container
    if (!hudContainer && (canvas.hud as any).objects && typeof (canvas.hud as any).objects.addChild === 'function') {
      hudContainer = (canvas.hud as any).objects;
      console.log('Mastery System | Using canvas.hud.objects');
    }
    
    // Try each key to see if any is a PIXI.Container
    if (!hudContainer) {
      for (const key of hudKeys) {
        const value = (canvas.hud as any)[key];
        if (value && typeof value.addChild === 'function') {
          hudContainer = value;
          console.log(`Mastery System | Using canvas.hud.${key}`);
          break;
        }
        // Also check nested properties
        if (value && typeof value === 'object') {
          // Check for v13 element property first (replaces deprecated container)
          if (value.element && typeof value.element.addChild === 'function') {
            hudContainer = value.element;
            console.log(`Mastery System | Using canvas.hud.${key}.element`);
            break;
          }
          // Fallback to deprecated container property (for backwards compatibility)
          if (value.container && typeof value.container.addChild === 'function') {
            hudContainer = value.container;
            console.log(`Mastery System | Using canvas.hud.${key}.container (deprecated)`);
            break;
          }
        }
      }
    }
  }
  
  // Fallback to tokens layer if HUD doesn't work (tokens layer exists)
  if (!hudContainer && canvas.tokens) {
    if ((canvas.tokens as any).container && typeof (canvas.tokens as any).container.addChild === 'function') {
      hudContainer = (canvas.tokens as any).container;
      console.log('Mastery System | Using canvas.tokens.container');
    } else if (typeof (canvas.tokens as any).addChild === 'function') {
      hudContainer = canvas.tokens as any;
      console.log('Mastery System | Using canvas.tokens directly');
    }
  }
  
  // Fallback to foreground layer if HUD doesn't work
  if (!hudContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      hudContainer = (canvas.foreground as any).container;
      console.log('Mastery System | Using canvas.foreground.container');
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      hudContainer = canvas.foreground as any;
      console.log('Mastery System | Using canvas.foreground directly');
    }
  }
  
  // Last resort: use canvas.app.stage (the root PIXI container)
  if (!hudContainer && canvas.app && canvas.app.stage) {
    hudContainer = canvas.app.stage;
    console.log('Mastery System | Using canvas.app.stage as last resort');
  }
  
  if (!hudContainer) {
    console.error('Mastery System | Could not find suitable canvas layer for radial menu');
    console.error('Mastery System | Available canvas layers:', {
      hud: !!canvas.hud,
      foreground: !!canvas.foreground,
      effects: !!canvas.effects,
      tokens: !!canvas.tokens
    });
    ui.notifications.error('Could not display radial menu: Canvas layer not available');
    return;
  }
  
  const root = new PIXI.Container();
  msRadialMenu = root;
  msCurrentTokenId = token.id; // Track which token has the menu open
  root.name = 'ms-radial-menu-root';
  
  // Make root interactive so child events can be captured
  root.interactive = true;
  root.interactiveChildren = true; // Allow children to be interactive
  
  // Notify turn indicator that radial menu opened
  Hooks.call('masterySystem.radialMenuOpened', token.id);
  
  console.log('Mastery System | Root container created:', {
    interactive: root.interactive,
    interactiveChildren: root.interactiveChildren,
    name: root.name
  });
  
  // Add to canvas layer
  hudContainer.addChild(root);
  
  console.log('Mastery System | Root container added to hudContainer, parent:', root.parent?.constructor?.name);
  
  // Center on token
  const tokenCenter = token.center;
  root.position.set(tokenCenter.x, tokenCenter.y);
  
  // State management functions
  const getCurrentSegmentId = () => currentSegmentId;
  
  const setCurrentSegmentId = (id: InnerSegment['id']) => {
    console.log(`Mastery System | [setCurrentSegmentId] Called with id="${id}", current="${currentSegmentId}"`);
    
    if (currentSegmentId === id) {
      console.log(`Mastery System | Segment ${id} already active, no change needed`);
      return; // No change needed
    }
    
    console.log(`Mastery System | [setCurrentSegmentId] Changing segment from "${currentSegmentId}" to "${id}"`);
    const oldSegmentId = currentSegmentId;
    currentSegmentId = id;
    
    // Check if the new segment has options
    const optionsForSegment = bySegment[currentSegmentId] ?? [];
    console.log(`Mastery System | [setCurrentSegmentId] Segment "${currentSegmentId}" has ${optionsForSegment.length} options`);
    
    // Re-render outer ring with filtered options for the new segment
    console.log(`Mastery System | [setCurrentSegmentId] Re-rendering outer ring...`);
    renderOuterRing(root, token, bySegment, currentSegmentId);
    
    // Refresh inner segments visual state to highlight the active segment
    console.log(`Mastery System | [setCurrentSegmentId] Refreshing inner segments visual...`);
    refreshInnerSegmentsVisual(root, getCurrentSegmentId);
    
    // Ensure inner segments stay on top after re-rendering outer ring
    const innerSegments: PIXI.DisplayObject[] = [];
    root.children.forEach((child: any) => {
      if (child.msInnerSegment === true) {
        innerSegments.push(child);
      }
    });
    
    console.log(`Mastery System | [setCurrentSegmentId] Moving ${innerSegments.length} inner segments to top...`);
    
    // Remove and re-add to put them on top
    innerSegments.forEach((seg, idx) => {
      const oldIndex = root.getChildIndex(seg);
      root.removeChild(seg);
      root.addChild(seg);
      const newIndex = root.getChildIndex(seg);
      console.log(`Mastery System | [setCurrentSegmentId] Inner segment ${idx} moved from index ${oldIndex} to ${newIndex}`);
    });
    
    console.log(`Mastery System | [setCurrentSegmentId] Segment change complete: "${oldSegmentId}" -> "${currentSegmentId}"`);
  };
  
  // Initial render
  // Render outer ring first, then inner segments
  // This ensures inner segments are on top and can receive clicks
  renderOuterRing(root, token, bySegment, currentSegmentId);
  renderInnerSegments(root, getCurrentSegmentId, setCurrentSegmentId);
  
  // Move inner segments to the end of children list to ensure they're on top
  // This helps with event handling - elements rendered later are on top
  const innerSegments: PIXI.DisplayObject[] = [];
  root.children.forEach((child: any) => {
    if (child.msInnerSegment === true) {
      innerSegments.push(child);
    }
  });
  
  console.log(`Mastery System | Found ${innerSegments.length} inner segments, moving to top`);
  
  // Remove and re-add to put them on top
  innerSegments.forEach((seg, idx) => {
    const oldIndex = root.getChildIndex(seg);
    root.removeChild(seg);
    root.addChild(seg);
    const newIndex = root.getChildIndex(seg);
    console.log(`Mastery System | Inner segment ${idx} moved from index ${oldIndex} to ${newIndex}`);
  });
  
  // Final verification: log all children in order
  console.log('Mastery System | Root children order (bottom to top):');
  root.children.forEach((child: any, idx: number) => {
    const type = child.msInnerSegment ? 'INNER_SEGMENT' : 
                 child.msOuterSlice ? 'OUTER_SLICE' : 
                 child.msOuterRing ? 'OUTER_RING' : 'UNKNOWN';
    console.log(`  [${idx}] ${type} - ${child.name || child.constructor.name}`);
  });
  
  // Outside-click closes the menu
  msRadialCloseHandler = (event: MouseEvent) => {
    if (!msRadialMenu) return;
    
    // Get the click position in canvas coordinates
    let canvasPoint: { x: number; y: number } | null = null;
    
    // Try multiple methods to get mouse position
    // Method 1: Use event coordinates and convert
    if (event && canvas.app?.renderer) {
      const rect = canvas.app.renderer.view.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const clientY = event.clientY - rect.top;
      
      // Convert screen coordinates to world coordinates
      if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
        const screenPoint = new PIXI.Point(clientX, clientY);
        const worldPoint = canvas.stage.toLocal(screenPoint);
        canvasPoint = { x: worldPoint.x, y: worldPoint.y };
      } else {
        // Fallback: use screen coordinates directly (approximation)
        const scale = canvas.stage?.scale?.x || 1;
        canvasPoint = { x: clientX / scale, y: clientY / scale };
      }
    }
    // Method 2: Use interaction plugin (if available)
    else if (canvas.app?.renderer?.plugins?.interaction?.mouse?.global) {
      const mouseGlobal = canvas.app.renderer.plugins.interaction.mouse.global;
      if (canvas.stage && typeof canvas.stage.toLocal === 'function') {
        const worldPoint = canvas.stage.toLocal(mouseGlobal);
        canvasPoint = { x: worldPoint.x, y: worldPoint.y };
      } else {
        canvasPoint = { x: mouseGlobal.x, y: mouseGlobal.y };
      }
    }
    
    // If we couldn't get the point, just close on any click
    if (!canvasPoint) {
      closeRadialMenu();
      return;
    }
    
    // Calculate distance from token center
    const dx = canvasPoint.x - tokenCenter.x;
    const dy = canvasPoint.y - tokenCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If click is outside the outer ring (with some margin for easier clicking), close
    if (distance > MS_OUTER_RING_OUTER + 30) {
      closeRadialMenu();
    }
  };
  
  window.addEventListener('mousedown', msRadialCloseHandler, true);
}

