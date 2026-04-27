/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 * 
 * Uses a PIXI-based radial menu for visual option selection
 */

import { openRadialMenuForActor, getAllCombatOptionsForActor, closeRadialMenu } from './token-radial-menu';
import type { RadialCombatOption } from './token-radial-menu';
import { getSegmentIdForOption } from './radial-menu/options';
import { startMeleeTargeting, collectMeleeBurstHostileTokenIds } from './melee-targeting';
import { promptMeleeAoePrimaryChoice } from './melee-aoe-primary-dialog.js';
import { extractMeleeAoePowerBonusD8 } from './utils/power-mechanics.js';
import { startRangedTargeting } from './ranged-targeting';
import { startUtilitySingleTargetMode, startUtilityRadiusMode } from './utility-targeting';
import {
  getRoundState,
  getMovementRangeBonusMeters,
  getAvailableAttackActions,
  getAvailableMovementActions,
  consumeAttackAction,
  consumeMovementAction,
  refundAttackAction,
  markPowerUsedThisRound,
  hasPowerBeenUsedThisRound
} from './combat/action-economy';
import {
  gridStepsFromMeters,
  gridStepsBetweenCenters,
  measureSceneDistanceBetweenPoints,
  metersToSceneDistance
} from './utils/grid-range';
import {
  highlightHexesInRange,
  clearHexHighlight,
  collectHexKeysInRangeForToken,
  highlightTabuHexesOnLayer
} from './utils/hex-highlighting';

/** Same yellow tone as radial range preview (`range-preview.ts`). */
const MOVEMENT_RANGE_COLOR = 0xffe066;
const MOVEMENT_RANGE_ALPHA = 0.45;
const TABU_OVERLAY_COLOR = 0x992222;
const TABU_OVERLAY_ALPHA = 0.55;

/**
 * Movement state interface for guided movement mode
 */
interface MovementState {
  token: any;
  option: RadialCombatOption;
  origin: { x: number; y: number };
  maxRangeMeters: number;
  maxRangeSteps: number;
  blockedHexKeys: Set<string>;
  originalAlpha: number;
  previewGraphics: PIXI.Graphics | null;
  ruler: any | null;
  /** Static yellow range + tabu overlay; not cleared on pointer move. */
  highlightIdRange: string;
  /** Hover destination tint; cleared each pointer move. */
  highlightIdHover: string;
  onMove: (ev: PIXI.FederatedPointerEvent) => void;
  onDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

// Global movement state
let activeMovementState: MovementState | null = null;

/**
 * Initialize token action selector hooks
 */
export function initializeTokenActionSelector() {
  console.log('Mastery System | Initializing Token Action Selector');

  // Hook into Token HUD rendering to add custom icon
  Hooks.on('renderTokenHUD', (app: any, html: any, _data: any) => {
    // Get the token from app.object (Foundry v11+)
    const token = app.object;
    if (!token) {
      console.warn('Mastery System | Could not find token in Token HUD');
      return;
    }

    // Convert html to jQuery if it's not already (Foundry v13 compatibility)
    const $html = (html instanceof jQuery ? html : $(html)) as JQuery;

    // Find the right column of the Token HUD
    const rightCol = $html.find('.col.right');
    if (rightCol.length === 0) {
      console.warn('Mastery System | Could not find .col.right in Token HUD');
      return;
    }

    // Check if the icon already exists to avoid duplicates
    if (rightCol.find('.ms-action-selector').length > 0) {
      return;
    }

    // Get current action flag to show status
    const currentAction = token.document.getFlag('mastery-system', 'currentAction') || {};
    const hasAction = currentAction.category && currentAction.optionId;

    // Create the action selector icon
    const actionIcon = $(`
      <div class="control-icon ms-action-selector" 
           title="${hasAction ? `Current: ${currentAction.category} - ${currentAction.optionId}` : 'Select Action'}"
           data-token-id="${token.id}">
        <i class="fas fa-swords"></i>
      </div>
    `);

    // Add visual indicator if action is set
    if (hasAction) {
      actionIcon.addClass('active');
    }

    // Add click handler
    actionIcon.on('click', async (event: JQuery.ClickEvent) => {
      event.preventDefault();
      event.stopPropagation();
      await openMasteryActionRadialMenu(token);
    });

    // Append to right column
    rightCol.append(actionIcon);
  });

  // Hook into token updates to intercept movement
  Hooks.on('preUpdateToken', async (tokenDoc: any, change: any, _options: any, userId: string) => {
    // Only react to position changes
    if (change.x === undefined && change.y === undefined) {
      return;
    }

    // Only for the user performing the move
    if (userId !== game.user.id) {
      return;
    }

    // If guided movement is active, allow the movement (it's already validated)
    if (activeMovementState && activeMovementState.token.document.id === tokenDoc.id) {
      return; // Allow movement
    }

    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};

    // If nothing is selected, block movement
    if (!action.category || !action.optionId) {
      ui.notifications.warn('Bitte zuerst im Token-HUD eine Movement-Aktion wählen.');
      return false;
    }

    // Only allow movement if the category is "movement"
    if (action.category !== 'movement') {
      ui.notifications.warn('Du hast aktuell keine Movement-Aktion gewählt.');
      return false;
    }

    // At this point, movement is allowed
    // The flag will be cleared after successful movement in the updateToken hook
    return;
  });

