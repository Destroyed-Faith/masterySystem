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
// Guard to prevent duplicate confirmMeleeTarget calls
let isConfirmingTarget = false;

/**
 * Parse reach from weapon innate abilities or option
 * @param innateAbilities - Array of ability strings like ["Reach (+1 m)", "Finesse"]
 * @returns Reach in meters (2m base + bonus from weapon)
 */
function parseReachFromAbilities(innateAbilities: string[]): number {
  const baseReach = 2; // Default melee reach is 2m
  if (!innateAbilities || !Array.isArray(innateAbilities)) {
    return baseReach;
  }
  
  for (const ability of innateAbilities) {
    // Match "Reach (+1 m)" or "Reach (+2 m)" - new format
    const bonusMatch = ability.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
    if (bonusMatch) {
      const bonus = parseInt(bonusMatch[1], 10);
      return baseReach + bonus; // 2m base + bonus
    }
    
    // Legacy support: Match "Reach (2 m)" or "Reach (3 m)" - old format
    const legacyMatch = ability.match(/Reach\s*\((\d+)\s*m\)/i);
    if (legacyMatch) {
      return parseInt(legacyMatch[1], 10);
    }
  }
  
  return baseReach; // Default melee reach is 2m
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
      // If weapon has explicit reach, use it (even if it's 2m, which is now the default)
      if (reach >= 2) {
        console.log('Mastery System | Found weapon reach:', reach, 'm from', equippedWeapon.name);
        return reach;
      }
    }
  }
  
  // Default: 2 meters (extended melee reach)
  return 2;
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
    
    // For hex grids, use Foundry's distance measurement (new v13 API)
    let distanceInUnits = gridDistance;
    try {
      if (canvas.grid?.measurePath) {
        // New v13 API: measurePath returns array of distances
        const waypoints = [
          { x: attackerCenter.x, y: attackerCenter.y },
          { x: targetCenter.x, y: targetCenter.y }
        ];
        const measurement = canvas.grid.measurePath(waypoints, {});
        if (measurement && measurement.length > 0) {
          distanceInUnits = measurement[0];
        }
      } else if (canvas.grid?.measureDistances) {
        // Fallback to old API
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
  console.log('Mastery System | [DEBUG] highlightReachArea called', {
    hasGrid: !!canvas.grid,
    hasPreviewGraphics: !!state.previewGraphics,
    reachGridUnits: state.reachGridUnits,
    reachMeters: state.reachMeters,
    tokenName: state.token.name
  });
  
  if (!canvas.grid || !state.previewGraphics) {
    console.warn('Mastery System | [DEBUG] highlightReachArea: Missing grid or previewGraphics', {
      hasGrid: !!canvas.grid,
      hasPreviewGraphics: !!state.previewGraphics
    });
    return;
  }
  
  const attackerCenter = state.token.center;
  const radiusPx = state.reachGridUnits * (canvas.grid.size || 1);
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Drawing circle', {
    attackerCenter: { x: attackerCenter.x, y: attackerCenter.y },
    radiusPx,
    gridSize: canvas.grid.size,
    gridType: canvas.grid.type
  });
  
  // Clear previous graphics
  state.previewGraphics.clear();
  
  // Always draw circle for visibility (even on hex grids)
  state.previewGraphics.lineStyle(3, 0xff6666, 1.0); // Thicker, fully opaque border
  state.previewGraphics.beginFill(0xff6666, 0.25); // Slightly more visible fill
  state.previewGraphics.drawCircle(0, 0, radiusPx);
  state.previewGraphics.endFill();
  
  // Add an inner ring for better visibility
  state.previewGraphics.lineStyle(1, 0xff8888, 0.6);
  state.previewGraphics.drawCircle(0, 0, radiusPx * 0.9);
  
  // Position at attacker center
  state.previewGraphics.position.set(attackerCenter.x, attackerCenter.y);
  
  // Ensure graphics are visible and renderable
  state.previewGraphics.visible = true;
  state.previewGraphics.renderable = true;
  state.previewGraphics.alpha = 1.0;
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Circle drawn', {
    radiusPx,
    position: { x: state.previewGraphics.position.x, y: state.previewGraphics.position.y },
    visible: state.previewGraphics.visible,
    renderable: state.previewGraphics.renderable,
    alpha: state.previewGraphics.alpha,
    parent: state.previewGraphics.parent?.constructor?.name,
    worldVisible: state.previewGraphics.worldVisible,
    worldAlpha: state.previewGraphics.worldAlpha,
    graphicsBounds: state.previewGraphics.getBounds(),
    hasParent: !!state.previewGraphics.parent,
    parentVisible: state.previewGraphics.parent ? (state.previewGraphics.parent as any).visible : false,
    parentWorldVisible: state.previewGraphics.parent ? (state.previewGraphics.parent as any).worldVisible : false
  });
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Now attempting hex highlighting');
  
  // Also highlight hexes within reach using grid highlight
  let highlight: any = null;
  let highlightMethod = 'none';
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
      highlightMethod = 'canvas.interface.grid.highlight';
      console.log('Mastery System | [DEBUG] Using canvas.interface.grid.highlight for melee reach');
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
      highlight = canvas.grid.highlight;
      highlightMethod = 'canvas.grid.highlight';
      console.log('Mastery System | [DEBUG] Using canvas.grid.highlight (fallback) for melee reach');
    } else if ((canvas.grid as any).getHighlightLayer) {
      highlight = (canvas.grid as any).getHighlightLayer(state.highlightId);
      if (!highlight && (canvas.grid as any).addHighlightLayer) {
        highlight = (canvas.grid as any).addHighlightLayer(state.highlightId);
      }
      highlightMethod = 'getHighlightLayer';
      console.log('Mastery System | [DEBUG] Using getHighlightLayer for melee reach');
    }
  } catch (error) {
    console.warn('Mastery System | [DEBUG] Could not get highlight layer for melee reach', error);
  }
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Highlight layer check', {
    hasHighlight: !!highlight,
    highlightMethod,
    highlightType: highlight ? highlight.constructor.name : 'null',
    highlightMethods: highlight ? Object.getOwnPropertyNames(Object.getPrototypeOf(highlight)).filter(m => typeof highlight[m] === 'function') : []
  });
  
  if (highlight) {
    // Try to clear the highlight layer
    if (typeof highlight.clear === 'function') {
      try {
        highlight.clear();
        console.log('Mastery System | [DEBUG] Highlight layer cleared for melee reach');
      } catch (error) {
        console.warn('Mastery System | [DEBUG] Error clearing highlight layer', error);
      }
    } else {
      console.log('Mastery System | [DEBUG] Highlight layer found but no clear method');
    }
  } else {
    console.warn('Mastery System | [DEBUG] No highlight layer available - hex highlighting will not work');
  }
  
  // Highlight hexes within reach
  // For hex grids, we need to iterate through nearby hexes
  const maxHexDistance = Math.ceil(state.reachGridUnits);
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Getting grid position', {
    maxHexDistance,
    attackerCenter: { x: attackerCenter.x, y: attackerCenter.y }
  });
  
  // Get grid position of attacker using new v13 API
  let attackerGrid: { col: number; row: number } | null = null;
  let gridPositionMethod = 'none';
  try {
    if (canvas.grid?.getOffset) {
      // New v13 API: getOffset returns {col, row}
      const offset = canvas.grid.getOffset(attackerCenter.x, attackerCenter.y);
      attackerGrid = { col: offset.col, row: offset.row };
      gridPositionMethod = 'getOffset';
      console.log('Mastery System | [DEBUG] Got grid position via getOffset', attackerGrid);
    } else if (canvas.grid?.getGridPositionFromPixels) {
      // Fallback to old API
      const oldGrid = canvas.grid.getGridPositionFromPixels(attackerCenter.x, attackerCenter.y);
      if (oldGrid) {
        attackerGrid = { col: oldGrid.x, row: oldGrid.y };
        gridPositionMethod = 'getGridPositionFromPixels';
        console.log('Mastery System | [DEBUG] Got grid position via getGridPositionFromPixels', attackerGrid);
      }
    }
  } catch (error) {
    console.warn('Mastery System | [DEBUG] Could not get grid position', error);
  }
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Grid position result', {
    attackerGrid,
    gridPositionMethod,
    hasHighlight: !!highlight
  });
  
  if (attackerGrid && highlight) {
    console.log('Mastery System | [DEBUG] highlightReachArea: Starting hex iteration', {
      attackerGrid,
      maxHexDistance,
      totalHexesToCheck: (maxHexDistance * 2 + 1) * (maxHexDistance * 2 + 1)
    });
    
    let hexesHighlighted = 0;
    // For hex grids, use cube coordinates or axial coordinates
    // Simple approach: check all hexes in a square area and measure distance
    for (let q = -maxHexDistance; q <= maxHexDistance; q++) {
      for (let r = -maxHexDistance; r <= maxHexDistance; r++) {
        // For hex grids, calculate distance using hex distance formula
        // In axial coordinates: distance = (|q| + |r| + |q + r|) / 2
        // But we need to check if this hex is within reach
        const gridCol = attackerGrid.col + q;
        const gridRow = attackerGrid.row + r;
        
        // Measure actual distance from attacker to this hex using new v13 API
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
        
        if (hexCenter) {
          const dx = hexCenter.x - attackerCenter.x;
          const dy = hexCenter.y - attackerCenter.y;
          const pixelDistance = Math.sqrt(dx * dx + dy * dy);
          const gridDistance = pixelDistance / (canvas.grid.size || 1);
          
          // Use Foundry's distance measurement if available (new v13 API)
          let distanceInUnits = gridDistance;
          try {
            if (canvas.grid?.measurePath) {
              // New v13 API: measurePath returns array of distances
              const waypoints = [
                { x: attackerCenter.x, y: attackerCenter.y },
                { x: hexCenter.x, y: hexCenter.y }
              ];
              const measurement = canvas.grid.measurePath(waypoints, {});
              if (measurement && measurement.length > 0) {
                distanceInUnits = measurement[0];
              }
            } else if (canvas.grid?.measureDistances) {
              // Fallback to old API
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
            // Try different methods to highlight the hex
            let highlighted = false;
            try {
              // Foundry v13 API: highlight.highlightPosition(col, row, options)
              if (highlight && typeof highlight.highlightPosition === 'function') {
                highlight.highlightPosition(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                highlighted = true;
              } 
              // Alternative API: highlight.highlightGridPosition
              else if (highlight && typeof highlight.highlightGridPosition === 'function') {
                highlight.highlightGridPosition(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                highlighted = true;
              } 
              // Fallback: highlight.highlight
              else if (highlight && typeof highlight.highlight === 'function') {
                highlight.highlight(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                highlighted = true;
              }
              // Direct grid highlight (v13)
              else if (canvas.grid && typeof (canvas.grid as any).highlightPosition === 'function') {
                (canvas.grid as any).highlightPosition(gridCol, gridRow, { color: 0xff6666, alpha: 0.5 });
                highlighted = true;
              }
              // Last resort: try to add highlight directly
              else if (highlight && typeof highlight.add === 'function') {
                highlight.add({ col: gridCol, row: gridRow, color: 0xff6666, alpha: 0.5 });
                highlighted = true;
              }
              
              if (highlighted) {
                hexesHighlighted++;
              }
            } catch (error) {
              console.warn('Mastery System | [DEBUG] Could not highlight hex at', gridCol, gridRow, error);
            }
          }
        }
      }
    }
    
    console.log('Mastery System | [DEBUG] highlightReachArea: Hex highlighting complete', {
      hexesHighlighted,
      totalHexesChecked: (maxHexDistance * 2 + 1) * (maxHexDistance * 2 + 1)
    });
  } else {
    console.warn('Mastery System | [DEBUG] highlightReachArea: Skipping hex highlighting', {
      hasAttackerGrid: !!attackerGrid,
      hasHighlight: !!highlight
    });
  }
  
  console.log('Mastery System | [DEBUG] highlightReachArea: Complete');
}

/**
 * Apply visual tint to valid target tokens
 */
function highlightValidTargets(state: MeleeTargetingState): void {
  console.log('Mastery System | [DEBUG] highlightValidTargets: Starting', {
    reachGridUnits: state.reachGridUnits,
    reachMeters: state.reachMeters,
    tokenName: state.token.name
  });
  
  const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
  
  console.log('Mastery System | [DEBUG] highlightValidTargets: Found', validTargets.length, 'valid targets within', state.reachMeters, 'm reach', {
    targetNames: validTargets.map(t => t.name)
  });
  
  // Store original alphas and apply red tint
  state.originalTokenAlphas.clear();
  
  for (const target of validTargets) {
    // Store original alpha
    state.originalTokenAlphas.set(target, target.alpha);
    
    // Apply red tint (reduce alpha slightly and add red filter)
    target.alpha = Math.max(0.6, target.alpha * 0.8);
    
    // Add red tint using a simple color overlay instead of deprecated ColorMatrixFilter
    // Store original tint for restoration
    const originalTint = target.tint;
    (target as any).msOriginalTint = originalTint;
    
    // Apply red tint (mix red with original color)
    target.tint = 0xff6666;
    
    // Also add a red outline/border effect using a graphics overlay
    // This is more reliable than filters
    if (!(target as any).msTargetOverlay) {
      const overlay = new PIXI.Graphics();
      const radius = Math.max(target.w || 50, target.h || 50) / 2 + 5;
      overlay.lineStyle(3, 0xff6666, 0.8);
      overlay.drawCircle(0, 0, radius);
      // Position overlay at token center
      overlay.position.set((target.w || 50) / 2, (target.h || 50) / 2);
      target.addChild(overlay);
      (target as any).msTargetOverlay = overlay;
      console.log('Mastery System | [DEBUG] Added red overlay to target:', target.name, {
        radius,
        overlayPosition: { x: overlay.position.x, y: overlay.position.y },
        targetSize: { w: target.w, h: target.h }
      });
    } else {
      console.log('Mastery System | [DEBUG] Target already has overlay:', target.name);
    }
  }
  
  console.log('Mastery System | [DEBUG] highlightValidTargets: Complete', {
    targetsHighlighted: validTargets.length
  });
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
  
  // Add to effects layer - try multiple layers to ensure visibility
  let effectsContainer: PIXI.Container | null = null;
  
  // Try tokens layer first (most visible)
  if (canvas.tokens) {
    if ((canvas.tokens as any).container && typeof (canvas.tokens as any).container.addChild === 'function') {
      effectsContainer = (canvas.tokens as any).container;
    } else if (typeof (canvas.tokens as any).addChild === 'function') {
      effectsContainer = canvas.tokens as any;
    }
  }
  
  // Fallback to effects layer
  if (!effectsContainer && canvas.effects) {
    if ((canvas.effects as any).container && typeof (canvas.effects as any).container.addChild === 'function') {
      effectsContainer = (canvas.effects as any).container;
    } else if (typeof (canvas.effects as any).addChild === 'function') {
      effectsContainer = canvas.effects as any;
    }
  }
  
  // Fallback to foreground layer
  if (!effectsContainer && canvas.foreground) {
    if ((canvas.foreground as any).container && typeof (canvas.foreground as any).container.addChild === 'function') {
      effectsContainer = (canvas.foreground as any).container;
    } else if (typeof (canvas.foreground as any).addChild === 'function') {
      effectsContainer = canvas.foreground as any;
    }
  }
  
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
    // Ensure it's on top
    effectsContainer.setChildIndex(previewGraphics, effectsContainer.children.length - 1);
    console.log('Mastery System | [DEBUG] Melee reach circle added to container:', {
      containerName: effectsContainer.constructor.name,
      containerType: typeof effectsContainer,
      previewGraphicsParent: previewGraphics.parent?.constructor?.name,
      previewGraphicsVisible: previewGraphics.visible,
      previewGraphicsAlpha: previewGraphics.alpha,
      previewGraphicsWorldVisible: previewGraphics.worldVisible,
      previewGraphicsRenderable: previewGraphics.renderable,
      containerChildren: effectsContainer.children.length,
      previewGraphicsIndex: effectsContainer.getChildIndex(previewGraphics),
      containerVisible: effectsContainer.visible,
      containerWorldVisible: effectsContainer.worldVisible
    });
  } else {
    console.warn('Mastery System | [DEBUG] Could not find container for melee reach preview', {
      hasEffects: !!canvas.effects,
      hasForeground: !!canvas.foreground,
      hasTokens: !!canvas.tokens,
      effectsType: canvas.effects ? typeof canvas.effects : 'null',
      foregroundType: canvas.foreground ? typeof canvas.foreground : 'null',
      tokensType: canvas.tokens ? typeof canvas.tokens : 'null'
    });
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
  
  // Attach event listeners - use capture phase to catch events before tokens handle them
  // Also listen on token layer directly for better token click detection
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Attaching event listeners', {
    hasStage: !!canvas.stage,
    hasTokens: !!canvas.tokens,
    capturePhase: true,
    stageType: canvas.stage ? typeof canvas.stage : 'null',
    tokensType: canvas.tokens ? typeof canvas.tokens : 'null',
    stageInteractive: canvas.stage ? (canvas.stage as any).interactive : false,
    stageEventMode: canvas.stage ? (canvas.stage as any).eventMode : 'unknown'
  });
  
  try {
    canvas.stage.on('pointerdown', state.onPointerDown, true);
    console.log('Mastery System | [DEBUG] Event listener attached to canvas.stage (capture phase)');
  } catch (error) {
    console.error('Mastery System | [DEBUG] Failed to attach listener to canvas.stage', error);
  }
  
  if (canvas.tokens) {
    try {
      (canvas.tokens as any).on('pointerdown', state.onPointerDown, true);
      console.log('Mastery System | [DEBUG] Event listener attached to canvas.tokens (capture phase)');
    } catch (error) {
      console.warn('Mastery System | [DEBUG] Failed to attach listener to canvas.tokens', error);
    }
  }
  
  try {
    window.addEventListener('keydown', state.onKeyDown);
    console.log('Mastery System | [DEBUG] Keyboard listener attached');
  } catch (error) {
    console.error('Mastery System | [DEBUG] Failed to attach keyboard listener', error);
  }
  
  // Verify listeners are attached
  const stageListeners = (canvas.stage as any)._events?.pointerdown || [];
  const tokensListeners = canvas.tokens ? ((canvas.tokens as any)._events?.pointerdown || []) : [];
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Event listeners attached', {
    stageListenersCount: stageListeners.length,
    tokensListenersCount: tokensListeners.length,
    hasKeydownListener: true // Can't easily verify window listeners
  });
  
  // Draw reach area and highlight targets
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Calling highlightReachArea', {
    previewGraphicsParent: state.previewGraphics?.parent?.constructor?.name,
    previewGraphicsVisible: state.previewGraphics?.visible,
    previewGraphicsPosition: state.previewGraphics ? { x: state.previewGraphics.position.x, y: state.previewGraphics.position.y } : null
  });
  highlightReachArea(state);
  console.log('Mastery System | [DEBUG] startMeleeTargeting: After highlightReachArea', {
    previewGraphicsParent: state.previewGraphics?.parent?.constructor?.name,
    previewGraphicsVisible: state.previewGraphics?.visible,
    previewGraphicsWorldVisible: state.previewGraphics?.worldVisible,
    previewGraphicsAlpha: state.previewGraphics?.alpha,
    previewGraphicsPosition: state.previewGraphics ? { x: state.previewGraphics.position.x, y: state.previewGraphics.position.y } : null
  });
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Calling highlightValidTargets');
  highlightValidTargets(state);
  
  // Show notification to help user understand what's happening
  const validTargets = getValidMeleeTargets(token, reachGridUnits);
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Valid targets found', {
    count: validTargets.length,
    targetNames: validTargets.map(t => t.name)
  });
  
  if (validTargets.length > 0) {
    ui.notifications?.info(`Melee targeting active: ${reachMeters}m reach. ${validTargets.length} enemy(ies) in range. Click on an enemy to attack.`);
  } else {
    ui.notifications?.info(`Melee targeting active: ${reachMeters}m reach. No enemies in range. Move enemies within the red area to attack.`);
  }
  
  console.log('Mastery System | [DEBUG] startMeleeTargeting: Complete', {
    reachMeters,
    reachGridUnits,
    token: token.name,
    validTargets: validTargets.length,
    previewGraphicsParent: state.previewGraphics?.parent?.constructor?.name,
    previewGraphicsVisible: state.previewGraphics?.visible,
    previewGraphicsWorldVisible: state.previewGraphics?.worldVisible,
    previewGraphicsRenderable: state.previewGraphics?.renderable,
    previewGraphicsAlpha: state.previewGraphics?.alpha,
    canvasRenderer: canvas.app?.renderer ? {
      type: canvas.app.renderer.type,
      width: canvas.app.renderer.width,
      height: canvas.app.renderer.height,
      resolution: canvas.app.renderer.resolution,
      autoDensity: canvas.app.renderer.autoDensity
    } : 'no renderer',
    canvasStage: canvas.stage ? {
      visible: canvas.stage.visible,
      worldVisible: canvas.stage.worldVisible,
      children: canvas.stage.children.length
    } : 'no stage',
    effectsLayer: canvas.effects ? {
      visible: (canvas.effects as any).visible,
      worldVisible: (canvas.effects as any).worldVisible,
      children: (canvas.effects as any).children?.length || 0
    } : 'no effects layer'
  });
}

