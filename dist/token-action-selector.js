/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category
 * Enforces movement restrictions based on selected action
 *
 * Uses a PIXI-based radial menu for visual option selection
 */
import { openRadialMenuForActor, getAllCombatOptionsForActor, closeRadialMenu } from './token-radial-menu.js';
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
    const allOptions = getAllCombatOptionsForActor(actor);
    if (!allOptions.length) {
        ui.notifications.warn('No combat options available for this actor.');
        return;
    }
    // Open the radial menu
    openRadialMenuForActor(token, allOptions);
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