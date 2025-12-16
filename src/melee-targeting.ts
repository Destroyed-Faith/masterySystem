/**
 * Melee Targeting – Foundry VTT v13
 * Clean, deterministic, hex-safe implementation
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";

interface MeleeTargetingState {
  token: any;
  option: RadialCombatOption;
  reachMeters: number;
  reachGridUnits: number;
  highlightId: string;
  previewGraphics: PIXI.Graphics | null;
  originalTokenAlphas: Map<any, number>;
  targetRings: Map<string, PIXI.Graphics>; // Map of token ID to ring graphics
  validTargets: Set<string>; // Set of valid target token IDs
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

let activeMeleeTargeting: MeleeTargetingState | null = null;

/* -------------------------------------------- */
/*  Utilities                                   */
/* -------------------------------------------- */

function metersToGridUnits(meters: number): number {
  const d = canvas.grid?.distance ?? 1;
  return meters / d;
}

function getMeleeReachMeters(option: RadialCombatOption): number {
  // Use option.range if available (new unified range system)
  if (option.range !== undefined) {
    console.log('Mastery System | [MELEE TARGETING] Using option.range:', option.range, {
      optionId: option.id,
      optionName: option.name,
      slot: option.slot,
      source: option.source
    });
    return option.range;
  }
  
  // Fallback to meleeReachMeters if set (legacy support)
  if (option.meleeReachMeters !== undefined) {
    console.log('Mastery System | [MELEE TARGETING] Using option.meleeReachMeters (legacy):', option.meleeReachMeters);
    return option.meleeReachMeters;
  }
  
  // Default fallback
  console.warn('Mastery System | [MELEE TARGETING] No range found, using default 2m', {
    optionId: option.id,
    optionName: option.name,
    hasRange: option.range !== undefined,
    hasMeleeReachMeters: option.meleeReachMeters !== undefined
  });
  return 2; // default melee reach
}

/* -------------------------------------------- */
/*  Find Valid Targets                          */
/* -------------------------------------------- */

/**
 * Find all tokens within melee reach
 */
function findValidTargets(state: MeleeTargetingState): Set<string> {
  const validTargets = new Set<string>();
  const attackerToken = state.token;
  const reachMeters = state.reachMeters;
  const reachGridUnits = state.reachGridUnits;
  
  if (!attackerToken || !canvas.grid) {
    console.log('Mastery System | [MELEE TARGETING] Cannot find targets: missing token or grid');
    return validTargets;
  }
  
  const attackerCenter = attackerToken.center;
  const allTokens = canvas.tokens?.placeables || [];
  const gridDistance = canvas.grid.distance || 1;
  
  console.log('Mastery System | [MELEE TARGETING] Finding valid targets', {
    reachMeters,
    reachGridUnits,
    gridDistance,
    totalTokens: allTokens.length
  });
  
  for (const token of allTokens) {
    // Skip own token
    if (token.id === attackerToken.id) continue;
    
    // Skip tokens without actor
    if (!token.actor) continue;
    
    // Calculate distance
    const tokenCenter = token.center;
    const distancePx = Math.sqrt(
      Math.pow(tokenCenter.x - attackerCenter.x, 2) + 
      Math.pow(tokenCenter.y - attackerCenter.y, 2)
    );
    
    // Convert to grid units
    const distanceGridUnits = distancePx / (canvas.grid.size || 100);
    const distanceMeters = distanceGridUnits * gridDistance;
    
    // Check if within reach
    if (distanceMeters <= reachMeters) {
      validTargets.add(token.id);
      console.log('Mastery System | [MELEE TARGETING] Valid target found', {
        targetId: token.id,
        targetName: token.name,
        distanceMeters: distanceMeters.toFixed(2),
        reachMeters
      });
    }
  }
  
  console.log('Mastery System | [MELEE TARGETING] Found valid targets', {
    count: validTargets.size,
    targetIds: Array.from(validTargets)
  });
  
  return validTargets;
}

/**
 * Create a ring around a token to mark it as a valid target
 */
