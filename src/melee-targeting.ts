/**
 * Melee Targeting System for Mastery System
 * 
 * Provides reach preview and target highlighting for melee attacks
 * Similar to movement preview but for attack targeting
 */

import type { RadialCombatOption } from './token-radial-menu';

/**
 * Melee targeting state interface
 */
interface MeleeTargetingState {
  token: any;
  option: RadialCombatOption;
  reachMeters: number;
  reachGridUnits: number;
  originalTokenAlphas: Map<any, number>;
  highlightId: string;
  previewGraphics: PIXI.Graphics | null;
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

// Global melee targeting state
let activeMeleeTargeting: MeleeTargetingState | null = null;

/**
 * Parse reach from weapon innate abilities or option
 * @param innateAbilities - Array of ability strings like ["Reach (2 m)", "Finesse"]
 * @returns Reach in meters, or 1 if not found
 */
function parseReachFromAbilities(innateAbilities: string[]): number {
  if (!innateAbilities || !Array.isArray(innateAbilities)) {
    return 1; // Default melee reach
  }
  
  for (const ability of innateAbilities) {
    // Match "Reach (2 m)" or "Reach (3 m)"
    const match = ability.match(/Reach\s*\((\d+)\s*m\)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return 1; // Default melee reach
}

/**
 * Get melee reach for an attack option
 * @param token - The attacking token
 * @param option - The combat option
 * @returns Reach in meters
 */
function getMeleeReach(token: any, option: RadialCombatOption): number {
  // Check if option has explicit meleeReachMeters
  if (option.meleeReachMeters !== undefined) {
    return option.meleeReachMeters;
  }
  
  // Check equipped weapon
  const actor = token.actor;
  if (actor) {
    const items = actor.items || [];
    const equippedWeapon = items.find((item: any) => {
      return item.type === 'weapon' && (item.system as any)?.equipped === true;
    });
    
    if (equippedWeapon) {
      const innateAbilities = (equippedWeapon.system as any)?.innateAbilities || [];
      const reach = parseReachFromAbilities(innateAbilities);
      if (reach > 1) {
        console.log('Mastery System | Found weapon reach:', reach, 'm from', equippedWeapon.name);
        return reach;
      }
    }
  }
  
  // Default: 1 meter (adjacent/close combat)
  return 1;
}

/**
 * Convert meters to grid units
 * @param meters - Distance in meters
 * @returns Distance in grid units
 */
function metersToGridUnits(meters: number): number {
  // canvas.grid.distance is the grid distance per unit (usually 1 for 1m per hex)
  const gridDistance = canvas.grid?.distance || 1;
  return meters / gridDistance;
}

/**
 * Get all valid melee targets within reach
 * @param attackerToken - The attacking token
 * @param reachGridUnits - Reach in grid units
 * @returns Array of valid target tokens
 */
function getValidMeleeTargets(attackerToken: any, reachGridUnits: number): any[] {
  const validTargets: any[] = [];
  const attackerCenter = attackerToken.center;
  
  // Get all tokens on the canvas
  const allTokens = canvas.tokens?.placeables || [];
  
  for (const token of allTokens) {
    // Skip the attacker
    if (token.id === attackerToken.id) {
      continue;
    }
    
    // Only consider NPCs or hostile tokens
    const actor = token.actor;
    if (!actor) continue;
    
    // Check if it's an NPC or hostile
    const isNPC = actor.type === 'npc';
    const isHostile = token.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
    
    if (!isNPC && !isHostile) {
      continue; // Skip friendly/neutral tokens
    }
    
    // Calculate distance from attacker center to target center
    const targetCenter = token.center;
    const dx = targetCenter.x - attackerCenter.x;
    const dy = targetCenter.y - attackerCenter.y;
    const pixelDistance = Math.sqrt(dx * dx + dy * dy);
    const gridDistance = pixelDistance / (canvas.grid?.size || 1);
    
    // For hex grids, use Foundry's distance measurement
    let distanceInUnits = gridDistance;
    try {
      if (canvas.grid?.measureDistances) {
        const waypoints = [
          { x: attackerCenter.x, y: attackerCenter.y },
          { x: targetCenter.x, y: targetCenter.y }
        ];
        const measurement = canvas.grid.measureDistances(waypoints, {});
        if (measurement && measurement.length > 0) {
          distanceInUnits = measurement[0];
        }
      }
    } catch (error) {
      console.warn('Mastery System | Could not measure distance, using fallback', error);
    }
    
    // Check if within reach
    if (distanceInUnits <= reachGridUnits) {
      validTargets.push(token);
    }
  }
  
  return validTargets;
}

/**
 * Highlight reach area around the attacker
 */
function highlightReachArea(state: MeleeTargetingState): void {
  if (!canvas.grid || !state.previewGraphics) return;
  
  const attackerCenter = state.token.center;
  const radiusPx = state.reachGridUnits * (canvas.grid.size || 1);
  
  // Clear previous graphics
  state.previewGraphics.clear();
  
  // Draw reach circle (semi-transparent red/orange)
  state.previewGraphics.lineStyle(2, 0xff6666, 0.8);
  state.previewGraphics.beginFill(0xff6666, 0.2);
  state.previewGraphics.drawCircle(0, 0, radiusPx);
  state.previewGraphics.endFill();
  
  // Position at attacker center
  state.previewGraphics.position.set(attackerCenter.x, attackerCenter.y);
  
  // Also highlight hexes within reach using grid highlight
  let highlight: any = null;
  try {
    if (canvas.grid.highlight) {
      highlight = canvas.grid.highlight;
    } else if ((canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(state.highlightId);
      if (!highlight && (canvas.grid as any).addHighlightLayer) {
        highlight = (canvas.grid as any).addHighlightLayer(state.highlightId);
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not get highlight layer for melee reach', error);
  }
  
  if (highlight && highlight.clear) {
    highlight.clear();
  }
  
  // Highlight hexes within reach
  // For hex grids, we need to iterate through nearby hexes
  const maxHexDistance = Math.ceil(state.reachGridUnits);
  
  // Get grid position of attacker
  const attackerGrid = canvas.grid.getGridPositionFromPixels(attackerCenter.x, attackerCenter.y);
  if (attackerGrid && highlight) {
    // For hex grids, use cube coordinates or axial coordinates
    // Simple approach: check all hexes in a square area and measure distance
    for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
      for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
        // For hex grids, calculate distance using hex distance formula
        // In axial coordinates: distance = (|q| + |r| + |q + r|) / 2
        // But we need to check if this hex is within reach
        const gridX = attackerGrid.x + q;
        const gridY = attackerGrid.y + r;
        
        // Measure actual distance from attacker to this hex
        const hexCenter = canvas.grid.getPixelsFromGridPosition(gridX, gridY);
        if (hexCenter) {
          const dx = hexCenter.x - attackerCenter.x;
          const dy = hexCenter.y - attackerCenter.y;
          const pixelDistance = Math.sqrt(dx * dx + dy * dy);
          const gridDistance = pixelDistance / (canvas.grid.size || 1);
          
          // Use Foundry's distance measurement if available
          let distanceInUnits = gridDistance;
          try {
            if (canvas.grid?.measureDistances) {
              const waypoints = [
                { x: attackerCenter.x, y: attackerCenter.y },
                { x: hexCenter.x, y: hexCenter.y }
              ];
              const measurement = canvas.grid.measureDistances(waypoints, {});
              if (measurement && measurement.length > 0) {
                distanceInUnits = measurement[0];
              }
            }
          } catch (error) {
            // Use fallback
          }
          
          if (distanceInUnits <= state.reachGridUnits) {
            if (highlight.highlightPosition) {
              highlight.highlightPosition(gridX, gridY, { color: 0xff6666, alpha: 0.3 });
            } else if (highlight.highlightGridPosition) {
              highlight.highlightGridPosition(gridX, gridY, { color: 0xff6666, alpha: 0.3 });
            }
          }
        }
      }
    }
  }
}

/**
 * Apply visual tint to valid target tokens
 */
function highlightValidTargets(state: MeleeTargetingState): void {
  const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
  
  console.log('Mastery System | Melee targeting: Found', validTargets.length, 'valid targets within', state.reachMeters, 'm reach');
  
  // Store original alphas and apply red tint
  state.originalTokenAlphas.clear();
  
  for (const target of validTargets) {
    // Store original alpha
    state.originalTokenAlphas.set(target, target.alpha);
    
    // Apply red tint (reduce alpha slightly and add red filter)
    target.alpha = Math.max(0.6, target.alpha * 0.8);
    
    // Add red tint using filters (if available)
    if (target.filters) {
      // Check if we already have a red tint filter
      const hasTintFilter = target.filters.some((f: any) => f.tint !== undefined);
      if (!hasTintFilter) {
        // Add a subtle red tint
        const tintFilter = new PIXI.filters.ColorMatrixFilter();
        tintFilter.tint(0xff6666, false);
        target.filters = [...(target.filters || []), tintFilter];
      }
    } else {
      // Create filters array if it doesn't exist
      const tintFilter = new PIXI.filters.ColorMatrixFilter();
      tintFilter.tint(0xff6666, false);
      target.filters = [tintFilter];
    }
  }
}

/**
 * Start melee targeting mode
 * @param token - The attacking token
 * @param option - The combat option (must be melee)
 */
export function startMeleeTargeting(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | Starting melee targeting mode', { token: token.name, option: option.name });
  
  // Cancel any existing melee targeting
  endMeleeTargeting(false);
  
  // Ensure token is controlled by this user
  token.control({ releaseOthers: false });
  
  // Calculate reach
  const reachMeters = getMeleeReach(token, option);
  const reachGridUnits = metersToGridUnits(reachMeters);
  
  console.log('Mastery System | Melee reach:', reachMeters, 'm (', reachGridUnits, 'grid units)');
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  
  // Add to effects layer
  let effectsContainer: PIXI.Container | null = null;
  if (canvas.effects) {
    if ((canvas.effects as any).container && typeof (canvas.effects as any).container.addChild === 'function') {
      effectsContainer = (canvas.effects as any).container;
    } else if (typeof (canvas.effects as any).addChild === 'function') {
      effectsContainer = canvas.effects as any;
    }
  }
  if (!effectsContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      effectsContainer = (canvas.foreground as any).container;
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      effectsContainer = canvas.foreground as any;
    }
  }
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
  }
  
  const highlightId = 'mastery-melee';
  
  // Create event handlers
  const onPointerDown = (ev: PIXI.FederatedPointerEvent) => handleMeleePointerDown(ev);
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && activeMeleeTargeting) {
      console.log('Mastery System | Melee targeting cancelled via ESC');
      endMeleeTargeting(false);
    }
  };
  
