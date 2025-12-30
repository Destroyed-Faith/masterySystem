/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */

import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { startDivineClash, revealDivineClash, endRoundDivineClash, resetDivineClash } from '../divine-clash/divine-clash.js';

/**
 * Resolve combatant for active actor
 */
function resolveCombatant(actor: Actor): Combatant | null {
  if (!game.combat) return null;
  
  return game.combat.combatants.find((c: Combatant) => c.actor?.id === (actor as any).id) || null;
}

/**
 * Handler functions for Divine Clash buttons
 */
async function handleDivineClashStart() {
  console.log('Mastery System | Divine Clash Start button clicked');
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Divine Clash');
    return;
  }
  try {
    await startDivineClash();
  } catch (err) {
    console.error('Mastery System | Divine Clash Start failed', err);
    ui.notifications?.error('Divine Clash Start failed - see console');
  }
}

async function handleDivineClashReveal() {
  console.log('Mastery System | Divine Clash Reveal button clicked');
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reveal Divine Clash');
    return;
  }
  try {
    await revealDivineClash();
  } catch (err) {
    console.error('Mastery System | Divine Clash Reveal failed', err);
    ui.notifications?.error('Divine Clash Reveal failed - see console');
  }
}

async function handleDivineClashEndRound() {
  console.log('Mastery System | Divine Clash End Round button clicked');
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can end a round');
    return;
  }
  try {
    await endRoundDivineClash();
  } catch (err) {
    console.error('Mastery System | Divine Clash End Round failed', err);
    ui.notifications?.error('Divine Clash End Round failed - see console');
  }
}

async function handleDivineClashReset() {
  console.log('Mastery System | Divine Clash Reset button clicked');
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reset Divine Clash');
    return;
  }
  try {
    await resetDivineClash();
  } catch (err) {
    console.error('Mastery System | Divine Clash Reset failed', err);
    ui.notifications?.error('Divine Clash Reset failed - see console');
  }
}

/**
 * Initialize scene controls
 */
export function initializeSceneControls(): void {
  console.log('Mastery System | Initializing scene controls');

  Hooks.on('getSceneControlButtons', (controls: any) => {
    // In Foundry v13, controls is a Record (object), not an array
    // Add controls directly as properties
    
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
          name: 'divineClashStart',
          title: 'Divine Clash: Start',
          icon: 'fas fa-chess',
          onClick: () => handleDivineClashStart(),
          button: true
        },
        {
          name: 'divineClashReveal',
          title: 'Divine Clash: Reveal',
          icon: 'fas fa-eye',
          onClick: () => handleDivineClashReveal(),
          button: true
        },
        {
          name: 'divineClashEndRound',
          title: 'Divine Clash: End Round',
          icon: 'fas fa-hourglass-end',
          onClick: () => handleDivineClashEndRound(),
          button: true
        },
        {
          name: 'divineClashReset',
          title: 'Divine Clash: Reset',
          icon: 'fas fa-trash',
          onClick: () => handleDivineClashReset(),
          button: true
        }
      ],
      activeTool: '',
      visible: true
      // DO NOT set button: true on the control group - only on individual tools
    };
    
    console.log('Mastery System | Scene controls added:', controls.mastery);
    console.log('Mastery System | Tools with button:true:', controls.mastery.tools.filter((t: any) => t.button === true).map((t: any) => t.name));
    console.log('Mastery System | Handler functions:', {
      start: typeof handleDivineClashStart,
      reveal: typeof handleDivineClashReveal,
      endRound: typeof handleDivineClashEndRound,
      reset: typeof handleDivineClashReset
    });
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