/**
 * Handle pointer down during melee targeting
 */
function handleMeleePointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = activeMeleeTargeting;
  if (!state) {
    console.log('Mastery System | [DEBUG] handleMeleePointerDown: No active state');
    return;
  }
  
  console.log('Mastery System | [DEBUG] handleMeleePointerDown: Event received', {
    button: ev.button,
    target: ev.target?.constructor?.name,
    currentTarget: ev.currentTarget?.constructor?.name,
    eventType: ev.type,
    pointerId: ev.pointerId,
    isPrimary: ev.isPrimary,
    globalX: ev.globalX,
    globalY: ev.globalY,
    worldX: ev.data ? ev.data.getLocalPosition(canvas.app.stage).x : 'N/A',
    worldY: ev.data ? ev.data.getLocalPosition(canvas.app.stage).y : 'N/A',
    targetDocument: (ev.target as any)?.document?.type,
    targetId: (ev.target as any)?.id,
    targetName: (ev.target as any)?.name
  });
  
  // Right or middle click cancels
  if (ev.button === 2 || ev.button === 1) {
    console.log('Mastery System | [DEBUG] Melee targeting cancelled via mouse button', ev.button);
    endMeleeTargeting(false);
    return;
  }
  
  // Left click - check if clicking on a valid target
  if (ev.button === 0) {
    // Get the clicked object from the event
    const clickedObject = ev.target;
    
    console.log('Mastery System | [DEBUG] handleMeleePointerDown: Analyzing click', {
      clickedObjectType: clickedObject?.constructor?.name,
      hasDocument: !!(clickedObject as any)?.document,
      documentType: (clickedObject as any)?.document?.type
    });
    
    // Try to find the token from the clicked object
    let clickedToken: any = null;
    let detectionMethod = 'none';
    
    // Method 1: Check if the clicked object is a token
    if (clickedObject && (clickedObject as any).document && (clickedObject as any).document.type === 'Token') {
      clickedToken = clickedObject;
      detectionMethod = 'direct';
      console.log('Mastery System | [DEBUG] Found token via direct check:', clickedToken.name);
    }
    
    // Method 2: Check if clicked object is a child of a token
    if (!clickedToken && clickedObject) {
      let parent = (clickedObject as any).parent;
      let depth = 0;
      while (parent && depth < 10) {
        if (parent.document && parent.document.type === 'Token') {
          clickedToken = parent;
          detectionMethod = 'parent-traversal';
          console.log('Mastery System | [DEBUG] Found token via parent traversal:', clickedToken.name, 'depth:', depth);
          break;
        }
        parent = parent.parent;
        depth++;
      }
    }
    
    // Method 3: Find token by position (fallback) - use token layer coordinates
    if (!clickedToken) {
      try {
        // Try to get position in token layer coordinates
        let worldPos: { x: number; y: number } | null = null;
        if (canvas.tokens && ev.data) {
          try {
            worldPos = ev.data.getLocalPosition(canvas.tokens);
            console.log('Mastery System | [DEBUG] Got world position via canvas.tokens:', worldPos);
          } catch (e) {
            // Fallback to stage coordinates
            worldPos = ev.data.getLocalPosition(canvas.app.stage);
            console.log('Mastery System | [DEBUG] Got world position via stage (fallback):', worldPos);
          }
        } else if (ev.data) {
          worldPos = ev.data.getLocalPosition(canvas.app.stage);
          console.log('Mastery System | [DEBUG] Got world position via stage:', worldPos);
        }
        
        if (worldPos) {
          const tokens = canvas.tokens?.placeables || [];
          console.log('Mastery System | [DEBUG] Checking', tokens.length, 'tokens for position match');
          
          clickedToken = tokens.find((token: any) => {
            if (!token.bounds) return false;
            // Check if point is within token bounds
            const bounds = token.bounds;
            const contains = bounds.contains(worldPos!.x, worldPos!.y);
            if (contains) {
              console.log('Mastery System | [DEBUG] Token', token.name, 'bounds contain click position');
            }
            return contains;
          });
          if (clickedToken) {
            detectionMethod = 'position-check';
            console.log('Mastery System | [DEBUG] Found token via position check:', clickedToken.name);
          } else {
            console.log('Mastery System | [DEBUG] No token found at position', worldPos);
          }
        }
      } catch (error) {
        console.warn('Mastery System | [DEBUG] Could not get world position from click', error);
      }
    }
    
    console.log('Mastery System | [DEBUG] handleMeleePointerDown: Token detection result', {
      clickedToken: clickedToken ? clickedToken.name : null,
      clickedTokenId: clickedToken ? clickedToken.id : null,
      detectionMethod,
      isAttacker: clickedToken && clickedToken.id === state.token.id
    });
    
    if (clickedToken && clickedToken.id !== state.token.id) {
      // Check if it's a valid target
      const validTargets = getValidMeleeTargets(state.token, state.reachGridUnits);
      const isValidTarget = validTargets.some(t => t.id === clickedToken.id);
      
      console.log('Mastery System | [DEBUG] handleMeleePointerDown: Target validation', {
        clickedTokenName: clickedToken.name,
        validTargetsCount: validTargets.length,
        validTargetNames: validTargets.map(t => t.name),
        isValidTarget
      });
      
      if (isValidTarget) {
        console.log('Mastery System | [DEBUG] Valid melee target selected:', clickedToken.name);
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        confirmMeleeTarget(clickedToken, state);
        return;
      } else {
        console.log('Mastery System | [DEBUG] Clicked token is not a valid target:', clickedToken.name);
      }
    } else if (clickedToken && clickedToken.id === state.token.id) {
      console.log('Mastery System | [DEBUG] Clicked on attacker token, ignoring');
    }
    
    // Clicked outside any valid target - cancel
    console.log('Mastery System | [DEBUG] Clicked outside valid target, cancelling melee targeting');
    endMeleeTargeting(false);
  }
}

