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
import { handleRadialMenuOpened, handleRadialMenuClosed } from './radial-menu/rendering';
import { registerAttackRollClickHandler } from './chat/attack-roll-handler';
// Import combat-related modules statically
import { PassiveSelectionDialog } from './sheets/passive-selection-dialog.js';
import { rollInitiativeForAllCombatants } from './combat/initiative-roll.js';
import { InitiativeShopDialog } from './combat/initiative-shop-dialog.js';
import { CombatCarouselApp } from './ui/combat-carousel.js';

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

  // Initialize combat hooks
  // Register combatStart hook directly here
  Hooks.on('combatStart', async (combat: Combat) => {
    console.log('Mastery System | Combat started, showing passive selection overlay');
    
    try {
      // Step 1: Show Passive Selection Dialog
      await PassiveSelectionDialog.showForCombat(combat);
      
      // Step 2: Wait a moment for players to finish selecting passives
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 3: Roll initiative for all combatants (NPCs auto, PCs with shop)
      await rollInitiativeForAllCombatants(combat);
      
      // Step 4: Open Combat Carousel
      CombatCarouselApp.open();
    } catch (error) {
      console.error('Mastery System | Error in combat start sequence', error);
    }
  });

  // Close carousel when combat ends
  Hooks.on('combatEnd', () => {
    console.log('Mastery System | Combat ended, closing carousel');
    CombatCarouselApp.close();
  });

  // Update carousel when combat changes
  Hooks.on('updateCombat', () => {
    const carousel = CombatCarouselApp.instance;
    if (carousel && (carousel as any).rendered) {
      (carousel as any).render({ force: false });
    }
  });

  // Update carousel when combatants change
  Hooks.on('createCombatant', () => {
    const carousel = CombatCarouselApp.instance;
    if (carousel && (carousel as any).rendered) {
      (carousel as any).render({ force: false });
    }
  });

  Hooks.on('updateCombatant', () => {
    const carousel = CombatCarouselApp.instance;
    if (carousel && (carousel as any).rendered) {
      (carousel as any).render({ force: false });
    }
  });

  Hooks.on('deleteCombatant', () => {
    const carousel = CombatCarouselApp.instance;
    if (carousel && (carousel as any).rendered) {
      (carousel as any).render({ force: false });
    }
  });

  // Update carousel when canvas is ready (tokens might have changed)
  Hooks.on('canvasReady', () => {
    const carousel = CombatCarouselApp.instance;
    if (carousel && (carousel as any).rendered) {
      (carousel as any).render({ force: false });
    }
  });

  // Hide initiative roll button (d20) and add passive selection button in combat tracker
  Hooks.on('renderCombatTracker', (_app: any, html: any) => {
    // Convert html to jQuery if needed (Foundry v13 compatibility)
    let $html: JQuery<HTMLElement>;
    try {
      if (html && typeof html === 'object') {
        // Check if it's already a jQuery object
        if (html.jquery !== undefined && html.find !== undefined) {
          $html = html as JQuery<HTMLElement>;
        } else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
          $html = $(html) as JQuery<HTMLElement>;
        } else if (html.length !== undefined && html[0] instanceof HTMLElement) {
          // Might be a jQuery-like object
          $html = $(html) as JQuery<HTMLElement>;
        } else {
          // Try to wrap it
          $html = $(html) as JQuery<HTMLElement>;
        }
      } else {
        $html = $(html) as JQuery<HTMLElement>;
      }
    } catch (e) {
      console.error('Mastery System | Error converting html to jQuery in renderCombatTracker:', e);
      return;
    }

    // Hide all initiative roll buttons
    $html.find('button[data-action="rollInitiative"]').css('display', 'none');

    // Add buttons to each combatant row for passive and initiative dialogs
    $html.find('.combatant').each((_index: number, combatantElement: HTMLElement) => {
      const $combatant = $(combatantElement);
      const combatantId = $combatant.data('combatant-id') || $combatant.attr('data-combatant-id');
      
      if (!combatantId) {
        console.warn('Mastery System | [COMBAT TRACKER DEBUG] Combatant element has no ID', combatantElement);
        return;
      }

      // Find the token-initiative div
      const $initiativeDiv = $combatant.find('.token-initiative');
      if ($initiativeDiv.length === 0) {
        console.warn('Mastery System | [COMBAT TRACKER DEBUG] token-initiative div not found for combatant', combatantId);
        return;
      }

      // Remove existing buttons to prevent duplicates
      $initiativeDiv.find('.ms-passive-btn, .ms-initiative-btn').remove();

      // Add Passive Selection button
      const passiveBtn = $('<button type="button" class="combatant-control ms-passive-btn" data-action="selectPassives" data-combatant-id="' + combatantId + '" data-tooltip="Select Passives" aria-label="Select Passives" title="Select Passives"><i class="fa-solid fa-shield"></i></button>');
      $initiativeDiv.append(passiveBtn);

      // Add Initiative Shop button
      const initiativeBtn = $('<button type="button" class="combatant-control ms-initiative-btn" data-action="openInitiativeShop" data-combatant-id="' + combatantId + '" data-tooltip="Initiative Shop" aria-label="Initiative Shop" title="Initiative Shop"><i class="fa-solid fa-shop"></i></button>');
      $initiativeDiv.append(initiativeBtn);

      // Add click handlers
      passiveBtn.off('click.ms-passive').on('click.ms-passive', async (ev: JQuery.ClickEvent) => {
        console.log('Mastery System | [COMBAT TRACKER DEBUG] Passive button clicked', { combatantId });
        ev.preventDefault();
        ev.stopPropagation();
        
        const combat = game.combat;
        if (!combat) {
          ui.notifications?.warn('No active combat encounter');
          return;
        }

        const combatant = combat.combatants.get(combatantId);
        if (!combatant) {
          console.error('Mastery System | [COMBAT TRACKER DEBUG] Combatant not found', { combatantId });
          ui.notifications?.error('Combatant not found');
          return;
        }

        try {
          await PassiveSelectionDialog.showForCombatant(combatant);
        } catch (error) {
          console.error('Mastery System | [COMBAT TRACKER DEBUG] Error showing passive dialog', error);
          ui.notifications?.error('Failed to open passive selection dialog');
        }
      });

      initiativeBtn.off('click.ms-initiative').on('click.ms-initiative', async (ev: JQuery.ClickEvent) => {
        console.log('Mastery System | [COMBAT TRACKER DEBUG] Initiative button clicked', { combatantId });
        ev.preventDefault();
        ev.stopPropagation();
        
        const combat = game.combat;
        if (!combat) {
          ui.notifications?.warn('No active combat encounter');
          return;
        }

        const combatant = combat.combatants.get(combatantId);
        if (!combatant) {
          console.error('Mastery System | [COMBAT TRACKER DEBUG] Combatant not found', { combatantId });
          ui.notifications?.error('Combatant not found');
          return;
        }

        try {
          // Calculate base initiative
          const actor = combatant.actor;
          if (!actor) {
            ui.notifications?.error('Actor not found');
            return;
          }

          const { rollInitiativeForCombatant } = await import('./combat/initiative-roll.js');
          const breakdown = await rollInitiativeForCombatant(combatant);
          
          // Show initiative shop
          await InitiativeShopDialog.showForCombatant(combatant, breakdown, combat);
        } catch (error) {
          console.error('Mastery System | [COMBAT TRACKER DEBUG] Error showing initiative shop', error);
          ui.notifications?.error('Failed to open initiative shop');
        }
      });
    });

    // Add "Select Passives" button to encounter controls
    const encounterControls = $html.find('.encounter-controls');
    if (encounterControls.length > 0) {
      // Remove any existing button to prevent duplicates
      encounterControls.find('.ms-passive-selection-btn').remove();
      
      // Add button to the left control buttons area
      const leftControls = encounterControls.find('.control-buttons.left');
      if (leftControls.length > 0) {
        const passiveBtn = $('<button type="button" class="inline-control combat-control icon fa-solid fa-shield ms-passive-selection-btn" data-action="selectPassives" data-tooltip="Select Passives" aria-label="Select Passives"></button>');
        leftControls.prepend(passiveBtn);
        
        // Add click handler
        passiveBtn.off('click.ms-passive').on('click.ms-passive', async (ev: JQuery.ClickEvent) => {
          console.log('Mastery System | [PASSIVE DIALOG DEBUG] Button clicked in combat tracker');
          ev.preventDefault();
          ev.stopPropagation();
          
          const combat = game.combat;
          if (!combat) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] No active combat');
            ui.notifications?.warn('No active combat encounter');
            return;
          }

          console.log('Mastery System | [PASSIVE DIALOG DEBUG] Opening dialog from button', {
            combatId: combat.id,
            combatants: combat.combatants.size
          });

          try {
            await PassiveSelectionDialog.showForCombat(combat);
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Dialog opened successfully from button');
          } catch (error) {
            console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error showing passive selection dialog', error);
            ui.notifications?.error('Failed to open passive selection dialog');
          }
        });
      }
    }
  });

  // Cleanup: Remove any stray passive-selection-overlay and initiative-shop-dialog elements from body
  Hooks.on('renderApplication', (app: any) => {
    // If any application is rendered, check for stray overlay elements
    // This ensures cleanup even if the dialog wasn't closed properly
    if (app.id !== 'mastery-passive-selection') {
      $('body > .passive-selection-overlay').remove();
    }
    if (app.id !== 'mastery-initiative-shop') {
      $('body > .initiative-shop-dialog').remove();
    }
  });
  
  console.log('Mastery System | Combat hooks initialized');

  // Initialize token action selector
  initializeTokenActionSelector();
  
  // Initialize turn indicator (blue ring around active combatant)
  initializeTurnIndicator();

  // Register radial menu hooks for hover preview suppression
  Hooks.on('masterySystem.radialMenuOpened', handleRadialMenuOpened);
  Hooks.on('masterySystem.radialMenuClosed', handleRadialMenuClosed);

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

  // Helper for less than comparison
  Handlebars.registerHelper('lt', function(a: number, b: number) {
    return (Number(a) || 0) < (Number(b) || 0);
  });

  // Helper for incrementing (for 1-based indexing)
  Handlebars.registerHelper('inc', function(value: number) {
    return parseInt(String(value)) + 1;
  });

  // Helper for creating a range array: {{#each (range 1 8)}}...{{/each}}
  Handlebars.registerHelper('range', function(start: number, end: number) {
    const startNum = Number(start) || 1;
    const endNum = Number(end) || 8;
    const result = [];
    for (let i = startNum; i <= endNum; i++) {
      result.push(i);
    }
    return result;
  });

  // Helper for multiplication
  Handlebars.registerHelper('multiply', function(a: number, b: number) {
    return a * b;
  });

  // Helper for division
  Handlebars.registerHelper('divide', function(a: number, b: number) {
    if (b === 0) return 0;
    return a / b;
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

  // Combat Carousel Settings
  (game as any).settings.register('mastery-system', 'carouselResource1Path', {
    name: 'Carousel Resource 1 Path',
    hint: 'Path to first tracked resource (e.g., tracked.hp)',
    scope: 'world',
    config: true,
    type: String,
    default: 'tracked.hp'
  });

  (game as any).settings.register('mastery-system', 'carouselResource1Label', {
    name: 'Carousel Resource 1 Label',
    hint: 'Display label for first resource',
    scope: 'world',
    config: true,
    type: String,
    default: 'HP'
  });

  (game as any).settings.register('mastery-system', 'carouselResource2Path', {
    name: 'Carousel Resource 2 Path',
    hint: 'Path to second tracked resource (e.g., tracked.stress)',
    scope: 'world',
    config: true,
    type: String,
    default: 'tracked.stress'
  });

  (game as any).settings.register('mastery-system', 'carouselResource2Label', {
    name: 'Carousel Resource 2 Label',
    hint: 'Display label for second resource',
    scope: 'world',
    config: true,
    type: String,
    default: 'Stress'
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
  Hooks.on('renderSettingsConfig', (app: any, html: any, _data: any) => {
    // In Foundry v13, html might be an HTMLElement, jQuery, or a different structure
    // Convert to jQuery if needed
    let $html: JQuery<HTMLElement>;
    try {
      if (html && typeof html === 'object') {
        // Check if it's already a jQuery object
        if (html.jquery !== undefined && html.find !== undefined) {
          $html = html as JQuery<HTMLElement>;
        } else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
          $html = $(html) as JQuery<HTMLElement>;
        } else if (html.length !== undefined && html[0] instanceof HTMLElement) {
          // Might be a jQuery-like object
          $html = $(html) as JQuery<HTMLElement>;
        } else {
          // Try to wrap it
          $html = $(html) as JQuery<HTMLElement>;
        }
      } else {
        $html = $(html) as JQuery<HTMLElement>;
      }
    } catch (e) {
      console.error('Mastery System | Error converting html to jQuery:', e);
      return;
    }
    
    // Find the Character XP Management setting
    const xpSetting = $html.find('[name="mastery-system.characterXpManagement"]').closest('.form-group');
    if (xpSetting.length === 0) {
      console.log('Mastery System | XP Management setting not found in settings');
      return;
    }
    
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
        if (attributeXPAvailable > 0) {
          htmlContent += `<button type="button" class="remove-xp-btn" data-character-id="${actor.id}" data-xp-type="attribute" data-amount="${attributeXPAvailable}" title="Remove all available Attribute XP"><i class="fas fa-minus"></i> Remove All</button>`;
        }
        htmlContent += `</div></td>`;
        htmlContent += `<td class="xp-cell mastery-xp"><div class="xp-info">`;
        htmlContent += `<span class="xp-spent">Spent: <strong>${masteryXPSpent}</strong></span> `;
        htmlContent += `<span class="xp-available">Available: <strong>${masteryXPAvailable}</strong></span> `;
        htmlContent += `<span class="xp-total">Total: <strong>${masteryXPSpent + masteryXPAvailable}</strong></span>`;
        if (masteryXPAvailable > 0) {
          htmlContent += `<button type="button" class="remove-xp-btn" data-character-id="${actor.id}" data-xp-type="mastery" data-amount="${masteryXPAvailable}" title="Remove all available Mastery XP"><i class="fas fa-minus"></i> Remove All</button>`;
        }
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
    
    // Handle remove XP buttons
    customContainer.find('.remove-xp-btn').on('click', async (event) => {
      const button = $(event.currentTarget);
      const characterId = button.data('character-id');
      const xpType = button.data('xp-type');
      const amount = parseInt(button.data('amount') as string) || 0;
      
      if (amount <= 0) {
        ui.notifications?.warn('No XP to remove.');
        return;
      }
      
      const actor = (game as any).actors?.get(characterId);
      if (!actor) {
        ui.notifications?.error('Character not found.');
        return;
      }
      
      const currentPoints = (actor.system?.points?.[xpType] || 0);
      const newPoints = Math.max(0, currentPoints - amount);
      await actor.update({
        [`system.points.${xpType}`]: newPoints
      });
      
      ui.notifications?.info(`Removed ${amount} ${xpType === 'attribute' ? 'Attribute' : 'Mastery'} XP from ${actor.name}.`);
      
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
    'systems/mastery-system/templates/item/power-sheet.hbs',
    
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
/**
 * Normalize health.bars from object to array format
 * This ensures health bars are always stored as arrays, not objects
 */
function normalizeHealthBars(health: any): any {
  if (!health || !health.bars) {
    return health;
  }
  
  const bars = health.bars;
  // If bars is an object (not an array), convert to array
  if (!Array.isArray(bars) && typeof bars === 'object') {
    const barsArray = Object.keys(bars)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => bars[key]);
    health.bars = barsArray;
  }
  
  // Ensure each bar has required fields
  // Only set defaults if the value is missing (undefined/null), not if it's 0
  if (Array.isArray(health.bars)) {
    health.bars = health.bars.map((bar: any, index: number) => ({
      name: bar.name || `Bar ${index + 1}`,
      max: (bar.max !== undefined && bar.max !== null) ? bar.max : 30,
      current: (bar.current !== undefined && bar.current !== null) ? bar.current : ((bar.max !== undefined && bar.max !== null) ? bar.max : 30),
      penalty: (bar.penalty !== undefined && bar.penalty !== null) ? bar.penalty : 0
    }));
  }
  
  return health;
}

/**
 * Hook to normalize health.bars before actor updates
 * Ensures health.bars is always stored as an array, not an object
 */
Hooks.on('preUpdateActor', (actor: any, updateData: any, _options: any, _userId: string) => {
  if (actor.type === 'npc') {
    // Normalize main health bars
    if (updateData.system?.health?.bars) {
      updateData.system.health = normalizeHealthBars(updateData.system.health);
    }
    
    // Normalize phase health bars
    if (updateData.system?.phases && Array.isArray(updateData.system.phases)) {
      updateData.system.phases = updateData.system.phases.map((phase: any) => {
        if (phase.health?.bars) {
          phase.health = normalizeHealthBars(phase.health);
        }
        return phase;
      });
    }
  }
});

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
  
  // Initialize NPCs with 30 HP and health bar
  if (actor.type === 'npc' || actor.type === 'character') {
    if (!data.system) {
      data.system = {};
    }
    // Initialize health with 30 HP
    if (!data.system.health) {
      data.system.health = {
        bars: [
          {
            name: 'Healthy',
            max: 30,
            current: 30,
            penalty: 0
          }
        ],
        currentBar: 0,
        tempHP: 0
      };
    } else {
      // Ensure health bars exist and are initialized
      if (!data.system.health.bars || data.system.health.bars.length === 0) {
        data.system.health.bars = [
          {
            name: 'Healthy',
            max: 30,
            current: 30,
            penalty: 0
          }
        ];
      } else {
        // Set first bar to 30 HP if max is 0
        if (data.system.health.bars[0].max === 0) {
          data.system.health.bars[0].max = 30;
          data.system.health.bars[0].current = 30;
        }
      }
      if (data.system.health.currentBar === undefined) {
        data.system.health.currentBar = 0;
      }
      if (data.system.health.tempHP === undefined) {
        data.system.health.tempHP = 0;
      }
    }
    
    // Initialize statusEffects array
    if (!data.system.statusEffects) {
      data.system.statusEffects = [];
    }
    
    console.log('Mastery System | New NPC created - initialized with 30 HP and statusEffects');
  }
});

// Post-create hook to add default weapon if needed
Hooks.on('createActor', async (actor: any, _options: any, _userId: string) => {
  // Only add default weapon for characters and NPCs
  if (actor.type !== 'character' && actor.type !== 'npc') {
    return;
  }
  
  // Only add if this is the creating user (not a sync from another client)
  if (_userId !== (game as any).user?.id) {
    return;
  }
  
  try {
    // Check if actor has any weapon items
    const items = actor.items || [];
    const hasWeapon = items.some((item: any) => item.type === 'weapon');
    
    if (!hasWeapon) {
      // Create default "Unarmed" weapon
      const unarmedWeapon = {
        name: 'Unarmed',
        type: 'weapon',
        system: {
          weaponType: 'melee',
          damage: '1d8',
          range: '0m',
          specials: [],
          equipped: true,
          hands: 1,
          innateAbilities: [],
          description: 'Basic unarmed strikes using fists, feet, or natural weapons.'
        }
      };
      
      await actor.createEmbeddedDocuments('Item', [unarmedWeapon]);
      console.log(`Mastery System | Added default "Unarmed" weapon to ${actor.name}`);
    }
  } catch (error) {
    console.warn('Mastery System | Could not add default weapon to actor:', error);
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
/**
 * Equip Exclusivity Hook
 * Ensures only one weapon/armor/shield can be equipped at a time
 */
Hooks.on('preUpdateItem', async (item: any, changes: any, _options: any, _userId: string) => {
  // Only process if this is the updating user
  if (_userId !== (game as any).user?.id) {
    return;
  }
  
  // Only process if item is embedded in an actor and equipped is being set to true
  if (!item.parent || item.parent.documentName !== 'Actor') {
    return;
  }
  
  const itemType = item.type;
  if (!['weapon', 'armor', 'shield'].includes(itemType)) {
    return;
  }
  
  if (changes.system?.equipped !== true) {
    return;
  }
  
  const actor = item.parent;
  const items = actor.items || [];
  
  // Find all other items of the same type that are equipped
  const otherEquippedItems = items.filter((otherItem: any) => {
    return otherItem.id !== item.id && 
           otherItem.type === itemType && 
           (otherItem.system as any)?.equipped === true;
  });
  
  if (otherEquippedItems.length > 0) {
    // Unequip all other items of the same type
    const updates = otherEquippedItems.map((otherItem: any) => ({
      _id: otherItem.id,
      'system.equipped': false
    }));
    
    await actor.updateEmbeddedDocuments('Item', updates);
    console.log(`Mastery System | Unequipped ${otherEquippedItems.length} other ${itemType}(s) when equipping ${item.name}`);
  }
});

Hooks.once('ready', async () => {
  // Register attack roll click handler
  registerAttackRollClickHandler();
  
  // Migration: Add default weapon to existing actors if missing
  console.log('Mastery System | Running equipment migration...');
  
  const actors = (game as any).actors?.filter((a: any) => 
    a.type === 'character' || a.type === 'npc'
  ) || [];
  
  let migrated = 0;
  
  for (const actor of actors) {
    try {
      const items = actor.items || [];
      const hasWeapon = items.some((item: any) => item.type === 'weapon');
      
      if (!hasWeapon) {
        const unarmedWeapon = {
          name: 'Unarmed',
          type: 'weapon',
          system: {
            weaponType: 'melee',
            damage: '1d8',
            range: '0m',
            specials: [],
            equipped: true,
            hands: 1,
            innateAbilities: [],
            description: 'Basic unarmed strikes using fists, feet, or natural weapons.'
          }
        };
        
        await actor.createEmbeddedDocuments('Item', [unarmedWeapon]);
        migrated++;
        console.log(`Mastery System | Added default "Unarmed" weapon to ${actor.name}`);
      }
    } catch (error) {
      console.warn(`Mastery System | Could not migrate actor ${actor.name}:`, error);
    }
  }
  
  if (migrated > 0) {
    console.log(`Mastery System | Migrated ${migrated} actors (added default weapon)`);
  }
  
  // Optional: Try to backfill armor/shield items from system.combat.armorName/shieldName
  // This is optional and only runs if utils/equipment.ts exists
  try {
    const equipmentModule = await import('./utils/equipment.js');
    if (equipmentModule.getAllArmor && equipmentModule.getAllShields) {
      let backfilled = 0;
      
      for (const actor of actors) {
        try {
          const system = (actor as any).system;
          const combat = system?.combat || {};
          const items = actor.items || [];
          
          // Check for armor
          if (combat.armorName && !items.some((item: any) => item.type === 'armor')) {
            const allArmor = equipmentModule.getAllArmor();
            const matchingArmor = allArmor.find((a: any) => a.name === combat.armorName);
            
            if (matchingArmor) {
              const armorItem = {
                name: matchingArmor.name,
                type: 'armor',
                system: {
                  type: matchingArmor.type || 'light',
                  armorValue: matchingArmor.armorValue || 0,
                  skillPenalty: matchingArmor.skillPenalty || 0,
                  equipped: true,
                  description: matchingArmor.description || ''
                }
              };
              
              await actor.createEmbeddedDocuments('Item', [armorItem]);
              backfilled++;
              console.log(`Mastery System | Backfilled armor "${combat.armorName}" for ${actor.name}`);
            } else {
              console.warn(`Mastery System | Could not find armor definition for "${combat.armorName}" (actor: ${actor.name})`);
            }
          }
          
          // Check for shield
          if (combat.shieldName && !items.some((item: any) => item.type === 'shield')) {
            const allShields = equipmentModule.getAllShields();
            const matchingShield = allShields.find((s: any) => s.name === combat.shieldName);
            
            if (matchingShield) {
              const shieldItem = {
                name: matchingShield.name,
                type: 'shield',
                system: {
                  type: matchingShield.type || 'light',
                  shieldValue: matchingShield.shieldValue || 0,
                  evadeBonus: matchingShield.evadeBonus || 0,
                  skillPenalty: matchingShield.skillPenalty || 0,
                  equipped: true,
                  description: matchingShield.description || ''
                }
              };
              
              await actor.createEmbeddedDocuments('Item', [shieldItem]);
              backfilled++;
              console.log(`Mastery System | Backfilled shield "${combat.shieldName}" for ${actor.name}`);
            } else {
              console.warn(`Mastery System | Could not find shield definition for "${combat.shieldName}" (actor: ${actor.name})`);
            }
          }
        } catch (error) {
          console.warn(`Mastery System | Could not backfill equipment for ${actor.name}:`, error);
        }
      }
      
      if (backfilled > 0) {
        console.log(`Mastery System | Backfilled ${backfilled} equipment items`);
      }
    }
  } catch (error) {
    // utils/equipment.ts doesn't exist or doesn't export the needed functions - that's okay
    console.log('Mastery System | Equipment backfill skipped (utils/equipment.js not available)');
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
       ║  Version: 0.2.0                                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