  // Hook into token updates to clear flag after successful movement
  Hooks.on('updateToken', async (tokenDoc: any, change: any, _options: any, userId: string) => {
    // Only react to position changes
    if (change.x === undefined && change.y === undefined) {
      return;
    }

    // Only for the user performing the move
    if (userId !== game.user.id) {
      return;
    }

    // Clear the currentAction flag after successful movement
    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};
    if (action.category === 'movement') {
      await tokenDoc.unsetFlag('mastery-system', 'currentAction');
      console.log('Mastery System | Cleared currentAction flag after movement');
    }
  });


  // Melee/ranged: attack action is spent when the player clicks Roll on the chat card (see attack-roll-handler).
  Hooks.on("masterySystem.meleeTargetSelected", async (payload: any) => {
    try {
      const attackerToken = canvas.tokens?.get(payload.attackerTokenId);
      if (!attackerToken) {
        console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: missing attacker token", {
          attackerTokenId: payload.attackerTokenId
        });
        return;
      }

      const option = payload.option as RadialCombatOption;
      if (!attackerToken.actor) {
        console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: no attacker actor");
        return;
      }

      const targetId =
        typeof payload.targetTokenId === "string" ? payload.targetTokenId.trim() : "";
      if (!targetId) {
        console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: no targetTokenId", payload);
        return;
      }

      const targetToken = canvas.tokens?.get(targetId);
      if (!targetToken) {
        console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: token not on canvas", {
          targetTokenId: targetId
        });
        return;
      }

      const { createMeleeAttackCard } = await import("./combat/attack-executor.js");
      const aoeMelee = payload.aoeMelee ?? null;
      await createMeleeAttackCard(attackerToken, targetToken, option, null, aoeMelee);
    } catch (e) {
      console.error("Mastery System | [TOKEN ACTION SELECTOR] meleeTargetSelected hook failed", e);
    }
  });

  Hooks.on("masterySystem.rangedTargetSelected", async (payload: any) => {
    try {
      const attackerToken = canvas.tokens?.get(payload.attackerTokenId);
      const targetToken = canvas.tokens?.get(payload.targetTokenId);
      if (!attackerToken || !targetToken) {
        console.warn("Mastery System | [RADIAL FLOW] rangedTargetSelected: missing token(s)", payload);
        return;
      }

      const option = payload.option as RadialCombatOption;
      if (!attackerToken.actor) {
        console.warn("Mastery System | [RADIAL FLOW] rangedTargetSelected: no attacker actor");
        return;
      }

      const { createRangedAttackCard } = await import("./combat/attack-executor.js");
      await createRangedAttackCard(attackerToken, targetToken, option);
    } catch (e) {
      console.error("Mastery System | [TOKEN ACTION SELECTOR] rangedTargetSelected hook failed", e);
    }
  });
}

/**
 * Open the radial menu for combat action selection
 * @param token - The token to set the action for
 */
async function openMasteryActionRadialMenu(token: any) {
  const actor = token.actor;
  if (!actor) {
    ui.notifications.error('No actor found for this token.');
    return;
  }

  // Close any existing radial menu
  closeRadialMenu();

  // Get all combat options for the actor
  const allOptions = await getAllCombatOptionsForActor(actor);

  if (!allOptions.length) {
    ui.notifications.warn('No combat options available for this actor.');
    return;
  }

  // Open the radial menu
  openRadialMenuForActor(token, allOptions);
}


/**
 * Get hex center position for a token
 * Uses Foundry grid APIs - no calibration math needed
 */
function getTokenHexCenter(token: any): { x: number; y: number } {
  if (!token || !canvas.grid) {
    return { x: token?.x || 0, y: token?.y || 0 };
  }
  
  // Use token center directly - grid.getOffset will handle conversion to hex coordinates
  const center = token.center || { x: token.x, y: token.y };
  
  // For hex grids, optionally get the actual hex center pixel position
  // But for movement preview, we can use token.center directly since grid.getOffset handles conversion
  const isHexGrid = canvas.grid.type === CONST.GRID_TYPES.HEXAGONAL;
  
  if (isHexGrid && canvas.grid?.getOffset && canvas.grid?.getTopLeftPoint) {
    try {
      const offset = canvas.grid.getOffset(center.x, center.y) as any;
      if (offset && (offset.i !== undefined || offset.col !== undefined)) {
        const i = offset.i ?? offset.col ?? 0;
        const j = offset.j ?? offset.row ?? 0;
        // Get top-left point of the hex, then add half grid size to get center
        const tl = canvas.grid.getTopLeftPoint({ i, j });
        if (tl && tl.x !== undefined && tl.y !== undefined) {
          const gridSize = canvas.grid.size || 100;
          return {
            x: tl.x + gridSize / 2,
            y: tl.y + gridSize / 2
          };
        }
      }
    } catch (error) {
      console.warn('Mastery System | Could not calculate hex center, using token center', error);
    }
  }
  
  // Fallback to token center
  return center;
}

/** Pixel center of the token if its top-left were `tl`. */
function tokenCenterFromTopLeft(token: any, tl: { x: number; y: number }): { x: number; y: number } {
  const w = Number(token.w) || 0;
  const h = Number(token.h) || 0;
  return { x: tl.x + w / 2, y: tl.y + h / 2 };
}

/** Grid key `"i,j"` for the hex/square under the token's center at the given top-left. */
function hexKeyUnderTokenAtTopLeft(token: any, topLeft: { x: number; y: number }): string | null {
  const grid: any = canvas.grid;
  if (!grid?.getOffset) return null;
  const c = tokenCenterFromTopLeft(token, topLeft);
  const o = grid.getOffset(c.x, c.y) as any;
  if (o?.i === undefined || o?.j === undefined) return null;
  return `${o.i},${o.j}`;
}

