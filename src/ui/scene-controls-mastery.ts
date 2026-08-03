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
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can start Divine Clash');
    return;
  }
  try {
    await startDivineClash();
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Start failed', err);
    ui.notifications?.error('Divine Clash Start failed - see console');
  }
}

async function handleDivineClashReveal() {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reveal Divine Clash');
    return;
  }
  try {
    await revealDivineClash();
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Reveal failed', err);
    ui.notifications?.error('Divine Clash Reveal failed - see console');
  }
}

async function handleDivineClashEndRound() {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can end a round');
    return;
  }
  try {
    await endRoundDivineClash();
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash End Round failed', err);
    ui.notifications?.error('Divine Clash End Round failed - see console');
  }
}

async function handleDivineClashReset() {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can reset Divine Clash');
    return;
  }
  try {
    await resetDivineClash();
  } catch (err) {
    console.error('Mastery System | [ERROR] Divine Clash Reset failed', err);
    ui.notifications?.error('Divine Clash Reset failed - see console');
  }
}

/**
 * Initialize scene controls
 */
export function initializeSceneControls(): void {
  // Set up event delegation for Divine Clash buttons as soon as DOM is ready
  Hooks.once('ready', () => {
    const setupEventDelegation = () => {
      const sceneControls = document.querySelector('#scene-controls');
      if (!sceneControls) {
        // Try again after a short delay if not found
        setTimeout(setupEventDelegation, 500);
        return;
      }
      
      // Remove any existing listeners to avoid duplicates
      const existingListener = (sceneControls as any)._divineClashClickHandler;
      if (existingListener) {
        sceneControls.removeEventListener('click', existingListener);
      }
      
      // Create a single delegated click handler
      const clickHandler = (ev: Event) => {
        const target = ev.target as HTMLElement;
        const button = target.closest('[data-tool]') as HTMLElement;
        
        if (!button) {
          return;
        }
        
        const toolName = button.getAttribute('data-tool');
        if (!toolName || !toolName.startsWith('divineClash')) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        
        // Call the appropriate handler
        switch (toolName) {
          case 'divineClashStart':
            handleDivineClashStart();
            break;
          case 'divineClashReveal':
            handleDivineClashReveal();
            break;
          case 'divineClashEndRound':
            handleDivineClashEndRound();
            break;
          case 'divineClashReset':
            handleDivineClashReset();
            break;
        }
      };
      
      // Store reference to remove later if needed
      (sceneControls as any)._divineClashClickHandler = clickHandler;
      
      // Add event listener with capture to ensure we catch it before Foundry
      sceneControls.addEventListener('click', clickHandler, true);
    };
    
    setupEventDelegation();
  });

  Hooks.on('getSceneControlButtons', (controls: any) => {
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
          handleDivineClashStart();
        },
        activate: () => {
          handleDivineClashStart();
        },
        button: true
      },
      {
        name: 'divineClashReveal',
        title: 'Divine Clash: Reveal',
        icon: 'fas fa-eye',
        onClick: () => {
          handleDivineClashReveal();
        },
        activate: () => {
          handleDivineClashReveal();
        },
        button: true
      },
      {
        name: 'divineClashEndRound',
        title: 'Divine Clash: End Round',
        icon: 'fas fa-hourglass-end',
        onClick: () => {
          handleDivineClashEndRound();
        },
        activate: () => {
          handleDivineClashEndRound();
        },
        button: true
      },
      {
        name: 'divineClashReset',
        title: 'Divine Clash: Reset',
        icon: 'fas fa-trash',
        onClick: () => {
          handleDivineClashReset();
        },
        activate: () => {
          handleDivineClashReset();
        },
        button: true
      }
    ];
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
    // Set up event delegation for Divine Clash buttons
    // This ensures handlers work even if buttons are re-rendered by Foundry
    const setupEventDelegation = () => {
      const sceneControls = document.querySelector('#scene-controls');
      if (!sceneControls) {
        return;
      }
      
      // Remove any existing listeners to avoid duplicates
      const existingListener = (sceneControls as any)._divineClashClickHandler;
      if (existingListener) {
        sceneControls.removeEventListener('click', existingListener);
      }
      
      // Create a single delegated click handler
      const clickHandler = (ev: Event) => {
        const target = ev.target as HTMLElement;
        const button = target.closest('[data-tool]') as HTMLElement;
        
        if (!button) {
          return;
        }
        
        const toolName = button.getAttribute('data-tool');
        if (!toolName || !toolName.startsWith('divineClash')) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        
        // Call the appropriate handler
        switch (toolName) {
          case 'divineClashStart':
            handleDivineClashStart();
            break;
          case 'divineClashReveal':
            handleDivineClashReveal();
            break;
          case 'divineClashEndRound':
            handleDivineClashEndRound();
            break;
          case 'divineClashReset':
            handleDivineClashReset();
            break;
        }
      };
      
      // Store reference to remove later if needed
      (sceneControls as any)._divineClashClickHandler = clickHandler;
      
      // Add event listener with capture to ensure we catch it before Foundry
      sceneControls.addEventListener('click', clickHandler, true);
    };
    
    // Set up event delegation immediately and on every render
    setupEventDelegation();
    
    // Hook to inject buttons when the tools panel is rendered
    // In Foundry V13, tools with button: true should appear in the tools panel when the control is active
    Hooks.on('renderSceneControls', () => {
      // Re-setup event delegation in case DOM was recreated
      setupEventDelegation();
      
      // Use a MutationObserver to watch for when the tools panel appears
      const injectButtons = () => {
        // Find the tools panel
        const toolsPanel = document.querySelector('#scene-controls-tools');
        if (!toolsPanel) {
          return false;
        }
        
        // Find the mastery tools container
        const masteryToolsContainer = toolsPanel.querySelector('[data-control="mastery"]')?.closest('.control-tools') || 
                                      toolsPanel.querySelector('.control-tools[data-control="mastery"]');
        
        if (!masteryToolsContainer) {
          return false;
        }
        
        // Check if buttons already exist
        const existingButtons = masteryToolsContainer.querySelectorAll('[data-tool="divineClashStart"], [data-tool="divineClashReveal"], [data-tool="divineClashEndRound"], [data-tool="divineClashReset"]');
        if (existingButtons.length > 0) {
          return true;
        }
        // Create button configs
        const buttonConfigs = [
          { name: 'divineClashStart', title: 'Divine Clash: Start', icon: 'fas fa-chess', handler: handleDivineClashStart },
          { name: 'divineClashReveal', title: 'Divine Clash: Reveal', icon: 'fas fa-eye', handler: handleDivineClashReveal },
          { name: 'divineClashEndRound', title: 'Divine Clash: End Round', icon: 'fas fa-hourglass-end', handler: handleDivineClashEndRound },
          { name: 'divineClashReset', title: 'Divine Clash: Reset', icon: 'fas fa-trash', handler: handleDivineClashReset }
        ];
        
        buttonConfigs.forEach(config => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'control-tool';
          btn.setAttribute('data-tool', config.name);
          btn.setAttribute('data-tooltip', config.title);
          btn.setAttribute('aria-label', config.title);
          btn.innerHTML = `<i class="${config.icon}"></i>`;
          
          // Note: We don't add direct event listeners here anymore
          // Event delegation handles all clicks
          
          masteryToolsContainer.appendChild(btn);
        });
        
        return true;
      };
      
      // Try immediately
      setTimeout(() => {
        if (!injectButtons()) {
          // If not found, set up a MutationObserver to watch for the tools panel
          const observer = new MutationObserver(() => {
            if (injectButtons()) {
              observer.disconnect();
            }
          });
          
          const sceneControls = document.querySelector('#scene-controls');
          if (sceneControls) {
            observer.observe(sceneControls, {
              childList: true,
              subtree: true
            });
            
            // Stop observing after 5 seconds
            setTimeout(() => observer.disconnect(), 5000);
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
