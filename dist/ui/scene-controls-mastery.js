/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { startDivineClash, revealDivineClash, endRoundDivineClash, resetDivineClash } from '../divine-clash/divine-clash.js';
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
    }
    catch (err) {
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
    }
    catch (err) {
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
    }
    catch (err) {
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
    console.log('Mastery System | Initializing scene controls');
    Hooks.on('getSceneControlButtons', (controls) => {
        console.log('Mastery System | [DEBUG] getSceneControlButtons hook called');
        console.log('Mastery System | [DEBUG] Controls object:', controls);
        console.log('Mastery System | [DEBUG] Controls keys:', Object.keys(controls));
        // In Foundry v13, controls is a Record (object), not an array
        // Add controls directly as properties
        // Create tool definitions with detailed logging
        const tools = [
            {
                name: 'divineClashStart',
                title: 'Divine Clash: Start',
                icon: 'fas fa-chess',
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
        // IMPORTANT: Do NOT set button: true on the control group itself in Foundry v13
        // Only set button: true on individual tools that should execute onClick immediately
        controls.mastery = {
            name: 'mastery',
            title: 'Mastery',
            icon: 'fas fa-gem',
            layer: 'TokenLayer',
            tools: tools,
            activeTool: '',
            visible: true
            // DO NOT set button: true on the control group - only on individual tools
        };
        console.log('Mastery System | [DEBUG] Scene controls added:', controls.mastery);
        console.log('Mastery System | [DEBUG] Tools with button:true:', controls.mastery.tools.filter((t) => t.button === true).map((t) => t.name));
        console.log('Mastery System | [DEBUG] Full controls.mastery object:', JSON.stringify(controls.mastery, null, 2));
        // Also hook into renderSceneControls to check if buttons are rendered
        Hooks.once('renderSceneControls', () => {
            console.log('Mastery System | [DEBUG] renderSceneControls hook fired');
            setTimeout(() => {
                const masteryControl = document.querySelector('[data-control="mastery"]');
                console.log('Mastery System | [DEBUG] Mastery control element found:', masteryControl);
                if (masteryControl) {
                    const buttons = masteryControl.querySelectorAll('[data-tool="divineClashStart"], [data-tool="divineClashReveal"], [data-tool="divineClashEndRound"], [data-tool="divineClashReset"]');
                    console.log('Mastery System | [DEBUG] Divine Clash buttons found in DOM:', buttons.length);
                    buttons.forEach((btn, idx) => {
                        console.log(`Mastery System | [DEBUG] Button ${idx}:`, btn, 'data-tool:', btn.getAttribute('data-tool'));
                        // Add direct click listener for debugging
                        btn.addEventListener('click', (ev) => {
                            console.log('Mastery System | [DEBUG] Direct click event on button:', btn.getAttribute('data-tool'), ev);
                        });
                    });
                }
            }, 1000);
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