  const state: MeleeTargetingState = {
    token,
    option,
    reachMeters,
    reachGridUnits,
    originalTokenAlphas: new Map(),
    highlightId,
    previewGraphics,
    onPointerDown,
    onKeyDown
  };
  
  activeMeleeTargeting = state;
  
  // Attach event listeners
  canvas.stage.on('pointerdown', state.onPointerDown);
  window.addEventListener('keydown', state.onKeyDown);
  
  // Draw reach area and highlight targets
  highlightReachArea(state);
  highlightValidTargets(state);
  
  console.log('Mastery System | Melee targeting mode active');
}

/**
 * Handle pointer down during melee targeting
 */
function handleMeleePointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = activeMeleeTargeting;
  if (!state) return;
  
  // Right or middle click cancels
  if (ev.button === 2 || ev.button === 1) {
    console.log('Mastery System | Melee targeting cancelled via mouse button', ev.button);
    endMeleeTargeting(false);
    return;
  }
  
  // Left click - check if clicking on a valid target
  if (ev.button === 0) {
    const worldPos = ev.data.getLocalPosition(canvas.app.stage);
    
    // Find token at click position
    const tokens = canvas.tokens?.placeables || [];
    const clickedToken = tokens.find((token: any) => {
      const bounds = token.bounds;
      return bounds && bounds.contains(worldPos.x, worldPos.y);
    });
    
    if (clickedToken && clickedToken.id !== state.token.id) {
      // Check if it's a valid target
      const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
      const isValidTarget = validTargets.some(t => t.id === clickedToken.id);
      
      if (isValidTarget) {
        console.log('Mastery System | Valid melee target selected:', clickedToken.name);
        confirmMeleeTarget(clickedToken, state);
        return;
      }
    }
    
    // Clicked outside any valid target - cancel
    console.log('Mastery System | Clicked outside valid target, cancelling melee targeting');
    endMeleeTargeting(false);
  }
}