function createTargetRing(token: any): PIXI.Graphics {
  const ring = new PIXI.Graphics();
  const radius = (token.w || token.width || 50) / 2 + 10; // Token radius + padding
  
  // Red ring for valid targets
  ring.lineStyle(3, 0xff0000, 1);
  ring.drawCircle(0, 0, radius);
  
  ring.position.set(token.center.x, token.center.y);
  ring.visible = true;
  ring.renderable = true;
  ring.alpha = 1.0;
  
  // IMPORTANT: Make ring non-interactive so it doesn't block clicks
  ring.interactive = false;
  ring.eventMode = 'none';
  
  return ring;
}

/**
 * Highlight reach area and mark valid targets
 */
function highlightReachArea(state: MeleeTargetingState): void {
  const grid = canvas.grid;
  if (!grid) return;

  const RANGE = Math.max(0, Math.floor(state.reachGridUnits));
  const tokenId = state.token?.document?.id;
  if (!tokenId) return;

  // HEX GRID → Grid Highlight Layer ONLY
  if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
    highlightHexesInRange(
      tokenId,
      RANGE,
      state.highlightId,
      0xff6666,
      0.5
    );
  }

  // GRIDLESS fallback → previewGraphics
  if (grid.type === CONST.GRID_TYPES.GRIDLESS && state.previewGraphics) {
    state.previewGraphics.clear();
    const c = state.token.center;
    const radiusPx = RANGE * (grid.size || 100);

    state.previewGraphics.lineStyle(3, 0xff6666, 1);
    state.previewGraphics.beginFill(0xff6666, 0.25);
    state.previewGraphics.drawCircle(0, 0, radiusPx);
    state.previewGraphics.endFill();
    state.previewGraphics.position.set(c.x, c.y);
    state.previewGraphics.visible = true;
  }
  
  // Find and mark valid targets
  state.validTargets = findValidTargets(state);
  
  // Create rings around valid targets
  const effectsLayer = canvas.effects || canvas.foreground;
  if (!effectsLayer) {
    console.warn('Mastery System | [MELEE TARGETING] No effects layer found for target rings');
    return;
  }
  
  const container = (effectsLayer as any).container || effectsLayer;
  
  for (const targetId of state.validTargets) {
    const targetToken = canvas.tokens?.get(targetId);
    if (!targetToken) continue;
    
    // Store original alpha
    if (!state.originalTokenAlphas.has(targetToken)) {
      state.originalTokenAlphas.set(targetToken, targetToken.alpha);
    }
    
    // Create ring
    const ring = createTargetRing(targetToken);
    state.targetRings.set(targetId, ring);
    container.addChild(ring);
    
    // Highlight target token slightly
    targetToken.alpha = Math.min(1.0, targetToken.alpha * 1.2);
  }
  
  console.log('Mastery System | [MELEE TARGETING] Target rings created', {
    count: state.targetRings.size
  });
}

/* -------------------------------------------- */
/*  Start / End Targeting                       */
/* -------------------------------------------- */

export function startMeleeTargeting(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | [MELEE TARGETING] startMeleeTargeting called', {
    tokenId: token?.id,
    tokenName: token?.name,
    optionId: option.id,
    optionName: option.name,
    optionRange: option.range,
    optionMeleeReachMeters: option.meleeReachMeters,
    slot: option.slot,
    source: option.source
  });
  
  endMeleeTargeting(false);

  token.control({ releaseOthers: false });

  const reachMeters = getMeleeReachMeters(option);
  const reachGridUnits = metersToGridUnits(reachMeters);
  
  console.log('Mastery System | [MELEE TARGETING] Calculated reach', {
    reachMeters,
    reachGridUnits,
    gridDistance: canvas.grid?.distance,
    gridType: canvas.grid?.type
  });

  const previewGraphics =
    canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS
      ? new PIXI.Graphics()
      : null;

  if (previewGraphics) {
    canvas.stage.addChild(previewGraphics);
  }

  const state: MeleeTargetingState = {
    token,
    option,
    reachMeters,
    reachGridUnits,
    highlightId: "mastery-melee",
    previewGraphics,
    originalTokenAlphas: new Map(),
    targetRings: new Map(),
    validTargets: new Set(),
    onPointerDown: handlePointerDown,
    onKeyDown: handleKeyDown
  };

  activeMeleeTargeting = state;

  // Use capture phase to catch clicks before they reach other handlers
  canvas.stage.on("pointerdown", state.onPointerDown, true);
  // Also listen on tokens layer as fallback
  if (canvas.tokens) {
    const tokensLayer = (canvas.tokens as any).layer || canvas.tokens;
    tokensLayer.on("pointerdown", state.onPointerDown, true);
  }
  window.addEventListener("keydown", state.onKeyDown);

  highlightReachArea(state);
}

