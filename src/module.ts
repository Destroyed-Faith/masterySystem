/**
 * Mastery System / Destroyed Faith
 * Main module entry point for Foundry VTT v13
 */

import { MasteryActor } from './documents/actor';
import { MasteryItem } from './documents/item';
import { MasteryCharacterSheet } from './sheets/character-sheet';
import { MasteryNpcSheet } from './sheets/npc-sheet';
import { MasteryItemSheet } from './sheets/item-sheet';

// Import the dice roller
import './dice/roll-handler';

/**
 * Initialize the Mastery System
 * This hook is called once when Foundry first starts up
 */
Hooks.once('init', async function() {
  console.log('Mastery System | Initializing Mastery System / Destroyed Faith');
  
  // Register custom Document classes
  CONFIG.Actor.documentClass = MasteryActor;
  CONFIG.Item.documentClass = MasteryItem;
  
  // Register custom sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  
  // Register Character sheet
  Actors.registerSheet('mastery-system', MasteryCharacterSheet, {
    types: ['character'],
    makeDefault: true,
    label: 'Mastery Character Sheet'
  });
  
  // Register NPC sheet
  Actors.registerSheet('mastery-system', MasteryNpcSheet, {
    types: ['npc'],
    makeDefault: true,
    label: 'Mastery NPC Sheet'
  });
  
  // Register Item sheet
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('mastery-system', MasteryItemSheet, {
    makeDefault: true,
    label: 'Mastery Item Sheet'
  });
  
  // Register system settings
  registerSystemSettings();
  
  // Preload Handlebars templates
  await preloadTemplates();
  
  console.log('Mastery System | System initialized');
});

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
}

/**
 * Preload Handlebars templates
 */
async function preloadTemplates() {
  const templatePaths = [
    // Actor sheets
    'systems/mastery-system/templates/actor/character-sheet.hbs',
    'systems/mastery-system/templates/actor/npc-sheet.hbs',
    'systems/mastery-system/templates/actor/summon-sheet.hbs',
    'systems/mastery-system/templates/actor/divine-sheet.hbs',
    
    // Item sheets
    'systems/mastery-system/templates/item/special-sheet.hbs',
    'systems/mastery-system/templates/item/echo-sheet.hbs',
    'systems/mastery-system/templates/item/artifact-sheet.hbs',
    'systems/mastery-system/templates/item/condition-sheet.hbs',
    
    // Partials
    'systems/mastery-system/templates/partials/attribute-block.hbs',
    'systems/mastery-system/templates/partials/skill-list.hbs',
    'systems/mastery-system/templates/partials/health-bars.hbs',
    
    // Chat cards
    'systems/mastery-system/templates/chat/roll-card.hbs',
    'systems/mastery-system/templates/chat/damage-card.hbs'
  ];
  
  return loadTemplates(templatePaths);
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
║  Version: 0.0.1 (Alpha)                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

