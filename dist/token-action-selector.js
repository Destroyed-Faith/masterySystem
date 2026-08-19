/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 *
 * Uses a PIXI-based radial menu for visual option selection
 */
import { openRadialMenuForActor, getAllCombatOptionsForActor, closeRadialMenu } from './token-radial-menu.js';
import { getSegmentIdForOption } from './radial-menu/options.js';
import { startMeleeTargeting, collectMeleeBurstHostileTokenIds } from './melee-targeting.js';
import { promptMeleeAoePrimaryChoice } from './melee-aoe-primary-dialog.js';
import { extractMeleeAoePowerBonusD8 } from './utils/power-mechanics.js';
import { startRangedTargeting } from './ranged-targeting.js';
import { startUtilitySingleTargetMode, startUtilityRadiusMode } from './utility-targeting.js';
import { getRoundState, getMovementRangeBonusMeters, getAvailableAttackActions, getAvailableMovementActions, consumeAttackAction, consumeMovementAction, spendMovementPowerAction, isNormalMovementReplaced, refundAttackAction, markPowerUsedThisRound, markNpcAttackUsedThisRound, canUseNpcAttackThisRound, hasPowerBeenUsedThisRound } from './combat/action-economy.js';
import { gridStepsFromMeters, gridStepsBetweenCenters, masteryPowerMaxSteps, measureSceneDistanceBetweenPoints, metersToSceneDistance } from './utils/grid-range.js';
import { eventWorldPoint, resolveOverlayContainer, snapWorldTopLeft, } from './utils/grid-snap.js';
import { highlightHexesInRange, highlightHexesWithinStepsFromPoint, clearHexHighlight, collectHexKeysInRangeForToken, highlightTabuHexesOnLayer } from './utils/hex-highlighting.js';
/** Same yellow tone as radial range preview (`range-preview.ts`). */
const MOVEMENT_RANGE_COLOR = 0xffe066;
const MOVEMENT_RANGE_ALPHA = 0.45;
const TABU_OVERLAY_COLOR = 0x992222;
const TABU_OVERLAY_ALPHA = 0.55;
// Global movement state
let activeMovementState = null;
/**
 * Initialize token action selector hooks
 */
export function initializeTokenActionSelector() {
    // Hook into Token HUD rendering to add custom icon
    Hooks.on('renderTokenHUD', (app, html, _data) => {
        // Get the token from app.object (Foundry v11+)
        const token = app.object;
        if (!token) {
            console.warn('Mastery System | Could not find token in Token HUD');
            return;
        }
        // Convert html to jQuery if it's not already (Foundry v13 compatibility)
        const $html = (html instanceof jQuery ? html : $(html));
        // Place the radial-menu button in the MIDDLE column of the Token HUD —
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
        actionIcon.on('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await openMasteryActionRadialMenu(token);
        });
        targetCol.append(actionIcon);
    });
    // Hook into token updates to intercept movement
    Hooks.on('preUpdateToken', async (tokenDoc, change, _options, userId) => {
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
    Hooks.on('updateToken', async (tokenDoc, change, _options, userId) => {
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
    Hooks.on("masterySystem.meleeTargetSelected", async (payload) => {
        try {
            const attackerToken = canvas.tokens?.get(payload.attackerTokenId);
            if (!attackerToken) {
                console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: missing attacker token", {
                    attackerTokenId: payload.attackerTokenId
                });
                return;
            }
            const option = payload.option;
            if (!attackerToken.actor) {
                console.warn("Mastery System | [RADIAL FLOW] meleeTargetSelected: no attacker actor");
                return;
            }
            const targetId = typeof payload.targetTokenId === "string" ? payload.targetTokenId.trim() : "";
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
                const ok = await ensureCanTargetWithPerception(attackerToken.actor, targetToken.actor, { observerToken: attackerToken, targetToken });
                if (!ok)
                    return;
            }
            await createMeleeAttackCard(attackerToken, targetToken, option, null, aoeMelee);
        }
        catch (e) {
            console.error("Mastery System | [TOKEN ACTION SELECTOR] meleeTargetSelected hook failed", e);
        }
    });
    Hooks.on("masterySystem.rangedTargetSelected", async (payload) => {
        try {
            const attackerToken = canvas.tokens?.get(payload.attackerTokenId);
            const targetToken = canvas.tokens?.get(payload.targetTokenId);
            if (!attackerToken || !targetToken) {
                console.warn("Mastery System | [RADIAL FLOW] rangedTargetSelected: missing token(s)", payload);
                return;
            }
            const option = payload.option;
            if (!attackerToken.actor) {
                console.warn("Mastery System | [RADIAL FLOW] rangedTargetSelected: no attacker actor");
                return;
            }
            const { createRangedAttackCard } = await import("./combat/attack-executor.js");
            const { ensureCanTargetWithPerception } = await import("./combat/perception-gate.js");
            if (attackerToken.actor && targetToken.actor) {
                const ok = await ensureCanTargetWithPerception(attackerToken.actor, targetToken.actor, { observerToken: attackerToken, targetToken });
                if (!ok)
                    return;
            }
            console.log("[MS NPC Targeting] rangedTargetSelected → createRangedAttackCard", {
                attacker: attackerToken.name,
                target: targetToken.name,
                option: option?.name,
                range: option?.range,
                rangeMinMeters: option?.rangeMinMeters,
            });
            await createRangedAttackCard(attackerToken, targetToken, option);
            console.log("[MS NPC Targeting] rangedTargetSelected → attack card created");
        }
        catch (e) {
            console.error("Mastery System | [TOKEN ACTION SELECTOR] rangedTargetSelected hook failed", e);
        }
    });
}
/**
 * Open the radial menu for combat action selection
 * @param token - The token to set the action for
 */
