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
import { startMeleeTargeting } from './melee-targeting';
import { startRangedTargeting } from './ranged-targeting';
import { startConeAttackMode, startUtilitySingleTargetMode, startUtilityRadiusMode } from './utility-targeting';
import {
  getRoundState,
  getMovementRangeBonusMeters,
  getAvailableAttackActions,
  getAvailableMovementActions,
  consumeAttackAction,
  consumeMovementAction,
  getAvailableActiveBuffActions,
  markActiveBuffUsedThisRound,
  isNormalMovementReplaced,
  refundAttackAction,
  markPowerUsedThisRound,
  markNpcAttackUsedThisRound,
  canUseNpcAttackThisRound,
  hasPowerBeenUsedThisRound
} from './combat/action-economy';
import { movementMetersAfterStoneEffects } from './stones/stone-combat-effects.js';
import {
  gridStepsFromMeters,
  gridStepsBetweenCenters,
  masteryPowerMaxSteps,
  measureSceneDistanceBetweenPoints,
  metersToSceneDistance
} from './utils/grid-range.js';
import {
  eventWorldPoint,
  resolveOverlayContainer,
  snapWorldTopLeft,
} from './utils/grid-snap.js';
import {
  highlightHexesWithinStepsFromPoint,
  clearHexHighlight,
  collectHexKeysWithinStepsFromPoint,
  highlightTabuHexesOnLayer
} from './utils/hex-highlighting.js';
import {
  createMovementBudget,
  movementBudgetExhausted,
  reconcileGuidedSpendAfterHalt,
  spendMovementMeters,
  spendMovementSteps,
  type MovementBudget,
} from './ui/guided-movement-budget.js';
import { clearTokenMovementHistory } from './ui/token-movement-history.js';
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
  fleeCommitted?: boolean;
  origin: { x: number; y: number };
  maxRangeMeters: number;
  maxRangeSteps: number;
  budget: MovementBudget;
  movedOnce: boolean;
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
  /** Resolves when the player commits or cancels this movement. */
  finish?: (ok: boolean) => void;
}

// Global movement state
let activeMovementState: MovementState | null = null;

export type GuidedMovementSummary = {
  active: true;
  tokenId: string;
  actorId: string | null;
  remainingMeters: number;
  maxMeters: number;
  remainingSteps: number;
  maxSteps: number;
};

/** Live budget for the open guided-move session, if any. */
export function getActiveGuidedMovementSummary(): GuidedMovementSummary | null {
  const state = activeMovementState;
  if (!state) return null;
  return {
    active: true,
    tokenId: String(state.token?.id ?? state.token?.document?.id ?? ''),
    actorId: state.token?.actor?.id != null ? String(state.token.actor.id) : null,
    remainingMeters: state.budget.remainingMeters,
    maxMeters: state.budget.maxMeters,
    remainingSteps: state.budget.remainingSteps,
    maxSteps: state.budget.maxSteps,
  };
}

function notifyGuidedMovementChanged(): void {
  try {
    void import('./ui/combat-carousel.js').then(({ CombatCarouselApp }) => {
      CombatCarouselApp.refresh();
    });
  } catch {
    /* ignore */
  }
}

/**
 * Initialize token action selector hooks
 */