export function endMeleeTargeting(success: boolean): void {
  const state = activeMeleeTargeting;
  if (!state) return;

  canvas.stage.off("pointerdown", state.onPointerDown, true);
  // Remove from tokens layer if added
  if (canvas.tokens) {
    const tokensLayer = (canvas.tokens as any).layer || canvas.tokens;
    tokensLayer.off("pointerdown", state.onPointerDown, true);
  }
  window.removeEventListener("keydown", state.onKeyDown);

  // CLEAR GRID HIGHLIGHT (IMPORTANT)
  clearHexHighlight(state.highlightId);

  // Clear preview graphics
  if (state.previewGraphics) {
    state.previewGraphics.destroy(true);
  }
  
  // Remove target rings
  for (const [_targetId, ring] of state.targetRings) {
    if (ring.parent) {
      ring.parent.removeChild(ring);
    }
    ring.destroy(true);
  }
  state.targetRings.clear();

  // Restore target visuals
  for (const [token, alpha] of state.originalTokenAlphas) {
    token.alpha = alpha;
    if ((token as any).msOriginalTint !== undefined) {
      token.tint = (token as any).msOriginalTint;
      delete (token as any).msOriginalTint;
    }
  }

  activeMeleeTargeting = null;

  if (!success) {
    ui.notifications?.info("Melee targeting cancelled");
  }
}

/* -------------------------------------------- */
/*  Input Handling                              */
/* -------------------------------------------- */

function handleKeyDown(ev: KeyboardEvent): void {
  if (ev.key === "Escape") {
    endMeleeTargeting(false);
  }
}

function handlePointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = activeMeleeTargeting;
  if (!state) {
    console.log('Mastery System | [MELEE TARGETING] handlePointerDown: No active targeting state');
    return;
  }

  console.log('Mastery System | [MELEE TARGETING] handlePointerDown', {
    button: ev.button,
    targetType: ev.target?.constructor?.name,
    targetDocumentType: (ev.target as any)?.document?.type,
    targetId: (ev.target as any)?.id,
    stateTokenId: state.token?.document?.id
  });

  if (ev.button !== 0) {
    console.log('Mastery System | [MELEE TARGETING] Non-left click, cancelling');
    endMeleeTargeting(false);
    return;
  }

  // Use the same method as utility-targeting: find token at click position
  const worldPos = ev.data.getLocalPosition(canvas.app.stage);
  const tokens = canvas.tokens?.placeables || [];
  
  console.log('Mastery System | [MELEE TARGETING] Searching for token at click position', {
    worldPos: { x: worldPos.x, y: worldPos.y },
    totalTokens: tokens.length,
    validTargets: Array.from(state.validTargets)
  });
  
  // Try multiple methods to find the clicked token
  let clickedToken: any = null;
  
  // Method 1: Check bounds.contains (standard method)
  for (const token of tokens) {
    const bounds = token.bounds;
    if (bounds && bounds.contains(worldPos.x, worldPos.y)) {
      clickedToken = token;
      console.log('Mastery System | [MELEE TARGETING] Found token via bounds.contains', {
        tokenId: token.id,
        tokenName: token.name,
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
      });
      break;
    }
  }
  
  // Method 2: If not found, check distance to token center (fallback)
  if (!clickedToken) {
    let closestToken: any = null;
    let closestDistance = Infinity;
    
    for (const token of tokens) {
      const tokenCenter = token.center;
      const distance = Math.sqrt(
        Math.pow(worldPos.x - tokenCenter.x, 2) + 
        Math.pow(worldPos.y - tokenCenter.y, 2)
      );
      const tokenRadius = (token.w || token.width || 50) / 2;
      
      if (distance <= tokenRadius * 1.5) { // 1.5x radius for easier clicking
        if (distance < closestDistance) {
          closestDistance = distance;
          closestToken = token;
        }
      }
    }
    
    if (closestToken) {
      clickedToken = closestToken;
      console.log('Mastery System | [MELEE TARGETING] Found token via distance check', {
        tokenId: closestToken.id,
        tokenName: closestToken.name,
        distance: closestDistance.toFixed(2)
      });
    }
  }
  
  // Method 3: Check if ev.target is a token or has a token ancestor
  if (!clickedToken) {
    let current: any = ev.target;
    let depth = 0;
    while (current && depth < 10) {
      if (current.document && current.document.type === "Token") {
        const tokenId = current.id || current.document?.id;
        clickedToken = tokens.find((t: any) => t.id === tokenId);
        if (clickedToken) {
          console.log('Mastery System | [MELEE TARGETING] Found token via ev.target traversal', {
            tokenId: clickedToken.id,
            tokenName: clickedToken.name,
            depth
          });
          break;
        }
      }
      current = current.parent;
      depth++;
    }
  }

  console.log('Mastery System | [MELEE TARGETING] Token search result', {
    worldPos: { x: worldPos.x, y: worldPos.y },
    clickedTokenId: clickedToken?.id,
    clickedTokenName: clickedToken?.name,
    totalTokens: tokens.length,
    validTargets: Array.from(state.validTargets),
    foundVia: clickedToken ? 'found' : 'not found'
  });

  if (!clickedToken) {
    // Don't cancel immediately - might be clicking on empty space
    // Only cancel if clicking outside the highlighted area
    console.log('Mastery System | [MELEE TARGETING] No token found at click position', {
      worldPos: { x: worldPos.x, y: worldPos.y },
      validTargets: Array.from(state.validTargets),
      allTokenPositions: tokens.slice(0, 5).map((t: any) => ({
        id: t.id,
        name: t.name,
        center: t.center,
        bounds: t.bounds ? { x: t.bounds.x, y: t.bounds.y, width: t.bounds.width, height: t.bounds.height } : null
      }))
    });
    
    // Check if click is on a valid target ring (clicked on ring, not token)
    let clickedOnRing = false;
    for (const [targetId, ring] of state.targetRings) {
      const ringPos = ring.position;
      const ringRadius = (ring as any).radius || 50;
      const distance = Math.sqrt(
        Math.pow(worldPos.x - ringPos.x, 2) + 
        Math.pow(worldPos.y - ringPos.y, 2)
      );
      if (distance <= ringRadius) {
        clickedOnRing = true;
        // Get the token for this ring
        clickedToken = canvas.tokens?.get(targetId);
        console.log('Mastery System | [MELEE TARGETING] Clicked on ring, found token', {
          targetId,
          tokenId: clickedToken?.id,
          tokenName: clickedToken?.name
        });
        break;
      }
    }
    
    if (!clickedToken && !clickedOnRing) {
      console.log('Mastery System | [MELEE TARGETING] Clicked outside, cancelling');
      endMeleeTargeting(false);
      return;
    }
  }

  if (clickedToken.id === state.token.id) {
    console.log('Mastery System | [MELEE TARGETING] Clicked on own token, ignoring');
    return;
  }
  
  // Check if target is in valid targets list
  const targetTokenId = clickedToken.id;
  if (!state.validTargets.has(targetTokenId)) {
    console.log('Mastery System | [MELEE TARGETING] Target not in valid targets list', {
      targetId: targetTokenId,
      targetName: clickedToken.name,
      validTargets: Array.from(state.validTargets),
      reachMeters: state.reachMeters
    });
    ui.notifications?.warn(`Target is out of range (${state.reachMeters}m)`);
    return;
  }

  console.log('Mastery System | [MELEE TARGETING] Valid target clicked - starting attack', {
    targetId: clickedToken.id,
    targetName: clickedToken.name,
    attackerId: state.token.id,
    attackerName: state.token.name,
    reachMeters: state.reachMeters,
    reachGridUnits: state.reachGridUnits,
    optionId: state.option.id,
    optionName: state.option.name
  });

  ev.stopPropagation();
  ev.stopImmediatePropagation();

  // Start the attack
  // TODO: Trigger actual attack roll here
  // For now, just end targeting and notify
  ui.notifications?.info(`Attacking ${clickedToken.name || 'target'}`);
  
  endMeleeTargeting(true);
}

export function isMeleeTargetingActive(): boolean {
  return activeMeleeTargeting !== null;
}