async function openMasteryActionRadialMenu(token) {
    const actor = token.actor;
    if (!actor) {
        ui.notifications.error('No actor found for this token.');
        return;
    }
    const { warnIfPlayerStonesPending } = await import('./combat/stone-round-gate.js');
    if (warnIfPlayerStonesPending(game.combat))
        return;
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
function getTokenHexCenter(token) {
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
            const offset = canvas.grid.getOffset(center.x, center.y);
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
        }
        catch (error) {
            console.warn('Mastery System | Could not calculate hex center, using token center', error);
        }
    }
    // Fallback to token center
    return center;
}
/** Pixel center of the token if its top-left were `tl`. */
function tokenCenterFromTopLeft(token, tl) {
    const w = Number(token.w) || 0;
    const h = Number(token.h) || 0;
    return { x: tl.x + w / 2, y: tl.y + h / 2 };
}
/** Grid key `"i,j"` for the hex/square under the token's center at the given top-left. */
function hexKeyUnderTokenAtTopLeft(token, topLeft) {
    const grid = canvas.grid;
    if (!grid?.getOffset)
        return null;
    const c = tokenCenterFromTopLeft(token, topLeft);
    const o = grid.getOffset(c.x, c.y);
    if (o?.i === undefined || o?.j === undefined)
        return null;
    return `${o.i},${o.j}`;
}
/** Hex keys of grid cells where other tokens (with an actor) have their center — cannot end movement here. */
function collectBlockedHexKeysFromOtherTokens(movingToken) {
    const keys = new Set();
    const grid = canvas.grid;
    if (!grid?.getOffset)
        return keys;
    const myId = movingToken.id;
    for (const t of (canvas.tokens?.placeables ?? [])) {
        if (!t || t.id === myId)
            continue;
        if (!t.actor)
            continue;
        const o = grid.getOffset(t.center);
        if (o?.i !== undefined && o?.j !== undefined)
            keys.add(`${o.i},${o.j}`);
    }
    return keys;
}
function paintStaticMovementRange(state) {
    const token = state.token;
    if (!canvas.grid || canvas.grid.type === CONST.GRID_TYPES.GRIDLESS)
        return;
    highlightHexesInRange(token.id, state.maxRangeSteps, state.highlightIdRange, MOVEMENT_RANGE_COLOR, MOVEMENT_RANGE_ALPHA);
    const reachable = collectHexKeysInRangeForToken(token.id, state.maxRangeSteps);
    if (reachable) {
        highlightTabuHexesOnLayer(state.highlightIdRange, state.blockedHexKeys, reachable, TABU_OVERLAY_COLOR, TABU_OVERLAY_ALPHA);
    }
}
/**
 * Get default movement range for an option
 */
