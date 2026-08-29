/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */

import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { confirmAndApplySafeHavenRestToAllCharacters } from '../utils/safe-haven-rest.js';
import { UnluckGmDialog } from './unluck-gm-dialog.js';
import { KnownNpcsGmDialog } from './known-npcs-gm-dialog.js';

/**
 * Resolve combatant for active actor
 */
function resolveCombatant(actor: Actor): Combatant | null {
  if (!game.combat) return null;
  
  return game.combat.combatants.find((c: Combatant) => c.actor?.id === (actor as any).id) || null;
}

async function handlePartySafeHavenRest() {
  try {
    await confirmAndApplySafeHavenRestToAllCharacters();
  } catch (err) {
    console.error('Mastery System | [ERROR] Party Safe Haven Rest failed', err);
    ui.notifications?.error('Safe Haven Rest failed - see console');
  }
}

async function handleUnluckMenu() {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can open the Unluck menu');
    return;
  }
  try {
    await UnluckGmDialog.open();
  } catch (err) {
    console.error('Mastery System | [ERROR] Unluck menu failed', err);
    ui.notifications?.error('Unluck menu failed - see console');
  }
}

async function handleKnownNpcsMenu() {
  if (!game.user?.isGM) {
    ui.notifications?.warn('Only the GM can choose which NPCs players see');
    return;
  }
  try {
    await KnownNpcsGmDialog.open();
  } catch (err) {
    console.error('Mastery System | [ERROR] Important NPCs menu failed', err);
    ui.notifications?.error('Important NPCs menu failed - see console');
  }
}

const MASTERY_TOOL_HANDLERS: Record<string, () => void> = {
  safeHavenRestAll: handlePartySafeHavenRest,
  unluckMenu: handleUnluckMenu,
  knownNpcsMenu: handleKnownNpcsMenu,
};

/**
 * Initialize scene controls
 */
export function initializeSceneControls(): void {
  Hooks.once('ready', () => {
    const setupEventDelegation = () => {
      const sceneControls = document.querySelector('#scene-controls');
      if (!sceneControls) {
        // Try again after a short delay if not found
        setTimeout(setupEventDelegation, 500);
        return;
      }
      
      // Remove any existing listeners to avoid duplicates
      const existingListener = (sceneControls as any)._masteryToolClickHandler;
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
        const handler = toolName ? MASTERY_TOOL_HANDLERS[toolName] : undefined;
        if (!handler) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        handler();
      };
      
      // Store reference to remove later if needed
      (sceneControls as any)._masteryToolClickHandler = clickHandler;
      
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
        name: 'safeHavenRestAll',
        title: 'Safe Haven Rest — All Characters',
        icon: 'fas fa-bed',
        visible: !!(game as any).user?.isGM,
        onClick: () => {
          handlePartySafeHavenRest();
        },
        activate: () => {
          handlePartySafeHavenRest();
        },
        button: true
      },
      {
        name: 'unluckMenu',
        title: 'Unluck / Misfortune',
        icon: 'fas fa-cloud-moon',
        visible: !!(game as any).user?.isGM,
        onClick: () => {
          handleUnluckMenu();
        },
        activate: () => {
          handleUnluckMenu();
        },
        button: true
      },
      {
        name: 'knownNpcsMenu',
        title: 'Important NPCs',
        icon: 'fas fa-id-badge',
        visible: !!(game as any).user?.isGM,
        onClick: () => {
          handleKnownNpcsMenu();
        },
        activate: () => {
          handleKnownNpcsMenu();
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
    // Event delegation so handlers keep working if Foundry re-renders the tools
    const setupEventDelegation = () => {
      const sceneControls = document.querySelector('#scene-controls');
      if (!sceneControls) {
        return;
      }
      
      // Remove any existing listeners to avoid duplicates
      const existingListener = (sceneControls as any)._masteryToolClickHandler;
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
        const handler = toolName ? MASTERY_TOOL_HANDLERS[toolName] : undefined;
        if (!handler) {
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        handler();
      };
      
      // Store reference to remove later if needed
      (sceneControls as any)._masteryToolClickHandler = clickHandler;
      
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
        const existingButtons = masteryToolsContainer.querySelectorAll('[data-tool="safeHavenRestAll"], [data-tool="unluckMenu"], [data-tool="knownNpcsMenu"]');
        if (existingButtons.length > 0) {
          return true;
        }
        const isGM = !!(game as any).user?.isGM;
        const buttonConfigs = isGM
          ? [
              { name: 'safeHavenRestAll', title: 'Safe Haven Rest — All Characters', icon: 'fas fa-bed', handler: handlePartySafeHavenRest },
              { name: 'unluckMenu', title: 'Unluck / Misfortune', icon: 'fas fa-cloud-moon', handler: handleUnluckMenu },
              { name: 'knownNpcsMenu', title: 'Important NPCs', icon: 'fas fa-id-badge', handler: handleKnownNpcsMenu },
            ]
          : [];
        
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
