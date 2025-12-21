/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 *
 * Uses a PIXI-based radial menu for visual option selection
 */
import { openRadialMenuForActor, getAllCombatOptionsForActor, closeRadialMenu } from './token-radial-menu.js';
import { startMeleeTargeting } from './melee-targeting.js';
import { startUtilitySingleTargetMode, startUtilityRadiusMode } from './utility-targeting.js';
import { getRoundState, getAvailableAttackActions, getAvailableMovementActions, consumeAttackAction, consumeMovementAction } from './combat/action-economy.js';
// Global movement state
let activeMovementState = null;
/**
 * Initialize token action selector hooks
 */
export function initializeTokenActionSelector() {
    console.log('Mastery System | Initializing Token Action Selector');
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
        actionIcon.on('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await openMasteryActionRadialMenu(token);
        });
        // Append to right column
        rightCol.append(actionIcon);
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
            console.log('Mastery System | Cleared currentAction flag after movement');
        }
    });
    // Register hook listener for melee target selection
    Hooks.on("masterySystem.meleeTargetSelected", async (payload) => {
        try {
            const attackerToken = canvas.tokens?.get(payload.attackerTokenId);
            const targetToken = canvas.tokens?.get(payload.targetTokenId);
            if (!attackerToken || !targetToken) {
                console.warn("Mastery System | [TOKEN ACTION SELECTOR] Missing tokens in meleeTargetSelected hook", payload);
                return;
            }
            // Import and call createMeleeAttackCard
            const { createMeleeAttackCard } = await import("./combat/attack-executor.js");
            await createMeleeAttackCard(attackerToken, targetToken, payload.option);
        }
        catch (e) {
            console.error("Mastery System | [TOKEN ACTION SELECTOR] meleeTargetSelected hook failed", e);
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
/**
 * Get all hexes along a path between two hex coordinates (for hexagonal grids)
 * Uses line drawing algorithm for hex grids (offset coordinates)
 */
function getHexesAlongPath(startI, startJ, endI, endJ) {
    const hexes = [];
    // For offset coordinates (i, j), we can use a simple line drawing algorithm
    // Calculate distance in hex coordinates
    const di = endI - startI;
    const dj = endJ - startJ;
    // Calculate the number of steps needed
    const distance = Math.max(Math.abs(di), Math.abs(dj), Math.abs(di + dj));
    if (distance === 0) {
        return [{ i: startI, j: startJ }];
    }
    // Linear interpolation for each step
    for (let step = 0; step <= distance; step++) {
        const t = step / distance;
        const i = Math.round(startI + di * t);
        const j = Math.round(startJ + dj * t);
        hexes.push({ i, j });
    }
    // Remove duplicates
    const uniqueHexes = [];
    const seen = new Set();
    for (const hex of hexes) {
        const key = `${hex.i},${hex.j}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueHexes.push(hex);
        }
    }
    return uniqueHexes;
}
/**
 * Get default movement range for an option
 */
function getDefaultMovementRange(token, option) {
    // If option has explicit range, use it
    if (option.range !== undefined && option.range > 0) {
        return option.range;
    }
    // Fall back to actor's base movement/speed
    const actor = token.actor;
    if (actor?.system?.combat?.speed) {
        return actor.system.combat.speed;
    }
    // Default fallback
    return 6; // Default movement in meters
}
/**
 * Start guided movement mode for a token
 */
export function startGuidedMovement(token, option) {
    console.log('Mastery System | Starting guided movement mode', { token: token.name, option: option.name });
    // Cancel any existing movement mode first
    endGuidedMovement(false);
    // Ensure token is controlled by this user
    token.control({ releaseOthers: false });
    // Get hex center as origin (for hex grids, this is the center of the hex the token is in)
    const origin = getTokenHexCenter(token);
    const maxRange = getDefaultMovementRange(token, option);
    const originalAlpha = token.alpha;
    console.log('Mastery System | Guided movement start:', token.name, 'maxRange:', maxRange, 'option:', option);
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
    const highlightId = "mastery-move";
    // Create preview graphics
    const previewGraphics = new PIXI.Graphics();
    // Add to effects layer (similar to range preview)
    let effectsContainer = null;
    if (canvas.effects) {
        if (canvas.effects.container && typeof canvas.effects.container.addChild === 'function') {
            effectsContainer = canvas.effects.container;
        }
        else if (typeof canvas.effects.addChild === 'function') {
            effectsContainer = canvas.effects;
        }
    }
    if (!effectsContainer && canvas.foreground) {
        if (canvas.foreground.container && typeof canvas.foreground.container.addChild === 'function') {
            effectsContainer = canvas.foreground.container;
        }
        else if (typeof canvas.foreground.addChild === 'function') {
            effectsContainer = canvas.foreground;
        }
    }
    if (effectsContainer) {
        effectsContainer.addChild(previewGraphics);
    }
    // Create event handlers
    const onMove = (ev) => handleMovementPointerMove(ev);
    const onDown = (ev) => handleMovementPointerDown(ev);
    const onKeyDown = (ev) => {
        if (ev.key === 'Escape' && activeMovementState) {
            console.log('Mastery System | Guided movement cancelled via ESC');
            endGuidedMovement(false);
        }
    };
    const state = {
        token,
        option,
        origin,
        maxRange,
        originalAlpha,
        previewGraphics,
        ruler,
        highlightId,
        onMove,
        onDown,
        onKeyDown
    };
    activeMovementState = state;
    // Attach mouse listeners to canvas stage
    canvas.stage.on("pointermove", state.onMove);
    canvas.stage.on("pointerdown", state.onDown);
    // Attach keyboard listener for ESC
    window.addEventListener("keydown", state.onKeyDown);
    // Initial preview at origin (zero-length)
    refreshMovementPreview(state, origin.x, origin.y);
    console.log('Mastery System | Guided movement mode active', { maxRange, origin });
}
/**
 * Handle pointer move during movement mode
 */
function handleMovementPointerMove(ev, state) {
    const currentState = state || activeMovementState;
    if (!currentState || activeMovementState !== currentState)
        return;
    const worldPos = ev.data.getLocalPosition(canvas.app.stage);
    const snapped = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
    refreshMovementPreview(currentState, snapped.x, snapped.y);
}
/**
 * Refresh the movement preview path and highlights
 */
function refreshMovementPreview(state, destX, destY) {
    if (!canvas.grid || !state.previewGraphics)
        return;
    // Clear previous graphics
    state.previewGraphics.clear();
    // Measure path from origin to destination
    const origin = state.origin;
    const dest = { x: destX, y: destY };
    const isHexGrid = canvas.grid.type === CONST.GRID_TYPES.HEXAGONAL;
    let distanceInUnits = 0;
    let isValid = false;
    // For hex grids, calculate distance using path hexes (avoids wrong Euclidean distance)
    if (isHexGrid && canvas.grid?.getOffset) {
        try {
            const originOffsetRaw = canvas.grid.getOffset(origin.x, origin.y);
            const destOffsetRaw = canvas.grid.getOffset(dest.x, dest.y);
            if (originOffsetRaw && destOffsetRaw) {
                const originI = originOffsetRaw.i ?? originOffsetRaw.col ?? 0;
                const originJ = originOffsetRaw.j ?? originOffsetRaw.row ?? 0;
                const destI = destOffsetRaw.i ?? destOffsetRaw.col ?? 0;
                const destJ = destOffsetRaw.j ?? destOffsetRaw.row ?? 0;
                const pathHexes = getHexesAlongPath(originI, originJ, destI, destJ);
                const steps = Math.max(0, pathHexes.length - 1);
                distanceInUnits = steps;
                isValid = steps <= state.maxRange;
            }
        }
        catch (error) {
            console.warn('Mastery System | Error calculating hex path distance', error);
        }
    }
    // For non-hex grids or if hex calculation failed, use Ruler/fallback
    if (distanceInUnits === 0) {
        // Use Ruler if available
        if (state.ruler) {
            try {
                state.ruler.clear();
                state.ruler.waypoints = [
                    { x: origin.x, y: origin.y },
                    { x: dest.x, y: dest.y }
                ];
                // Measure the path - try v13 API
                if (typeof state.ruler.measure === 'function') {
                    const measurement = state.ruler.measure(state.ruler.waypoints);
                    distanceInUnits = measurement?.distance || 0;
                }
                else if (state.ruler.totalDistance !== undefined) {
                    distanceInUnits = state.ruler.totalDistance;
                }
            }
            catch (error) {
                console.warn('Mastery System | Ruler measure error', error);
            }
        }
        // Fallback: simple distance calculation if Ruler failed
        if (distanceInUnits === 0) {
            const dx = dest.x - origin.x;
            const dy = dest.y - origin.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            distanceInUnits = pixelDistance / (canvas.grid.size || 1);
        }
        isValid = distanceInUnits <= state.maxRange;
    }
    const lineColor = isValid ? 0x00ff00 : 0xff0000; // Green if valid, red if not
    const fillColor = isValid ? 0x00ff00 : 0xff0000;
    // Get highlight layer (use v13 API)
    let highlightLayer = null;
    try {
        if (canvas.interface?.grid?.highlightLayers && canvas.interface.grid.highlightLayers[state.highlightId]) {
            highlightLayer = canvas.interface.grid.highlightLayers[state.highlightId];
        }
        else if (canvas.interface?.grid && typeof canvas.interface.grid.addHighlightLayer === 'function') {
            highlightLayer = canvas.interface.grid.addHighlightLayer(state.highlightId);
        }
    }
    catch (error) {
        console.warn('Mastery System | Could not get highlight layer', error);
    }
    // Clear previous highlights
    if (highlightLayer) {
        if (typeof highlightLayer.clear === 'function') {
            highlightLayer.clear();
        }
        else if (highlightLayer.removeChildren && typeof highlightLayer.removeChildren === 'function') {
            highlightLayer.removeChildren();
        }
    }
    // Draw path line
    state.previewGraphics.lineStyle(3, lineColor, 0.8);
    state.previewGraphics.moveTo(origin.x, origin.y);
    state.previewGraphics.lineTo(dest.x, dest.y);
    // Draw origin marker (cyan circle)
    state.previewGraphics.lineStyle(2, 0x00ffff, 0.9);
    state.previewGraphics.beginFill(0x00ffff, 0.3);
    state.previewGraphics.drawCircle(origin.x, origin.y, canvas.grid.size * 0.3);
    state.previewGraphics.endFill();
    // Draw destination marker
    state.previewGraphics.lineStyle(2, lineColor, 0.9);
    state.previewGraphics.beginFill(fillColor, 0.3);
    state.previewGraphics.drawCircle(dest.x, dest.y, canvas.grid.size * 0.3);
    state.previewGraphics.endFill();
    // Use Foundry grid APIs for hex highlighting (same approach as hex-highlighting.ts)
    const gridUI = canvas.interface?.grid;
    if (isHexGrid && gridUI && canvas.grid?.getOffset && canvas.grid?.getTopLeftPoint) {
        try {
            // Get hex coordinates using grid.getOffset (returns {i,j} in v13)
            const originOffsetRaw = canvas.grid.getOffset(origin.x, origin.y);
            const destOffsetRaw = canvas.grid.getOffset(dest.x, dest.y);
            if (originOffsetRaw && destOffsetRaw) {
                // Extract i,j coordinates (v13 hex grids return {i,j}, fallback to {col,row} mapping)
                const originI = originOffsetRaw.i ?? originOffsetRaw.col ?? 0;
                const originJ = originOffsetRaw.j ?? originOffsetRaw.row ?? 0;
                const destI = destOffsetRaw.i ?? destOffsetRaw.col ?? 0;
                const destJ = destOffsetRaw.j ?? destOffsetRaw.row ?? 0;
                // Get all hexes along the path
                const pathHexes = getHexesAlongPath(originI, originJ, destI, destJ);
                // Set up highlight layer (same reliable approach as hex-highlighting.ts)
                gridUI.addHighlightLayer?.(state.highlightId);
                gridUI.clearHighlightLayer?.(state.highlightId);
                // Highlight origin hex in cyan
                const originTl = canvas.grid.getTopLeftPoint({ i: originI, j: originJ });
                if (originTl && originTl.x !== undefined && originTl.y !== undefined) {
                    gridUI.highlightPosition?.(state.highlightId, {
                        x: originTl.x,
                        y: originTl.y,
                        color: 0x00ffff, // Cyan for origin
                        alpha: 0.5
                    });
                }
                // Highlight path hexes (green if valid, red if beyond range)
                const pathColor = isValid ? 0x00ff00 : 0xff0000;
                for (const hex of pathHexes) {
                    const tl = canvas.grid.getTopLeftPoint({ i: hex.i, j: hex.j });
                    if (tl && tl.x !== undefined && tl.y !== undefined) {
                        gridUI.highlightPosition?.(state.highlightId, {
                            x: tl.x,
                            y: tl.y,
                            color: pathColor,
                            alpha: 0.5
                        });
                    }
                }
            }
        }
        catch (error) {
            console.warn('Mastery System | Error highlighting hex path', error);
        }
    }
    else if (gridUI && canvas.grid?.getOffset && canvas.grid?.getTopLeftPoint) {
        // For non-hex grids, highlight origin and destination
        try {
            gridUI.addHighlightLayer?.(state.highlightId);
            gridUI.clearHighlightLayer?.(state.highlightId);
            const originOffsetRaw = canvas.grid.getOffset(origin.x, origin.y);
            const destOffsetRaw = canvas.grid.getOffset(dest.x, dest.y);
            if (originOffsetRaw) {
                const originI = originOffsetRaw.i ?? originOffsetRaw.col ?? 0;
                const originJ = originOffsetRaw.j ?? originOffsetRaw.row ?? 0;
                const originTl = canvas.grid.getTopLeftPoint({ i: originI, j: originJ });
                if (originTl && originTl.x !== undefined && originTl.y !== undefined) {
                    gridUI.highlightPosition?.(state.highlightId, {
                        x: originTl.x,
                        y: originTl.y,
                        color: 0x00ffff, // Cyan for origin
                        alpha: 0.5
                    });
                }
            }
            if (destOffsetRaw) {
                const destI = destOffsetRaw.i ?? destOffsetRaw.col ?? 0;
                const destJ = destOffsetRaw.j ?? destOffsetRaw.row ?? 0;
                const destTl = canvas.grid.getTopLeftPoint({ i: destI, j: destJ });
                if (destTl && destTl.x !== undefined && destTl.y !== undefined) {
                    gridUI.highlightPosition?.(state.highlightId, {
                        x: destTl.x,
                        y: destTl.y,
                        color: isValid ? 0x00ff00 : 0xff0000,
                        alpha: 0.5
                    });
                }
            }
        }
        catch (error) {
            console.warn('Mastery System | Error highlighting non-hex path', error);
        }
    }
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
        console.log('Mastery System | Guided movement cancelled via mouse button', ev.button);
        endGuidedMovement(false);
        return;
    }
    // Left click -> attempt move
    if (ev.button === 0) {
        const worldPos = ev.data.getLocalPosition(canvas.app.stage);
        const snapped = canvas.grid.getSnappedPosition(worldPos.x, worldPos.y, 1);
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
    const dest = { x: destX, y: destY };
    // Re-measure the path (same logic as in refreshMovementPreview)
    const isHexGrid = canvas.grid.type === CONST.GRID_TYPES.HEXAGONAL;
    let distanceInUnits = 0;
    // For hex grids, calculate distance using path hexes (avoids wrong Euclidean distance)
    if (isHexGrid && canvas.grid?.getOffset) {
        try {
            const originOffsetRaw = canvas.grid.getOffset(origin.x, origin.y);
            const destOffsetRaw = canvas.grid.getOffset(dest.x, dest.y);
            if (originOffsetRaw && destOffsetRaw) {
                const originI = originOffsetRaw.i ?? originOffsetRaw.col ?? 0;
                const originJ = originOffsetRaw.j ?? originOffsetRaw.row ?? 0;
                const destI = destOffsetRaw.i ?? destOffsetRaw.col ?? 0;
                const destJ = destOffsetRaw.j ?? destOffsetRaw.row ?? 0;
                const pathHexes = getHexesAlongPath(originI, originJ, destI, destJ);
                const steps = Math.max(0, pathHexes.length - 1);
                distanceInUnits = steps;
            }
        }
        catch (error) {
            console.warn('Mastery System | Error calculating hex path distance in commit', error);
        }
    }
    // For non-hex grids or if hex calculation failed, use Ruler/fallback
    if (distanceInUnits === 0) {
        if (state.ruler) {
            try {
                state.ruler.clear();
                state.ruler.waypoints = [
                    { x: origin.x, y: origin.y },
                    { x: dest.x, y: dest.y }
                ];
                // Measure the path - try v13 API
                if (typeof state.ruler.measure === 'function') {
                    const measurement = state.ruler.measure(state.ruler.waypoints);
                    distanceInUnits = measurement?.distance || 0;
                }
                else if (state.ruler.totalDistance !== undefined) {
                    distanceInUnits = state.ruler.totalDistance;
                }
            }
            catch (error) {
                console.warn('Mastery System | Ruler measure error', error);
            }
        }
        // Fallback calculation
        if (distanceInUnits === 0) {
            const dx = dest.x - origin.x;
            const dy = dest.y - origin.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            distanceInUnits = pixelDistance / (canvas.grid.size || 1);
        }
    }
    // Check if destination is within range
    if (distanceInUnits > state.maxRange) {
        ui.notifications.warn('Target is out of movement range.');
        // Do not move the token; keep movement mode active
        return;
    }
    // Move the token using Foundry's movement animation
    const token = state.token;
    try {
        // Use v13 API: token.document.update with animate option
        await token.document.update({ x: dest.x, y: dest.y }, { animate: true });
        console.log('Mastery System | Movement completed', {
            option: state.option.name,
            distance: distanceInUnits.toFixed(1),
            maxRange: state.maxRange
        });
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
    console.log('Mastery System | Guided movement end. success =', success);
    // Remove event listeners
    canvas.stage.off("pointermove", state.onMove);
    canvas.stage.off("pointerdown", state.onDown);
    window.removeEventListener("keydown", state.onKeyDown);
    // Clear highlights using gridUI API (same reliable approach as hex-highlighting.ts)
    try {
        canvas.interface?.grid?.clearHighlightLayer?.(state.highlightId);
    }
    catch (error) {
        console.warn('Mastery System | Could not clear highlight layer', error);
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
    // Clear state
    activeMovementState = null;
    if (!success) {
        ui.notifications.info('Movement cancelled');
    }
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
    console.log('Mastery System | Chosen combat option:', { token: token.name, option });
    console.log('Mastery System | Option details:', {
        slot: option.slot,
        segment: option.segment,
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
    // Check and consume attack action if needed
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
        console.log('Mastery System | [ACTION ECONOMY] Consumed attack action. Remaining:', getAvailableAttackActions(actor, combat));
    }
    // Check if this is a movement option - check both segment and slot
    const isMovement = option.slot === 'movement' || option.segment === 'movement';
    console.log('Mastery System | Is movement option?', isMovement, { slot: option.slot, segment: option.segment });
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
            }
            else {
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
    const isMeleeAttack = option.slot === 'attack' &&
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
        console.log('Mastery System | [ATTACK SELECTION] Starting melee targeting', {
            tokenName: token.name,
            optionId: option.id,
            optionName: option.name,
            range: option.range
        });
        // Close radial menu when attack option is selected
        closeRadialMenu();
        // WENN target schon gewählt wurde (kommt vom Hook) -> execute sofort
        const targetToken = option.targetToken;
        if (targetToken) {
            // hier NICHT importen. Du brauchst dafür eine “executeMeleeAttack” Funktion
            // die NICHT in melee-targeting.ts liegt, sonst wieder Kreis.
            // -> ich bau dir dafür gleich eine kleine attack-executor.ts (v13-only).
            Hooks.call('masterySystem.executeMeleeAttack', { attackerTokenId: token.id, targetTokenId: targetToken.id, option });
            return;
        }
        // sonst: targeting starten
        startMeleeTargeting(token, option);
        return;
    }
    // Check if this is a utility option
    const isUtility = option.slot === 'utility';
    console.log('Mastery System | Is utility option?', isUtility, { slot: option.slot, aoeShape: option.aoeShape });
    if (isUtility) {
        if (option.aoeShape === 'none') {
            console.log('Mastery System | Starting single-target utility mode for', token.name, option);
            startUtilitySingleTargetMode(token, option);
            return;
        }
        else if (option.aoeShape === 'radius') {
            console.log('Mastery System | Starting radius utility mode for', token.name, option);
            startUtilityRadiusMode(token, option);
            return;
        }
        else if (option.aoeShape === 'cone') {
            // TODO: Implement cone targeting later
            ui.notifications?.warn('Cone targeting not yet implemented');
            return;
        }
    }
    if (option.source === 'power' && option.item) {
        // Handle power selection
        // TODO: Integrate with existing power usage logic
        // Example: option.item.roll() or trigger power activation
        console.log('Mastery System | Power selected:', option.name, option.item);
        ui.notifications.info(`Action selected: ${option.name} (${option.slot})`);
        // You can add logic here to:
        // - Show power details
        // - Trigger a roll
        // - Create a chat card
        // - Activate the power
    }
    else if (option.source === 'maneuver' && option.maneuver) {
        // Handle maneuver selection
        // TODO: Integrate with existing maneuver execution logic
        console.log('Mastery System | Maneuver selected:', option.name, option.maneuver);
        ui.notifications.info(`Action selected: ${option.name} (${option.slot})`);
        // You can add logic here to:
        // - Execute the maneuver
        // - Create a chat message
        // - Set flags for movement modifications
        // - Trigger rolls if needed
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
        if (consumed) {
            console.log('Mastery System | [ACTION ECONOMY] Consumed attack action for Stand Up. Remaining:', (await import('./combat/action-economy.js')).getAvailableAttackActions(token.actor, combat));
        }
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
    console.log('Mastery System | Stand Up executed for', token.actor.name);
}
//# sourceMappingURL=token-action-selector.js.map