/** Hex keys of grid cells where other tokens (with an actor) have their center — cannot end movement here. */
function collectBlockedHexKeysFromOtherTokens(movingToken: any): Set<string> {
  const keys = new Set<string>();
  const grid: any = canvas.grid;
  if (!grid?.getOffset) return keys;
  const myId = movingToken.id;
  for (const t of (canvas.tokens?.placeables ?? []) as any[]) {
    if (!t || t.id === myId) continue;
    if (!t.actor) continue;
    const o = grid.getOffset(t.center);
    if (o?.i !== undefined && o?.j !== undefined) keys.add(`${o.i},${o.j}`);
  }
  return keys;
}

function paintStaticMovementRange(state: MovementState): void {
  const token = state.token;
  if (!canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) return;
  highlightHexesInRange(
    token.id,
    state.maxRangeSteps,
    state.highlightIdRange,
    MOVEMENT_RANGE_COLOR,
    MOVEMENT_RANGE_ALPHA
  );
  const reachable = collectHexKeysInRangeForToken(token.id, state.maxRangeSteps);
  if (reachable) {
    highlightTabuHexesOnLayer(
      state.highlightIdRange,
      state.blockedHexKeys,
      reachable,
      TABU_OVERLAY_COLOR,
      TABU_OVERLAY_ALPHA
    );
  }
}

/**
 * Get default movement range for an option
 */
function getDefaultMovementRange(token: any, option: RadialCombatOption): number {
  // If option has explicit range, use it
  if (option.range !== undefined && option.range > 0) {
    return option.range;
  }
  
  // Fall back to actor's base movement/speed + round bonuses (initiative shop, stones)
  const actor = token.actor;
  const combat = game.combat ?? null;
  const bonusM = actor ? getMovementRangeBonusMeters(actor, combat) : 0;
  if (actor?.system?.combat?.speed) {
    return actor.system.combat.speed + bonusM;
  }
  
  // Default fallback
  return 6 + bonusM; // Default movement in meters
}

/**
 * Start guided movement mode for a token
 */
export function startGuidedMovement(token: any, option: RadialCombatOption): void {
  console.log('Mastery System | Starting guided movement mode', { token: token.name, option: option.name });
  
  // Cancel any existing movement mode first
  endGuidedMovement(false);
  
  // Ensure token is controlled by this user
  token.control({ releaseOthers: false });
  
  // Get hex center as origin (for hex grids, this is the center of the hex the token is in)
  const origin = getTokenHexCenter(token);
  const maxRangeMeters = getDefaultMovementRange(token, option);
  const maxRangeSteps = gridStepsFromMeters(maxRangeMeters);
  const blockedHexKeys = collectBlockedHexKeysFromOtherTokens(token);
  const originalAlpha = token.alpha;
  
  console.log('Mastery System | Guided movement start:', token.name, 'maxRangeMeters:', maxRangeMeters, 'steps:', maxRangeSteps, 'option:', option);
  
  // Make the token slightly transparent to indicate "picked up"
  token.alpha = 0.6;
  
  // Create a Ruler bound to this user
  let ruler: any = null;
  try {
    ruler = new (Ruler as any)(game.user);
    ruler.clear();
  } catch (error) {
    console.warn('Mastery System | Could not create Ruler, using fallback', error);
  }
  
  const highlightIdRange = 'mastery-move-range';
  const highlightIdHover = 'mastery-move-hover';
  
  // Create preview graphics
  const previewGraphics = new PIXI.Graphics();
  
  // Add to effects layer (similar to range preview)
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
  
  // Create event handlers
  const onMove = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerMove(ev);
  const onDown = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerDown(ev);
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && activeMovementState) {
      console.log('Mastery System | Guided movement cancelled via ESC');
      endGuidedMovement(false);
    }
  };
  
  const state: MovementState = {
    token,
    option,
    origin,
    maxRangeMeters,
    maxRangeSteps,
    blockedHexKeys,
    originalAlpha,
    previewGraphics,
    ruler,
    highlightIdRange,
    highlightIdHover,
    onMove,
    onDown,
    onKeyDown
  };
  
  activeMovementState = state;
  
  paintStaticMovementRange(state);
  
  // Attach mouse listeners to canvas stage
  canvas.stage.on("pointermove", state.onMove);
  canvas.stage.on("pointerdown", state.onDown);
  
  // Attach keyboard listener for ESC
  window.addEventListener("keydown", state.onKeyDown);
  
  // Initial preview at origin (zero-length)
  refreshMovementPreview(state, origin.x, origin.y);
  
  console.log('Mastery System | Guided movement mode active', { maxRangeMeters, maxRangeSteps, origin });
}

/**
 * Handle pointer move during movement mode
 */
function handleMovementPointerMove(ev: PIXI.FederatedPointerEvent, state?: MovementState): void {
  const currentState = state || activeMovementState;
  if (!currentState || activeMovementState !== currentState) return;

  const worldPos = ev.data.getLocalPosition(canvas.app.stage);
  const grid: any = canvas.grid;
  const snapped =
    grid && typeof grid.getSnappedPosition === 'function'
      ? grid.getSnappedPosition(worldPos.x, worldPos.y, 1)
      : { x: worldPos.x, y: worldPos.y };

  refreshMovementPreview(currentState, snapped.x, snapped.y);
}

/**
 * Preview line + Ziel-Feld (Hover-Layer). Gelbes Reichweiten-Raster bleibt auf `highlightIdRange`.
 */
