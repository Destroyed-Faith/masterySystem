/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category and kind
 * Enforces movement restrictions based on selected action
 */

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
    const hasAction = currentAction.category && currentAction.kind;

    // Create the action selector icon
    const actionIcon = $(`
      <div class="control-icon ms-action-selector" 
           title="${hasAction ? `Current: ${currentAction.category} (${currentAction.kind})` : 'Select Action'}"
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
      await openActionSelectorDialog(token);
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

    const action = tokenDoc.getFlag('mastery-system', 'currentAction') || {};

    // If nothing is selected, block movement
    if (!action.category || !action.kind) {
      ui.notifications.warn('Bitte zuerst im Token-HUD eine Movement-Aktion (Power oder Maneuver) wählen.');
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
}

/**
 * Open the action selector dialog
 * @param token - The token to set the action for
 */
async function openActionSelectorDialog(token: any) {
  const currentAction = token.document.getFlag('mastery-system', 'currentAction') || {};

  // Create dialog content
  const content = `
    <form>
      <div class="form-group">
        <label>Action Category:</label>
        <select name="category" style="width: 100%;">
          <option value="">-- Select Category --</option>
          <option value="attack" ${currentAction.category === 'attack' ? 'selected' : ''}>Attack</option>
          <option value="movement" ${currentAction.category === 'movement' ? 'selected' : ''}>Movement</option>
          <option value="utility" ${currentAction.category === 'utility' ? 'selected' : ''}>Utility</option>
          <option value="reaction" ${currentAction.category === 'reaction' ? 'selected' : ''}>Reaction</option>
        </select>
      </div>
      <div class="form-group">
        <label>Action Kind:</label>
        <select name="kind" style="width: 100%;">
          <option value="">-- Select Kind --</option>
          <option value="maneuver" ${currentAction.kind === 'maneuver' ? 'selected' : ''}>Maneuver</option>
          <option value="power" ${currentAction.kind === 'power' ? 'selected' : ''}>Power</option>
        </select>
      </div>
    </form>
  `;

  // Create and show dialog
  new Dialog({
    title: 'Select Action',
    content: content,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: 'OK',
        callback: async (html: JQuery) => {
          const category = html.find('[name="category"]').val() as string;
          const kind = html.find('[name="kind"]').val() as string;

          // Validate selection
          if (!category || !kind) {
            ui.notifications.warn('Please select both category and kind.');
            return;
          }

          // Validate category
          const validCategories = ['attack', 'movement', 'utility', 'reaction'];
          if (!validCategories.includes(category)) {
            ui.notifications.warn('Invalid category selected.');
            return;
          }

          // Validate kind
          const validKinds = ['maneuver', 'power'];
          if (!validKinds.includes(kind)) {
            ui.notifications.warn('Invalid kind selected.');
            return;
          }

          // Set the flag
          try {
            await token.document.setFlag('mastery-system', 'currentAction', {
              category: category,
              kind: kind
            });

            ui.notifications.info(`Action set: ${category} (${kind})`);
            console.log('Mastery System | Set currentAction flag:', { category, kind, tokenId: token.id });
          } catch (error) {
            console.error('Mastery System | Error setting currentAction flag:', error);
            ui.notifications.error('Failed to set action. Please try again.');
          }
        }
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: 'Cancel',
        callback: () => {}
      }
    },
    default: 'ok',
    close: () => {}
  }).render(true);
}

