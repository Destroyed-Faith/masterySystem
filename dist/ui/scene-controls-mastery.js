/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { startDivineClash, revealDivineClash, endRoundDivineClash, resetDivineClash } from '../divine-clash/divine-clash.js';
import { log } from '../utils/logger.js';
/**
 * Resolve combatant for active actor
 */
function resolveCombatant(actor) {
    if (!game.combat)
        return null;
    return game.combat.combatants.find((c) => c.actor?.id === actor.id) || null;
}
/**
 * Handler functions for Divine Clash buttons
 */
async function handleDivineClashStart() {
    log.debug('Mastery System | [DEBUG] Divine Clash Start button clicked');
    log.debug('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start Divine Clash');
        return;
    }
    try {
        log.debug('Mastery System | [DEBUG] Calling startDivineClash()');
        await startDivineClash();
        log.debug('Mastery System | [DEBUG] startDivineClash() completed');
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Divine Clash Start failed', err);
        ui.notifications?.error('Divine Clash Start failed - see console');
    }
}
async function handleDivineClashReveal() {
    log.debug('Mastery System | [DEBUG] Divine Clash Reveal button clicked');
    log.debug('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can reveal Divine Clash');
        return;
    }
    try {
        log.debug('Mastery System | [DEBUG] Calling revealDivineClash()');
        await revealDivineClash();
        log.debug('Mastery System | [DEBUG] revealDivineClash() completed');
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Divine Clash Reveal failed', err);
        ui.notifications?.error('Divine Clash Reveal failed - see console');
    }
}
async function handleDivineClashEndRound() {
    log.debug('Mastery System | [DEBUG] Divine Clash End Round button clicked');
    log.debug('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can end a round');
        return;
    }
    try {
        log.debug('Mastery System | [DEBUG] Calling endRoundDivineClash()');
        await endRoundDivineClash();
        log.debug('Mastery System | [DEBUG] endRoundDivineClash() completed');
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Divine Clash End Round failed', err);
        ui.notifications?.error('Divine Clash End Round failed - see console');
    }
}
async function handleDivineClashReset() {
    log.debug('Mastery System | [DEBUG] Divine Clash Reset button clicked');
    log.debug('Mastery System | [DEBUG] User:', game.user?.name, 'isGM:', game.user?.isGM);
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can reset Divine Clash');
        return;
    }
    try {
        log.debug('Mastery System | [DEBUG] Calling resetDivineClash()');
        await resetDivineClash();
        log.debug('Mastery System | [DEBUG] resetDivineClash() completed');
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Divine Clash Reset failed', err);
        ui.notifications?.error('Divine Clash Reset failed - see console');
    }
}
/**
 * Initialize scene controls
 */
