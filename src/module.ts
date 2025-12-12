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

  // Register Handlebars helpers
  registerHandlebarsHelpers();

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
 * Register Handlebars helpers
 */
function registerHandlebarsHelpers() {
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

  // Helper for greater than or equal comparison
  Handlebars.registerHelper('gte', function(a: number, b: number) {
    return a >= b;
  });

  // Helper for less than or equal comparison
  Handlebars.registerHelper('lte', function(a: number, b: number) {
    return a <= b;
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

  // Attribute Points distribution
  (game as any).settings.register('mastery-system', 'attributePointsPerLevel', {
    name: 'Attribute Points per Level',
    hint: 'How many Attribute Points characters receive per level/session',
    scope: 'world',
    config: true,
    type: Number,
    default: 1,
    range: {
      min: 0,
      max: 10,
      step: 1
    }
  });

  // Mastery Points distribution
  (game as any).settings.register('mastery-system', 'masteryPointsPerLevel', {
    name: 'Mastery Points per Level',
    hint: 'How many Mastery Points characters receive per level/session',
    scope: 'world',
    config: true,
    type: Number,
    default: 1,
    range: {
      min: 0,
      max: 10,
      step: 1
    }
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
 * Preload Handlebars templates
 */
async function preloadTemplates() {
  const templatePaths = [
    // Actor sheets (only load existing templates)
    'systems/mastery-system/templates/actor/character-sheet.hbs',
    'systems/mastery-system/templates/actor/npc-sheet.hbs',
    
    // Item sheets (only load existing templates)
    'systems/mastery-system/templates/item/special-sheet.hbs'
  ];
  
  try {
    await foundry.applications.handlebars.loadTemplates(templatePaths);
  } catch (error) {
    console.warn('Mastery System | Some templates could not be loaded:', error);
  }
}

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
    const messageId = messageElement.data('messageId');
    
    console.log('Mastery System | DEBUG: Button click details', {
      messageId,
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
      console.warn('Mastery System | Could not find message ID for attack roll');
      return;
    }
    
    const message = (game as any).messages?.get(messageId);
    if (!message) {
      console.warn('Mastery System | Could not find message for attack roll');
      return;
    }
    
    const flags = message.getFlag('mastery-system');
    console.log('Mastery System | DEBUG: Message flags', flags);
    
    if (!flags || flags.attackType !== 'melee') {
      console.warn('Mastery System | DEBUG: Invalid flags or not melee attack', { flags, attackType: flags?.attackType });
      return;
    }
    
    // Disable button during roll
    button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
    console.log('Mastery System | DEBUG: Starting attack roll...');
    
    try {
      // Import the roll handler
      const { masteryRoll } = await import('./dice/roll-handler');
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
      
    } catch (error) {
      console.error('Mastery System | DEBUG: Error during roll', error);
      console.error('Mastery System | Error rolling attack:', error);
      ui.notifications?.error('Failed to roll attack');
      button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll Attack');
    }
  });
});

/**
 * Also handle renderChatLog to ensure handler is set up
 */
Hooks.on('renderChatLog', (_app: any, html: JQuery, _data: any) => {
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
       ║  Version: 0.0.78 (Alpha)                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

