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
import { initializeTokenActionSelector } from './token-action-selector.js';
import { initializeTurnIndicator } from './turn-indicator.js';
// Dice roller functions are imported in sheets where needed
console.log('Mastery System | All imports completed');
/**
 * Initialize the Mastery System
 * This hook is called once when Foundry first starts up
 */
Hooks.once('init', async function () {
    console.log('Mastery System | Initializing Mastery System / Destroyed Faith');
    // Shim deprecated globals to the namespaced versions to suppress warnings (Foundry v13+)
    if (!globalThis.FilePicker && foundry?.applications?.apps?.FilePicker?.implementation) {
        globalThis.FilePicker = foundry.applications.apps.FilePicker.implementation;
    }
    // Shim Application to V2 if available to silence V1 deprecation (non-breaking)
    if (foundry?.applications?.api?.ApplicationV2 && !globalThis._masteryAppPatched) {
        globalThis.Application = foundry.applications.api.ApplicationV2;
        globalThis._masteryAppPatched = true;
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
        const combatModule = await import(combatPath);
        if (combatModule.initializeCombatHooks) {
            combatModule.initializeCombatHooks();
        }
    }
    catch (error) {
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
    Handlebars.registerHelper('default', function (value, fallback) {
        return value !== undefined && value !== null ? value : fallback;
    });
    // Calculate stones from an attribute value: {{calculateStones value}}
    Handlebars.registerHelper('calculateStones', function (value) {
        const num = Number(value) || 0;
        return calculateStones(num);
    });
    // Repeat block n times: {{#times n}}...{{/times}}
    Handlebars.registerHelper('times', function (count, block) {
        const n = Number(count) || 0;
        let accum = '';
        for (let i = 0; i < n; i++) {
            accum += block.fn(i);
        }
        return accum;
    });
    // Simple arithmetic helpers
    Handlebars.registerHelper('add', function (a, b) {
        return (Number(a) || 0) + (Number(b) || 0);
    });
    Handlebars.registerHelper('subtract', function (a, b) {
        return (Number(a) || 0) - (Number(b) || 0);
    });
    // Helper to create arrays
    Handlebars.registerHelper('array', function (...args) {
        args.pop(); // Remove Handlebars options object
        return args;
    });
    // Helper for greater than or equal comparison
    Handlebars.registerHelper('gte', function (a, b) {
        return a >= b;
    });
    // Helper for less than or equal comparison
    Handlebars.registerHelper('lte', function (a, b) {
        return a <= b;
    });
    // Helper for incrementing (for 1-based indexing)
    Handlebars.registerHelper('inc', function (value) {
        return parseInt(String(value)) + 1;
    });
    // Helper for multiplication
    Handlebars.registerHelper('multiply', function (a, b) {
        return a * b;
    });
    // Helper to check if user is GM
    Handlebars.registerHelper('userIsGM', function () {
        return game.user?.isGM ?? false;
    });
}
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
    // Mastery Rank - Global default
    game.settings.register('mastery-system', 'defaultMasteryRank', {
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
    game.settings.register('mastery-system', 'playerMasteryRanks', {
        name: 'Player Mastery Ranks',
        hint: 'Mastery Rank per player (overrides global default)',
        scope: 'world',
        config: false,
        type: Object,
        default: {}
    });
    // Attribute Points distribution
    game.settings.register('mastery-system', 'attributePointsPerLevel', {
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
    game.settings.register('mastery-system', 'masteryPointsPerLevel', {
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
    game.settings.register('mastery-system', 'defaultSceneImage', {
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
 * Set default scene background image when creating new scenes
 */
Hooks.on('preCreateScene', (_scene, data, _options, _userId) => {
    // Only set default if no background image is provided
    if (!data.img && (!data.background || !data.background.src)) {
        const defaultImage = game.settings.get('mastery-system', 'defaultSceneImage');
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
 * Handle attack roll button clicks in chat
 */
Hooks.on('renderChatLog', (_app, html, _data) => {
    // Use event delegation for attack roll buttons
    html.off('click', '.roll-attack-btn').on('click', '.roll-attack-btn', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const button = $(ev.currentTarget);
        const messageElement = button.closest('.message');
        const messageId = messageElement.data('messageId');
        if (!messageId) {
            console.warn('Mastery System | Could not find message ID for attack roll');
            return;
        }
        const message = game.messages?.get(messageId);
        if (!message) {
            console.warn('Mastery System | Could not find message for attack roll');
            return;
        }
        const flags = message.getFlag('mastery-system');
        if (!flags || flags.attackType !== 'melee') {
            return;
        }
        // Disable button during roll
        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
        try {
            // Import the roll handler
            const { masteryRoll } = await import('./dice/roll-handler');
            // Get actor data
            const attacker = game.actors?.get(flags.attackerId);
            if (!attacker) {
                throw new Error('Attacker not found');
            }
            // Perform the attack roll
            const result = await masteryRoll({
                numDice: flags.attributeValue,
                keepDice: flags.masteryRank,
                skill: 0,
                tn: flags.targetEvade,
                label: `Attack Roll (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`,
                flavor: `vs ${game.actors?.get(flags.targetId)?.name || 'Target'}'s Evade (${flags.targetEvade})`,
                actorId: flags.attackerId
            });
            console.log('Mastery System | Attack roll completed:', {
                total: result.total,
                targetEvade: flags.targetEvade,
                success: result.success,
                raises: result.raises
            });
            // Update button to show it was rolled
            button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');
        }
        catch (error) {
            console.error('Mastery System | Error rolling attack:', error);
            ui.notifications?.error('Failed to roll attack');
            button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll Attack');
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
       ║  Version: 0.0.78 (Alpha)                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
//# sourceMappingURL=module.js.map