function getDefaultMovementRange(token, option) {
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
export function startGuidedMovement(token, option) {
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
    // Make the token slightly transparent to indicate "picked up"
    token.alpha = 0.6;
    // Create a Ruler bound to this user
    let ruler = null;
    try {
        ruler = new Ruler(game.user);
        ruler.clear();
    }
    catch (error) {
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
    const onMove = (ev) => handleMovementPointerMove(ev);
    const onDown = (ev) => handleMovementPointerDown(ev);
    const onKeyDown = (ev) => {
        if (ev.key === 'Escape' && activeMovementState) {
            endGuidedMovement(false);
        }
    };
    const state = {
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
}
/**
 * Handle pointer move during movement mode
 */
function handleMovementPointerMove(ev, state) {
    const currentState = state || activeMovementState;
    if (!currentState || activeMovementState !== currentState)
        return;
    const worldPos = eventWorldPoint(ev);
    const snapped = snapWorldTopLeft(worldPos.x, worldPos.y);
    refreshMovementPreview(currentState, snapped.x, snapped.y);
}
/**
 * Preview line + Ziel-Feld (Hover-Layer). Gelbes Reichweiten-Raster bleibt auf `highlightIdRange`.
 */
function refreshMovementPreview(state, destX, destY) {
    if (!state.previewGraphics)
        return;
    state.previewGraphics.clear();
    const origin = state.origin;
    const token = state.token;
    const destTL = { x: destX, y: destY };
    const destCenter = tokenCenterFromTopLeft(token, destTL);
    const grid = canvas.grid;
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
    }
    else {
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
function handleMovementPointerDown(ev, state) {
    const currentState = state || activeMovementState;
    if (!currentState || activeMovementState !== currentState)
        return;
    // Right or middle click cancels
    if (ev.button === 2 || ev.button === 1) {
        endGuidedMovement(false);
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
async function attemptCommitMovement(destX, destY, state) {
    const origin = state.origin;
    const token = state.token;
    const destTL = { x: destX, y: destY };
    const destCenter = tokenCenterFromTopLeft(token, destTL);
    const grid = canvas.grid;
    const gridless = !grid || grid.type === CONST.GRID_TYPES.GRIDLESS;
    let distanceLabel = '';
    if (!gridless && grid?.getOffset) {
        const destKey = hexKeyUnderTokenAtTopLeft(token, destTL);
        if (destKey && state.blockedHexKeys.has(destKey)) {
            ui.notifications.warn(game.i18n?.localize('MASTERY.combat.moveTargetOccupied') ??
                'Das Zielfeld ist durch eine andere Figur blockiert.');
            return;
        }
        const steps = gridStepsBetweenCenters(origin, destCenter, state.maxRangeSteps);
        if (steps === null || steps > state.maxRangeSteps) {
            ui.notifications.warn(game.i18n?.localize('MASTERY.combat.moveOutOfRange') ??
                'Ziel liegt außerhalb der Bewegungsreichweite.');
            return;
        }
        distanceLabel = String(steps);
    }
    else {
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
        // Movement action consumption is already handled in handleChosenCombatOption
        // before startGuidedMovement is called, so no need to consume again here
        // End movement mode successfully
        endGuidedMovement(true);
    }
    catch (error) {
        console.error('Mastery System | Error during token movement', error);
        ui.notifications.error('Failed to move token');
        endGuidedMovement(false);
    }
}
/**
 * End guided movement mode
 */
export function endGuidedMovement(success) {
    const state = activeMovementState;
    if (!state)
        return;
    // Remove event listeners
    canvas.stage.off("pointermove", state.onMove);
    canvas.stage.off("pointerdown", state.onDown);
    window.removeEventListener("keydown", state.onKeyDown);
    try {
        clearHexHighlight(state.highlightIdRange);
        clearHexHighlight(state.highlightIdHover);
    }
    catch (error) {
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
    }
    else {
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
export async function handleChosenCombatOption(token, option) {
    const isWeaponSwap = option.id === 'weapon-swap' || option.maneuver?.id === 'weapon-swap';
    if (isWeaponSwap) {
        const actor = token?.actor;
        if (!actor) {
            ui.notifications?.warn('No actor found for token!');
            return;
        }
        closeRadialMenu();
        const { swapWeaponSet } = await import('./utils/weapon-sets.js');
        await swapWeaponSet(actor);
        return;
    }
    // Check combat exists
    const combat = game.combat;
    if (!combat) {
        ui.notifications?.warn('Not in combat!');
        return;
    }
    const { warnIfPlayerStonesPending } = await import('./combat/stone-round-gate.js');
    if (warnIfPlayerStonesPending(combat))
        return;
    const actor = token.actor;
    if (!actor) {
        ui.notifications?.warn('No actor found for token!');
        return;
    }
    if (option.costsAction &&
        (option.consumableItemId || (option.tags || []).includes('consumable')) &&
        getAvailableAttackActions(actor, combat) <= 0) {
        ui.notifications?.warn(game?.i18n?.localize('MASTERY.consumable.noAttackAction') ?? 'No Attack Actions remaining.');
        return;
    }
    if (option.source === 'power' &&
        option.item?.id &&
        !option.consumableItemId &&
        !(option.tags || []).includes('consumable') &&
        hasPowerBeenUsedThisRound(actor, combat, option.item.id)) {
        ui.notifications?.warn(game?.i18n?.localize('MASTERY.combat.powerAlreadyUsedThisRound') ??
            'This power has already been used this round.');
        return;
    }
    const reactionPower = option.source === 'power' &&
        ((option.powerType === 'reaction') ||
            (option.item?.system?.powerType === 'reaction'));
    if (reactionPower) {
        ui.notifications?.info(game?.i18n?.localize('MASTERY.combat.reactionUseWhenDamaged') ??
            'Reaction powers are chosen when you take damage from an attack (dialog after phasing). They are not fired from the radial during your turn.');
        return;
    }
    // Debug: Log remaining actions when opening radial
    const roundState = getRoundState(actor, combat);
    // Check if this is an active buff FIRST - before consuming actions
    // Active buffs should be activated directly on self, no targeting
    const segmentId = getSegmentIdForOption(option);
    const isActiveBuff = segmentId === 'active-buff';
    if (isActiveBuff && option.source === 'power' && option.item) {
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
        }
        closeRadialMenu();
        // Artifact Active Buffs (e.g. Titan Scars → Growth Form) have no backing
        // power item, so they use a dedicated activation path that can also grow
        // the token. Detected via the 'artifact' tag.
        if ((option.tags || []).includes('artifact')) {
            // @ts-ignore - .js extension in dynamic import
            const { activateArtifactActiveBuff } = await import('./utils/artifact-active-buffs.js');
            const ok = await activateArtifactActiveBuff(actor, option.item, option);
            if (!ok && option.costsAction) {
                await refundAttackAction(actor, combat);
            }
            if (ok) {
                // NOTE: deliberately not marking the artifact item "used this round" —
                // a single artifact item carries several rows, and the per-item guard
                // would otherwise block the actor's other artifact abilities (Bite,
                // Stone supports, etc.) for the rest of the round.
                if (token.hud)
                    token.hud.render();
                const sheet0 = actor.sheet;
                if (sheet0 && sheet0.rendered)
                    sheet0.render();
                const carousel0 = window.masteryCombatCarousel;
                if (carousel0 && carousel0.rendered)
                    carousel0.render();
            }
            return;
        }
        // Dynamic import for active buffs utilities
        // @ts-ignore - TypeScript doesn't recognize the .js extension in dynamic imports
        const activeBuffsModule = await import('./utils/active-buffs.js');
        const { activateActiveBuff, isPowerActiveAsBuff } = activeBuffsModule;
        // Check if already active
        if (isPowerActiveAsBuff(actor, option.item.id)) {
            ui.notifications?.warn(`${option.name} is already active!`);
            if (option.costsAction) {
                await refundAttackAction(actor, combat);
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
            const carousel = window.masteryCombatCarousel;
            if (carousel && carousel.rendered) {
                carousel.render();
            }
        }
        return;
    }
    // Flee lock: no Attacks / Reactions / Stones until next Turn
    try {
        const { isFleeLocked } = await import('./combat/action-economy.js');
        const isAttackish = option.slot === 'attack' ||
            option.source === 'npc-attack' ||
            (option.source === 'power' && option.powerType === 'active');
        if (isFleeLocked(actor, combat) && isAttackish) {
            ui.notifications?.warn('Flee: you cannot make Attacks until the start of your next Turn.');
            return;
        }
    }
    catch {
        /* ignore */
    }
    // Check and consume movement action if needed
    if (option.costsMovement) {
        const isMovementPower = option.source === 'power' && option.powerType === 'movement';
        if (!isMovementPower && isNormalMovementReplaced(actor, combat)) {
            ui.notifications?.warn('A Movement Power already replaced your normal Movement this round.');
            return;
        }
        const available = getAvailableMovementActions(actor, combat);
        if (available <= 0) {
            ui.notifications?.warn('No Movement actions left this round.');
            return; // Menu stays open
        }
        const consumed = isMovementPower
            ? await spendMovementPowerAction(actor, combat)
            : await consumeMovementAction(actor, combat);
        if (!consumed) {
            ui.notifications?.warn('Failed to consume movement action.');
            return;
        }
        // Dash / Disengage / Flee side-effects
        const moveId = String(option.maneuver?.id || option.id || '');
        if (moveId === 'dash' || moveId === 'disengage' || moveId === 'flee') {
            try {
                const { applyBasicMovementManeuverFlags } = await import('./combat/action-economy.js');
                await applyBasicMovementManeuverFlags(actor, combat, moveId);
            }
            catch (err) {
                console.warn('Mastery System | movement maneuver flags failed', err);
            }
        }
    }
    // Attack actions are consumed only when an attack/utility actually resolves (see melee hook, utility confirm, active buff, stand-up).
    // Check if this is a movement option - check both segment and slot
    const isMovement = option.slot === 'movement' || option.segment === 'movement';
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
            }
            else {
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
        const { getNpcAttackByIndex, applyNpcAttackTargetingToOption, resolveNpcAttackTargeting, } = await import('./utils/npc-attack-model.js');
        const { logNpcTargeting, logNpcTargetingRow, logNpcAttackListDump, logNpcActorTargetingCompare, logNpcOptionBranch, npcTargetingSnap, } = await import('./utils/npc-targeting-debug.js');
        const usageKey = String(option.npcAttackUsageKey || option.id || '').split('#')[0];
        const world = globalThis.game?.actors?.get(actor.id);
        logNpcTargeting('SELECT begin', {
            clickedOption: {
                name: option.name,
                source: option.source,
                id: option.id,
                burstMeleeAoE: option.burstMeleeAoE,
                tags: option.tags,
                aoeShape: option.aoeShape,
                aoeRadiusMeters: option.aoeRadiusMeters,
                npcAttackIndex: option.npcAttackIndex,
                npcPhaseIndex: option.npcPhaseIndex,
                usageKey,
            },
            tokenActorId: actor.id,
            tokenIsToken: !!actor.isToken,
            worldActorId: world?.id,
            sameRef: world === actor,
        });
        logNpcActorTargetingCompare('SELECT', actor, world);
        const tokenRow = getNpcAttackByIndex(actor.system, option.npcAttackIndex ?? 0, option.npcPhaseIndex);
        const worldRow = world
            ? getNpcAttackByIndex(world.system, option.npcAttackIndex ?? 0, option.npcPhaseIndex)
            : null;
        logNpcTargetingRow('SELECT token row at index', tokenRow, {
            npcAttackIndex: option.npcAttackIndex,
            npcPhaseIndex: option.npcPhaseIndex,
        });
        if (worldRow) {
            logNpcTargetingRow('SELECT world row at index', worldRow, {
                npcAttackIndex: option.npcAttackIndex,
                npcPhaseIndex: option.npcPhaseIndex,
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
                console.warn('[MS NPC Targeting] SELECT MISMATCH — token and world disagree; using token.actor (combat source)', { token: npcTargetingSnap(tokenRow), world: npcTargetingSnap(worldRow) });
            }
        }
        const beforeBurst = !!option.burstMeleeAoE;
        option = applyNpcAttackTargetingToOption(option, row);
        const after = resolveNpcAttackTargeting(row);
        logNpcTargeting(`SELECT applied live row → burst=${after.burstMeleeAoE} ranged=${after.isRanged} aoe=${after.aoeRad} (option.burst before=${beforeBurst} after=${option.burstMeleeAoE})`, { snap: npcTargetingSnap(row), after });
        logNpcOptionBranch('SELECT planned branch', option, after);
    }
    else if (option.source === 'power') {
        console.log('[MS NPC Targeting] SELECT power item (NOT npc-attack sheet row)', {
            name: option.name,
            itemId: option.item?.id,
            itemName: option.item?.name,
            burstMeleeAoE: option.burstMeleeAoE,
            aoeShape: option.aoeShape,
            range: option.range,
            powerType: option.item?.system?.powerType,
            itemAoe: option.item?.system?.aoe,
            itemRange: option.item?.system?.range,
        });
    }
    // Parry Stance → enter Passive Parry pool (must run before melee targeting —
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
            const result = await enterParry(actor, combat);
            if (!result.ok) {
                ui.notifications?.warn(result.reason || 'Could not enter Parry.');
                return;
            }
            const attrLabel = result.attribute === 'agility' ? 'Agility' : 'Might';
            ui.notifications?.info(`Parry entered — pool ${result.pool}/${result.max} (${attrLabel}). Attack Actions given up this round.`);
            await globalThis.ChatMessage?.create?.({
                user: game.user?.id,
                speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
                content: `<p class="mastery-reaction-msg"><strong>${String(actor.name)}</strong> enters <strong>Parry</strong> (pool <strong>${result.pool}</strong> via ${attrLabel}).</p>`,
            });
        }
        catch (err) {
            console.warn('Mastery System | enter Parry failed', err);
            ui.notifications?.warn('Could not enter Parry.');
        }
        return;
    }
    // Check if this is a melee attack option
    // NPC attacks: tagged melee / not ranged (Reach may be up to 8m).
    // Other attacks: range <= 4m (2m base + up to 2m reach) or unspecified.
    // Exclude active buffs (they're handled above)
    const isNpcMelee = option.source === 'npc-attack' && !option.tags?.includes('ranged');
    const isMeleeAttack = segmentId !== 'active-buff' &&
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
                if (!canUseNpcAttackThisRound(actor, combat, usageKey, Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))))) {
                    ui.notifications?.warn('Keine Nutzungen dieser Attacke mehr in dieser Runde.');
                    return;
                }
            }
        }
        // Close radial menu when attack option is selected
        closeRadialMenu();
        const targetToken = option.targetToken;
        if (targetToken) {
            Hooks.call('masterySystem.meleeTargetSelected', {
                attackerTokenId: token.id,
                targetTokenId: targetToken.id,
                option
            });
            return;
        }
        if (option.burstMeleeAoE) {
            console.log('[MS NPC Targeting] SELECT entering MELEE_AOE_DIALOG', {
                name: option.name,
                source: option.source,
                burstMeleeRadiusMeters: option.burstMeleeRadiusMeters,
                aoeRadiusMeters: option.aoeRadiusMeters,
                aoeShape: option.aoeShape,
                tags: option.tags,
            });
            const burstIds = collectMeleeBurstHostileTokenIds(token, option);
            if (!burstIds.length) {
                ui.notifications?.warn?.('Melee AoE: no hostile targets in range.');
                console.warn('Mastery System | [RADIAL FLOW] melee burst: zero hostile targets in AoE', {
                    option: option.name,
                    token: token.name
                });
                return;
            }
            // Paint the burst footprint around the attacker while the primary dialog is open.
            const burstHighlightId = `mastery-melee-aoe-${token.id}`;
            const burstM = typeof option.burstMeleeRadiusMeters === 'number' && option.burstMeleeRadiusMeters > 0
                ? option.burstMeleeRadiusMeters
                : (option.meleeReachMeters ?? option.range ?? 2);
            try {
                const steps = masteryPowerMaxSteps(burstM);
                if (steps > 0 && token.center) {
                    highlightHexesWithinStepsFromPoint(token.center, steps, burstHighlightId, 0xff6644, 0.38);
                }
            }
            catch (err) {
                console.warn('Mastery System | Melee AoE preview failed', err);
            }
            // Power bonus dice are part of the full payload (not splash-only).
            const powerBonus = option.source === 'npc-attack' ? 0 : extractMeleeAoePowerBonusD8(option.item);
            let choice;
            try {
                choice = await promptMeleeAoePrimaryChoice(burstIds, token.id, option);
            }
            finally {
                clearHexHighlight(burstHighlightId);
            }
            if (choice === 'cancelled') {
                return;
            }
            // Ally filter from the dialog: secondaries come from the effective pool.
            const effectiveBurstIds = choice.effectiveBurstTokenIds;
            if (choice.primaryTokenId === null) {
                if (!effectiveBurstIds.length) {
                    ui.notifications?.warn?.('Melee AoE (no primary): no valid targets in the area.');
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
                if (option.source === 'npc-attack' && option.costsAction) {
                    await markNpcAttackUsedThisRound(actor, combat, String(option.npcAttackUsageKey || option.id || ''));
                }
                // No-primary AoE: roll once (TN = first creature's Evade for the roll
                // UI), then compare that same total separately against every creature.
                const { getAttackAttribute, getAttributeValue, getMasteryRank, getTargetEvade } = await import('./combat/attack-executor.js');
                const mr = getMasteryRank(actor);
                const attribute = getAttackAttribute(actor, null, option, 'melee');
                let numDice = Math.max(1, getAttributeValue(actor, attribute));
                if (option.source === 'npc-attack') {
                    const { getNpcAttackByIndex, npcAttackDiceCount } = await import('./utils/npc-attack-model.js');
                    const row = getNpcAttackByIndex(actor.system, option.npcAttackIndex ?? 0, option.npcPhaseIndex);
                    const pool = npcAttackDiceCount(row);
                    if (pool > 0)
                        numDice = pool;
                }
                const firstTok = canvas.tokens?.get(effectiveBurstIds[0]);
                const anchorTn = getTargetEvade(firstTok?.actor) || 6;
                const { masteryRoll } = await import('./dice/roll-handler.js');
                const areaRoll = await masteryRoll({
                    numDice,
                    keepDice: mr,
                    skill: 0,
                    tn: anchorTn,
                    label: `AoE Attack (${attribute.charAt(0).toUpperCase() + attribute.slice(1)})`,
                    flavor: `Roll ${numDice}d8 keep ${mr} — AoE: same result compared separately against each creature's Evade`,
                    actorId: actor.id,
                    rollKind: 'attack',
                    autoFailIntent: 'attack',
                    checkContext: { tags: ['sight'] },
                    normalTn: anchorTn,
                });
                const attackTotal = Math.floor(Number(areaRoll?.total) || 0);
                const { resolveAoeFromSharedRoll } = await import('./combat/aoe-melee-resolution.js');
                const isSpellAoe = option.artifactIsSpell === true ||
                    option.npcIsSpell === true ||
                    (option.item?.system?.isSpell === true);
                await resolveAoeFromSharedRoll({
                    attacker: actor,
                    tokenIds: effectiveBurstIds.slice(),
                    attackTotal,
                    isSpell: isSpellAoe,
                    flags: {
                        selectedPowerId: option.item?.id ?? null,
                        masteryRank: mr,
                        attackType: 'melee',
                        powerIsSpell: isSpellAoe,
                        aoeMeleeWeapon: true,
                    },
                    weaponId: null,
                });
                return;
            }
            const primaryId = choice.primaryTokenId;
            const secondaries = effectiveBurstIds.filter((id) => id !== primaryId);
            const primaryTok = canvas.tokens?.get(primaryId);
            if (!primaryTok) {
                ui.notifications?.warn?.('Melee AoE: primary token not found.');
                return;
            }
            // Always attach secondaries — each gets a per-Evade check + full payload.
            const aoeMelee = secondaries.length
                ? { secondaryTokenIds: secondaries, powerBonusDice: powerBonus }
                : null;
            const { createMeleeAttackCard } = await import('./combat/attack-executor.js');
            await createMeleeAttackCard(token, primaryTok, option, null, aoeMelee);
            return;
        }
        startMeleeTargeting(token, option);
        return;
    }
    const isAttackHostileZonePlacement = option.slot === "attack" &&
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
                if (!canUseNpcAttackThisRound(actor, combat, usageKey, Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))))) {
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
    const isRangedAttack = segmentId !== "active-buff" &&
        option.slot === "attack" &&
        option.range !== undefined &&
        option.range > 4;
    if (isRangedAttack) {
        const { gateAmmunitionAttack } = await import('./utils/ammunition.js');
        if (!gateAmmunitionAttack(actor, option))
            return;
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
                if (!canUseNpcAttackThisRound(actor, combat, usageKey, Math.min(5, Math.max(1, Math.floor(Number(option.npcAttacksPerRound) || 1))))) {
                    ui.notifications?.warn('Keine Nutzungen dieser Attacke mehr in dieser Runde.');
                    return;
                }
            }
        }
        closeRadialMenu();
        // Autofire: ordered chain targeting → one attack card vs first target.
        try {
            const { detectAutofire } = await import('./combat/autofire.js');
            if (detectAutofire(option)) {
                const { promptAutofireChain } = await import('./autofire-targeting.js');
                const chain = await promptAutofireChain(token, option);
                if (!chain?.length)
                    return;
                const primaryTok = canvas.tokens?.get(chain[0]);
                if (!primaryTok) {
                    ui.notifications?.warn?.('Autofire: first target token not found.');
                    return;
                }
                option.autofireChainTokenIds = chain;
                const { createRangedAttackCard } = await import('./combat/attack-executor.js');
                await createRangedAttackCard(token, primaryTok, option);
                return;
            }
        }
        catch (afErr) {
            console.warn('Mastery System | Autofire targeting failed', afErr);
        }
        const preTarget = option.targetToken;
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
        }
        else if (option.aoeShape === 'radius') {
            startUtilityRadiusMode(token, option);
            return;
        }
        else if (option.aoeShape === 'cone') {
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
        ui.notifications?.warn(`${option.name}: Fern-/Ranged-Angriff ist noch nicht angebunden — keine Aktion verbraucht. Nahkampf (Reichweite ≤4m) wählen oder später erneut testen.`);
    }
    else if (option.source === 'maneuver' && option.maneuver) {
        closeRadialMenu();
        console.warn('Mastery System | [RADIAL FLOW] branch: maneuver fallback — no executor', {
            name: option.name,
            slot: option.slot,
            range: option.range,
            maneuverId: option.maneuver.id
        });
        ui.notifications?.info(`Action selected: ${option.name} (${option.slot}) — Ausführung noch nicht implementiert (keine Aktion verbraucht).`);
    }
}
/**
 * Execute Stand Up action
 * @param token - The token standing up
 * @param option - The stand-up option
 */