export function initializeSceneControls() {
    log.debug('Mastery System | Initializing scene controls');
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
            const existingListener = sceneControls._divineClashClickHandler;
            if (existingListener) {
                sceneControls.removeEventListener('click', existingListener);
            }
            // Create a single delegated click handler
            const clickHandler = (ev) => {
                const target = ev.target;
                const button = target.closest('[data-tool]');
                if (!button) {
                    return;
                }
                const toolName = button.getAttribute('data-tool');
                if (!toolName || !toolName.startsWith('divineClash')) {
                    return;
                }
                log.debug(`[DEBUG] Delegated click handler triggered for: ${toolName}`);
                ev.preventDefault();
                ev.stopPropagation();
                // Call the appropriate handler
                switch (toolName) {
                    case 'divineClashStart':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashStart');
                        handleDivineClashStart();
                        break;
                    case 'divineClashReveal':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashReveal');
                        handleDivineClashReveal();
                        break;
                    case 'divineClashEndRound':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashEndRound');
                        handleDivineClashEndRound();
                        break;
                    case 'divineClashReset':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashReset');
                        handleDivineClashReset();
                        break;
                }
            };
            // Store reference to remove later if needed
            sceneControls._divineClashClickHandler = clickHandler;
            // Add event listener with capture to ensure we catch it before Foundry
            sceneControls.addEventListener('click', clickHandler, true);
            log.debug('Mastery System | [DEBUG] Event delegation set up for Divine Clash buttons');
        };
        setupEventDelegation();
    });
    Hooks.on('getSceneControlButtons', (controls) => {
        log.debug('Mastery System | [DEBUG] getSceneControlButtons hook called');
        log.debug('Mastery System | [DEBUG] Controls object:', controls);
        log.debug('Mastery System | [DEBUG] Controls keys:', Object.keys(controls));
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
                    log.debug('Mastery System | [DEBUG] onClick() called for divineClashStart');
                    handleDivineClashStart();
                },
                activate: () => {
                    log.debug('Mastery System | [DEBUG] activate() called for divineClashStart');
                    handleDivineClashStart();
                },
                button: true
            },
            {
                name: 'divineClashReveal',
                title: 'Divine Clash: Reveal',
                icon: 'fas fa-eye',
                onClick: () => {
                    log.debug('Mastery System | [DEBUG] onClick() called for divineClashReveal');
                    handleDivineClashReveal();
                },
                activate: () => {
                    log.debug('Mastery System | [DEBUG] activate() called for divineClashReveal');
                    handleDivineClashReveal();
                },
                button: true
            },
            {
                name: 'divineClashEndRound',
                title: 'Divine Clash: End Round',
                icon: 'fas fa-hourglass-end',
                onClick: () => {
                    log.debug('Mastery System | [DEBUG] onClick() called for divineClashEndRound');
                    handleDivineClashEndRound();
                },
                activate: () => {
                    log.debug('Mastery System | [DEBUG] activate() called for divineClashEndRound');
                    handleDivineClashEndRound();
                },
                button: true
            },
            {
                name: 'divineClashReset',
                title: 'Divine Clash: Reset',
                icon: 'fas fa-trash',
                onClick: () => {
                    log.debug('Mastery System | [DEBUG] onClick() called for divineClashReset');
                    handleDivineClashReset();
                },
                activate: () => {
                    log.debug('Mastery System | [DEBUG] activate() called for divineClashReset');
                    handleDivineClashReset();
                },
                button: true
            }
        ];
        log.debug('Mastery System | [DEBUG] Tools array created:', tools);
        log.debug('Mastery System | [DEBUG] Handler function types:', {
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
        log.debug('Mastery System | [DEBUG] Scene controls added:', controls.mastery);
        log.debug('Mastery System | [DEBUG] Tools with button:true:', controls.mastery.tools.filter((t) => t.button === true).map((t) => t.name));
        log.debug('Mastery System | [DEBUG] Full controls.mastery object:', JSON.stringify(controls.mastery, null, 2));
        // Set up event delegation for Divine Clash buttons
        // This ensures handlers work even if buttons are re-rendered by Foundry
        const setupEventDelegation = () => {
            const sceneControls = document.querySelector('#scene-controls');
            if (!sceneControls) {
                return;
            }
            // Remove any existing listeners to avoid duplicates
            const existingListener = sceneControls._divineClashClickHandler;
            if (existingListener) {
                sceneControls.removeEventListener('click', existingListener);
            }
            // Create a single delegated click handler
            const clickHandler = (ev) => {
                const target = ev.target;
                const button = target.closest('[data-tool]');
                if (!button) {
                    return;
                }
                const toolName = button.getAttribute('data-tool');
                if (!toolName || !toolName.startsWith('divineClash')) {
                    return;
                }
                log.debug(`[DEBUG] Delegated click handler triggered for: ${toolName}`);
                ev.preventDefault();
                ev.stopPropagation();
                // Call the appropriate handler
                switch (toolName) {
                    case 'divineClashStart':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashStart');
                        handleDivineClashStart();
                        break;
                    case 'divineClashReveal':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashReveal');
                        handleDivineClashReveal();
                        break;
                    case 'divineClashEndRound':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashEndRound');
                        handleDivineClashEndRound();
                        break;
                    case 'divineClashReset':
                        log.debug('Mastery System | [DEBUG] Calling handleDivineClashReset');
                        handleDivineClashReset();
                        break;
                }
            };
            // Store reference to remove later if needed
            sceneControls._divineClashClickHandler = clickHandler;
            // Add event listener with capture to ensure we catch it before Foundry
            sceneControls.addEventListener('click', clickHandler, true);
            log.debug('Mastery System | [DEBUG] Event delegation set up for Divine Clash buttons');
        };
        // Set up event delegation immediately and on every render
        setupEventDelegation();
        // Hook to inject buttons when the tools panel is rendered
        // In Foundry V13, tools with button: true should appear in the tools panel when the control is active
        Hooks.on('renderSceneControls', () => {
            log.debug('Mastery System | [DEBUG] renderSceneControls hook fired');
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
                    log.debug('Mastery System | [DEBUG] Buttons already exist in tools panel');
                    return true;
                }
                log.debug('Mastery System | [DEBUG] Injecting buttons into tools panel');
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
                    log.debug(`[DEBUG] Injected button: ${config.name}`);
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
export function initializeTokenHUDButton() {
    Hooks.on('renderTokenHUD', (_hud, html, token) => {
        // Only show for character actors
        const actor = token.actor;
        if (!actor || actor.type !== 'character')
            return;
        // Find the right column (where other buttons are)
        const rightColumn = html.find('.col.right');
        if (rightColumn.length === 0)
            return;
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
        stonePowersBtn.on('click', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (!actor) {
                ui.notifications?.error('Actor not found');
                return;
            }
            try {
                const combatant = resolveCombatant(actor);
                await StonePowersDialog.showForActor(actor, combatant || null);
            }
            catch (error) {
                console.error('Mastery System | Error showing stone powers dialog', error);
                ui.notifications?.error('Failed to open stone powers dialog');
            }
        });
        // Insert before the last element (or append if empty)
        if (rightColumn.children().length > 0) {
            rightColumn.append(stonePowersBtn);
        }
        else {
            rightColumn.append(stonePowersBtn);
        }
    });
}
//# sourceMappingURL=scene-controls-mastery.js.map