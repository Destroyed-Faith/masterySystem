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
    const origin = { x: token.x, y: token.y };
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
    let distanceInUnits = 0;
    let segments = [];
    // Use Ruler if available
    if (state.ruler) {
        try {
            state.ruler.clear();
            state.ruler.waypoints = [
                { x: origin.x, y: origin.y },
                { x: dest.x, y: dest.y }
            ];
            // Measure the path - try v13 API
            const measurement = state.ruler.measure(state.ruler.waypoints);
            distanceInUnits = measurement?.distance || 0;
            segments = measurement?.segments || [];
        }
        catch (error) {
            console.warn('Mastery System | Ruler measure error', error);
            // Fallback calculation below
        }
    }
    // Fallback: simple distance calculation if Ruler failed
    if (distanceInUnits === 0) {
        const dx = dest.x - origin.x;
        const dy = dest.y - origin.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        distanceInUnits = pixelDistance / (canvas.grid.size || 1);
    }
    // Determine if destination is valid (within range)
    const isValid = distanceInUnits <= state.maxRange;
    const lineColor = isValid ? 0x00ff00 : 0xff0000; // Green if valid, red if not
    const fillColor = isValid ? 0x00ff00 : 0xff0000;
    // Get highlight layer
    let highlight = null;
    try {
        if (canvas.grid.highlight) {
            highlight = canvas.grid.highlight;
        }
        else if (canvas.grid.getHighlightLayer) {
            highlight = canvas.grid.getHighlightLayer(state.highlightId);
            if (!highlight && canvas.grid.addHighlightLayer) {
                highlight = canvas.grid.addHighlightLayer(state.highlightId);
            }
        }
    }
    catch (error) {
        console.warn('Mastery System | Could not get highlight layer', error);
    }
    // Clear previous highlights
    if (highlight && highlight.clear) {
        highlight.clear();
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
    // Highlight grid positions along the path
    if (highlight && segments.length > 0) {
        for (const segment of segments) {
            if (segment.positions && Array.isArray(segment.positions)) {
                for (const pos of segment.positions) {
                    const gridPos = canvas.grid.getGridPositionFromPixels(pos.x, pos.y);
                    if (gridPos) {
                        if (highlight.highlightPosition) {
                            highlight.highlightPosition(gridPos.x, gridPos.y, { color: fillColor, alpha: 0.3 });
                        }
                        else if (highlight.highlightGridPosition) {
                            highlight.highlightGridPosition(gridPos.x, gridPos.y, { color: fillColor, alpha: 0.3 });
                        }
                    }
                }
            }
        }
    }
    // Also highlight origin and destination
    const originGrid = canvas.grid.getGridPositionFromPixels(origin.x, origin.y);
    const destGrid = canvas.grid.getGridPositionFromPixels(dest.x, dest.y);
    if (highlight && originGrid) {
        if (highlight.highlightPosition) {
            highlight.highlightPosition(originGrid.x, originGrid.y, { color: 0x00ffff, alpha: 0.5 });
        }
        else if (highlight.highlightGridPosition) {
            highlight.highlightGridPosition(originGrid.x, originGrid.y, { color: 0x00ffff, alpha: 0.5 });
        }
    }
    if (highlight && destGrid) {
        if (highlight.highlightPosition) {
            highlight.highlightPosition(destGrid.x, destGrid.y, { color: fillColor, alpha: 0.5 });
        }
        else if (highlight.highlightGridPosition) {
            highlight.highlightGridPosition(destGrid.x, destGrid.y, { color: fillColor, alpha: 0.5 });
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
    // Re-measure the path (same as in refreshMovementPreview)
    let distanceInUnits = 0;
    if (state.ruler) {
        try {
            state.ruler.clear();
            state.ruler.waypoints = [
                { x: origin.x, y: origin.y },
                { x: dest.x, y: dest.y }
            ];
            const measurement = state.ruler.measure(state.ruler.waypoints);
            distanceInUnits = measurement?.distance || 0;
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
    // Clear highlights
    let highlight = null;
    try {
        if (canvas.grid?.highlight) {
            highlight = canvas.grid.highlight;
        }
        else if (canvas.grid && canvas.grid.getHighlightLayer) {
            highlight = canvas.grid.getHighlightLayer(state.highlightId);
        }
    }
    catch (error) {
        // Ignore
    }
    if (highlight && highlight.clear) {
        highlight.clear();
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
/**
 * Handle the chosen combat option
 * Can trigger rolls, chat cards, or other mechanics based on the selection
 * Made available globally so the radial menu can call it
 * @param token - The token that selected the option
 * @param option - The chosen option (power or maneuver)
 */
export function handleChosenCombatOption(token, option) {
    console.log('Mastery System | Chosen combat option:', { token: token.name, option });
    console.log('Mastery System | Option details:', {
        slot: option.slot,
        segment: option.segment,
        source: option.source,
        name: option.name,
        rangeCategory: option.rangeCategory
    });
    // Check if this is a movement option - check both segment and slot
    const isMovement = option.slot === 'movement' || option.segment === 'movement';
    console.log('Mastery System | Is movement option?', isMovement, { slot: option.slot, segment: option.segment });
    if (isMovement) {
        console.log('Mastery System | Starting guided movement for', token.name, option);
        startGuidedMovement(token, option);
        return;
    }
    // Check if this is a melee attack option
    const isMeleeAttack = option.slot === 'attack' && option.rangeCategory === 'melee';
    console.log('Mastery System | Is melee attack option?', isMeleeAttack, { slot: option.slot, rangeCategory: option.rangeCategory });
    if (isMeleeAttack) {
        console.log('Mastery System | Starting melee targeting for', token.name, option);
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
//# sourceMappingURL=token-action-selector.js.map