function refreshMovementPreview(state: MovementState, destX: number, destY: number): void {
  if (!state.previewGraphics) return;

  state.previewGraphics.clear();

  const origin = state.origin;
  const token = state.token;
  const destTL = { x: destX, y: destY };
  const destCenter = tokenCenterFromTopLeft(token, destTL);

  const grid: any = canvas.grid;
  const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
  const cellSize = grid?.size ?? 100;

  let isValid = false;

  if (!gridless && grid?.getOffset) {
    clearHexHighlight(state.highlightIdHover);
    const gridUI = canvas.interface?.grid;
    gridUI?.addHighlightLayer?.(state.highlightIdHover);
    gridUI?.clearHighlightLayer?.(state.highlightIdHover);

    const destKey = hexKeyUnderTokenAtTopLeft(token, destTL);
    const tabuDest = destKey !== null && state.blockedHexKeys.has(destKey);
    const steps = gridStepsBetweenCenters(origin, destCenter, state.maxRangeSteps);
    isValid = !tabuDest && steps !== null && steps <= state.maxRangeSteps;

    if (destKey && gridUI) {
      const parts = destKey.split(',');
      const i = Number(parts[0]);
      const j = Number(parts[1]);
      if (Number.isFinite(i) && Number.isFinite(j)) {
        const tl = grid.getTopLeftPoint({ i, j });
        if (tl && tl.x !== undefined && tl.y !== undefined) {
          gridUI.highlightPosition?.(state.highlightIdHover, {
            x: tl.x,
            y: tl.y,
            color: isValid ? 0x66dd66 : 0xff4444,
            alpha: 0.42
          });
        }
      }
    }
  } else {
    const maxScene = metersToSceneDistance(state.maxRangeMeters);
    const d = measureSceneDistanceBetweenPoints(origin, destCenter);
    isValid = d <= maxScene + 0.01;
  }

  const lineColor = isValid ? 0x66ff99 : 0xff6666;
  const fillColor = lineColor;

  state.previewGraphics.lineStyle(3, lineColor, 0.88);
  state.previewGraphics.moveTo(origin.x, origin.y);
  state.previewGraphics.lineTo(destCenter.x, destCenter.y);

  state.previewGraphics.lineStyle(2, 0x00ffff, 0.88);
  state.previewGraphics.beginFill(0x00ffff, 0.22);
  state.previewGraphics.drawCircle(origin.x, origin.y, cellSize * 0.28);
  state.previewGraphics.endFill();

  state.previewGraphics.lineStyle(2, lineColor, 0.9);
  state.previewGraphics.beginFill(fillColor, 0.26);
  state.previewGraphics.drawCircle(destCenter.x, destCenter.y, cellSize * 0.28);
  state.previewGraphics.endFill();
}

/**
 * Handle pointer down during movement mode
 */
function handleMovementPointerDown(ev: PIXI.FederatedPointerEvent, state?: MovementState): void {
  const currentState = state || activeMovementState;
  if (!currentState || activeMovementState !== currentState) return;
  
  // Right or middle click cancels
  if (ev.button === 2 || ev.button === 1) {
    console.log('Mastery System | Guided movement cancelled via mouse button', ev.button);
    endGuidedMovement(false);
    return;
  }
  
  // Left click -> attempt move
  if (ev.button === 0) {
    const worldPos = ev.data.getLocalPosition(canvas.app.stage);
    const grid: any = canvas.grid;
    const snapped =
      grid && typeof grid.getSnappedPosition === 'function'
        ? grid.getSnappedPosition(worldPos.x, worldPos.y, 1)
        : { x: worldPos.x, y: worldPos.y };

    attemptCommitMovement(snapped.x, snapped.y, currentState)
      .catch(err => {
        console.error('Mastery System | Guided movement commit failed', err);
        endGuidedMovement(false);
      });
  }
}

/**
 * Attempt to commit movement to a destination
 */
async function attemptCommitMovement(destX: number, destY: number, state: MovementState): Promise<void> {
  const origin = state.origin;
  const token = state.token;
  const destTL = { x: destX, y: destY };
  const destCenter = tokenCenterFromTopLeft(token, destTL);

  const grid: any = canvas.grid;
  const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;

  let distanceLabel = '';

  if (!gridless && grid?.getOffset) {
    const destKey = hexKeyUnderTokenAtTopLeft(token, destTL);
    if (destKey && state.blockedHexKeys.has(destKey)) {
      ui.notifications.warn(
        game.i18n?.localize('MASTERY.combat.moveTargetOccupied') ??
          'Das Zielfeld ist durch eine andere Figur blockiert.'
      );
      return;
    }
    const steps = gridStepsBetweenCenters(origin, destCenter, state.maxRangeSteps);
    if (steps === null || steps > state.maxRangeSteps) {
      ui.notifications.warn(
        game.i18n?.localize('MASTERY.combat.moveOutOfRange') ??
          'Ziel liegt außerhalb der Bewegungsreichweite.'
      );
      return;
    }
    distanceLabel = String(steps);
  } else {
    const maxScene = metersToSceneDistance(state.maxRangeMeters);
    const d = measureSceneDistanceBetweenPoints(origin, destCenter);
    if (d > maxScene + 0.01) {
      ui.notifications.warn('Target is out of movement range.');
      return;
    }
    distanceLabel = d.toFixed(1);
  }

  try {
    await token.document.update({ x: destTL.x, y: destTL.y }, { animate: true });

    console.log('Mastery System | Movement completed', {
      option: state.option.name,
      distance: distanceLabel,
      maxRangeMeters: state.maxRangeMeters,
      maxRangeSteps: state.maxRangeSteps
    });
      
    // Movement action consumption is already handled in handleChosenCombatOption
    // before startGuidedMovement is called, so no need to consume again here
    
    // End movement mode successfully
    endGuidedMovement(true);
    
  } catch (error) {
    console.error('Mastery System | Error during token movement', error);
    ui.notifications.error('Failed to move token');
    endGuidedMovement(false);
  }
}