export function initializeTokenActionSelector() {
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

    // Place the radial-menu button in the MIDDLE column of the Token HUD â€”
    // centered between the left (combat toggle) and right (config) button
    // stacks, as far from Start/Exit Combat as possible. Fall back to the
    // right column on layouts without a middle column.
    let targetCol = $html.find('.col.middle');
    if (targetCol.length === 0) {
      targetCol = $html.find('.col.right');
    }
    if (targetCol.length === 0) {
      console.warn('Mastery System | Could not find a Token HUD column for the action selector');
      return;
    }

    // Check if the icon already exists to avoid duplicates
    if ($html.find('.ms-action-selector').length > 0) {
      return;
    }

    // Get current action flag to show status
    const currentAction = token.document.getFlag('mastery-system', 'currentAction') || {};
    const hasAction = currentAction.category && currentAction.optionId;

    // Create the action selector icon (concentric target rings: red/yellow/blue)
    const actionIcon = $(`
      <div class="control-icon ms-action-selector" 
           title="${hasAction ? `Current: ${currentAction.category} - ${currentAction.optionId}` : 'Select Action'}"
           data-token-id="${token.id}">
        <img src="systems/mastery-system/assets/icons/radial-target.svg" alt="Actions" />
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

    targetCol.append(actionIcon);
  });

  // Hook into token updates to intercept movement
  Hooks.on('preUpdateToken', async (tokenDoc: any, change: any, options: any, userId: string) => {
    // Only react to position changes
    if (change.x === undefined && change.y === undefined) {
      return;
    }

    const combat = game.combat as any;
    const guidedActive =
      !!activeMovementState &&
      String(activeMovementState.token?.document?.id || activeMovementState.token?.id || '') ===
        String(tokenDoc.id);
    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};
    const traversal = String(tokenDoc.getFlag('mastery-system', 'movementTraversal') || '');
    const { gateTokenMovementUpdate } = await import('./combat/token-move-gate.js');
    const gate = gateTokenMovementUpdate({
      change,
      options,
      isLocalUser: userId === game.user.id,
      combatStarted: !!(combat && combat.started === true),
      guidedActive,
      currentAction: action,
      traversal,
    });
    if (!gate.allow) {
      ui.notifications?.warn?.(gate.reason);
      return false;
    }

    // Only for the user performing the move
    if (userId !== game.user.id) {
      return;
    }

    // Out of combat: free movement, no Movement-action gate / warning.
    if (!combat || combat.started !== true) {
      return;
    }

    // Authorized guided / resolver writes skip the HUD action gate and cap here.
    const { isMasteryAuthorizedMove } = await import('./combat/token-move-gate.js');
    if (isMasteryAuthorizedMove(options)) {
      return;
    }

    if (traversal === 'forced' || traversal === 'reaction') {
      return;
    }

    // If nothing is selected, block movement
    if (!action.category || !action.optionId) {
      ui.notifications.warn('Bitte zuerst im Token-HUD eine Movement-Aktion wÃ¤hlen.');
      return false;
    }

    // Only allow movement if the category is "movement"
    if (action.category !== 'movement') {
      ui.notifications.warn('Du hast aktuell keine Movement-Aktion gewÃ¤hlt.');
      return false;
    }

    const { applyMovementCapToTokenChange } = await import('./combat/movement-allowance.js');
    applyMovementCapToTokenChange(tokenDoc, change, combat);
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
      const { ensureCanTargetWithPerception } = await import("./combat/perception-gate.js");
      const aoeMelee = payload.aoeMelee ?? null;

      if (attackerToken.actor && targetToken.actor) {
        const ok = await ensureCanTargetWithPerception(
          attackerToken.actor,
          targetToken.actor,
          { observerToken: attackerToken, targetToken },
        );
        if (!ok) return;
      }

      // Grapple is an Opposed Attribute Contest, not an attack card.
      if (option?.source === 'maneuver' && option.maneuver?.id === 'grapple') {
        const { beginGrappleContest } = await import('./combat/grapple-actions.js');
        await beginGrappleContest(attackerToken, targetToken);
        return;
      }

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
      const { ensureCanTargetWithPerception } = await import("./combat/perception-gate.js");

      if (attackerToken.actor && targetToken.actor) {
        const ok = await ensureCanTargetWithPerception(
          attackerToken.actor,
          targetToken.actor,
          { observerToken: attackerToken, targetToken },
        );
        if (!ok) return;
      }

      console.log("[MS NPC Targeting] rangedTargetSelected â†’ createRangedAttackCard", {
        attacker: attackerToken.name,
        target: targetToken.name,
        option: option?.name,
        range: option?.range,
        rangeMinMeters: (option as any)?.rangeMinMeters,
      });
      await createRangedAttackCard(attackerToken, targetToken, option);
      console.log("[MS NPC Targeting] rangedTargetSelected â†’ attack card created");
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

  const { warnIfPlayerStonesPending } = await import('./combat/stone-round-gate.js');
  if (warnIfPlayerStonesPending(game.combat)) return;

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
 * Snap a world point to the center of its grid cell (hex/square).
 * Foundry `getOffset` / `getCenterPoint` require a `{x,y}` point â€” never bare x,y args.
 */
function hexCenterFromWorldPoint(point: { x: number; y: number }): { x: number; y: number } {
  const grid: any = canvas.grid;
  if (!grid?.getOffset) {
    return { x: point.x, y: point.y };
  }
  try {
    const offset = grid.getOffset({ x: point.x, y: point.y });
    if (typeof grid.getCenterPoint === 'function') {
      const c = grid.getCenterPoint(offset);
      if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) {
        return { x: c.x, y: c.y };
      }
    }
    if (typeof grid.getTopLeftPoint === 'function') {
      const tl = grid.getTopLeftPoint(offset);
      if (tl && Number.isFinite(tl.x) && Number.isFinite(tl.y)) {
        const sizeX = Number(grid.sizeX) || Number(grid.size) || 100;
        const sizeY = Number(grid.sizeY) || Number(grid.size) || 100;
        return { x: tl.x + sizeX / 2, y: tl.y + sizeY / 2 };
      }
    }
  } catch (error) {
    console.warn('Mastery System | Could not snap world point to hex center', error);
  }
  return { x: point.x, y: point.y };
}

/** Top-left of the grid cell containing a world point (for preview dest args). */
function gridTopLeftFromWorldPoint(point: { x: number; y: number }): { x: number; y: number } {
  const grid: any = canvas.grid;
  if (!grid?.getOffset || !grid?.getTopLeftPoint) {
    return { x: point.x, y: point.y };
  }
  try {
    const tl = grid.getTopLeftPoint(grid.getOffset({ x: point.x, y: point.y }));
    if (tl && Number.isFinite(tl.x) && Number.isFinite(tl.y)) {
      return { x: tl.x, y: tl.y };
    }
  } catch {
    /* fall through */
  }
  return { x: point.x, y: point.y };
}

/**
 * Get hex center position for a token.
 * Uses document x/y when present so mid-animation placeables are not trusted.
 */
function getTokenHexCenter(token: any): { x: number; y: number } {
  if (!token) return { x: 0, y: 0 };
  const doc = token.document ?? token;
  const docX = Number(doc?.x);
  const docY = Number(doc?.y);
  if (Number.isFinite(docX) && Number.isFinite(docY)) {
    return hexCenterFromWorldPoint(tokenCenterFromTopLeft(token, { x: docX, y: docY }));
  }
  const center = token.center || { x: token.x || 0, y: token.y || 0 };
  return hexCenterFromWorldPoint(center);
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
  const o = grid.getOffset({ x: c.x, y: c.y }) as any;
  if (o?.i === undefined || o?.j === undefined) return null;
  return `${o.i},${o.j}`;
}

/** Hex keys of grid cells where other tokens (with an actor) have their center â€” cannot end movement here. */
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
  if (!canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS) return;
  const steps = Math.max(0, state.budget.remainingSteps);
  if (steps <= 0) return;
  // Always paint from `state.origin` â€” not `token.center`, which lags during
  // Foundry's move animation and would keep the yellow blob at the start hex.
  highlightHexesWithinStepsFromPoint(
    state.origin,
    steps,
    state.highlightIdRange,
    MOVEMENT_RANGE_COLOR,
    MOVEMENT_RANGE_ALPHA
  );
  const reachable = collectHexKeysWithinStepsFromPoint(state.origin, steps);
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
    return movementMetersAfterStoneEffects(actor, actor.system.combat.speed + bonusM);
  }
  
  // Default fallback
  return movementMetersAfterStoneEffects(actor, 6 + bonusM);
}

/**
 * Start guided movement mode for a token
 */
export function startGuidedMovement(token: any, option: RadialCombatOption): Promise<boolean> {
  // Cancel any existing movement mode first
  endGuidedMovement(false);
  let finish: (ok: boolean) => void = () => undefined;
  const done = new Promise<boolean>((resolve) => {
    finish = resolve;
  });
  
  // Ensure token is controlled by this user
  token.control({ releaseOthers: false });
  // Drop any leftover Foundry walked-path trail from a prior move.
  void clearTokenMovementHistory(token.document ?? token);
  
  // Get hex center as origin (for hex grids, this is the center of the hex the token is in)
  const origin = getTokenHexCenter(token);
  const maxRangeMeters = getDefaultMovementRange(token, option);
  const maxRangeSteps = gridStepsFromMeters(maxRangeMeters);
  const blockedHexKeys = collectBlockedHexKeysFromOtherTokens(token);
  const originalAlpha = token.alpha;
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
  const effectsContainer = resolveOverlayContainer();
  if (effectsContainer) {
    effectsContainer.addChild(previewGraphics);
  }
  
  // Create event handlers
  const onMove = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerMove(ev);
  const onDown = (ev: PIXI.FederatedPointerEvent) => handleMovementPointerDown(ev);
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && activeMovementState) {
      endGuidedMovement(false);
    }
  };
  
  const state: MovementState = {
    token,
    option,
    origin,
    maxRangeMeters,
    maxRangeSteps,
    budget: createMovementBudget(maxRangeMeters, maxRangeSteps),
    movedOnce: false,
    blockedHexKeys,
    originalAlpha,
    previewGraphics,
    ruler,
    highlightIdRange,
    highlightIdHover,
    onMove,
    onDown,
    onKeyDown,
    finish,
  };
  
  activeMovementState = state;
  
  paintStaticMovementRange(state);
  
  // Attach mouse listeners to canvas stage
  canvas.stage.on("pointermove", state.onMove);
  canvas.stage.on("pointerdown", state.onDown);
  
  // Attach keyboard listener for ESC
  window.addEventListener("keydown", state.onKeyDown);
  
  // Initial preview at origin (zero-length). Preview expects token top-left, not center.
  const originTL = gridTopLeftFromWorldPoint(origin);
  refreshMovementPreview(state, originTL.x, originTL.y);
  notifyGuidedMovementChanged();
  ui.notifications?.info?.(
    `Move up to ${Math.round(maxRangeMeters)} m. Click to step; right-click to finish; Esc cancels leftover.`,
  );
  return done;
}

/**
 * Handle pointer move during movement mode
 */
function handleMovementPointerMove(ev: PIXI.FederatedPointerEvent, state?: MovementState): void {
  const currentState = state || activeMovementState;
  if (!currentState || activeMovementState !== currentState) return;

  const worldPos = eventWorldPoint(ev);
  const snapped = snapWorldTopLeft(worldPos.x, worldPos.y);

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
    const stepCap = state.budget.remainingSteps;
    const steps = gridStepsBetweenCenters(origin, destCenter, stepCap);
    isValid = !tabuDest && steps !== null && steps <= stepCap;

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
    const maxScene = metersToSceneDistance(state.budget.remainingMeters);
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
  
  // Right/middle: finish if already stepped, otherwise cancel
  if (ev.button === 2 || ev.button === 1) {
    endGuidedMovement(currentState.movedOnce);
    return;
  }
  
  // Left click -> attempt move
  if (ev.button === 0) {
    const worldPos = eventWorldPoint(ev);
    const snapped = snapWorldTopLeft(worldPos.x, worldPos.y);

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
function movementTraversalKind(option: RadialCombatOption): 'path' | 'teleport' | 'safe' | 'disengage' {
  const id = String((option as any)?.movementTemplateId || option?.id || (option as any)?.templateId || '').toLowerCase();
  const name = String(option?.name || '').toLowerCase();
  if (id.includes('teleport') || name.includes('teleport') || option?.tags?.includes('teleport')) return 'teleport';
  if (id === 'disengage' || name.includes('disengage')) return 'disengage';
  if (id.includes('safe-movement') || name.includes('safe movement')) return 'safe';
  return 'path';
}

async function attemptCommitMovement(destX: number, destY: number, state: MovementState): Promise<void> {
  const origin = state.origin;
  const token = state.token;
  const destTL = { x: destX, y: destY };
  const destCenter = tokenCenterFromTopLeft(token, destTL);

  const grid: any = canvas.grid;
  const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;

  let stepsUsed = 0;
  let metersUsed = 0;

  if (!gridless && grid?.getOffset) {
    const destKey = hexKeyUnderTokenAtTopLeft(token, destTL);
    if (destKey && state.blockedHexKeys.has(destKey)) {
      ui.notifications.warn(
        game.i18n?.localize('MASTERY.combat.moveTargetOccupied') ??
          'Das Zielfeld ist durch eine andere Figur blockiert.'
      );
      return;
    }
    const steps = gridStepsBetweenCenters(origin, destCenter, state.budget.remainingSteps);
    if (steps === null || steps > state.budget.remainingSteps) {
      ui.notifications.warn(
        game.i18n?.localize('MASTERY.combat.moveOutOfRange') ??
          'Ziel liegt auÃŸerhalb der Bewegungsreichweite.'
      );
      return;
    }
    if (steps <= 0) return;
    stepsUsed = steps;
  } else {
    const maxScene = metersToSceneDistance(state.budget.remainingMeters);
    const d = measureSceneDistanceBetweenPoints(origin, destCenter);
    if (d > maxScene + 0.01) {
      ui.notifications.warn('Target is out of movement range.');
      return;
    }
    if (d <= 0.01) return;
    metersUsed = d;
  }

  try {
    const templateId = String((state.option as any).movementTemplateId || (state.option.item?.system as any)?.templateId || '');
    if (state.option.source === 'power' && state.option.powerType === 'movement' && templateId) {
      const { executeMovementPower, resolveTeleportAllyForGuidedMove } = await import(
        './combat/movement-powers.js'
      );
      const level = Number((state.option.item?.system as any)?.level) || 1;
      const placeables = canvas.tokens?.placeables ?? [];
      let ally: { token: any; dest: { x: number; y: number; elevation?: number }; willing: boolean } | undefined;
      if (templateId === 'movement-teleport-with-ally') {
        const picked = await resolveTeleportAllyForGuidedMove({
          mover: token.document ?? token,
          dest: { x: destTL.x, y: destTL.y },
          tokens: placeables,
        });
        if (!picked) {
          ui.notifications?.warn('Teleport with Ally needs a willing ally within 2 m.');
          return;
        }
        ally = picked;
      }
      const result = await executeMovementPower({
        token: token.document ?? token,
        templateId,
        level,
        dest: { x: destTL.x, y: destTL.y },
        tokens: placeables,
        ally,
      });
      if (!result.ok) {
        ui.notifications?.warn(result.reason || 'Movement Power was not completed.');
        return;
      }
      state.movedOnce = true;
      state.origin = destCenter;
      if (movementBudgetExhausted(state.budget)) endGuidedMovement(true);
      else {
        paintStaticMovementRange(state);
        notifyGuidedMovementChanged();
      }
      return;
    }
    const moveId = String(state.option.maneuver?.id || state.option.id || '');
    if (moveId === 'flee' && !state.fleeCommitted) {
      const { commitFlee } = await import('./combat/flee.js');
      const fled = await commitFlee(token.actor, (globalThis as any).game?.combat ?? null);
      if (!fled.ok) {
        ui.notifications?.warn(fled.reason || 'Flee was not completed.');
        return;
      }
      state.fleeCommitted = true;
    }
    const traversal = moveId === 'flee' ? 'path' : movementTraversalKind(state.option);
    await token.document.setFlag?.('mastery-system', 'movementTraversal', traversal);
    const { MASTERY_AUTHORIZED_MOVE } = await import('./combat/token-move-gate.js');
    await token.document.update(
      { x: destTL.x, y: destTL.y },
      {
        animate: true,
        // Foundry V14 TokenRuler â€” do not keep a walked-path trail for this step.
        showRuler: false,
        // Portrait tokens: do not spin to face the move vector.
        autoRotate: false,
        [MASTERY_AUTHORIZED_MOVE]: true,
      },
    );

    // Region OnEnter pause/stop may halt at the boundary before dest â€” wait, then spend only walked distance.
    try {
      const anim =
        token.object?.movementAnimationPromise ?? token.document?.object?.movementAnimationPromise;
      if (anim && typeof anim.then === 'function') await anim;
    } catch {
      /* ignore */
    }

    const doc = token.document ?? token;
    const actualTL = { x: Number(doc.x) || 0, y: Number(doc.y) || 0 };
    const actualCenter = tokenCenterFromTopLeft(token, actualTL);
    let actualSteps: number | null = null;
    let actualMeters = 0;
    if (!gridless && grid?.getOffset) {
      actualSteps = gridStepsBetweenCenters(origin, actualCenter, state.budget.remainingSteps);
    } else {
      actualMeters = measureSceneDistanceBetweenPoints(origin, actualCenter);
    }
    const reconciled = reconcileGuidedSpendAfterHalt({
      intendedSteps: stepsUsed,
      intendedMeters: metersUsed,
      actualSteps,
      actualMeters,
      gridless,
    });
    stepsUsed = reconciled.stepsUsed;
    metersUsed = reconciled.metersUsed;

    // Movement action was already spent when the option started (except Flee, which commits above).
    await clearTokenMovementHistory(token.document);

    if (stepsUsed > 0) {
      state.budget = spendMovementSteps(state.budget, stepsUsed);
    } else if (metersUsed > 0) {
      state.budget = spendMovementMeters(state.budget, metersUsed);
    }
    state.movedOnce = true;
    // Use the document position after any region stop â€” not the intended dest.
    state.origin = actualCenter;
    state.blockedHexKeys = collectBlockedHexKeysFromOtherTokens(token);

    try {
      clearHexHighlight(state.highlightIdRange);
      clearHexHighlight(state.highlightIdHover);
    } catch {
      /* ignore */
    }

    if (movementBudgetExhausted(state.budget)) {
      endGuidedMovement(true);
      return;
    }

    // Re-center yellow remaining range on the new hex; no history trail.
    paintStaticMovementRange(state);
    refreshMovementPreview(state, actualTL.x, actualTL.y);
    notifyGuidedMovementChanged();
    const left = Math.max(0, Math.round(state.budget.remainingMeters));
    ui.notifications?.info?.(
      reconciled.haltedShort
        ? `Stopped at region boundary â€” ${left} m left; click to continue.`
        : `${left} m left â€” click to step, right-click to finish.`,
    );
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
  const finish = state.finish;
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

  // Never leave Foundry's pink walked-path trail after guided movement ends.
  void clearTokenMovementHistory(state.token?.document ?? state.token);
  
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
  } else if (!state.movedOnce) {
    ui.notifications.info('Movement cancelled');
  }

  activeMovementState = null;
  notifyGuidedMovementChanged();
  finish?.(success);
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
  const isWeaponSwap =
    option.id === 'weapon-swap' ||
    option.id === 'weapon-swap-1' ||
    option.id === 'weapon-swap-2' ||
    option.id === 'weapon-swap-unarmed' ||
    option.maneuver?.id === 'weapon-swap';
  if (isWeaponSwap) {
    const actor = token?.actor;
    if (!actor) {
      ui.notifications?.warn('No actor found for token!');
      return;
    }
    closeRadialMenu();
    const target =
      option.id === 'weapon-swap-unarmed' ? 'unarmed' : option.id === 'weapon-swap-2' ? 2 : option.id === 'weapon-swap-1' ? 1 : undefined;
    if (target !== undefined) {
      const { swapWeaponSet } = await import('./utils/weapon-sets.js');
      await swapWeaponSet(actor, target);
      return;
    }
    const { postWeaponSwapCard } = await import('./chat/weapon-swap-card.js');
    await postWeaponSwapCard(actor, token);
    return;
  }

  // Check combat exists
  const combat = game.combat;
  if (!combat) {
    ui.notifications?.warn('Not in combat!');
    return;
  }

  const { warnIfPlayerStonesPending } = await import('./combat/stone-round-gate.js');
  if (warnIfPlayerStonesPending(combat)) return;

  const actor = token.actor;
  if (!actor) {
    ui.notifications?.warn('No actor found for token!');
    return;
  }

  if (
    option.costsAction &&
    (option.consumableItemId || (option.tags || []).includes('consumable')) &&
    getAvailableAttackActions(actor, combat) <= 0
  ) {
    ui.notifications?.warn(
      game?.i18n?.localize('MASTERY.consumable.noAttackAction') ?? 'No Attack Actions remaining.',
    );
    return;
  }

  if (
    option.source === 'power' &&
    option.item?.id &&
    !option.consumableItemId &&
    !(option.tags || []).includes('consumable') &&
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
  // Check if this is an active buff FIRST - before consuming actions
  // Active buffs should be activated directly on self, no targeting
  const segmentId = getSegmentIdForOption(option);
  const isActiveBuff = segmentId === 'active-buff';
  
  if (isActiveBuff) {
    // Reject in the combat execution path â€” Buffs activate only in Preparation.
    ui.notifications?.warn(
      'Active Buffs are activated during the Preparation Phase (Stone Powers), not from the radial menu.',
    );
    return;
  }

  // Flee lock: no Attacks / Reactions / Stones until next Turn
  try {
    const { isFleeLocked } = await import('./combat/action-economy.js');
    const isAttackish =
      option.slot === 'attack' ||
      option.source === 'npc-attack' ||
      (option.source === 'power' && (option as any).powerType === 'active');
    if (isFleeLocked(actor, combat) && isAttackish) {
      ui.notifications?.warn('Flee: you cannot make Attacks until the start of your next Turn.');
      return;
    }
  } catch {
    /* ignore */
  }

  // Check and consume movement action if needed
  if (option.costsMovement) {
    const isMovementPower = option.source === 'power' && option.powerType === 'movement';
    if (isMovementPower && option.disabled) {
      ui.notifications?.warn('This Movement Power has no effect at its current Power Level.');
      return;
    }
    if (!isMovementPower && isNormalMovementReplaced(actor, combat)) {
      ui.notifications?.warn('A Movement Power already replaced your normal Movement this round.');
      return;
    }
    const moveId = String(option.maneuver?.id || option.id || '');
    if (moveId === 'flee') {
      const { canDeclareFlee } = await import('./combat/flee.js');
      const check = canDeclareFlee(actor, combat);
      if (!check.ok) {
        ui.notifications?.warn(check.reason || 'Flee is not available.');
        return;
      }
    }

    const available = getAvailableMovementActions(actor, combat);
    if (available <= 0) {
      ui.notifications?.warn('No Movement actions left this round.');
      return; // Menu stays open
    }

    // Dash / Disengage cannot forfeit a base Attack Action already spent on Prep Buff activation.
    if (moveId === 'dash' || moveId === 'disengage') {
      const { canForfeitBaseAttackForManeuver } = await import('./combat/action-economy.js');
      const forfeit = canForfeitBaseAttackForManeuver(actor, combat, moveId);
      if (!forfeit.ok) {
        ui.notifications?.warn(forfeit.reason || 'Cannot forfeit the base Attack Action again.');
        return;
      }
    }

    if (!isMovementPower && moveId !== 'flee') {
      const consumed = await consumeMovementAction(actor, combat);
      if (!consumed) {
        ui.notifications?.warn('Failed to consume movement action.');
        return;
      }
    }

    // Dash / Disengage side-effects. Flee spends and locks only after the move commits.
    if (moveId === 'dash' || moveId === 'disengage') {
      try {
        const { applyBasicMovementManeuverFlags } = await import('./combat/action-economy.js');
        const flags = await applyBasicMovementManeuverFlags(actor, combat, moveId);
        if (!flags.ok) {
          ui.notifications?.warn(flags.reason || 'Cannot apply Dash/Disengage.');
          return;
        }
      } catch (err) {
        console.warn('Mastery System | movement maneuver flags failed', err);
      }
    }
  }

  // Attack actions are consumed only when an attack/utility actually resolves (see melee hook, utility confirm, active buff, stand-up).

  // Check if this is a movement option - check both segment and slot
  const isMovement = option.slot === 'movement' || (option as any).segment === 'movement';
  if (isMovement) {
    // Close radial menu immediately when movement option is selected
    closeRadialMenu();
    
    // Handle stand-up differently (it's an immediate action, not movement)
    if (option.id === 'stand-up' || option.maneuver?.id === 'stand-up') {
      // Stand Up is immediate - just execute it
      executeStandUp(token, option);
      return;
    }

    // Quick Load: Reload(1), no movement
    if (option.id === 'quick-load' || option.maneuver?.id === 'quick-load') {
      await executeQuickLoad(token, option);
      return;
    }
    
    // For movement powers, check if they're teleport-type or move-type
    if (option.source === 'power' && option.powerType === 'movement') {
      // Check if it's a teleport (by tags or description)
      const isTeleport = option.tags?.includes('teleport') || 
                        option.description?.toLowerCase().includes('teleport') ||
                        option.name?.toLowerCase().includes('teleport');
      
      if (isTeleport) {
        // TODO: Implement teleport targeting mode (for now, use guided movement)
        startGuidedMovement(token, option);
      } else {
        // Regular movement power - use guided movement
        startGuidedMovement(token, option);
      }
      return;
    }
    
    // Regular movement maneuver
    startGuidedMovement(token, option);
    return;
  }

  // NPC attacks: re-read live actor data at click time (source of truth).
  if (option.source === 'npc-attack') {
    const {
      getNpcAttackByIndex,
      applyNpcAttackTargetingToOption,
      resolveNpcAttackTargeting,
    } = await import('./utils/npc-attack-model.js');
    const {
      logNpcTargeting,
      logNpcTargetingRow,
      logNpcAttackListDump,
      logNpcActorTargetingCompare,
      logNpcOptionBranch,
      npcTargetingSnap,
    } = await import('./utils/npc-targeting-debug.js');

    const usageKey = String((option as any).npcAttackUsageKey || option.id || '').split('#')[0];
    const world = (globalThis as any).game?.actors?.get(actor.id);
    logNpcTargeting('SELECT begin', {
      clickedOption: {
        name: option.name,
        source: option.source,
        id: option.id,
        burstMeleeAoE: option.burstMeleeAoE,
        tags: option.tags,
        aoeShape: option.aoeShape,
        aoeRadiusMeters: option.aoeRadiusMeters,
        npcAttackIndex: (option as any).npcAttackIndex,
        npcPhaseIndex: (option as any).npcPhaseIndex,
        usageKey,
      },
      tokenActorId: actor.id,
      tokenIsToken: !!(actor as any).isToken,
      worldActorId: world?.id,
      sameRef: world === actor,
    });
    logNpcActorTargetingCompare('SELECT', actor, world);

    const tokenRow = getNpcAttackByIndex(
      actor.system,
      (option as any).npcAttackIndex ?? 0,
      (option as any).npcPhaseIndex,
    );
    const worldRow = world
      ? getNpcAttackByIndex(
          world.system,
          (option as any).npcAttackIndex ?? 0,
          (option as any).npcPhaseIndex,
        )
      : null;
    logNpcTargetingRow('SELECT token row at index', tokenRow, {
      npcAttackIndex: (option as any).npcAttackIndex,
      npcPhaseIndex: (option as any).npcPhaseIndex,
    });
    if (worldRow) {
      logNpcTargetingRow('SELECT world row at index', worldRow, {
        npcAttackIndex: (option as any).npcAttackIndex,
        npcPhaseIndex: (option as any).npcPhaseIndex,
      });
    }
    logNpcAttackListDump('SELECT full token list', actor.system, { actorId: actor.id });

    // Prefer the actor the sheet wrote to when they diverge (debug shows which).
    let row = tokenRow;
    if (worldRow && world !== actor) {
      const tokenT = resolveNpcAttackTargeting(tokenRow);
      const worldT = resolveNpcAttackTargeting(worldRow);
      logNpcTargeting('SELECT token vs world resolved', {
        token: npcTargetingSnap(tokenRow),
        world: npcTargetingSnap(worldRow),
        tokenBurst: tokenT.burstMeleeAoE,
        worldBurst: worldT.burstMeleeAoE,
      });
      if (tokenT.burstMeleeAoE !== worldT.burstMeleeAoE || tokenT.isRanged !== worldT.isRanged) {
        console.warn(
          '[MS NPC Targeting] SELECT MISMATCH â€” token and world disagree; using token.actor (combat source)',
          { token: npcTargetingSnap(tokenRow), world: npcTargetingSnap(worldRow) },
        );
      }
    }

    const beforeBurst = !!option.burstMeleeAoE;
    option = applyNpcAttackTargetingToOption(option, row);
    const after = resolveNpcAttackTargeting(row);
    logNpcTargeting(
      `SELECT applied live row â†’ burst=${after.burstMeleeAoE} ranged=${after.isRanged} aoe=${after.aoeRad} (option.burst before=${beforeBurst} after=${option.burstMeleeAoE})`,
      { snap: npcTargetingSnap(row), after },
    );
    logNpcOptionBranch('SELECT planned branch', option, after);
  } else if (option.source === 'power') {
    console.log('[MS NPC Targeting] SELECT power item (NOT npc-attack sheet row)', {
      name: option.name,
      itemId: option.item?.id,
      itemName: option.item?.name,
      burstMeleeAoE: option.burstMeleeAoE,
      aoeShape: option.aoeShape,
      range: option.range,
      powerType: (option.item?.system as any)?.powerType,
      itemAoe: (option.item?.system as any)?.aoe,
      itemRange: (option.item?.system as any)?.range,
    });
  }

  // Reload (PG "Load"): 1 Attack Action clears the Unloaded state.
  if (option.source === 'maneuver' && option.maneuver?.id === 'reload') {
    closeRadialMenu();
    await executeReloadAction(token, option);
    return;
  }

  // Drop Load (PG "Dropping Load"): 1 Attack Action Encumbered / 2 Overloaded.
  if (option.source === 'maneuver' && option.maneuver?.id === 'drop-load') {
    closeRadialMenu();
    await executeDropLoadAction(token, option);
    return;
  }

  // Parry Stance â†’ enter Passive Parry pool (must run before melee targeting â€”
  // the maneuver uses slot "attack" with a melee-ish range).
  if (option.source === 'maneuver' && option.maneuver?.id === 'parry-stance') {
    const atkAvail = getAvailableAttackActions(actor, combat);
    if (atkAvail <= 0) {
      ui.notifications?.warn('No Actions left this round.');
      return;
    }
    closeRadialMenu();
    try {
      const { enterParry } = await import('./combat/parry.js');
      let delivery: 'martial' | 'spell' = 'martial';
      const Dialog = (globalThis as any).Dialog;
      if (Dialog?.wait) {
        const choice = await Dialog.wait({
          title: 'Parry',
          content:
            '<p>Parry has one pool and two deliveries. Martial strips Attack Dice (Might or Agility). Spell strips Casting Dice from a perceived direct Spell whose origin is within 22 m (Intellect, Resolve, or Influence). Entering normally spends the base Attack Action. If that Action was already committed during Preparation to an Active Buff, spend one additional Attack Action instead.</p>',
          buttons: {
            martial: { label: 'Martial', callback: () => 'martial' },
            spell: { label: 'Spell', callback: () => 'spell' },
          },
          default: 'martial',
          close: () => null,
        });
        if (choice !== 'martial' && choice !== 'spell') return;
        delivery = choice;
      }
      const result = await enterParry(actor, combat, { delivery });
      if (!result.ok) {
        ui.notifications?.warn(result.reason || 'Could not enter Parry.');
        return;
      }
      const attrLabel = result.attribute === 'agility' ? 'Agility' : 'Might';
      ui.notifications?.info(
        `Parry entered â€” pool ${result.pool}/${result.max} (${attrLabel}). Attack Actions given up this round.`,
      );
      await (globalThis as any).ChatMessage?.create?.({
        user: (game as any).user?.id,
        speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor }),
        content: `<p class="mastery-reaction-msg"><strong>${String(actor.name)}</strong> enters <strong>Parry</strong> (pool <strong>${result.pool}</strong> via ${attrLabel}).</p>`,
      });
    } catch (err) {
      console.warn('Mastery System | enter Parry failed', err);
      ui.notifications?.warn('Could not enter Parry.');
    }
    return;
  }

  // Release Grapple (grappler, free): end the pair link.
  if (option.source === 'maneuver' && option.maneuver?.id === 'grapple-release') {
    closeRadialMenu();
    const { releaseGrappleAction } = await import('./combat/grapple-actions.js');
    await releaseGrappleAction(token);
    return;
  }

  // Escape Grapple (held creature, 1 Attack Action): Opposed Attribute Contest vs the grappler.
  if (option.source === 'maneuver' && option.maneuver?.id === 'grapple-escape') {
    const atkAvail = getAvailableAttackActions(actor, combat);
    if (atkAvail <= 0) {
      ui.notifications?.warn('No Actions left this round.');
      return;
    }
    closeRadialMenu();
    const { beginGrappleEscape } = await import('./combat/grapple-actions.js');
    await beginGrappleEscape(token);
    return;
  }
  // Grapple itself continues into the melee-targeting branch below; the
  // meleeTargetSelected hook routes it to the contest card instead of an attack card.

  // Heal / Cleanse Actives: ally targeting, no attack roll / Evade / Reactions.
  try {
    const { isHealRadialOption } = await import('./combat/heal-resolution.js');
    const { isCleanseRadialOption } = await import('./combat/cleanse-resolution.js');
    const healOrCleanse = isHealRadialOption(option) || isCleanseRadialOption(option);
    if (healOrCleanse) {
      // In combat: spend an Attack Action. Outside combat: still allow heal/cleanse.
      if (option.costsAction && combat) {
        const atkAvail = getAvailableAttackActions(actor, combat);
        if (atkAvail <= 0) {
          ui.notifications?.warn('No Actions left this round.');
          return;
        }
      }
      closeRadialMenu();
      option.defaultTargetGroup = 'ally';
      option.allowManualTargetSelection = true;
      if (isHealRadialOption(option)) option.aoePlacementProfile = 'heal';
      else option.aoePlacementProfile = 'cleanse';
      if (option.rangeMeters === undefined) option.rangeMeters = option.range;
      if (option.aoeShape === 'radius' && (option.aoeRadiusMeters ?? 0) > 0) {
        // Melee / Self support AoE must not open the place-cursor (Touch parses as ~2 m).
        const looksRanged =
          /ranged/i.test(String(option.name || '')) ||
          /ranged/i.test(String((option as any).artifactPowerTemplateId || ''));
        const reach = Number(option.rangeMeters ?? option.range ?? 0) || 0;
        if (!looksRanged && (option.burstMeleeAoE || (reach > 0 && reach <= 4))) {
          option.rangeMeters = 0;
          option.burstMeleeAoE = false;
        }
        startUtilityRadiusMode(token, option);
      } else {
        option.aoeShape = 'none';
        startUtilitySingleTargetMode(token, option);
      }
      return;
    }
  } catch (err) {
    console.warn('Mastery System | heal/cleanse radial branch failed', err);
  }

  // A grappler attacking with a weapon has to let go first (unarmed Basic
  // Attack and spells keep the hold). Asked once, before targeting starts.
  if (option.slot === 'attack') {
    try {
      const { attackRequiresGrappleRelease } = await import('./combat/grapple-state.js');
      const { describeActiveWeaponProfile } = await import('./utils/weapon-sets.js');
      if (attackRequiresGrappleRelease(actor, option, { unarmedNow: describeActiveWeaponProfile(actor).unarmed })) {
        const { confirmReleaseGrappleForWeaponAttack } = await import('./combat/grapple-actions.js');
        const proceed = await confirmReleaseGrappleForWeaponAttack(token, option.name);
        if (!proceed) return;
      }
    } catch (err) {
      console.warn('Mastery System | grapple weapon-attack gate failed', err);
    }
  }

  // Check if this is a melee attack option
  // NPC attacks: tagged melee / not ranged (Reach may be up to 8m).
  // Other attacks: range <= 4m (2m base + up to 2m reach) or unspecified.
  // Exclude active buffs (they're handled above)
  const isNpcMelee =
    option.source === 'npc-attack' && !option.tags?.includes('ranged');
  if (option.slot === 'attack' && option.aoeShape === 'cone') {
    if (option.costsAction) {
      const atkAvail = getAvailableAttackActions(actor, combat);
      if (atkAvail <= 0) {
        ui.notifications?.warn('No Actions left this round.');
        return;
      }
    }
    closeRadialMenu();
    startConeAttackMode(token, option);
    return;
  }

  const isMeleeAttack =
    option.slot === 'attack' &&
    (isNpcMelee ||
      (option.source !== 'npc-attack' && (option.range === undefined || option.range <= 4)));
  console.log('[MS NPC Targeting] SELECT route flags', {
    name: option.name,
    source: option.source,
    isNpcMelee,
    isMeleeAttack,
    burstMeleeAoE: option.burstMeleeAoE,
    tags: option.tags,
    range: option.range,
    segmentId,
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
      if (option.source === 'npc-attack') {
        const usageKey = String(option.npcAttackUsageKey || option.id || '');
        if (
          !canUseNpcAttackThisRound(
            actor,
            combat,
            usageKey,
            Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))),
          )
        ) {
          ui.notifications?.warn('Keine Nutzungen dieser Attacke mehr in dieser Runde.');
          return;
        }
      }
    }
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
      // Self-centered Instant Melee AoE (Rending Spiral, Tail Sweep, Frostwave, …):
      // same interactive flow as Cone/Zone — radius preview + affected-creature
      // panel. No Primary Target; no silent Dialog shortcut.
      const radiusM =
        typeof option.burstMeleeRadiusMeters === 'number' && option.burstMeleeRadiusMeters > 0
          ? option.burstMeleeRadiusMeters
          : Number(option.aoeRadiusMeters) || Number(option.range) || 0;
      console.log('[MS NPC Targeting] SELECT entering MELEE_BURST_RADIUS_MODE', {
        name: option.name,
        source: option.source,
        radiusM,
        tags: option.tags,
      });
      option.range = 0;
      option.rangeMeters = 0;
      option.aoeShape = 'radius';
      option.aoeRadiusMeters = radiusM;
      option.aoePlacementProfile = 'melee-burst';
      option.allowManualTargetSelection = true;
      option.defaultTargetGroup = option.defaultTargetGroup || 'creature';
      startUtilityRadiusMode(token, option);
      return;
    }

    startMeleeTargeting(token, option);
    return;
  }

  const isAttackHostileZonePlacement =
    option.slot === "attack" &&
    option.aoeShape === "radius" &&
    (option.aoeRadiusMeters ?? 0) > 0 &&
    (option.aoePlacementProfile === "hostile-zone" ||
      (option.source === "npc-attack" && option.tags?.includes("ranged")));

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
      if (option.source === "npc-attack") {
        const usageKey = String(option.npcAttackUsageKey || option.id || "");
        if (
          !canUseNpcAttackThisRound(
            actor,
            combat,
            usageKey,
            Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))),
          )
        ) {
          ui.notifications?.warn("Keine Nutzungen dieser Attacke mehr in dieser Runde.");
          return;
        }
      }
    }
    closeRadialMenu();
    // Ranged AoE: place a radius under the cursor (hex highlight / circle).
    if (!option.aoePlacementProfile) {
      option.aoePlacementProfile = "hostile-zone";
    }
    if (!option.defaultTargetGroup) {
      option.defaultTargetGroup = "enemy";
    }
    if (option.allowManualTargetSelection === undefined) {
      option.allowManualTargetSelection = true;
    }
    startUtilityRadiusMode(token, option);
    return;
  }

  const isRangedAttack =
    option.slot === "attack" &&
    option.range !== undefined &&
    option.range > 4;

  if (isRangedAttack) {
    const { gateAmmunitionAttack } = await import('./utils/ammunition.js');
    if (!gateAmmunitionAttack(actor, option)) return;
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
      if (option.source === 'npc-attack') {
        const usageKey = String(option.npcAttackUsageKey || option.id || '');
        if (
          !canUseNpcAttackThisRound(
            actor,
            combat,
            usageKey,
            Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))),
          )
        ) {
          ui.notifications?.warn('Keine Nutzungen dieser Attacke mehr in dieser Runde.');
          return;
        }
      }
    }
    closeRadialMenu();

    // Autofire: ordered chain targeting â†’ one attack card vs first target.
    try {
      const { detectAutofire } = await import('./combat/autofire.js');
      if (detectAutofire(option)) {
        const { promptAutofireChain } = await import('./autofire-targeting.js');
        const chain = await promptAutofireChain(token, option);
        if (!chain?.length) return;
        const primaryTok = canvas.tokens?.get(chain[0]);
        if (!primaryTok) {
          ui.notifications?.warn?.('Autofire: first target token not found.');
          return;
        }
        (option as any).autofireChainTokenIds = chain;
        const { createRangedAttackCard } = await import('./combat/attack-executor.js');
        await createRangedAttackCard(token, primaryTok, option);
        return;
      }
    } catch (afErr) {
      console.warn('Mastery System | Autofire targeting failed', afErr);
    }

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
  if (isUtility) {
    // Titan Growth / Transformation — self activate, no targeting.
    const isTransformation =
      (option.tags || []).includes('transformation') ||
      /titan\s*growth/i.test(String(option.name || '')) ||
      /transformation/i.test(String(option.artifactRowSpecial || ''));
    if (isTransformation && option.item) {
      if (option.costsAction) {
        const atkAvail = getAvailableAttackActions(actor, combat);
        if (atkAvail <= 0) {
          ui.notifications?.warn('No Actions left this round.');
          return;
        }
      }
      closeRadialMenu();
      try {
        const { activateArtifactActiveBuff } = await import('./utils/artifact-active-buffs.js');
        const ok = await activateArtifactActiveBuff(actor, option.item, option);
        if (ok && option.costsAction && combat) {
          const { consumeAttackAction } = await import('./combat/action-economy.js');
          await consumeAttackAction(actor, combat);
        }
      } catch (err) {
        console.warn('Mastery System | Transformation activation failed', err);
      }
      return;
    }
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
    closeRadialMenu();
    if (option.aoeShape === 'none') {
      startUtilitySingleTargetMode(token, option);
      return;
    } else if (option.aoeShape === 'radius') {
      startUtilityRadiusMode(token, option);
      return;
    } else if (option.aoeShape === 'cone') {
      ui.notifications?.warn('Cone targeting not yet implemented');
      console.warn('Mastery System | [RADIAL FLOW] utility cone not implemented â€” no action spent', {
        option: option.name
      });
      return;
    }
  }

  if (option.source === 'power' && option.item) {
    closeRadialMenu();
    console.warn('Mastery System | [RADIAL FLOW] branch: non-melee attack power â€” no targeting/roll pipeline yet', {
      name: option.name,
      slot: option.slot,
      range: option.range,
      costsAction: option.costsAction,
      note: 'Attack actions are NOT consumed here; use a melee-range power or weapon attack until ranged powers are wired up.'
    });
    ui.notifications?.warn(
      `${option.name}: Fern-/Ranged-Angriff ist noch nicht angebunden â€” keine Aktion verbraucht. Nahkampf (Reichweite â‰¤4m) wÃ¤hlen oder spÃ¤ter erneut testen.`
    );
  } else if (option.source === 'maneuver' && option.maneuver) {
    closeRadialMenu();
    console.warn('Mastery System | [RADIAL FLOW] branch: maneuver fallback â€” no executor', {
      name: option.name,
      slot: option.slot,
      range: option.range,
      maneuverId: option.maneuver.id
    });
    ui.notifications?.info(`Action selected: ${option.name} (${option.slot}) â€” AusfÃ¼hrung noch nicht implementiert (keine Aktion verbraucht).`);
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
}

async function actorHasBlockingCondition(actor: any, names: string[]): Promise<boolean> {
  try {
    const { hasCondition } = await import('./utils/power-mechanics.js');
    return names.some((n) => hasCondition(actor, n));
  } catch {
    const statuses = (actor as any)?.statuses;
    if (statuses && typeof statuses.has === 'function') {
      for (const n of names) {
        if (statuses.has(n)) return true;
      }
    }
    const effects = actor?.effects
      ? Array.isArray(actor.effects)
        ? actor.effects
        : Array.from(actor.effects)
      : [];
    for (const e of effects) {
      const label = String(e?.name || e?.label || e?.id || '').toLowerCase();
      if (names.some((n) => label.includes(n.toLowerCase()))) return true;
    }
    return false;
  }
}

/** Clear the Unloaded state on every equipped Load weapon. Returns their names. */
async function reloadEquippedLoadWeapons(actor: any): Promise<string[]> {
  const { hasLoadProperty, isWeaponUnloaded, markWeaponLoaded } = await import(
    './utils/weapon-properties.js'
  );
  const items: any[] = actor?.items ? Array.from(actor.items) : [];
  const reloaded: string[] = [];
  for (const it of items) {
    if (it.type !== 'weapon' || it.system?.equipped !== true) continue;
    if (!hasLoadProperty(it) || !isWeaponUnloaded(it)) continue;
    await markWeaponLoaded(it);
    reloaded.push(String(it.name));
  }
  return reloaded;
}

/**
 * Drop Load (PG "Dropping Load"): safely drop carried gear to remove
 * Encumbered / Overloaded â€” 1 Attack Action Encumbered, 2 Overloaded.
 * Dropped items leave the carry grid (moved to the stash as "on the ground").
 */
async function executeDropLoadAction(token: any, option: RadialCombatOption): Promise<void> {
  const actor = token.actor;
  if (!actor) return;
  const combat = game.combat ?? null;
  const { getActorInventoryLoadZone, LOAD_ZONE_LABEL } = await import('./utils/encumbrance.js');
  const zone = getActorInventoryLoadZone(actor);
  if (zone === 'normal') {
    ui.notifications?.info('Not Encumbered or Overloaded â€” nothing to drop.');
    return;
  }
  const cost = zone === 'overloaded' ? 2 : 1;
  const { getAvailableAttackActions, consumeAttackAction } = await import(
    './combat/action-economy.js'
  );
  if (combat) {
    if (getAvailableAttackActions(actor, combat) < cost) {
      ui.notifications?.warn(
        `Drop Load (${LOAD_ZONE_LABEL[zone]}) costs ${cost} Attack Action${cost > 1 ? 's' : ''} â€” not enough left.`,
      );
      return;
    }
  }

  // Every carry-grid item leaves the character (dropped safely at their feet).
  const updates: Array<{ _id: string; [key: string]: unknown }> = [];
  const droppedNames: string[] = [];
  for (const item of actor.items) {
    const flags = item.getFlag?.('mastery-system', 'equipment') || {};
    if (flags.container !== 'inventory' || flags.slot) continue;
    if (flags.weaponSetPrepared === true) continue;
    if (flags.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot))) continue;
    const newFlags = { ...flags, container: 'stash', band: null, grid: null };
    updates.push({ _id: item.id, 'flags.mastery-system.equipment': newFlags });
    droppedNames.push(String(item.name));
  }
  if (updates.length === 0) {
    ui.notifications?.info('No carried gear in the inventory grid to drop.');
    return;
  }
  if (combat) {
    for (let i = 0; i < cost; i++) await consumeAttackAction(actor, combat);
  }
  await actor.updateEmbeddedDocuments('Item', updates);
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor, token: token.document }),
      content: `<div class="mastery-system-action">
        <h3><i class="fas fa-box-open"></i> Drop Load</h3>
        <p><strong>${actor.name}</strong> safely drops the carried load (${cost} Attack Action${cost > 1 ? 's' : ''} â€” was ${LOAD_ZONE_LABEL[zone]}).</p>
        <p>Dropped to the ground (stash): ${droppedNames.join(', ')}.</p>
      </div>`,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    });
  } catch (error) {
    console.warn('Mastery System | Could not create Drop Load chat message:', error);
  }
}

/**
 * Reload (Attack Action) â€” PG "Load": spend 1 Attack Action to reload.
 */
async function executeReloadAction(token: any, option: RadialCombatOption): Promise<void> {
  const actor = token.actor;
  if (!actor) return;
  const combat = game.combat ?? null;
  const { getAvailableAttackActions, consumeAttackAction } = await import(
    './combat/action-economy.js'
  );
  if (combat) {
    if (getAvailableAttackActions(actor, combat) <= 0) {
      ui.notifications?.warn('No Actions left this round.');
      return;
    }
  }
  if (await actorHasBlockingCondition(actor, ['immobilized', 'restrained'])) {
    ui.notifications?.warn('Reload: you cannot reload while Immobilized or Restrained.');
    return;
  }
  const reloaded = await reloadEquippedLoadWeapons(actor);
  if (reloaded.length === 0) {
    ui.notifications?.info('No Unloaded weapon equipped â€” nothing to reload.');
    return;
  }
  if (combat) await consumeAttackAction(actor, combat);
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor, token: token.document }),
      content: `<div class="mastery-system-action">
        <h3><i class="fas fa-sync-alt"></i> ${option.name || 'Reload'}</h3>
        <p>Reloaded: <strong>${reloaded.join(', ')}</strong> (1 Attack Action).</p>
      </div>`,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    });
  } catch (error) {
    console.warn('Mastery System | Could not create Reload chat message:', error);
  }
}

/**
 * Quick Load â€” spend Movement (already consumed) for Reload (1).
 * Caps total Reload this Turn at Mastery Rank. No token movement.
 */
async function executeQuickLoad(token: any, option: RadialCombatOption): Promise<void> {
  const actor = token.actor;
  if (!actor) return;

  const combat = game.combat ?? null;
  const {
    refundMovementAction,
    getQuickLoadReloadThisTurn,
    recordQuickLoadReload,
  } = await import('./combat/action-economy.js');
  const { getMasteryRank } = await import('./combat/basic-combat.js');

  const refund = async (msg: string) => {
    if (combat && option.costsMovement) {
      try {
        await refundMovementAction(actor, combat);
      } catch (err) {
        console.warn('Mastery System | Quick Load refund failed', err);
      }
    }
    ui.notifications?.warn(msg);
  };

  if (await actorHasBlockingCondition(actor, ['immobilized', 'restrained'])) {
    await refund('Quick Load: you cannot Quick Load while Immobilized or Restrained.');
    return;
  }

  const mr = getMasteryRank(actor);
  const used = getQuickLoadReloadThisTurn(actor, combat);
  if (used >= mr) {
    await refund(`Quick Load: Reload this Turn is capped at Mastery Rank (${mr}).`);
    return;
  }

  const recorded = await recordQuickLoadReload(actor, combat, mr);
  if (!recorded) {
    await refund(`Quick Load: Reload this Turn is capped at Mastery Rank (${mr}).`);
    return;
  }

  // Actually clear the Unloaded state on the equipped Load weapon(s).
  try {
    await reloadEquippedLoadWeapons(actor);
  } catch (err) {
    console.warn('Mastery System | Quick Load weapon reload failed', err);
  }

  const chatData: any = {
    speaker: ChatMessage.getSpeaker({ actor, token: token.document }),
    content: `<div class="mastery-system-action">
      <h3><i class="fas fa-sync-alt"></i> ${option.name}</h3>
      <p>Reload (1). Movement converted to reload â€” no repositioning.</p>
      <p><em>Quick Load this Turn: ${used + 1} / ${mr} (Mastery Rank)</em></p>
    </div>`,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
  };
  try {
    await ChatMessage.create(chatData);
  } catch (error) {
    console.warn('Mastery System | Could not create Quick Load chat message:', error);
  }
  ui.notifications?.info(`${actor.name}: Quick Load â€” Reload (1) (${used + 1}/${mr}).`);
}

