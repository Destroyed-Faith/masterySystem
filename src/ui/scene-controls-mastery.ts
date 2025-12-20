/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */

import { PassiveSelectionDialog } from '../sheets/passive-selection-dialog.js';
import { InitiativeShopDialog } from '../combat/initiative-shop-dialog.js';
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { CombatCarouselApp } from './combat-carousel.js';
import { ThemePreviewApp } from './theme-preview.js';
import { rollInitiativeForCombatant } from '../combat/initiative-roll.js';
import { showDamageDialog } from '../dice/damage-dialog.js';

/**
 * Resolve the active actor from selected token or user character
 */
function resolveActiveActor(): Actor | null {
  const controlled = canvas?.tokens?.controlled || [];
  if (controlled.length > 0 && controlled[0].actor) {
    return controlled[0].actor;
  }
  
  if (game.user?.character) {
    return game.user.character;
  }
  
  return null;
}

/**
 * Resolve combatant for active actor
 */
function resolveCombatant(actor: Actor): Combatant | null {
  if (!game.combat) return null;
  
  return game.combat.combatants.find((c: Combatant) => c.actor?.id === (actor as any).id) || null;
}

/**
 * Initialize scene controls
 */
export function initializeSceneControls(): void {
  console.log('Mastery System | Initializing scene controls');

  Hooks.on('getSceneControlButtons', (controls: any) => {
    // In Foundry v13, controls is a Record (object), not an array
    // Add controls directly as properties
    
    // Define theme preview handlers for each theme
    const handleThemePreviewRulebook = async function() {
      console.log('Mastery System | Theme preview clicked: rulebook');
      try {
        await ThemePreviewApp.show('rulebook');
      } catch (err) {
        console.error('Mastery System | Theme preview failed', err);
        ui.notifications?.error('Theme preview failed - see console');
      }
    };
    
    const handleThemePreviewEmber = async function() {
      console.log('Mastery System | Theme preview clicked: ember');
      try {
        await ThemePreviewApp.show('ember');
      } catch (err) {
        console.error('Mastery System | Theme preview failed', err);
        ui.notifications?.error('Theme preview failed - see console');
      }
    };
    
    const handleThemePreviewAshen = async function() {
      console.log('Mastery System | Theme preview clicked: ashen');
      try {
        await ThemePreviewApp.show('ashen');
      } catch (err) {
        console.error('Mastery System | Theme preview failed', err);
        ui.notifications?.error('Theme preview failed - see console');
      }
    };
    
    const handleThemePreviewBloodmoon = async function() {
      console.log('Mastery System | Theme preview clicked: bloodmoon');
      try {
        await ThemePreviewApp.show('bloodmoon');
      } catch (err) {
        console.error('Mastery System | Theme preview failed', err);
        ui.notifications?.error('Theme preview failed - see console');
      }
    };
    
    const handleThemePreviewCurrent = async function() {
      const currentTheme = (game as any).settings?.get('mastery-system', 'uiTheme') || 'rulebook';
      console.log(`Mastery System | Theme preview clicked: current (${currentTheme})`);
      try {
        await ThemePreviewApp.show();
      } catch (err) {
        console.error('Mastery System | Theme preview failed', err);
        ui.notifications?.error('Theme preview failed - see console');
      }
    };
    
    const handlePassiveSelection = async function() {
      console.log('Mastery System | Passive Selection clicked');
      try {
        const actor = resolveActiveActor();
        if (!actor) {
          ui.notifications?.warn('Select a token or assign a User Character first.');
          return;
        }

        // If in combat, use combatant; otherwise create dummy combatant for preview
        const combatant = resolveCombatant(actor);
        if (combatant) {
          // In combat: use existing dialog
          await PassiveSelectionDialog.showForCombatant(combatant, false);
        } else {
          // Not in combat: create dummy combatant for preview
          ui.notifications?.info('Opening Passive Selection in preview mode (not in combat).');
          ui.notifications?.warn('Passive Selection is only available during combat. Start a combat encounter first.');
        }
      } catch (err) {
        console.error('Mastery System | Passive Selection failed', err);
        ui.notifications?.error('Passive Selection failed - see console');
      }
    };
    
    const handleInitiativeShop = async function() {
      console.log('Mastery System | Initiative Shop clicked');
      try {
        const actor = resolveActiveActor();
        if (!actor) {
          ui.notifications?.warn('Select a token or assign a User Character first.');
          return;
        }

        const combatant = resolveCombatant(actor);
        if (combatant && game.combat) {
          // In combat: roll initiative and show shop
          const breakdown = await rollInitiativeForCombatant(combatant);
          await InitiativeShopDialog.showForCombatant(combatant, breakdown, game.combat);
        } else {
          // Not in combat: show preview with dummy context
          ui.notifications?.info('Initiative Shop is only available during combat. Start a combat encounter first.');
        }
      } catch (err) {
        console.error('Mastery System | Initiative Shop failed', err);
        ui.notifications?.error('Initiative Shop failed - see console');
      }
    };
    
    const handleStonePowers = async function() {
      console.log('Mastery System | Stone Powers clicked');
      try {
        const actor = resolveActiveActor();
        if (!actor) {
          ui.notifications?.warn('Select a token or assign a User Character first.');
          return;
        }

        const combatant = resolveCombatant(actor);
        await StonePowersDialog.showForActor(actor, combatant || null);
      } catch (err) {
        console.error('Mastery System | Stone Powers failed', err);
        ui.notifications?.error('Stone Powers failed - see console');
      }
    };
    
    const handleDamageDialogTest = async function() {
      console.log('Mastery System | Damage Dialog Test clicked');
      const actor = resolveActiveActor();
      if (!actor) {
        ui.notifications?.warn('Select a token or assign a User Character first.');
        return;
      }

      // Try to get a target
      const targets = Array.from(canvas?.tokens?.controlled || []);
      let targetActor: Actor | null = null;
      
      if (targets.length > 1) {
        // Use second selected token as target
        targetActor = (targets[1] as any)?.actor || null;
      } else {
        // Try to find a nearby token or use the same actor
        targetActor = actor;
      }

      if (!targetActor) {
        ui.notifications?.warn('Select a target token for damage testing.');
        return;
      }

      // Open damage dialog with dummy data
      try {
        await showDamageDialog(
          actor,
          targetActor,
          null, // weaponId
          null, // selectedPowerId
          0,    // raises
          {}    // flags
        );
      } catch (error) {
        console.error('Mastery System | Error opening damage dialog', error);
        ui.notifications?.error('Failed to open damage dialog. Check console for details.');
      }
    };
    
    const handleCarouselRefresh = function() {
      console.log('Mastery System | Carousel Refresh clicked');
      try {
        const instance = CombatCarouselApp.instance;
        if (instance && (instance as any).rendered) {
          CombatCarouselApp.refresh();
          ui.notifications?.info('Combat Carousel refreshed.');
        } else {
          CombatCarouselApp.open();
          ui.notifications?.info('Combat Carousel opened.');
        }
      } catch (err) {
        console.error('Mastery System | Carousel Refresh failed', err);
        ui.notifications?.error('Carousel Refresh failed - see console');
      }
    };
    
    // Add Mastery group directly to controls object
    // IMPORTANT: Do NOT set button: true on the control group itself in Foundry v13
    // Only set button: true on individual tools that should execute onClick immediately
    controls.mastery = {
      name: 'mastery',
      title: 'Mastery',
      icon: 'fas fa-gem',
      layer: 'TokenLayer',
      tools: [
        {
          name: 'themePreviewRulebook',
          title: 'Theme Preview: Rulebook',
          icon: 'fas fa-scroll',
          onClick: handleThemePreviewRulebook,
          button: true
        },
        {
          name: 'themePreviewEmber',
          title: 'Theme Preview: Ember',
          icon: 'fas fa-fire',
          onClick: handleThemePreviewEmber,
          button: true
        },
        {
          name: 'themePreviewAshen',
          title: 'Theme Preview: Ashen',
          icon: 'fas fa-mountain',
          onClick: handleThemePreviewAshen,
          button: true
        },
        {
          name: 'themePreviewBloodmoon',
          title: 'Theme Preview: Bloodmoon',
          icon: 'fas fa-moon',
          onClick: handleThemePreviewBloodmoon,
          button: true
        },
        {
          name: 'themePreviewCurrent',
          title: 'Theme Preview: Current',
          icon: 'fas fa-palette',
          onClick: handleThemePreviewCurrent,
          button: true
        },
        {
          name: 'passiveSelection',
          title: 'Passive Selection',
          icon: 'fas fa-shield-halved',
          onClick: handlePassiveSelection,
          button: true
        },
        {
          name: 'initiativeShop',
          title: 'Initiative Shop',
          icon: 'fas fa-dice-d20',
          onClick: handleInitiativeShop,
          button: true
        },
        {
          name: 'stonePowers',
          title: 'Stone Powers',
          icon: 'fas fa-gem',
          onClick: handleStonePowers,
          button: true
        },
        {
          name: 'damageDialogTest',
          title: 'Damage Dialog Test',
          icon: 'fas fa-burst',
          onClick: handleDamageDialogTest,
          button: true
        },
        {
          name: 'carouselRefresh',
          title: 'Carousel Refresh',
          icon: 'fas fa-arrows-rotate',
          onClick: handleCarouselRefresh,
          button: true
        }
      ],
      activeTool: '',
      visible: true
      // DO NOT set button: true on the control group - only on individual tools
    };
    
    console.log('Mastery System | Scene controls added:', controls.mastery);
    console.log('Mastery System | Tools with button:true:', controls.mastery.tools.filter((t: any) => t.button === true).map((t: any) => t.name));
  });
}