/**
 * Confirm melee target and execute attack
 */
async function confirmMeleeTarget(targetToken: any, state: MeleeTargetingState): Promise<void> {
  // Set target using Foundry's targeting API
  try {
    await game.user.updateTokenTargets([targetToken.id]);
    console.log('Mastery System | Target set:', targetToken.name);
  } catch (error) {
    console.warn('Mastery System | Could not set target via API', error);
  }
  
  // Execute attack resolution
  // This will be handled by the existing combat option handler
  // We just need to pass the target information
  console.log('Mastery System | Melee attack confirmed:', {
    attacker: state.token.name,
    target: targetToken.name,
    option: state.option.name,
    reach: state.reachMeters + 'm'
  });
  
  // Call the existing attack handler with target info
  // The handler should be able to access the target via game.user.targets
  // For now, we'll just log and end targeting mode
  // TODO: Integrate with actual attack resolution
  
  // End targeting mode
  endMeleeTargeting(true);
  
  // Trigger notification
  ui.notifications?.info(`Melee attack: ${state.token.name} → ${targetToken.name} (${state.option.name})`);
}

/**
 * End melee targeting mode
 * @param success - Whether targeting was successful (target selected) or cancelled
 */
export function endMeleeTargeting(success: boolean): void {
  const state = activeMeleeTargeting;
  if (!state) return;
  
  console.log('Mastery System | Ending melee targeting mode, success =', success);
  
  // Remove event listeners
  canvas.stage.off('pointerdown', state.onPointerDown);
  window.removeEventListener('keydown', state.onKeyDown);
  
  // Clear highlights
  let highlight: any = null;
  try {
    if (canvas.grid?.highlight) {
      highlight = canvas.grid.highlight;
    } else if (canvas.grid && (canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(state.highlightId);
    }
  } catch (error) {
    // Ignore
  }
  
  if (highlight && highlight.clear) {
    highlight.clear();
  }
  
  // Clear preview graphics
  if (state.previewGraphics && state.previewGraphics.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  
  // Restore token alphas and remove tints
  for (const [token, originalAlpha] of state.originalTokenAlphas.entries()) {
    token.alpha = originalAlpha;
    
    // Remove red tint filter
    if (token.filters) {
      token.filters = token.filters.filter((f: any) => {
        // Remove ColorMatrixFilter that was used for tinting
        return !(f instanceof PIXI.filters.ColorMatrixFilter);
      });
      if (token.filters.length === 0) {
        token.filters = null;
      }
    }
  }
  
  // Clear state
  activeMeleeTargeting = null;
  
  if (!success) {
    ui.notifications?.info('Melee targeting cancelled');
  }
}

/**
 * Check if melee targeting is currently active
 */
export function isMeleeTargetingActive(): boolean {
  return activeMeleeTargeting !== null;
}

