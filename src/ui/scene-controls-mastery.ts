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
  console.log('Mastery System | [DEBUG] Divine Clash Start button clicked');
  console.log('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Divine Clash');
    return;
  }
  try {
    console.log('Mastery System | [DEBUG] Calling startDivineClash()');
    await startDivineClash();
    console.log('Mastery System | [DEBUG] startDivineClash() completed');
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Start failed', err);
    ui.notifications?.error('Divine Clash Start failed - see console');
  }
}

async function handleDivineClashReveal() {
  console.log('Mastery System | [DEBUG] Divine Clash Reveal button clicked');
  console.log('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reveal Divine Clash');
    return;
  }
  try {
    console.log('Mastery System | [DEBUG] Calling revealDivineClash()');
    await revealDivineClash();
    console.log('Mastery System | [DEBUG] revealDivineClash() completed');
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Reveal failed', err);
    ui.notifications?.error('Divine Clash Reveal failed - see console');
  }
}

async function handleDivineClashEndRound() {
  console.log('Mastery System | [DEBUG] Divine Clash End Round button clicked');
  console.log('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can end a round');
    return;
  }
  try {
    console.log('Mastery System | [DEBUG] Calling endRoundDivineClash()');
    await endRoundDivineClash();
    console.log('Mastery System | [DEBUG] endRoundDivineClash() completed');
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash End Round failed', err);
    ui.notifications?.error('Divine Clash End Round failed - see console');
  }
}

async function handleDivineClashReset() {
  console.log('Mastery System | [DEBUG] Divine Clash Reset button clicked');
  console.log('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reset Divine Clash');
    return;
  }
  try {
    console.log('Mastery System | [DEBUG] Calling resetDivineClash()');
    await resetDivineClash();
    console.log('Mastery System | [DEBUG] resetDivineClash() completed');
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Reset failed', err);
    ui.notifications?.error('Divine Clash Reset failed - see console');
  }
}

/**
 * Initialize scene controls
 */