/**
 * Initialize Token HUD button for Stone Powers
 */
export function initializeTokenHUDButton(): void {
  Hooks.on('renderTokenHUD', (_hud: any, html: JQuery, token: Token) => {
    // Only show for character actors
    const actor = token.actor;
    if (!actor || actor.type !== 'character') return;

    // Find the right column (where other buttons are)
    const rightColumn = html.find('.col.right');
    if (rightColumn.length === 0) return;

    // Create Stone Powers button
    const stonePowersBtn = $(`
      <div class="control-icon ms-stone-powers-hud" 
           data-action="openStonePowers" 
           data-tooltip="Stone Powers"
           aria-label="Stone Powers"
           title="Stone Powers">
        <i class="fas fa-gem"></i>
      </div>
    `);

    // Add click handler
    stonePowersBtn.on('click', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (!actor) {
        ui.notifications?.error('Actor not found');
        return;
      }

      try {
        const combatant = resolveCombatant(actor);
        await StonePowersDialog.showForActor(actor, combatant || null);
      } catch (error) {
        console.error('Mastery System | Error showing stone powers dialog', error);
        ui.notifications?.error('Failed to open stone powers dialog');
      }
    });

    // Insert before the last element (or append if empty)
    if (rightColumn.children().length > 0) {
      rightColumn.append(stonePowersBtn);
    } else {
      rightColumn.append(stonePowersBtn);
    }
  });
}