async function executeStandUp(token, option) {
    if (!token || !token.actor) {
        ui.notifications.error('Cannot stand up: invalid token');
        return;
    }
    // Import isActorProne to verify
    let isActorProne = null;
    try {
        const actorHelpers = await import('./utils/actor-helpers.js');
        isActorProne = actorHelpers.isActorProne;
    }
    catch (error) {
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
        const proneEffects = token.actor.effects.filter((e) => {
            const name = (e.name || '').toLowerCase();
            const label = (e.label || '').toLowerCase();
            return name.includes('prone') || label.includes('prone');
        });
        for (const effect of proneEffects) {
            try {
                await effect.delete();
            }
            catch (error) {
                console.warn('Mastery System | Could not remove prone effect:', error);
            }
        }
    }
    // Method 2: Remove from statuses (Foundry v13)
    if (token.actor.statuses) {
        const statuses = token.actor.statuses;
        // Check if CONST.STATUS_EFFECTS exists and has PRONE
        if (statuses.has && CONST.STATUS_EFFECTS && CONST.STATUS_EFFECTS.PRONE) {
            const proneStatusId = CONST.STATUS_EFFECTS.PRONE;
            if (statuses.has(proneStatusId)) {
                try {
                    await token.actor.toggleStatusEffect(proneStatusId);
                }
                catch (error) {
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
                    }
                    catch (error) {
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
    }
    catch (error) {
        console.warn('Mastery System | Could not clear prone flags:', error);
    }
    // Consume attack action (Stand Up costs an action)
    const combat = game.combat;
    if (combat) {
        const { consumeAttackAction } = await import('./combat/action-economy.js');
        const consumed = await consumeAttackAction(token.actor, combat);
    }
    // Create chat message
    const chatData = {
        speaker: ChatMessage.getSpeaker({ actor: token.actor, token: token.document }),
        content: `<div class="mastery-system-action">
      <h3><i class="fas fa-hand-rock"></i> ${option.name}</h3>
      <p>${option.description || option.maneuver?.effect || 'Action executed.'}</p>
    </div>`,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER
    };
    try {
        await ChatMessage.create(chatData);
    }
    catch (error) {
        console.warn('Mastery System | Could not create chat message:', error);
    }
    ui.notifications.info(`${token.actor.name} stands up.`);
}
async function actorHasBlockingCondition(actor, names) {
    try {
        const { hasCondition } = await import('./utils/power-mechanics.js');
        return names.some((n) => hasCondition(actor, n));
    }
    catch {
        const statuses = actor?.statuses;
        if (statuses && typeof statuses.has === 'function') {
            for (const n of names) {
                if (statuses.has(n))
                    return true;
            }
        }
        const effects = actor?.effects
            ? Array.isArray(actor.effects)
                ? actor.effects
                : Array.from(actor.effects)
            : [];
        for (const e of effects) {
            const label = String(e?.name || e?.label || e?.id || '').toLowerCase();
            if (names.some((n) => label.includes(n.toLowerCase())))
                return true;
        }
        return false;
    }
}
/**
 * Quick Load — spend Movement (already consumed) for Reload (1).
 * Caps total Reload this Turn at Mastery Rank. No token movement.
 */
async function executeQuickLoad(token, option) {
    const actor = token.actor;
    if (!actor)
        return;
    const combat = game.combat ?? null;
    const { refundMovementAction, getQuickLoadReloadThisTurn, recordQuickLoadReload, } = await import('./combat/action-economy.js');
    const { getMasteryRank } = await import('./combat/basic-combat.js');
    const refund = async (msg) => {
        if (combat && option.costsMovement) {
            try {
                await refundMovementAction(actor, combat);
            }
            catch (err) {
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
    const chatData = {
        speaker: ChatMessage.getSpeaker({ actor, token: token.document }),
        content: `<div class="mastery-system-action">
      <h3><i class="fas fa-sync-alt"></i> ${option.name}</h3>
      <p>Reload (1). Movement converted to reload — no repositioning.</p>
      <p><em>Quick Load this Turn: ${used + 1} / ${mr} (Mastery Rank)</em></p>
    </div>`,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    };
    try {
        await ChatMessage.create(chatData);
    }
    catch (error) {
        console.warn('Mastery System | Could not create Quick Load chat message:', error);
    }
    ui.notifications?.info(`${actor.name}: Quick Load — Reload (1) (${used + 1}/${mr}).`);
}
//# sourceMappingURL=token-action-selector.js.map