/**
 * Calculate Evade (defense) for a target
 * Evade = Agility + Combat Reflexes + (Mastery Rank × 2)
 * Or use pre-calculated evadeTotal if available
 */
function calculateEvade(actor: any): number {
  const system = actor.system as any;
  
  // Try to use pre-calculated evadeTotal first
  if (system.combat?.evadeTotal !== undefined) {
    return system.combat.evadeTotal;
  }
  
  // Fallback calculation: Agility + Combat Reflexes + (MR × 2)
  const agility = system.attributes?.agility?.value || 0;
  const combatReflexes = system.combat?.reflexes || system.combat?.combatReflexes || 0;
  const masteryRank = system.mastery?.rank || 2;
  
  return agility + combatReflexes + (masteryRank * 2);
}

/**
 * Get attack attribute for melee attack
 * Defaults to Might, but can be Agility if weapon has Finesse
 */
function getAttackAttribute(actor: any, weapon: any): { name: string; value: number } {
  const system = actor.system as any;
  
  // Check if weapon has Finesse
  const innateAbilities = (weapon?.system as any)?.innateAbilities || [];
  const hasFinesse = innateAbilities.some((a: string) => a.toLowerCase().includes('finesse'));
  
  if (hasFinesse) {
    return {
      name: 'Agility',
      value: system.attributes?.agility?.value || 0
    };
  }
  
  // Default to Might
  return {
    name: 'Might',
    value: system.attributes?.might?.value || 0
  };
}

