/**
 * Scene Controls - Mastery Quick Access Menu
 * Adds a "Mastery" group to the left Scene Controls toolbar
 */
import { CombatCarouselApp } from './combat-carousel.js';
import { showDamageDialog } from '../dice/damage-dialog.js';
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { startDivineClash, revealDivineClash, endRoundDivineClash, resetDivineClash } from '../divine-clash/divine-clash.js';
/**
 * Resolve the active actor from selected token or user character
 */
function resolveActiveActor() {
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
function resolveCombatant(actor) {
    if (!game.combat)
        return null;
    return game.combat.combatants.find((c) => c.actor?.id === actor.id) || null;
}
/**
 * Initialize scene controls
 */
export function initializeSceneControls() {
    console.log('Mastery System | Initializing scene controls');
    Hooks.on('getSceneControlButtons', (controls) => {
        // In Foundry v13, controls is a Record (object), not an array
        // Add controls directly as properties
        const handleDamageDialogTest = async function () {
            console.log('Mastery System | Damage Dialog Test clicked');
            const actor = resolveActiveActor();
            if (!actor) {
                ui.notifications?.warn('Select a token or assign a User Character first.');
                return;
            }
            // Try to get a target
            const targets = Array.from(canvas?.tokens?.controlled || []);
            let targetActor = null;
            if (targets.length > 1) {
                // Use second selected token as target
                targetActor = targets[1]?.actor || null;
            }
            else {
                // Try to find a nearby token or use the same actor
                targetActor = actor;
            }
            if (!targetActor) {
                ui.notifications?.warn('Select a target token for damage testing.');
                return;
            }
            // Open damage dialog with dummy data
            try {
                await showDamageDialog(actor, targetActor, null, // weaponId
                null, // selectedPowerId
                0, // raises
                {} // flags
                );
            }
            catch (error) {
                console.error('Mastery System | Error opening damage dialog', error);
                ui.notifications?.error('Failed to open damage dialog. Check console for details.');
            }
        };
        const handleCarouselRefresh = function () {
            console.log('Mastery System | Carousel Refresh clicked');
            try {
                const instance = CombatCarouselApp.instance;
                if (instance && instance.rendered) {
                    CombatCarouselApp.refresh();
                    ui.notifications?.info('Combat Carousel refreshed.');
                }
                else {
                    CombatCarouselApp.open();
                    ui.notifications?.info('Combat Carousel opened.');
                }
            }
            catch (err) {
                console.error('Mastery System | Carousel Refresh failed', err);
                ui.notifications?.error('Carousel Refresh failed - see console');
            }
        };
        const handleDivineClashStart = async function () {
            if (!game.user?.isGM) {
                ui.notifications?.warn('Only the GM can start Divine Clash');
                return;
            }
            try {
                await startDivineClash();
            }
            catch (err) {
                console.error('Mastery System | Divine Clash Start failed', err);
                ui.notifications?.error('Divine Clash Start failed - see console');
            }
        };
        const handleDivineClashReveal = async function () {
            if (!game.user?.isGM) {
                ui.notifications?.warn('Only the GM can reveal Divine Clash');
                return;
            }
            try {
                await revealDivineClash();
            }
            catch (err) {
                console.error('Mastery System | Divine Clash Reveal failed', err);
                ui.notifications?.error('Divine Clash Reveal failed - see console');
            }
        };
        const handleDivineClashEndRound = async function () {
            if (!game.user?.isGM) {
                ui.notifications?.warn('Only the GM can end a round');
                return;
            }
            try {
                await endRoundDivineClash();
            }
            catch (err) {
                console.error('Mastery System | Divine Clash End Round failed', err);
                ui.notifications?.error('Divine Clash End Round failed - see console');
            }
        };
        const handleDivineClashReset = async function () {
            if (!game.user?.isGM) {
                ui.notifications?.warn('Only the GM can reset Divine Clash');
                return;
            }
            try {
                await resetDivineClash();
            }
            catch (err) {
                console.error('Mastery System | Divine Clash Reset failed', err);
                ui.notifications?.error('Divine Clash Reset failed - see console');
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
                },
                {
                    name: 'divineClashStart',
                    title: 'Divine Clash: Start',
                    icon: 'fas fa-chess',
                    onClick: handleDivineClashStart,
                    button: true
                },
                {
                    name: 'divineClashReveal',
                    title: 'Divine Clash: Reveal',
                    icon: 'fas fa-eye',
                    onClick: handleDivineClashReveal,
                    button: true
                },
                {
                    name: 'divineClashEndRound',
                    title: 'Divine Clash: End Round',
                    icon: 'fas fa-hourglass-end',
                    onClick: handleDivineClashEndRound,
                    button: true
                },
                {
                    name: 'divineClashReset',
                    title: 'Divine Clash: Reset',
                    icon: 'fas fa-trash',
                    onClick: handleDivineClashReset,
                    button: true
                }
            ],
            activeTool: '',
            visible: true
            // DO NOT set button: true on the control group - only on individual tools
        };
        console.log('Mastery System | Scene controls added:', controls.mastery);
        console.log('Mastery System | Tools with button:true:', controls.mastery.tools.filter((t) => t.button === true).map((t) => t.name));
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