/**
 * Token Action Selector for Mastery System
 * Adds a custom icon to Token HUD for selecting action category and kind
 * Enforces movement restrictions based on selected action
 * 
 * Two-step flow:
 * 1. Select category (attack/movement/utility/reaction) and kind (maneuver/power)
 * 2. Select concrete option from available powers or maneuvers
 */

import { getAvailableManeuvers, CombatManeuver } from './system/combat-maneuvers';
import type { CombatSlot } from './system/combat-maneuvers';

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
      await openMasteryActionDialog(token);
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
 * Step 1: Open the master action selection dialog
 * User selects category (attack/movement/utility/reaction) and kind (maneuver/power)
 * @param token - The token to set the action for
 */
async function openMasteryActionDialog(token: any) {
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
            ui.notifications.warn('Bitte Kategorie und Kind wählen.');
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

          // 1) Store selection on token flag
          try {
            await token.document.setFlag('mastery-system', 'currentAction', {
              category: category,
              kind: kind
            });

            // 2) Immediately open the second dialog with concrete options
            openCombatOptionDialog(token, { category: category as CombatSlot, kind });
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

/**
 * Map power type to high-level combat slot/category
 * @param powerType - The power type from item.system.powerType
 * @returns The combat slot category
 */
function mapPowerTypeToSlot(powerType: string): CombatSlot {
  switch (powerType) {
    case 'movement':
      return 'movement';
    case 'reaction':
      return 'reaction';
    case 'utility':
      return 'utility';
    // Typical offensive/active powers consume the Action slot -> "attack"
    case 'active':
    case 'active-buff':
    case 'buff': // Buffs that require actions are typically attack slot
    default:
      return 'attack';
  }
}

/**
 * Get all combat options (powers and maneuvers) available to an actor
 * matching the selected category and kind
 * @param actor - The actor to get options for
 * @param selection - The category and kind selection
 * @returns Array of available options
 */
function getCombatOptionsForActor(actor: any, selection: { category: CombatSlot; kind: string }): Array<{
  id: string;
  name: string;
  description: string;
  source: 'power' | 'maneuver';
  item?: any;
  maneuver?: CombatManeuver;
}> {
  const options: Array<{
    id: string;
    name: string;
    description: string;
    source: 'power' | 'maneuver';
    item?: any;
    maneuver?: CombatManeuver;
  }> = [];

  // --- POWERS (from Actor items) ---
  if (selection.kind === 'power') {
    const items = actor.items || [];
    
    for (const item of items) {
      // Powers are stored as items with type "special"
      if (item.type !== 'special') continue;

      const powerType = (item.system as any)?.powerType;
      if (!powerType) continue;

      // Map power type to high-level slot/category
      const slot = mapPowerTypeToSlot(powerType);

      // Only include powers matching the chosen category
      if (slot !== selection.category) continue;

      options.push({
        id: item.id,
        name: item.name,
        description: (item.system as any)?.description || '',
        source: 'power',
        item: item
      });
    }
  }

  // --- MANEUVERS (generic combat maneuvers) ---
  if (selection.kind === 'maneuver') {
    // Get available maneuvers for this actor (filters by requirements)
    const availableManeuvers = getAvailableManeuvers(actor);
    
    for (const maneuver of availableManeuvers) {
      // Only include maneuvers matching the chosen category/slot
      if (maneuver.slot !== selection.category) continue;

      options.push({
        id: maneuver.id,
        name: maneuver.name,
        description: maneuver.description || (maneuver.effect || ''),
        source: 'maneuver',
        maneuver: maneuver
      });
    }
  }

  return options;
}

/**
 * Step 2: Open the combat option selection dialog
 * Lists all available powers or maneuvers matching the category and kind
 * @param token - The token to set the action for
 * @param selection - The category and kind from step 1
 */
function openCombatOptionDialog(token: any, selection: { category: CombatSlot; kind: string }) {
  const actor = token.actor;
  if (!actor) {
    ui.notifications.error('Kein Actor für dieses Token gefunden.');
    return;
  }

  const options = getCombatOptionsForActor(actor, selection);

  if (!options.length) {
    const kindLabel = selection.kind === 'power' ? 'Powers' : 'Manöver';
    ui.notifications.warn(`Keine verfügbaren ${kindLabel} für Kategorie "${selection.category}" gefunden.`);
    return;
  }

  // Build radio-list HTML
  const listHtml = options.map((opt, i) => {
    const label = `${opt.name} [${opt.source}]`;
    const description = opt.description ? `<div class="notes" style="margin-left: 20px; font-size: 0.9em; color: #999;">${opt.description}</div>` : '';
    
    return `
      <div class="form-group">
        <label>
          <input type="radio" name="chosenOption" value="${i}" ${i === 0 ? 'checked' : ''}>
          ${label}
        </label>
        ${description}
      </div>
    `;
  }).join('');

  new Dialog({
    title: `Choose ${selection.category} ${selection.kind}`,
    content: `<form>${listHtml}</form>`,
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Use',
        callback: async (html: JQuery) => {
          const indexStr = html.find('input[name="chosenOption"]:checked').val();
          if (indexStr === undefined) {
            ui.notifications.warn('Keine Option gewählt.');
            return;
          }

          const index = parseInt(indexStr as string, 10);
          const chosen = options[index];
          
          if (!chosen) {
            ui.notifications.warn('Keine Option gewählt.');
            return;
          }

          // Store concrete choice on token
          try {
            await token.document.setFlag('mastery-system', 'currentAction', {
              category: selection.category,
              kind: selection.kind,
              optionId: chosen.id,
              optionSource: chosen.source  // "power" | "maneuver"
            });

            ui.notifications.info(`Action selected: ${chosen.name} (${selection.category} ${selection.kind})`);
            console.log('Mastery System | Set concrete action:', {
              category: selection.category,
              kind: selection.kind,
              optionId: chosen.id,
              optionSource: chosen.source,
              tokenId: token.id
            });

            // Optionally immediately trigger something (roll, chat card, etc.)
            handleChosenCombatOption(token, chosen);
          } catch (error) {
            console.error('Mastery System | Error setting concrete action:', error);
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

/**
 * Handle the chosen combat option
 * Can trigger rolls, chat cards, or other mechanics based on the selection
 * @param token - The token that selected the option
 * @param option - The chosen option (power or maneuver)
 */
function handleChosenCombatOption(token: any, option: { id: string; name: string; source: 'power' | 'maneuver'; item?: any; maneuver?: CombatManeuver }) {
  console.log('Mastery System | Chosen combat option:', { token: token.name, option });

  if (option.source === 'power' && option.item) {
    // Handle power selection
    // TODO: Integrate with existing power usage logic
    // Example: option.item.roll() or trigger power activation
    console.log('Mastery System | Power selected:', option.name, option.item);
    
    // You can add logic here to:
    // - Show power details
    // - Trigger a roll
    // - Create a chat card
    // - Activate the power
    
  } else if (option.source === 'maneuver' && option.maneuver) {
    // Handle maneuver selection
    // TODO: Integrate with existing maneuver execution logic
    console.log('Mastery System | Maneuver selected:', option.name, option.maneuver);
    
    // You can add logic here to:
    // - Execute the maneuver
    // - Create a chat message
    // - Set flags for movement modifications
    // - Trigger rolls if needed
  }
}