/**
 * Confirm melee target and create attack roll card
 */
async function confirmMeleeTarget(targetToken: any, state: MeleeTargetingState): Promise<void> {
  // Guard against duplicate calls
  if (isConfirmingTarget) {
    console.warn('Mastery System | confirmMeleeTarget already in progress, ignoring duplicate call');
    return;
  }
  
  isConfirmingTarget = true;
  
  try {
    const attacker = state.token.actor;
    const target = targetToken.actor;
  
  if (!attacker || !target) {
    console.error('Mastery System | Missing actor data for attack');
    endMeleeTargeting(false);
    return;
  }
  
  // Get equipped weapon
  const items = (attacker as any).items || [];
  const equippedWeapon = items.find((item: any) => 
    item.type === 'weapon' && (item.system as any)?.equipped === true
  );
  
  // Get attack data
  const attackAttr = getAttackAttribute(attacker, equippedWeapon);
  const attackerSystem = attacker.system as any;
  const masteryRank = attackerSystem.mastery?.rank || 2;
  
  // Get target's Evade
  const targetEvade = calculateEvade(target);
  
  // Get weapon damage for display
  const weaponDamage = equippedWeapon ? ((equippedWeapon.system as any)?.damage || (equippedWeapon.system as any)?.weaponDamage || '1d8') : '1d8';
  
  console.log('Mastery System | [ATTACK CARD CREATION] Weapon info', {
    hasEquippedWeapon: !!equippedWeapon,
    weaponId: equippedWeapon ? equippedWeapon.id : null,
    weaponName: equippedWeapon ? equippedWeapon.name : null,
    weaponDamage: weaponDamage
  });
  
  // Get available attack powers (powers that can be used on attack)
  // Show all active powers, or powers explicitly marked as canUseOnAttack
  const attackPowers = items.filter((item: any) => {
    if (item.type !== 'special') return false;
    const system = item.system as any;
    const powerType = system?.powerType;
    
    // Include if it's an active power
    if (powerType === 'active') {
      // If canUseOnAttack is explicitly set, respect it
      if (system?.canUseOnAttack !== undefined) {
        return system.canUseOnAttack === true;
      }
      // Otherwise, include all active powers (default to true)
      return true;
    }
    
    return false;
  });
  
  console.log('Mastery System | [ATTACK CARD CREATION] Attack powers found', {
    totalItems: items.length,
    specialItems: items.filter((item: any) => item.type === 'special').length,
    attackPowersCount: attackPowers.length,
    attackPowers: attackPowers.map((p: any) => ({
      id: p.id,
      name: p.name,
      powerType: (p.system as any)?.powerType,
      canUseOnAttack: (p.system as any)?.canUseOnAttack,
      level: (p.system as any)?.level
    }))
  });
  
  // Use the power from the radial menu option if available, otherwise use first available power
  let selectedPower: any = null;
  let selectedPowerLevel = 1;
  let selectedPowerSpecials: string[] = [];
  let selectedPowerDamage = '';
  
  // Check if a power was selected in the radial menu
  if (state.option && state.option.source === 'power' && state.option.item) {
    // Use the power from the radial menu selection
    selectedPower = state.option.item;
    console.log('Mastery System | [ATTACK CARD CREATION] Using power from radial menu', {
      powerId: selectedPower.id,
      powerName: selectedPower.name,
      optionId: state.option.id,
      optionName: state.option.name
    });
  } else if (attackPowers.length > 0) {
    // Fallback: Use the first available power if no power was selected in radial menu
    selectedPower = attackPowers[0];
    console.log('Mastery System | [ATTACK CARD CREATION] No power selected in radial menu, using first available', {
      powerId: selectedPower.id,
      powerName: selectedPower.name,
      totalAvailablePowers: attackPowers.length
    });
  }
  
  if (selectedPower) {
    const powerSystem = selectedPower.system as any;
    selectedPowerLevel = powerSystem.level || 1;
    selectedPowerSpecials = powerSystem.specials || [];
    selectedPowerDamage = powerSystem.roll?.damage || '';
    
    // Try to get level-specific data from power definitions
    try {
      const powersModule = await import('../../utils/powers/index.js' as any);
      const powerDefinitions = powersModule.ALL_MASTERY_POWERS || [];
      const powerTree = powerSystem.tree || '';
      const powerName = selectedPower.name;
      
      const powerDef = powerDefinitions.find((p: any) => 
        p.name === powerName && p.tree === powerTree
      );
      if (powerDef && powerDef.levels) {
        const levelData = powerDef.levels.find((l: any) => l.level === selectedPowerLevel);
        if (levelData) {
          // Use level-specific data if available
          if (levelData.special) {
            selectedPowerSpecials = levelData.special.split(',').map((s: string) => s.trim());
          }
          if (levelData.roll?.damage) {
            selectedPowerDamage = levelData.roll.damage;
          }
        }
      }
    } catch (e) {
      console.warn('Mastery System | Could not load power definitions for level data', e);
    }
    
    console.log('Mastery System | [ATTACK CARD CREATION] Selected power', {
      powerId: selectedPower.id,
      powerName: selectedPower.name,
      powerLevel: selectedPowerLevel,
      powerSpecials: selectedPowerSpecials,
      powerDamage: selectedPowerDamage,
      source: state.option && state.option.source === 'power' ? 'radial-menu' : 'first-available'
    });
  }
  
  // Create attack card in chat
  const attackCardContent = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas fa-sword"></i> Melee Attack</h3>
        <div class="attack-participants">
          <strong>${attacker.name}</strong> → <strong>${target.name}</strong>
        </div>
      </div>
      
      <div class="attack-details">
        <div class="detail-row">
          <span>Attack Attribute:</span>
          <span><strong>${attackAttr.name}</strong> (${attackAttr.value} dice)</span>
        </div>
        <div class="detail-row">
          <span>Mastery Rank:</span>
          <span><strong>${masteryRank}</strong> (keep ${masteryRank} highest)</span>
        </div>
        <div class="detail-row">
          <span>Target Evade:</span>
          <span><strong id="display-evade-${attacker.id}">${targetEvade}</strong></span>
        </div>
        ${equippedWeapon ? `
          <div class="detail-row">
            <span>Weapon:</span>
            <span><strong>${equippedWeapon.name}</strong> (${weaponDamage} damage)</span>
          </div>
        ` : ''}
        ${selectedPower ? `
          <div class="detail-row">
            <span>Power:</span>
            <span><strong>${selectedPower.name}</strong> (Level ${selectedPowerLevel})</span>
          </div>
        ` : ''}
      </div>
      
      <div class="raises-section">
        <label for="raises-input-${attacker.id}" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-weight: bold; color: #8b0000;">Raises:</span>
          <input type="number" class="raises-input" id="raises-input-${attacker.id}" 
                 min="0" value="0" step="1" inputmode="numeric" pattern="[0-9]*"
                 data-base-evade="${targetEvade}">
          <span class="raises-hint">(+4 TN per raise)</span>
        </label>
      </div>
      
      <div class="attack-actions">
        <button class="roll-attack-btn" data-attacker-id="${attacker.id}" data-target-id="${target.id}" 
                data-attribute="${attackAttr.name.toLowerCase()}" data-attribute-value="${attackAttr.value}"
                data-mastery-rank="${masteryRank}" data-target-evade="${targetEvade}" data-raises="0"
                data-base-evade="${targetEvade}">
          <i class="fas fa-dice-d20"></i> Roll Attack
        </button>
      </div>
    </div>
  `;
  
  console.log('Mastery System | [ATTACK CARD CREATION] Attack card HTML generated', {
    hasRaisesSection: attackCardContent.includes('raises-section'),
    hasRaisesInput: attackCardContent.includes('raises-input'),
    hasPowerSelection: attackCardContent.includes('power-select'),
    raisesInputId: `raises-input-${attacker.id}`,
    htmlLength: attackCardContent.length,
    htmlPreview: attackCardContent.substring(0, 500) + '...'
  });
  
  // Prepare initial flags
  const initialFlags = {
    attackType: 'melee',
    attackerId: attacker.id,
    targetId: target.id,
    targetTokenId: targetToken.id,
    attribute: attackAttr.name.toLowerCase(),
    attributeValue: attackAttr.value,
    masteryRank: masteryRank,
    targetEvade: targetEvade,
    weaponDamage: weaponDamage,
    baseEvade: targetEvade,
    weaponId: equippedWeapon ? equippedWeapon.id : null,
    selectedPowerId: selectedPower ? selectedPower.id : null,
    selectedPowerLevel: selectedPower ? selectedPowerLevel : null,
    selectedPowerSpecials: selectedPower ? selectedPowerSpecials : [],
    selectedPowerDamage: selectedPower ? selectedPowerDamage : ''
  };
  
  console.log('Mastery System | [ATTACK CARD CREATION] Initial flags being set', {
    weaponId: initialFlags.weaponId,
    weaponIdType: typeof initialFlags.weaponId,
    selectedPowerId: initialFlags.selectedPowerId,
    selectedPowerIdType: typeof initialFlags.selectedPowerId,
    selectedPowerExists: !!selectedPower,
    selectedPowerIdFromPower: selectedPower ? selectedPower.id : 'N/A',
    selectedPowerLevel: initialFlags.selectedPowerLevel,
    selectedPowerSpecials: initialFlags.selectedPowerSpecials,
    selectedPowerDamage: initialFlags.selectedPowerDamage,
    targetEvade: initialFlags.targetEvade,
    baseEvade: initialFlags.baseEvade,
    allFlagKeys: Object.keys(initialFlags),
    flagValues: {
      weaponId: initialFlags.weaponId,
      selectedPowerId: initialFlags.selectedPowerId,
      selectedPowerLevel: initialFlags.selectedPowerLevel,
      selectedPowerSpecials: JSON.stringify(initialFlags.selectedPowerSpecials),
      selectedPowerDamage: initialFlags.selectedPowerDamage
    }
  });
  
  // Create chat message
  const chatData: any = {
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor: attacker, token: state.token }),
    content: attackCardContent,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    flags: {
      'mastery-system': initialFlags
    }
  };
  
  const message = await ChatMessage.create(chatData);
    console.log('Mastery System | DEBUG: Chat message created', {
      messageId: message.id,
      contentLength: attackCardContent.length
    });
    
    // Initialize raises input handler and power selection
    const initializeRaisesInput = () => {
      const messageElement = $(`[data-message-id="${message.id}"]`);
      console.log('Mastery System | DEBUG: Initializing raises input handler', {
        messageId: message.id,
        messageElementFound: messageElement.length > 0,
        messageElementHtml: messageElement.length > 0 ? messageElement.html()?.substring(0, 200) : 'not found'
      });
      
      if (messageElement.length) {
        // Power is now automatically selected, no dropdown handler needed
        const raisesInput = messageElement.find(`#raises-input-${attacker.id}`);
        const displayEvade = messageElement.find(`#display-evade-${attacker.id}`);
        const rollButton = messageElement.find(`[data-attacker-id="${attacker.id}"].roll-attack-btn`);
        const baseEvade = targetEvade;
        
        console.log('Mastery System | DEBUG: Looking for elements in message', {
          raisesInputFound: raisesInput.length > 0,
          displayEvadeFound: displayEvade.length > 0,
          rollButtonFound: rollButton.length > 0,
          raisesInputId: `raises-input-${attacker.id}`,
          allInputsInMessage: messageElement.find('input').length,
          allInputsIds: messageElement.find('input').map((_i, el) => $(el).attr('id')).get()
        });
        
        if (raisesInput.length && displayEvade.length && rollButton.length) {
          console.log('Mastery System | DEBUG: All elements found, attaching input handler');
          
          // Prevent non-numeric input
          raisesInput.off('keypress').on('keypress', function(e: JQuery.KeyPressEvent) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char)) {
              e.preventDefault();
              console.log('Mastery System | DEBUG: Blocked non-numeric input:', char);
              return false;
            }
            return true;
          });
          
          // Handle input changes
          raisesInput.off('input').on('input', function() {
            let value = $(this).val() as string;
            // Remove any non-numeric characters
            value = value.replace(/[^0-9]/g, '');
            if (value === '') value = '0';
            $(this).val(value);
            
            const raises = parseInt(value) || 0;
            const adjustedEvade = baseEvade + (raises * 4);
            console.log('Mastery System | DEBUG: Raises input changed', {
              rawValue: $(this).val(),
              raises,
              baseEvade,
              adjustedEvade
            });
            displayEvade.text(adjustedEvade);
            rollButton.attr('data-target-evade', adjustedEvade);
            rollButton.attr('data-raises', raises);
          });
          
          console.log('Mastery System | DEBUG: Raises input handler attached successfully');
          return true;
        } else {
          console.warn('Mastery System | DEBUG: Not all elements found for raises input initialization', {
            raisesInput: raisesInput.length,
            displayEvade: displayEvade.length,
            rollButton: rollButton.length
          });
        }
      } else {
        console.warn('Mastery System | DEBUG: Message element not found for initialization', {
          messageId: message.id,
          allMessages: $('.message').length
        });
      }
      return false;
    };
    
    // Initialize raises input handler - use setTimeout to ensure DOM is ready
    setTimeout(() => {
      console.log('Mastery System | DEBUG: Attempting to initialize raises input (setTimeout)');
      if (!initializeRaisesInput()) {
        console.log('Mastery System | DEBUG: Raises input not found, waiting for renderChatMessage hook');
        // If still not found, wait for render hook
        Hooks.once('renderChatMessage', (_messageApp: any, _html: JQuery, messageData: any) => {
          console.log('Mastery System | DEBUG: renderChatMessage hook fired', {
            messageId: messageData.message.id,
            expectedMessageId: message.id,
            matches: messageData.message.id === message.id
          });
          if (messageData.message.id === message.id) {
            initializeRaisesInput();
          }
        });
      }
    }, 100);
    
    console.log('Mastery System | Melee attack card created:', {
      attacker: attacker.name,
      target: target.name,
      attribute: attackAttr.name,
      evade: targetEvade
    });
    
    // End targeting mode
    endMeleeTargeting(true);
  } finally {
    isConfirmingTarget = false;
  }
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
  canvas.stage.off('pointerdown', state.onPointerDown, true);
  if (canvas.tokens) {
    (canvas.tokens as any).off('pointerdown', state.onPointerDown, true);
  }
  window.removeEventListener('keydown', state.onKeyDown);
  
  // Clear highlights using new v13 API
  let highlight: any = null;
  try {
    // Use new v13 API: canvas.interface.grid.highlight
    if (canvas.interface?.grid?.highlight) {
      highlight = canvas.interface.grid.highlight;
    } else if (canvas.grid?.highlight) {
      // Fallback to old API for compatibility
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
    
    // Restore original tint
    const originalTint = (token as any).msOriginalTint;
    if (originalTint !== undefined) {
      token.tint = originalTint;
      delete (token as any).msOriginalTint;
    }
    
    // Remove overlay graphics
    const overlay = (token as any).msTargetOverlay;
    if (overlay && overlay.parent) {
      overlay.parent.removeChild(overlay);
      overlay.destroy();
      delete (token as any).msTargetOverlay;
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

