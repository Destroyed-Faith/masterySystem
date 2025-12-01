/**
 * Mastery System / Destroyed Faith
 * Main module entry point for Foundry VTT v13
 */
import { MasteryActor } from './documents/actor';
import { MasteryItem } from './documents/item';
import { MasteryCharacterSheet } from './sheets/character-sheet';
import { MasteryNpcSheet } from './sheets/npc-sheet';
import { MasteryItemSheet } from './sheets/item-sheet';
// Dice roller functions are imported in sheets where needed
/**
 * Initialize the Mastery System
 * This hook is called once when Foundry first starts up
 */
Hooks.once('init', async function () {
    console.log('Mastery System | Initializing Mastery System / Destroyed Faith');
    // Register custom Document classes
    CONFIG.Actor.documentClass = MasteryActor;
    CONFIG.Item.documentClass = MasteryItem;
    // Register custom sheet application classes
    // Register Character sheet first
    Actors.registerSheet('mastery-system', MasteryCharacterSheet, {
        types: ['character'],
        makeDefault: true,
        label: 'Mastery Character Sheet'
    });
    console.log('Mastery System | Registered Character Sheet');
    // Register NPC sheet
    Actors.registerSheet('mastery-system', MasteryNpcSheet, {
        types: ['npc'],
        makeDefault: true,
        label: 'Mastery NPC Sheet'
    });
    console.log('Mastery System | Registered NPC Sheet');
    // Unregister core sheets after registering our own (to ensure ours are used)
    Actors.unregisterSheet('core', ActorSheet);
    console.log('Mastery System | Unregistered core ActorSheet');
    // Register Item sheet
    Items.registerSheet('mastery-system', MasteryItemSheet, {
        makeDefault: true,
        label: 'Mastery Item Sheet'
    });
    // Unregister core item sheet
    Items.unregisterSheet('core', ItemSheet);
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
    game.settings.register('mastery-system', 'autoCalculate', {
        name: 'Auto-Calculate Derived Values',
        hint: 'Automatically calculate Stones, Health Bars, and other derived values',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    // Debug mode
    game.settings.register('mastery-system', 'debugMode', {
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
        // Actor sheets (only load existing templates)
        'systems/mastery-system/templates/actor/character-sheet.hbs',
        'systems/mastery-system/templates/actor/npc-sheet.hbs',
        // Item sheets (only load existing templates)
        'systems/mastery-system/templates/item/special-sheet.hbs'
    ];
    try {
        await loadTemplates(templatePaths);
    }
    catch (error) {
        console.warn('Mastery System | Some templates could not be loaded:', error);
    }
}
/**
 * Ready hook - called when Foundry is fully loaded and ready
 */
Hooks.once('ready', async function () {
    console.log('Mastery System | System ready');
    // Log system version
    const system = game.system;
    console.log(`Mastery System | Version ${system.version}`);
});
/**
 * Add chat message context menu options
 */
Hooks.on('getChatLogEntryContext', (_html, options) => {
    // Add re-roll option for Mastery rolls
    options.push({
        name: 'Re-Roll',
        icon: '<i class="fas fa-dice"></i>',
        condition: (li) => {
            const message = game.messages?.get(li.data('messageId'));
            return message?.getFlag('mastery-system', 'canReroll') === true;
        },
        callback: (li) => {
            const message = game.messages?.get(li.data('messageId'));
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
║  Version: 0.0.5 (Alpha)                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
//# sourceMappingURL=module.js.map