/**
 * End guided movement mode
 */
export function endGuidedMovement(success: boolean): void {
  const state = activeMovementState;
  if (!state) return;
  
  console.log('Mastery System | Guided movement end. success =', success);
  
  // Remove event listeners
  canvas.stage.off("pointermove", state.onMove);
  canvas.stage.off("pointerdown", state.onDown);
  window.removeEventListener("keydown", state.onKeyDown);
  
  try {
    clearHexHighlight(state.highlightIdRange);
    clearHexHighlight(state.highlightIdHover);
  } catch (error) {
    console.warn('Mastery System | Could not clear movement highlight layers', error);
  }
  
  // Clear ruler
  if (state.ruler && state.ruler.clear) {
    state.ruler.clear();
  }
  
  // Clear preview graphics
  if (state.previewGraphics && state.previewGraphics.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  
  // Reset token alpha
  state.token.alpha = state.originalAlpha;

  if (success) {
    const opt = state.option;
    if (opt.source === 'power' && opt.item?.id) {
      const combat = game.combat;
      const act = state.token?.actor;
      if (combat && act) {
        void markPowerUsedThisRound(act, combat, opt.item.id);
      }
    }
  } else {
    ui.notifications.info('Movement cancelled');
  }

  activeMovementState = null;
}

// Removed getTurnState - now using RoundState from action-economy.ts

/**
 * Handle the chosen combat option
 * Can trigger rolls, chat cards, or other mechanics based on the selection
 * Made available globally so the radial menu can call it
 * @param token - The token that selected the option
 * @param option - The chosen option (power or maneuver)
 */
export async function handleChosenCombatOption(token: any, option: RadialCombatOption) {
  console.log('Mastery System | [RADIAL FLOW] handleChosenCombatOption start', {
    token: token?.name,
    optionId: option.id,
    name: option.name,
    slot: option.slot,
    segment: (option as any).segment,
    source: option.source,
    range: option.range,
    costsMovement: option.costsMovement,
    costsAction: option.costsAction,
    aoeShape: option.aoeShape
  });
  console.log('Mastery System | Chosen combat option:', { token: token.name, option });
  console.log('Mastery System | Option details:', {
    slot: option.slot,
    segment: (option as any).segment,
    source: option.source,
    name: option.name,
    range: option.range,
    costsMovement: option.costsMovement,
    costsAction: option.costsAction
  });

  // Check combat exists
  const combat = game.combat;
  if (!combat) {
    ui.notifications?.warn('Not in combat!');
    return;
  }

  const actor = token.actor;
  if (!actor) {
    ui.notifications?.warn('No actor found for token!');
    return;
  }

  if (
    option.source === 'power' &&
    option.item?.id &&
    hasPowerBeenUsedThisRound(actor, combat, option.item.id)
  ) {
    ui.notifications?.warn(
      game?.i18n?.localize('MASTERY.combat.powerAlreadyUsedThisRound') ??
        'This power has already been used this round.'
    );
    return;
  }

  const reactionPower =
    option.source === 'power' &&
    (((option as any).powerType === 'reaction') ||
      ((option.item?.system as any)?.powerType === 'reaction'));
  if (reactionPower) {
    ui.notifications?.info(
      game?.i18n?.localize('MASTERY.combat.reactionUseWhenDamaged') ??
        'Reaction powers are chosen when you take damage from an attack (dialog after phasing). They are not fired from the radial during your turn.',
    );
    return;
  }

  // Debug: Log remaining actions when opening radial
  const roundState = getRoundState(actor, combat);
  console.log('Mastery System | [ACTION ECONOMY] Remaining actions:', {
    attack: getAvailableAttackActions(actor, combat),
    movement: getAvailableMovementActions(actor, combat),
    roundState: {
      attackTotal: roundState.attackActions.total,
      attackUsed: roundState.attackActions.used,
      movementTotal: roundState.movementActions.total,
      movementUsed: roundState.movementActions.used
    }
  });

  // Check if this is an active buff FIRST - before consuming actions
  // Active buffs should be activated directly on self, no targeting
  const segmentId = getSegmentIdForOption(option);
  const isActiveBuff = segmentId === 'active-buff';
  
  if (isActiveBuff && option.source === 'power' && option.item) {
    console.log('Mastery System | [ACTIVE BUFF] Activating active buff:', option.name);
    
    // Check and consume attack action if needed (active buffs cost an action)
    if (option.costsAction) {
      const available = getAvailableAttackActions(actor, combat);
      if (available <= 0) {
        ui.notifications?.warn('No Actions left this round.');
        return; // Menu stays open
      }
      
      const consumed = await consumeAttackAction(actor, combat);
      if (!consumed) {
        ui.notifications?.warn('Failed to consume attack action.');
        return;
      }
      
      console.log('Mastery System | [ACTION ECONOMY] Consumed attack action for active buff. Remaining:', getAvailableAttackActions(actor, combat));
    }
    
    closeRadialMenu();
    
    // Dynamic import for active buffs utilities
    // @ts-ignore - TypeScript doesn't recognize the .js extension in dynamic imports
    const activeBuffsModule = await import('./utils/active-buffs.js');
    const { activateActiveBuff, isPowerActiveAsBuff } = activeBuffsModule;
    
    // Check if already active
    if (isPowerActiveAsBuff(actor, option.item.id)) {
      ui.notifications?.warn(`${option.name} is already active!`);
      if (option.costsAction) {
        await refundAttackAction(actor, combat);
        console.log('Mastery System | [RADIAL FLOW] active buff: refunded attack (already active)');
      }
      return;
    }
    
    // Activate the buff directly on self
    const success = await activateActiveBuff(actor, option.item);
    if (!success && option.costsAction) {
      await refundAttackAction(actor, combat);
      console.warn('Mastery System | [RADIAL FLOW] active buff: refunded attack (activation failed)');
    }
    if (success) {
      if (option.item?.id) {
        await markPowerUsedThisRound(actor, combat, option.item.id);
      }
      // Refresh token HUD to show updated status
      if (token.hud) {
        token.hud.render();
      }
      // Refresh character sheet if open
      const sheet = actor.sheet;
      if (sheet && sheet.rendered) {
        sheet.render();
      }
      // Refresh combat carousel if open
      const carousel = (window as any).masteryCombatCarousel;
      if (carousel && carousel.rendered) {
        carousel.render();
      }
    }
    return;
  }

  // Check and consume movement action if needed
  if (option.costsMovement) {
    const available = getAvailableMovementActions(actor, combat);
    if (available <= 0) {
      ui.notifications?.warn('No Movement actions left this round.');
      return; // Menu stays open
    }
    
    const consumed = await consumeMovementAction(actor, combat);
    if (!consumed) {
      ui.notifications?.warn('Failed to consume movement action.');
      return;
    }
    
    console.log('Mastery System | [ACTION ECONOMY] Consumed movement action. Remaining:', getAvailableMovementActions(actor, combat));
  }

  // Attack actions are consumed only when an attack/utility actually resolves (see melee hook, utility confirm, active buff, stand-up).

  // Check if this is a movement option - check both segment and slot
  const isMovement = option.slot === 'movement' || (option as any).segment === 'movement';
  console.log('Mastery System | Is movement option?', isMovement, { slot: option.slot, segment: (option as any).segment });
  
  if (isMovement) {
    // Close radial menu immediately when movement option is selected
    closeRadialMenu();
    
    // Handle stand-up differently (it's an immediate action, not movement)
    if (option.id === 'stand-up' || option.maneuver?.id === 'stand-up') {
      console.log('Mastery System | Executing Stand Up for', token.name);
      // Stand Up is immediate - just execute it
      executeStandUp(token, option);
      return;
    }
    
    // For movement powers, check if they're teleport-type or move-type
    if (option.source === 'power' && option.powerType === 'movement') {
      // Check if it's a teleport (by tags or description)
      const isTeleport = option.tags?.includes('teleport') || 
                        option.description?.toLowerCase().includes('teleport') ||
                        option.name?.toLowerCase().includes('teleport');
      
      if (isTeleport) {
        console.log('Mastery System | Starting teleport targeting for', token.name, option);
        // TODO: Implement teleport targeting mode (for now, use guided movement)
        startGuidedMovement(token, option);
      } else {
        // Regular movement power - use guided movement
        console.log('Mastery System | Starting guided movement for movement power', token.name, option);
        startGuidedMovement(token, option);
      }
      return;
    }
    
    // Regular movement maneuver
    console.log('Mastery System | Starting guided movement for', token.name, option);
    startGuidedMovement(token, option);
    return;
  }
  
  // Check if this is a melee attack option
  // Melee attacks have range <= 4m (2m base + up to 2m reach)
  // OR if it's an attack slot with no range specified (should use weapon range)
  // Exclude active buffs (they're handled above)
  const isMeleeAttack = segmentId !== 'active-buff' &&
                        option.slot === 'attack' && 
                        (option.range === undefined || option.range <= 4);
  
  console.log('Mastery System | [ATTACK SELECTION] Checking if melee attack', {
    isMeleeAttack,
    slot: option.slot,
    range: option.range,
    optionId: option.id,
    optionName: option.name,
    source: option.source,
    hasRange: option.range !== undefined,
    rangeCheck: option.range !== undefined ? option.range <= 4 : 'undefined (treating as melee)'
  });
  
  if (isMeleeAttack) {
    if (option.costsAction) {
      const atkAvail = getAvailableAttackActions(actor, combat);
      if (atkAvail <= 0) {
        ui.notifications?.warn('No Actions left this round.');
        console.warn('Mastery System | [RADIAL FLOW] melee branch blocked: no attack actions left', {
          actor: actor.name,
          option: option.name
        });
        return;
      }
    }
    console.log('Mastery System | [RADIAL FLOW] branch: melee targeting (attack spent only after you pick a target)', {
      tokenName: token.name,
      optionId: option.id,
      optionName: option.name,
      range: option.range,
      costsAction: option.costsAction
    });
    console.log('Mastery System | [ATTACK SELECTION] Starting melee targeting', {
      tokenName: token.name,
      optionId: option.id,
      optionName: option.name,
      range: option.range
    });
    // Close radial menu when attack option is selected
    closeRadialMenu();

    const targetToken = (option as any).targetToken;
    if (targetToken) {
      Hooks.call('masterySystem.meleeTargetSelected', {
        attackerTokenId: token.id,
        targetTokenId: targetToken.id,
        option
      });
      return;
    }

    if (option.burstMeleeAoE) {
      const burstIds = collectMeleeBurstHostileTokenIds(token, option);
      if (!burstIds.length) {
        ui.notifications?.warn?.('Melee AoE: no hostile targets in range.');
        console.warn('Mastery System | [RADIAL FLOW] melee burst: zero hostile targets in AoE', {
          option: option.name,
          token: token.name
        });
        return;
      }

      const powerBonus = extractMeleeAoePowerBonusD8(option.item);
      if (burstIds.length > 1 && powerBonus <= 0) {
        ui.notifications?.warn?.(
          'Melee AoE: power has no unconditional +Nd8 splash on damageRider.flat — secondary splash disabled.',
        );
      }

      const choice = await promptMeleeAoePrimaryChoice(burstIds, token.id, option);
      if (choice === 'cancelled') {
        return;
      }

      if (choice.primaryTokenId === null) {
        if (powerBonus <= 0) {
          ui.notifications?.warn?.('Melee AoE (no primary): power must declare +Nd8 splash damage.');
          return;
        }
        if (option.costsAction) {
          const consumed = await consumeAttackAction(actor, combat);
          if (!consumed) {
            ui.notifications?.warn?.('Failed to consume attack action.');
            return;
          }
        }
        if (option.source === 'power' && option.item?.id) {
          await markPowerUsedThisRound(actor, combat, option.item.id);
        }
        const { resolveAoeMeleeSecondaries } = await import('./combat/aoe-melee-resolution.js');
        const mr = Math.max(1, Math.min(6, Math.floor(Number(actor.system?.mastery?.rank) || 2)));
        await resolveAoeMeleeSecondaries({
          attacker: actor as any,
          attackerMasteryRank: mr,
          secondaryTokenIds: burstIds.slice(),
          powerBonusDice: powerBonus,
        });
        return;
      }

      const primaryId = choice.primaryTokenId;
      const secondaries = burstIds.filter((id) => id !== primaryId);
      const primaryTok = canvas.tokens?.get(primaryId);
      if (!primaryTok) {
        ui.notifications?.warn?.('Melee AoE: primary token not found.');
        return;
      }

      const aoeMelee =
        secondaries.length && powerBonus > 0
          ? { secondaryTokenIds: secondaries, powerBonusDice: powerBonus }
          : null;

      const { createMeleeAttackCard } = await import('./combat/attack-executor.js');
      await createMeleeAttackCard(token, primaryTok, option, null, aoeMelee);
      return;
    }

    startMeleeTargeting(token, option);
    return;
  }

  const isAttackHostileZonePlacement =
    option.source === "power" &&
    option.slot === "attack" &&
    option.powerType === "active" &&
    option.aoeShape === "radius" &&
    (option.aoeRadiusMeters ?? 0) > 0 &&
    option.aoePlacementProfile === "hostile-zone";

  if (isAttackHostileZonePlacement) {
    if (option.costsAction) {
      const atkAvail = getAvailableAttackActions(actor, combat);
      if (atkAvail <= 0) {
        ui.notifications?.warn("No Actions left this round.");
        console.warn("Mastery System | [RADIAL FLOW] hostile zone branch blocked: no attack actions left", {
          actor: actor.name,
          option: option.name
        });
        return;
      }
    }
    console.log("Mastery System | [RADIAL FLOW] branch: active zone hex placement (same UX as utility radius)", {
      option: option.name,
      costsAction: option.costsAction
    });
    closeRadialMenu();
    startUtilityRadiusMode(token, option);
    return;
  }

  const isRangedAttack =
    segmentId !== "active-buff" &&
    option.slot === "attack" &&
    option.range !== undefined &&
    option.range > 4;

  if (isRangedAttack) {
    if (option.costsAction) {
      const atkAvail = getAvailableAttackActions(actor, combat);
      if (atkAvail <= 0) {
        ui.notifications?.warn("No Actions left this round.");
        console.warn("Mastery System | [RADIAL FLOW] ranged branch blocked: no attack actions left", {
          actor: actor.name,
          option: option.name
        });
        return;
      }
    }
    console.log("Mastery System | [RADIAL FLOW] branch: ranged targeting", {
      range: option.range,
      option: option.name,
      costsAction: option.costsAction
    });
    closeRadialMenu();

    const preTarget = (option as any).targetToken;
    if (preTarget) {
      Hooks.call("masterySystem.rangedTargetSelected", {
        attackerTokenId: token.id,
        targetTokenId: preTarget.id,
        option
      });
      return;
    }

    startRangedTargeting(token, option);
    return;
  }

  // Check if this is a utility option
  const isUtility = option.slot === 'utility';
  console.log('Mastery System | Is utility option?', isUtility, { slot: option.slot, aoeShape: option.aoeShape });
  
  if (isUtility) {
    if (option.costsAction) {
      const atkAvail = getAvailableAttackActions(actor, combat);
      if (atkAvail <= 0) {
        ui.notifications?.warn('No Actions left this round.');
        console.warn('Mastery System | [RADIAL FLOW] utility branch blocked: no attack actions left', {
          actor: actor.name,
          option: option.name
        });
        return;
      }
    }
    console.log('Mastery System | [RADIAL FLOW] branch: utility (attack spent on Confirm, not on opening targeting)', {
      aoeShape: option.aoeShape,
      costsAction: option.costsAction
    });
    closeRadialMenu();
    if (option.aoeShape === 'none') {
      console.log('Mastery System | Starting single-target utility mode for', token.name, option);
      startUtilitySingleTargetMode(token, option);
      return;
    } else if (option.aoeShape === 'radius') {
      console.log('Mastery System | Starting radius utility mode for', token.name, option);
      startUtilityRadiusMode(token, option);
      return;
    } else if (option.aoeShape === 'cone') {
      ui.notifications?.warn('Cone targeting not yet implemented');
      console.warn('Mastery System | [RADIAL FLOW] utility cone not implemented — no action spent', {
        option: option.name
      });
      return;
    }
  }

  if (option.source === 'power' && option.item) {
    closeRadialMenu();
    console.warn('Mastery System | [RADIAL FLOW] branch: non-melee attack power — no targeting/roll pipeline yet', {
      name: option.name,
      slot: option.slot,
      range: option.range,
      costsAction: option.costsAction,
      note: 'Attack actions are NOT consumed here; use a melee-range power or weapon attack until ranged powers are wired up.'
    });
    console.log('Mastery System | Power selected:', option.name, option.item);
    ui.notifications?.warn(
      `${option.name}: Fern-/Ranged-Angriff ist noch nicht angebunden — keine Aktion verbraucht. Nahkampf (Reichweite ≤4m) wählen oder später erneut testen.`
    );
  } else if (option.source === 'maneuver' && option.maneuver) {
    closeRadialMenu();
    console.warn('Mastery System | [RADIAL FLOW] branch: maneuver fallback — no executor', {
      name: option.name,
      slot: option.slot,
      range: option.range,
      maneuverId: option.maneuver.id
    });
    console.log('Mastery System | Maneuver selected:', option.name, option.maneuver);
    ui.notifications?.info(`Action selected: ${option.name} (${option.slot}) — Ausführung noch nicht implementiert (keine Aktion verbraucht).`);
  }
}

/**
 * Execute Stand Up action
 * @param token - The token standing up
 * @param option - The stand-up option
 */
async function executeStandUp(token: any, option: RadialCombatOption): Promise<void> {
  if (!token || !token.actor) {
    ui.notifications.error('Cannot stand up: invalid token');
    return;
  }
  
  // Import isActorProne to verify
  let isActorProne: ((actor: any, token?: any) => boolean) | null = null;
  try {
    const actorHelpers = await import('./utils/actor-helpers.js' as any);
    isActorProne = actorHelpers.isActorProne;
  } catch (error) {
    console.warn('Mastery System | Could not load actor helpers:', error);
  }
  
  // Verify actor is prone
  if (isActorProne && !isActorProne(token.actor, token)) {
    ui.notifications.warn('Actor is not prone.');
    return;
  }
  
  // Remove prone condition
  // Method 1: Remove from effects
  if (token.actor.effects) {
    const proneEffects = token.actor.effects.filter((e: any) => {
      const name = (e.name || '').toLowerCase();
      const label = (e.label || '').toLowerCase();
      return name.includes('prone') || label.includes('prone');
    });
    
    for (const effect of proneEffects) {
      try {
        await effect.delete();
      } catch (error) {
        console.warn('Mastery System | Could not remove prone effect:', error);
      }
    }
  }
  
  // Method 2: Remove from statuses (Foundry v13)
  if ((token.actor as any).statuses) {
    const statuses = (token.actor as any).statuses;
    // Check if CONST.STATUS_EFFECTS exists and has PRONE
    if (statuses.has && CONST.STATUS_EFFECTS && (CONST.STATUS_EFFECTS as any).PRONE) {
      const proneStatusId = (CONST.STATUS_EFFECTS as any).PRONE;
      if (statuses.has(proneStatusId)) {
        try {
          await token.actor.toggleStatusEffect(proneStatusId);
        } catch (error) {
          console.warn('Mastery System | Could not toggle prone status:', error);
        }
      }
    }
    // Also try to remove by name if constant doesn't exist
    if (statuses.size > 0) {
      for (const status of statuses) {
        const name = (status.name || status.id || '').toLowerCase();
        if (name.includes('prone')) {
          try {
            // Try to remove by status ID or name
            if (typeof token.actor.toggleStatusEffect === 'function') {
              await token.actor.toggleStatusEffect(status.id || status.name);
            }
          } catch (error) {
            console.warn('Mastery System | Could not remove prone status by name:', error);
          }
        }
      }
    }
  }
  
  // Method 3: Clear flags
  try {
    await token.actor.unsetFlag('mastery-system', 'prone');
    const conditions = token.actor.getFlag('mastery-system', 'conditions') || {};
    if (conditions.prone) {
      delete conditions.prone;
      await token.actor.setFlag('mastery-system', 'conditions', conditions);
    }
  } catch (error) {
    console.warn('Mastery System | Could not clear prone flags:', error);
  }
  
  // Consume attack action (Stand Up costs an action)
  const combat = game.combat;
  if (combat) {
    const { consumeAttackAction } = await import('./combat/action-economy.js');
    const consumed = await consumeAttackAction(token.actor, combat);
    if (consumed) {
      console.log('Mastery System | [ACTION ECONOMY] Consumed attack action for Stand Up. Remaining:', 
        (await import('./combat/action-economy.js')).getAvailableAttackActions(token.actor, combat));
    }
  }
  
  // Create chat message
  const chatData: any = {
    speaker: ChatMessage.getSpeaker({ actor: token.actor, token: token.document }),
    content: `<div class="mastery-system-action">
      <h3><i class="fas fa-hand-rock"></i> ${option.name}</h3>
      <p>${option.description || option.maneuver?.effect || 'Action executed.'}</p>
    </div>`,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER
  };
  
  try {
    await ChatMessage.create(chatData);
  } catch (error) {
    console.warn('Mastery System | Could not create chat message:', error);
  }
  
  ui.notifications.info(`${token.actor.name} stands up.`);
  console.log('Mastery System | Stand Up executed for', token.actor.name);
}
