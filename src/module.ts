/**
 * Mastery System / Destroyed Faith
 * Main module entry point for Foundry VTT v13
 */

// Immediate log to verify module is loading
console.log('Mastery System | Module file loaded');

import { MasteryActor } from './documents/actor.js';
import { MasteryItem } from './documents/item.js';
import { MasteryCharacterSheet } from './sheets/character-sheet.js';
import { MasteryNpcSheet } from './sheets/npc-sheet.js';
import { MasteryItemSheet } from './sheets/item-sheet.js';
// Combat hooks are imported dynamically to avoid build errors if dist/combat doesn't exist yet
// import { initializeCombatHooks } from '../dist/combat/initiative.js';
import { calculateStones } from './utils/calculations.js';
import { initializeTokenActionSelector } from './token-action-selector';
import { initializeTurnIndicator } from './turn-indicator';

// Dice roller functions are imported in sheets where needed

console.log('Mastery System | All imports completed');

// Register Handlebars helpers immediately (before init hook)
// This ensures they are available when templates are first rendered
registerHandlebarsHelpersImmediate();

/**
 * Initialize the Mastery System
 * This hook is called once when Foundry first starts up
 */
Hooks.once('init', async function() {
  console.log('Mastery System | Initializing Mastery System / Destroyed Faith');

  // Shim deprecated globals to the namespaced versions to suppress warnings (Foundry v13+)
  if (!(globalThis as any).FilePicker && (foundry as any)?.applications?.apps?.FilePicker?.implementation) {
    (globalThis as any).FilePicker = (foundry as any).applications.apps.FilePicker.implementation;
  }

  // Shim Application to V2 if available to silence V1 deprecation (non-breaking)
  if ((foundry as any)?.applications?.api?.ApplicationV2 && !(globalThis as any)._masteryAppPatched) {
    (globalThis as any).Application = (foundry as any).applications.api.ApplicationV2;
    (globalThis as any)._masteryAppPatched = true;
  }

  
  // Register custom Document classes
  CONFIG.Actor.documentClass = MasteryActor;
  CONFIG.Item.documentClass = MasteryItem;
  
  // Register custom sheet application classes
  // Register Character sheet first
  foundry.documents.collections.Actors.registerSheet('mastery-system', MasteryCharacterSheet, {
    types: ['character'],
    makeDefault: true,
    label: 'Mastery Character Sheet'
  });
  console.log('Mastery System | Registered Character Sheet');
  
  // Register NPC sheet
  foundry.documents.collections.Actors.registerSheet('mastery-system', MasteryNpcSheet, {
    types: ['npc'],
    makeDefault: true,
    label: 'Mastery NPC Sheet'
  });
  console.log('Mastery System | Registered NPC Sheet');
  
  // Register Item sheet
  foundry.documents.collections.Items.registerSheet('mastery-system', MasteryItemSheet, {
    makeDefault: true,
    label: 'Mastery Item Sheet'
  });
  console.log('Mastery System | Registered Item Sheet');
  
  // Register system settings
  registerSystemSettings();
  
  // Setup XP Management inline in settings
  setupXpManagementInline();
  
  // Handlebars helpers are already registered in registerHandlebarsHelpersImmediate()
  // No need to register again here

  // Register CONFIG constants
  registerConfigConstants();

  // Initialize combat hooks (dynamically imported to avoid build errors)
  // Note: Combat hooks are optional - if the file doesn't exist, we continue without them
  // The file may not exist, so we use a try-catch to handle this gracefully
  try {
    // Use a path that will resolve correctly at runtime from dist/module.js
    // Since this is a dynamic import, we need to construct the path correctly
    const combatPath = 'systems/mastery-system/dist/combat/initiative.js';
    const combatModule = await import(combatPath as any);
    if (combatModule.initializeCombatHooks) {
      combatModule.initializeCombatHooks();
    }
  } catch (error) {
    // Combat hooks are optional - this is expected if the file doesn't exist
    // Silently ignore - combat functionality will work without these hooks
  }

  // Initialize token action selector
  initializeTokenActionSelector();
  
  // Initialize turn indicator (blue ring around active combatant)
  initializeTurnIndicator();

  // Preload Handlebars templates
  await preloadTemplates();

  console.log('Mastery System | System initialized');
});

/**
 * Register Handlebars helpers immediately (before init)
 * This ensures helpers are available when templates are first rendered
 */