export function initializeSceneControls(): void {
  console.log('Mastery System | Initializing scene controls');

  Hooks.on('getSceneControlButtons', (controls: any) => {
    console.log('Mastery System | [DEBUG] getSceneControlButtons hook called');
    console.log('Mastery System | [DEBUG] Controls object:', controls);
    console.log('Mastery System | [DEBUG] Controls keys:', Object.keys(controls));
    
    // In Foundry v13, controls is a Record (object), not an array
    // Add controls directly as properties
    
    // Create tool definitions with detailed logging
    // In Foundry V13, tools with button: true need both onClick and activate
    const tools = [
      {
        name: 'divineClashStart',
        title: 'Divine Clash: Start',
        icon: 'fas fa-chess',
        onClick: () => {
          console.log('Mastery System | [DEBUG] onClick() called for divineClashStart');
          handleDivineClashStart();
        },
        activate: () => {
          console.log('Mastery System | [DEBUG] activate() called for divineClashStart');
          handleDivineClashStart();
        },
        button: true
      },
      {
        name: 'divineClashReveal',
        title: 'Divine Clash: Reveal',
        icon: 'fas fa-eye',
        onClick: () => {
          console.log('Mastery System | [DEBUG] onClick() called for divineClashReveal');
          handleDivineClashReveal();
        },
        activate: () => {
          console.log('Mastery System | [DEBUG] activate() called for divineClashReveal');
          handleDivineClashReveal();
        },
        button: true
      },
      {
        name: 'divineClashEndRound',
        title: 'Divine Clash: End Round',
        icon: 'fas fa-hourglass-end',
        onClick: () => {
          console.log('Mastery System | [DEBUG] onClick() called for divineClashEndRound');
          handleDivineClashEndRound();
        },
        activate: () => {
          console.log('Mastery System | [DEBUG] activate() called for divineClashEndRound');
          handleDivineClashEndRound();
        },
        button: true
      },
      {
        name: 'divineClashReset',
        title: 'Divine Clash: Reset',
        icon: 'fas fa-trash',
        onClick: () => {
          console.log('Mastery System | [DEBUG] onClick() called for divineClashReset');
          handleDivineClashReset();
        },
        activate: () => {
          console.log('Mastery System | [DEBUG] activate() called for divineClashReset');
          handleDivineClashReset();
        },
        button: true
      }
    ];
    
    console.log('Mastery System | [DEBUG] Tools array created:', tools);
    console.log('Mastery System | [DEBUG] Handler function types:', {
      start: typeof handleDivineClashStart,
      reveal: typeof handleDivineClashReveal,
      endRound: typeof handleDivineClashEndRound,
      reset: typeof handleDivineClashReset
    });
    
    // Add Mastery group directly to controls object
    // In Foundry V13, tools with button: true should appear as buttons
    controls.mastery = {
      name: 'mastery',
      title: 'Mastery',
      icon: 'fas fa-gem',
      layer: 'TokenLayer',
      tools: tools,
      activeTool: '',
      visible: true,
      // Ensure the control group is visible and accessible
      restricted: false
    };
    
    console.log('Mastery System | [DEBUG] Scene controls added:', controls.mastery);
    console.log('Mastery System | [DEBUG] Tools with button:true:', controls.mastery.tools.filter((t: any) => t.button === true).map((t: any) => t.name));
    console.log('Mastery System | [DEBUG] Full controls.mastery object:', JSON.stringify(controls.mastery, null, 2));
    
    // Also hook into renderSceneControls to check if buttons are rendered and manually add them if needed
    Hooks.on('renderSceneControls', () => {
      console.log('Mastery System | [DEBUG] renderSceneControls hook fired');
      setTimeout(() => {
        const masteryControl = document.querySelector('[data-control="mastery"]');
        console.log('Mastery System | [DEBUG] Mastery control element found:', masteryControl);
        if (masteryControl) {
          // Check if buttons exist
          let buttons = masteryControl.querySelectorAll('[data-tool="divineClashStart"], [data-tool="divineClashReveal"], [data-tool="divineClashEndRound"], [data-tool="divineClashReset"]');
          console.log('Mastery System | [DEBUG] Divine Clash buttons found in DOM:', buttons.length);
          
          // If buttons don't exist, try to find the tools container and add them manually
          if (buttons.length === 0) {
            console.log('Mastery System | [DEBUG] Buttons not found, attempting to find tools container');
            const toolsContainer = masteryControl.querySelector('.control-tools') || masteryControl.querySelector('.tools');
            console.log('Mastery System | [DEBUG] Tools container found:', toolsContainer);
            
            if (toolsContainer) {
              // Try to manually inject buttons
              const buttonConfigs = [
                { name: 'divineClashStart', title: 'Divine Clash: Start', icon: 'fas fa-chess', handler: handleDivineClashStart },
                { name: 'divineClashReveal', title: 'Divine Clash: Reveal', icon: 'fas fa-eye', handler: handleDivineClashReveal },
                { name: 'divineClashEndRound', title: 'Divine Clash: End Round', icon: 'fas fa-hourglass-end', handler: handleDivineClashEndRound },
                { name: 'divineClashReset', title: 'Divine Clash: Reset', icon: 'fas fa-trash', handler: handleDivineClashReset }
              ];
              
              buttonConfigs.forEach(config => {
                const existingBtn = toolsContainer.querySelector(`[data-tool="${config.name}"]`);
                if (!existingBtn) {
                  const btn = document.createElement('button');
                  btn.type = 'button';
                  btn.className = 'control-tool';
                  btn.setAttribute('data-tool', config.name);
                  btn.setAttribute('data-tooltip', config.title);
                  btn.setAttribute('aria-label', config.title);
                  btn.innerHTML = `<i class="${config.icon}"></i>`;
                  btn.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    console.log(`Mastery System | [DEBUG] Manually injected button clicked: ${config.name}`);
                    config.handler();
                  });
                  toolsContainer.appendChild(btn);
                  console.log(`Mastery System | [DEBUG] Manually injected button: ${config.name}`);
                }
              });
            }
          } else {
            // Buttons exist, add click listeners
            buttons.forEach((btn, idx) => {
              console.log(`Mastery System | [DEBUG] Button ${idx}:`, btn, 'data-tool:', btn.getAttribute('data-tool'));
              // Add direct click listener for debugging
              btn.addEventListener('click', (ev) => {
                console.log('Mastery System | [DEBUG] Direct click event on button:', btn.getAttribute('data-tool'), ev);
              });
            });
          }
        }
      }, 500);
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
