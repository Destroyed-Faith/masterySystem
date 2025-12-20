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
        // Add Mastery group directly to controls object
        controls.mastery = {
            name: 'mastery',
            title: 'Mastery',
            icon: 'fas fa-gem',
            layer: 'TokenLayer',
            tools: [
                {
                    name: 'themePreview',
                    title: 'Theme Preview',
                    icon: 'fas fa-palette',
                    onClick: async () => {
                        console.log('Mastery System | Theme Preview clicked');
                        await ThemePreviewApp.show();
                    },
                    button: true
                },
                {
                    name: 'passiveSelection',
                    title: 'Passive Selection',
                    icon: 'fas fa-shield-halved',
                    onClick: async () => {
                        console.log('Mastery System | Passive Selection clicked');
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
                        }
                        else {
                            // Not in combat: create dummy combatant for preview
                            ui.notifications?.info('Opening Passive Selection in preview mode (not in combat).');
                            // For preview, we need to create a temporary combatant-like object
                            // Since PassiveSelectionDialog requires a Combatant, we'll show a simplified version
                            // or just show a notification that combat is required
                            ui.notifications?.warn('Passive Selection is only available during combat. Start a combat encounter first.');
                        }
                    },
                    button: true
                },
                {
                    name: 'initiativeShop',
                    title: 'Initiative Shop',
                    icon: 'fas fa-dice-d20',
                    onClick: async () => {
                        console.log('Mastery System | Initiative Shop clicked');
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
                        }
                        else {
                            // Not in combat: show preview with dummy context
                            ui.notifications?.info('Initiative Shop is only available during combat. Start a combat encounter first.');
                        }
                    },
                    button: true
                },
                {
                    name: 'stonePowers',
                    title: 'Stone Powers',
                    icon: 'fas fa-gem',
                    onClick: async () => {
                        console.log('Mastery System | Stone Powers clicked');
                        const actor = resolveActiveActor();
                        if (!actor) {
                            ui.notifications?.warn('Select a token or assign a User Character first.');
                            return;
                        }
                        const combatant = resolveCombatant(actor);
                        await StonePowersDialog.showForActor(actor, combatant || null);
                    },
                    button: true
                },
                {
                    name: 'damageDialogTest',
                    title: 'Damage Dialog Test',
                    icon: 'fas fa-burst',
                    onClick: async () => {
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
                    },
                    button: true
                },
                {
                    name: 'carouselRefresh',
                    title: 'Carousel Refresh',
                    icon: 'fas fa-arrows-rotate',
                    onClick: () => {
                        console.log('Mastery System | Carousel Refresh clicked');
                        const instance = CombatCarouselApp.instance;
                        if (instance && instance.rendered) {
                            CombatCarouselApp.refresh();
                            ui.notifications?.info('Combat Carousel refreshed.');
                        }
                        else {
                            CombatCarouselApp.open();
                            ui.notifications?.info('Combat Carousel opened.');
                        }
                    },
                    button: true
                }
            ],
            activeTool: '',
            visible: true,
            button: true
        };
        console.log('Mastery System | Scene controls added:', controls.mastery);
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