function registerHandlebarsHelpersImmediate() {
  // Default/fallback helper: {{default value fallback}}
  Handlebars.registerHelper('default', function (value: any, fallback: any) {
    return value !== undefined && value !== null ? value : fallback;
  });

  // Calculate stones from an attribute value: {{calculateStones value}}
  Handlebars.registerHelper('calculateStones', function (value: any) {
    const num = Number(value) || 0;
    return calculateStones(num);
  });

  // Repeat block n times: {{#times n}}...{{/times}}
  Handlebars.registerHelper('times', function (count: any, block: any) {
    const n = Number(count) || 0;
    let accum = '';
    for (let i = 0; i < n; i++) {
      accum += block.fn(i);
    }
    return accum;
  });

  // Simple arithmetic helpers
  Handlebars.registerHelper('add', function (a: any, b: any) {
    return (Number(a) || 0) + (Number(b) || 0);
  });

  Handlebars.registerHelper('subtract', function (a: any, b: any) {
    return (Number(a) || 0) - (Number(b) || 0);
  });

  // Helper to create arrays
  Handlebars.registerHelper('array', function(...args: any[]) {
    args.pop(); // Remove Handlebars options object
    return args;
  });

  // Helper for greater than comparison
  Handlebars.registerHelper('gt', function(a: number, b: number) {
    return (Number(a) || 0) > (Number(b) || 0);
  });

  // Helper for greater than or equal comparison
  Handlebars.registerHelper('gte', function(a: number, b: number) {
    return (Number(a) || 0) >= (Number(b) || 0);
  });

  // Helper for less than or equal comparison
  Handlebars.registerHelper('lte', function(a: number, b: number) {
    return (Number(a) || 0) <= (Number(b) || 0);
  });

  // Helper for incrementing (for 1-based indexing)
  Handlebars.registerHelper('inc', function(value: number) {
    return parseInt(String(value)) + 1;
  });

  // Helper for multiplication
  Handlebars.registerHelper('multiply', function(a: number, b: number) {
    return a * b;
  });

  // Helper to check if user is GM
  Handlebars.registerHelper('userIsGM', function() {
    return (game as any).user?.isGM ?? false;
  });

  // Helper for equality comparison
  Handlebars.registerHelper('eq', function(a: any, b: any) {
    return a === b;
  });

  // Helper for not equal comparison
  Handlebars.registerHelper('ne', function(a: any, b: any) {
    return a !== b;
  });

  // Helper to check if value is an array
  Handlebars.registerHelper('isArray', function(value: any) {
    return Array.isArray(value);
  });

  // Helper to capitalize first letter
  Handlebars.registerHelper('capitalize', function(str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Helper to reduce array (sum)
  Handlebars.registerHelper('reduce', function(array: any[], initial: number, property: string) {
    if (!Array.isArray(array)) return initial;
    return array.reduce((sum, item) => sum + (item[property] || 0), initial);
  });

  // Helper to lookup value in object
  Handlebars.registerHelper('lookup', function(obj: any, key: string) {
    return obj && obj[key];
  });

  // Helper to check if array contains value
  Handlebars.registerHelper('contains', function(array: any[], value: any) {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  });

  // Helper to get type of value
  Handlebars.registerHelper('typeof', function(value: any) {
    return typeof value;
  });

  // Helper to determine power category (Melee/Melee AoE/Range/Range AoE)
  Handlebars.registerHelper('powerCategory', function(range: string, aoe: string) {
    const rangeStr = (range || '').toString().trim().toLowerCase();
    const aoeStr = (aoe || '').toString().trim();
    
    // Check if it's ranged (has range value and not melee)
    const hasRange = rangeStr !== '' && rangeStr !== '0m' && rangeStr !== '0' && !rangeStr.includes('melee') && !rangeStr.includes('touch');
    // Check if it has AoE
    const hasAoe = aoeStr !== '' && aoeStr !== '—' && aoeStr !== '-' && aoeStr !== 'none';
    
    if (hasRange && hasAoe) return 'Range AoE';
    if (hasRange) return 'Range';
    if (hasAoe) return 'Melee AoE';
    return 'Melee';
  });

  // Helper to format power type display
  Handlebars.registerHelper('powerTypeDisplay', function(powerType: string) {
    if (!powerType) return 'Active';
    const typeMap: Record<string, string> = {
      'active': 'Active',
      'buff': 'Active Buff',
      'utility': 'Active',
      'passive': 'Passive',
      'reaction': 'Reaction',
      'movement': 'Movement'
    };
    return typeMap[powerType.toLowerCase()] || 'Active';
  });

  // Helper to format damage display
  Handlebars.registerHelper('powerDamage', function(damage: string) {
    if (!damage || damage.trim() === '') return '—';
    return damage;
  });

  // Helper to format specials display
  Handlebars.registerHelper('powerSpecials', function(specials: string[]) {
    if (!specials || !Array.isArray(specials) || specials.length === 0) return '—';
    return specials.join(', ');
  });
}

/**
 * Register system settings
 */
function registerSystemSettings() {
  // Example setting: auto-calculate derived values
  (game as any).settings.register('mastery-system', 'autoCalculate', {
    name: 'Auto-Calculate Derived Values',
    hint: 'Automatically calculate Stones, Health Bars, and other derived values',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
  
  // Debug mode
  (game as any).settings.register('mastery-system', 'debugMode', {
    name: 'Debug Mode',
    hint: 'Enable debug logging to console',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  });

  // Mastery Rank - Global default
  (game as any).settings.register('mastery-system', 'defaultMasteryRank', {
    name: 'Default Mastery Rank',
    hint: 'Default Mastery Rank for all characters (can be overridden per player)',
    scope: 'world',
    config: true,
    type: Number,
    default: 2,
    range: {
      min: 1,
      max: 20,
      step: 1
    }
  });

  // Mastery Rank per player (stored as object with player IDs as keys)
  (game as any).settings.register('mastery-system', 'playerMasteryRanks', {
    name: 'Player Mastery Ranks',
    hint: 'Mastery Rank per player (overrides global default)',
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });

  // Character XP Management (inline in settings)
  (game as any).settings.register('mastery-system', 'characterXpManagement', {
    name: 'Character XP Management',
    hint: 'Manage Attribute XP and Mastery XP for all player characters',
    scope: 'world',
    config: true,
    type: Object,
    default: {},
    restricted: true
  });

  // Default scene background image
  (game as any).settings.register('mastery-system', 'defaultSceneImage', {
    name: 'Default Scene Background Image',
    hint: 'Default background image path for new scenes (leave empty to use Foundry default)',
    scope: 'world',
    config: true,
    type: String,
    default: 'systems/mastery-system/assets/banner.jpg',
    filePicker: 'image'
  });
}

/**
 * Setup XP Management inline in settings
 */
function setupXpManagementInline() {
  // Hook into settings rendering to add custom UI
  Hooks.on('renderSettingsConfig', (app: any, html: JQuery, _data: any) => {
    // Find the Character XP Management setting
    const xpSetting = html.find('[name="mastery-system.characterXpManagement"]').closest('.form-group');
    if (xpSetting.length === 0) return;
    
    // Replace the default input with our custom UI
    const settingInput = xpSetting.find('input, select, textarea');
    const customContainer = $('<div class="mastery-xp-management-inline"></div>');
    
    // Get all player characters
    const characters = (game as any).actors?.filter((actor: any) => actor.type === 'character') || [];
    
    // Build the UI
    let htmlContent = '<div class="xp-management-header"><h3><i class="fas fa-coins"></i> Character XP Management</h3></div>';
    
    // Bulk Grant Section
    htmlContent += '<div class="bulk-grant-section"><h4>Bulk Grant XP</h4>';
    htmlContent += '<div class="bulk-grant-controls">';
    htmlContent += '<div class="bulk-grant-group"><label>Attribute XP:</label>';
    htmlContent += '<input type="number" class="bulk-xp-amount" data-xp-type="attribute" min="0" value="0" />';
    htmlContent += '<button type="button" class="bulk-grant-btn" data-xp-type="attribute"><i class="fas fa-gift"></i> Grant to All</button></div>';
    htmlContent += '<div class="bulk-grant-group"><label>Mastery XP:</label>';
    htmlContent += '<input type="number" class="bulk-xp-amount" data-xp-type="mastery" min="0" value="0" />';
    htmlContent += '<button type="button" class="bulk-grant-btn" data-xp-type="mastery"><i class="fas fa-gift"></i> Grant to All</button></div>';
    htmlContent += '</div></div>';
    
    // Characters Table
    htmlContent += '<div class="characters-list"><table class="xp-table"><thead><tr>';
    htmlContent += '<th>Character</th><th>Player</th><th>Attribute XP</th><th>Mastery XP</th><th>Grant XP</th>';
    htmlContent += '</tr></thead><tbody>';
    
    if (characters.length === 0) {
      htmlContent += '<tr><td colspan="5" class="empty-message"><i class="fas fa-info-circle"></i> No player characters found.</td></tr>';
    } else {
      characters.forEach((actor: any) => {
        const system = actor.system || {};
        const points = system.points || {};
        
        // Calculate spent XP
        let attributeXPSpent = 0;
        if (system.attributes) {
          Object.values(system.attributes).forEach((attr: any) => {
            if (attr && typeof attr.value === 'number') {
              const baseValue = 2;
              const currentValue = attr.value || baseValue;
              if (currentValue > baseValue) {
                for (let val = baseValue + 1; val <= currentValue; val++) {
                  let cost = 1;
                  if (val >= 9 && val <= 16) cost = 2;
                  else if (val >= 17 && val <= 24) cost = 3;
                  else if (val >= 25 && val <= 32) cost = 4;
                  else if (val >= 33) cost = 5;
                  attributeXPSpent += cost;
                }
              }
            }
          });
        }
        
        let masteryXPSpent = 0;
        if (system.skills) {
          Object.values(system.skills).forEach((skillValue: any) => {
            if (typeof skillValue === 'number' && skillValue > 0) {
              for (let level = 1; level < skillValue; level++) {
                masteryXPSpent += level;
              }
            }
          });
        }
        
        const attributeXPAvailable = points.attribute || 0;
        const masteryXPAvailable = points.mastery || 0;
        const playerName = (game as any).users?.find((u: any) => u.character?.id === actor.id)?.name || 'Unassigned';
        
        htmlContent += `<tr data-character-id="${actor.id}">`;
        htmlContent += `<td class="character-cell"><img src="${actor.img}" alt="${actor.name}" class="character-avatar" /><span class="character-name">${actor.name}</span></td>`;
        htmlContent += `<td class="player-cell">${playerName}</td>`;
        htmlContent += `<td class="xp-cell attribute-xp"><div class="xp-info">`;
        htmlContent += `<span class="xp-spent">Spent: <strong>${attributeXPSpent}</strong></span> `;
        htmlContent += `<span class="xp-available">Available: <strong>${attributeXPAvailable}</strong></span> `;
        htmlContent += `<span class="xp-total">Total: <strong>${attributeXPSpent + attributeXPAvailable}</strong></span>`;
        htmlContent += `</div></td>`;
        htmlContent += `<td class="xp-cell mastery-xp"><div class="xp-info">`;
        htmlContent += `<span class="xp-spent">Spent: <strong>${masteryXPSpent}</strong></span> `;
        htmlContent += `<span class="xp-available">Available: <strong>${masteryXPAvailable}</strong></span> `;
        htmlContent += `<span class="xp-total">Total: <strong>${masteryXPSpent + masteryXPAvailable}</strong></span>`;
        htmlContent += `</div></td>`;
        htmlContent += `<td class="grant-cell"><div class="grant-controls">`;
        htmlContent += `<div class="grant-group"><input type="number" class="xp-amount-input" data-xp-type="attribute" data-character-id="${actor.id}" min="0" value="0" placeholder="AP" />`;
        htmlContent += `<button type="button" class="grant-xp-btn" data-character-id="${actor.id}" data-xp-type="attribute" title="Grant Attribute XP"><i class="fas fa-plus"></i></button></div>`;
        htmlContent += `<div class="grant-group"><input type="number" class="xp-amount-input" data-xp-type="mastery" data-character-id="${actor.id}" min="0" value="0" placeholder="MP" />`;
        htmlContent += `<button type="button" class="grant-xp-btn" data-character-id="${actor.id}" data-xp-type="mastery" title="Grant Mastery XP"><i class="fas fa-plus"></i></button></div>`;
        htmlContent += `</div></td></tr>`;
      });
    }
    
    htmlContent += '</tbody></table></div>';
    customContainer.html(htmlContent);
    
    // Replace the input
    settingInput.hide();
    settingInput.after(customContainer);
    
    // Add event listeners
    customContainer.find('.grant-xp-btn').on('click', async (event) => {
      const button = $(event.currentTarget);
      const characterId = button.data('character-id');
      const xpType = button.data('xp-type');
      const amount = parseInt(button.siblings(`.xp-amount-input[data-xp-type="${xpType}"]`).val() as string) || 0;
      
      if (amount <= 0) {
        ui.notifications?.warn('Please enter a valid amount greater than 0.');
        return;
      }
      
      const actor = (game as any).actors?.get(characterId);
      if (!actor) {
        ui.notifications?.error('Character not found.');
        return;
      }
      
      const currentPoints = (actor.system?.points?.[xpType] || 0);
      await actor.update({
        [`system.points.${xpType}`]: currentPoints + amount
      });
      
      ui.notifications?.info(`Granted ${amount} ${xpType === 'attribute' ? 'Attribute' : 'Mastery'} XP to ${actor.name}.`);
      
      // Re-render settings to update display
      app.render();
    });
    
    // Bulk grant
    customContainer.find('.bulk-grant-btn').on('click', async (event) => {
      const button = $(event.currentTarget);
      const xpType = button.data('xp-type');
      const amount = parseInt(customContainer.find(`.bulk-xp-amount[data-xp-type="${xpType}"]`).val() as string) || 0;
      
      if (amount <= 0) {
        ui.notifications?.warn('Please enter a valid amount greater than 0.');
        return;
      }
      
      const characters = (game as any).actors?.filter((actor: any) => actor.type === 'character') || [];
      let updated = 0;
      
      for (const actor of characters) {
        const currentPoints = (actor.system?.points?.[xpType] || 0);
        await actor.update({
          [`system.points.${xpType}`]: currentPoints + amount
        });
        updated++;
      }
      
      ui.notifications?.info(`Granted ${amount} ${xpType === 'attribute' ? 'Attribute' : 'Mastery'} XP to ${updated} characters.`);
      
      // Re-render settings to update display
      app.render();
    });
  });
}

/**
 * Preload Handlebars templates
 */
async function preloadTemplates() {
  const templatePaths = [
    // Actor sheets (only load existing templates)
    'systems/mastery-system/templates/actor/character-sheet.hbs',
    'systems/mastery-system/templates/actor/npc-sheet.hbs',
    
    // Item sheets (only load existing templates)
    'systems/mastery-system/templates/item/special-sheet.hbs',
    
    // Dice dialogs
    'systems/mastery-system/templates/dice/damage-dialog.hbs',
    
    // Character creation wizard
    'systems/mastery-system/templates/dialogs/disadvantage-config.hbs'
  ];
  
  try {
    await foundry.applications.handlebars.loadTemplates(templatePaths);
  } catch (error) {
    console.warn('Mastery System | Some templates could not be loaded:', error);
  }
}

/**
 * Register CONFIG constants
 */
function registerConfigConstants() {
  if (!(CONFIG as any).MASTERY) {
    (CONFIG as any).MASTERY = {};
  }
  
  (CONFIG as any).MASTERY.creation = {
    schticksAllowed: 2, // Number of schticks players must choose during creation
    attributePoints: 16,
    skillPoints: 16,  // Configurable - can be changed later
    maxAttributeAtCreation: 8,
    maxSkillAtCreation: 4,
    maxDisadvantagePoints: 8
  };
}

/**
 * Character Creation Hooks
 */
Hooks.on('preCreateActor', async (actor: any, data: any, _options: any, _userId: string) => {
  // Set creationComplete=false for new character actors
  if (actor.type === 'character') {
    if (!data.system) {
      data.system = {};
    }
    // Initialize schticks if not present
    if (!data.system.schticks) {
      data.system.schticks = { ranks: [] };
    }
    if (!data.system.creation) {
      data.system.creation = {};
    }
    data.system.creation.complete = false;
    console.log('Mastery System | New character created - setting creationComplete=false');
  }
});

/**
 * Migration hook - set creationComplete=true for existing characters without the flag
 */
Hooks.once('ready', async function() {
  console.log('Mastery System | Running character creation migration...');
  
  // Get all character actors
  const characters = (game as any).actors?.filter((a: any) => a.type === 'character') || [];
  let migrated = 0;
  
  for (const actor of characters) {
    const system = (actor as any).system;
    // If creation.complete is undefined or null, set it to true (existing character)
    if (system?.creation?.complete === undefined || system?.creation?.complete === null) {
      await actor.update({ 'system.creation.complete': true });
      migrated++;
    }
  }
  
  if (migrated > 0) {
    console.log(`Mastery System | Migrated ${migrated} existing characters (set creationComplete=true)`);
  }
});

/**
 * Ready hook - called when Foundry is fully loaded and ready
 */
Hooks.once('ready', async function() {
  console.log('Mastery System | System ready');
  
  // Log system version
  const system = (game as any).system;
  console.log(`Mastery System | Version ${system.version}`);
});

/**
 * Set default scene background image when creating new scenes
 */
Hooks.on('preCreateScene', (_scene: any, data: any, _options: any, _userId: string) => {
  // Only set default if no background image is provided
  if (!data.img && (!data.background || !data.background.src)) {
    const defaultImage = (game as any).settings.get('mastery-system', 'defaultSceneImage');
    if (defaultImage && defaultImage.trim() !== '') {
      // Set the background image - Foundry uses 'img' field for scene background
      data.img = defaultImage;
      console.log('Mastery System | Setting default scene background:', defaultImage);
    }
  }
});

/**
 * Add chat message context menu options
 */
Hooks.on('getChatLogEntryContext', (_html: JQuery, options: any[]) => {
  // Add re-roll option for Mastery rolls
  options.push({
    name: 'Re-Roll',
    icon: '<i class="fas fa-dice"></i>',
    condition: (li: JQuery) => {
      const message = (game as any).messages?.get(li.data('messageId'));
      return message?.getFlag('mastery-system', 'canReroll') === true;
    },
    callback: (li: JQuery) => {
      const message = (game as any).messages?.get(li.data('messageId'));
      // TODO: Implement re-roll logic
      console.log('Re-rolling:', message);
    }
  });
});

/**
 * Handle attack roll button clicks in chat
 * Use event delegation on the chat log container to catch all button clicks
 */
Hooks.once('ready', () => {
  console.log('Mastery System | DEBUG: Setting up global roll-attack-btn handler on chat log');
  
  // Register handler on the chat log container using event delegation
  // This ensures it works for all messages, including dynamically added ones
  $(document).off('click', '.roll-attack-btn').on('click', '.roll-attack-btn', async (ev: JQuery.ClickEvent) => {
    console.log('Mastery System | DEBUG: Roll Attack button clicked!', {
      eventType: ev.type,
      target: ev.target,
      currentTarget: ev.currentTarget,
      buttonClass: $(ev.currentTarget).attr('class')
    });
    ev.preventDefault();
    ev.stopPropagation();
    
    const button = $(ev.currentTarget);
    const messageElement = button.closest('.message');
    
    // Try multiple methods to get message ID (Foundry VTT uses data-message-id attribute)
    const messageId = messageElement.attr('data-message-id') || 
                      messageElement.data('message-id') || 
                      messageElement.data('messageId');
    
    console.log('Mastery System | DEBUG: Button click details', {
      messageId,
      messageElementAttrs: {
        'data-message-id': messageElement.attr('data-message-id'),
        'data-messageId': messageElement.attr('data-messageId'),
        'id': messageElement.attr('id'),
        'class': messageElement.attr('class')
      },
      buttonData: {
        attackerId: button.data('attacker-id'),
        targetId: button.data('target-id'),
        attribute: button.data('attribute'),
        attributeValue: button.data('attribute-value'),
        masteryRank: button.data('mastery-rank'),
        targetEvade: button.data('target-evade'),
        raises: button.data('raises'),
        baseEvade: button.data('base-evade')
      },
      buttonHtml: button.html()
    });
    
    if (!messageId) {
      console.warn('Mastery System | Could not find message ID for attack roll', {
        messageElementHtml: messageElement[0]?.outerHTML?.substring(0, 200),
        allDataAttrs: Array.from(messageElement[0]?.attributes || []).map((attr: any) => `${attr.name}="${attr.value}"`)
      });
      return;
    }
    
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      const allMessageIds = (game as any).messages ? Array.from((game as any).messages.keys()) : [];
      console.warn('Mastery System | Could not find message for attack roll', {
        messageId,
        allMessageIds: allMessageIds.slice(0, 10) // Only show first 10 for debugging
      });
      return;
    }
    
    // Debug: Check all flags on the message
    const allFlags = message.flags;
    console.log('Mastery System | [ROLL BUTTON CLICK] All message flags', {
      messageId: messageId,
      allFlags: allFlags,
      allFlagKeys: Object.keys(allFlags || {}),
      masterySystemFlags: allFlags?.['mastery-system']
    });
    
    // Try both methods to get flags (getFlag might not work in some Foundry versions)
    const flags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'];
    console.log('Mastery System | [ROLL BUTTON CLICK] Message flags (mastery-system)', {
      messageId: messageId,
      flags: flags,
      weaponId: flags?.weaponId,
      selectedPowerId: flags?.selectedPowerId,
      targetEvade: flags?.targetEvade,
      baseEvade: flags?.baseEvade,
      allFlagKeys: Object.keys(flags || {})
    });
    console.log('Mastery System | [ROLL BUTTON CLICK] Flags structure', {
      messageId: messageId,
      hasGetFlag: typeof message.getFlag === 'function',
      flagsDirect: message.flags?.['mastery-system'],
      flagsViaGetFlag: message.getFlag?.('mastery-system'),
      flagsMatch: message.flags?.['mastery-system'] === message.getFlag?.('mastery-system')
    });
    
    if (!flags || flags.attackType !== 'melee') {
      console.warn('Mastery System | DEBUG: Invalid flags or not melee attack', { 
        flags, 
        attackType: flags?.attackType,
        allFlagsKeys: Object.keys(allFlags || {}),
        masterySystemFlags: allFlags?.['mastery-system']
      });
      return;
    }
    
    // Disable button during roll
    button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
    console.log('Mastery System | DEBUG: Starting attack roll...');
    
    try {
      // Import the roll handler (must use .js extension for ES modules in Foundry VTT)
      const { masteryRoll } = await import('./dice/roll-handler.js');
      console.log('Mastery System | DEBUG: Roll handler imported');
      
      // Get actor data
      const attacker = (game as any).actors?.get(flags.attackerId);
      if (!attacker) {
        throw new Error('Attacker not found');
      }
      
      // Get current values from button (including raises-adjusted TN)
      const currentTargetEvade = parseInt(button.data('target-evade')) || flags.targetEvade;
      const raises = parseInt(button.data('raises')) || 0;
      
      console.log('Mastery System | DEBUG: Roll parameters', {
        numDice: flags.attributeValue,
        keepDice: flags.masteryRank,
        skill: 0,
        tn: currentTargetEvade,
        raises,
        baseEvade: flags.targetEvade,
        adjustedEvade: currentTargetEvade
      });
      
      // Perform the attack roll with d8 dice (exploding 8s handled in roll-handler)
      console.log('Mastery System | DEBUG: Calling masteryRoll...');
      const result = await masteryRoll({
        numDice: flags.attributeValue,
        keepDice: flags.masteryRank,
        skill: 0,
        tn: currentTargetEvade,
        label: `Attack Roll (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`,
        flavor: `vs ${(game as any).actors?.get(flags.targetId)?.name || 'Target'}'s Evade (${currentTargetEvade}${raises > 0 ? `, ${raises} raise${raises > 1 ? 's' : ''}` : ''})`,
        actorId: flags.attackerId
      });
      
      console.log('Mastery System | DEBUG: Roll completed!', {
        total: result.total,
        dice: result.dice,
        kept: result.kept,
        targetEvade: currentTargetEvade,
        baseEvade: flags.targetEvade,
        raises: result.raises,
        success: result.success
      });
      
      // Update button to show it was rolled
      button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');
      
      // If attack was successful, show damage dialog
      if (result.success && result.raises >= 0) {
        const target = (game as any).actors?.get(flags.targetId);
        if (target) {
          // Re-read flags from message to get updated power selection
          const currentMessage = (game as any).messages?.get(messageId);
          let updatedFlags = flags;
          console.log('Mastery System | [BEFORE DAMAGE DIALOG] Re-reading flags from message', {
            messageId: messageId,
            hasMessage: !!currentMessage,
            originalFlags: {
              weaponId: flags.weaponId,
              selectedPowerId: flags.selectedPowerId,
              targetEvade: flags.targetEvade,
              baseEvade: flags.baseEvade
            }
          });
          
          if (currentMessage) {
            const messageFlags = currentMessage.getFlag('mastery-system') || currentMessage.flags?.['mastery-system'];
            if (messageFlags) {
              updatedFlags = { ...flags, ...messageFlags };
              console.log('Mastery System | [BEFORE DAMAGE DIALOG] Updated flags from message', {
                messageId: messageId,
                originalFlags: {
                  weaponId: flags.weaponId,
                  selectedPowerId: flags.selectedPowerId,
                  targetEvade: flags.targetEvade,
                  baseEvade: flags.baseEvade
                },
                messageFlags: {
                  weaponId: messageFlags.weaponId,
                  selectedPowerId: messageFlags.selectedPowerId,
                  targetEvade: messageFlags.targetEvade,
                  baseEvade: messageFlags.baseEvade,
                  allKeys: Object.keys(messageFlags)
                },
                updatedFlags: {
                  weaponId: updatedFlags.weaponId,
                  selectedPowerId: updatedFlags.selectedPowerId,
                  targetEvade: updatedFlags.targetEvade,
                  baseEvade: updatedFlags.baseEvade,
                  allKeys: Object.keys(updatedFlags)
                },
                flagsChanged: {
                  weaponId: flags.weaponId !== updatedFlags.weaponId,
                  selectedPowerId: flags.selectedPowerId !== updatedFlags.selectedPowerId
                }
              });
            } else {
              console.warn('Mastery System | [BEFORE DAMAGE DIALOG] WARNING: No message flags found', {
                messageId,
                hasMessage: !!currentMessage,
                messageFlags: currentMessage?.flags,
                messageFlagsKeys: Object.keys(currentMessage?.flags || {}),
                masterySystemFlags: currentMessage?.flags?.['mastery-system']
              });
            }
          } else {
            console.error('Mastery System | [BEFORE DAMAGE DIALOG] ERROR: Could not find message to re-read flags', {
              messageId,
              allMessageIds: Array.from((game as any).messages?.keys() || []).slice(0, 10),
              totalMessages: (game as any).messages?.size || 0
            });
          }
          
          // Get equipped weapon ID (just the ID, not the full object)
          // First try to find it from actor items, then fall back to flags
          const items = (attacker as any).items || [];
          const equippedWeapon = items.find((item: any) => 
            item.type === 'weapon' && (item.system as any)?.equipped === true
          );
          let weaponId = equippedWeapon ? equippedWeapon.id : null;
          
          // If weapon not found by equipped flag, use weaponId from flags
          if (!weaponId && updatedFlags.weaponId) {
            console.log('Mastery System | [BEFORE DAMAGE DIALOG] Weapon not found as equipped, using weaponId from flags', {
              weaponIdFromFlags: updatedFlags.weaponId,
              allItems: items.map((i: any) => ({ id: i.id, name: i.name, type: i.type, equipped: (i.system as any)?.equipped }))
            });
            weaponId = updatedFlags.weaponId;
          }
          
          console.log('Mastery System | [BEFORE DAMAGE DIALOG] Weapon and power IDs', {
            messageId: messageId,
            weaponId: weaponId,
            weaponIdFromFlags: updatedFlags.weaponId,
            weaponIdMatch: weaponId === updatedFlags.weaponId,
            selectedPowerId: updatedFlags.selectedPowerId,
            selectedPowerIdType: typeof updatedFlags.selectedPowerId,
            selectedPowerIdLength: updatedFlags.selectedPowerId ? updatedFlags.selectedPowerId.length : 0,
            hasEquippedWeapon: !!equippedWeapon,
            equippedWeaponName: equippedWeapon ? equippedWeapon.name : null
          });
          
          // result.raises is already calculated based on the adjusted TN (which includes manual raises)
          // So we just use result.raises directly
          const totalRaises = result.raises || 0;
          
          console.log('Mastery System | [BEFORE DAMAGE DIALOG] Raises calculation', {
            messageId: messageId,
            resultRaises: result.raises,
            totalRaises: totalRaises,
            resultRaisesType: typeof result.raises,
            resultSuccess: result.success,
            resultTotal: result.total,
            resultTN: result.tn,
            currentTargetEvade: currentTargetEvade,
            baseEvade: flags.targetEvade,
            raisesFromButton: parseInt(button.data('raises')) || 0
          });
          
          console.log('Mastery System | [BEFORE DAMAGE DIALOG] Calling showDamageDialog with', {
            messageId: messageId,
            attackerId: attacker.id,
            attackerName: (attacker as any).name,
            targetId: target.id,
            targetName: (target as any).name,
            weaponId: weaponId,
            selectedPowerId: updatedFlags.selectedPowerId || null,
            totalRaises: totalRaises,
            flagsKeys: Object.keys(updatedFlags || {})
          });
          
          // Import and show damage dialog - pass only IDs, not full objects
          const { showDamageDialog } = await import('./dice/damage-dialog.js');
          const damageResult = await showDamageDialog(
            attacker,
            target,
            weaponId,
            updatedFlags.selectedPowerId || null,
            totalRaises,
            updatedFlags
          );
          
          if (damageResult) {
            // Roll and display damage
            await rollAndDisplayDamage(damageResult, attacker, target, flags);
          }
        }
      }
      
    } catch (error) {
      console.error('Mastery System | DEBUG: Error during roll', error);
      console.error('Mastery System | Error rolling attack:', error);
      ui.notifications?.error('Failed to roll attack');
      button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll Attack');
    }
  });
});

/**
 * Roll and display damage in chat
 */
async function rollAndDisplayDamage(
  damageResult: any,
  attacker: Actor,
  target: Actor,
  _flags?: any
): Promise<void> {
  const damageBreakdown: string[] = [];
  
  if (damageResult.baseDamage > 0) {
    damageBreakdown.push(`Base: ${damageResult.baseDamage}`);
  }
  if (damageResult.powerDamage > 0) {
    damageBreakdown.push(`Power: ${damageResult.powerDamage}`);
  }
  if (damageResult.passiveDamage > 0) {
    damageBreakdown.push(`Passive: ${damageResult.passiveDamage}`);
  }
  if (damageResult.raiseDamage > 0) {
    damageBreakdown.push(`Raises: ${damageResult.raiseDamage}`);
  }
  
  let content = `
    <div class="mastery-damage-card">
      <div class="damage-header">
        <h3><i class="fas fa-sword"></i> Damage</h3>
        <div class="damage-participants">
          <strong>${(attacker as any).name}</strong> → <strong>${(target as any).name}</strong>
        </div>
      </div>
      <div class="damage-details">
        <div class="damage-total">
          <span>Total Damage:</span>
          <span><strong>${damageResult.totalDamage}</strong></span>
        </div>
        ${damageBreakdown.length > 0 ? `
          <div class="damage-breakdown">
            ${damageBreakdown.map(part => `<div class="damage-part">${part}</div>`).join('')}
          </div>
        ` : ''}
        ${damageResult.specialsUsed.length > 0 ? `
          <div class="damage-specials">
            <span>Specials Used:</span>
            <span>${damageResult.specialsUsed.join(', ')}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  const chatData: any = {
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor: attacker }),
    content,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    flags: {
      'mastery-system': {
        damageType: 'melee',
        totalDamage: damageResult.totalDamage,
        specialsUsed: damageResult.specialsUsed
      }
    }
  };
  
  await ChatMessage.create(chatData);
  
  // Apply damage to target
  if (target && typeof (target as any).applyDamage === 'function') {
    await (target as any).applyDamage(damageResult.totalDamage);
  }
}

/**
 * Also handle renderChatLog to ensure handler is set up
 */
Hooks.on('renderChatLog', (_app: any, html: JQuery, _data: any) => {
  try {
    console.log('Mastery System | DEBUG: renderChatLog hook fired');
    
    // Check if buttons exist in the rendered HTML
    const existingButtons = html.find('.roll-attack-btn');
    console.log('Mastery System | DEBUG: Found existing roll-attack-btn buttons:', existingButtons.length);
    if (existingButtons.length > 0) {
      existingButtons.each((index, btn) => {
        console.log('Mastery System | DEBUG: Button', index, {
          id: $(btn).attr('id'),
          classes: $(btn).attr('class'),
          dataAttackerId: $(btn).data('attacker-id'),
          html: $(btn).html()?.substring(0, 50)
        });
      });
    }
  } catch (error) {
    console.error('Mastery System | DEBUG: Error in renderChatLog hook', error);
  }
});

/**
 * Log system information
 */
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            MASTERY SYSTEM / DESTROYED FAITH               ║
║                                                           ║
║  A dark fantasy tabletop RPG system featuring:            ║
║  • Roll & Keep d8 dice mechanics                          ║
║  • Attribute Stones & Mastery Ranks                       ║
║  • Health Bars with cumulative penalties                  ║
║  • Powers & Mastery Trees (L1-L4)                         ║
║  • Divine Clash late-game combat                          ║
║                                                           ║
       ║  Version: 0.1.10                                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

