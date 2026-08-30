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
function resolveCombatant(actor) {
    if (!game.combat)
        return null;
    return game.combat.combatants.find((c) => c.actor?.id === actor.id) || null;
}
function onceAtATime(fn) {
    let busy = false;
    return () => {
        if (busy)
            return;
        busy = true;
        void fn().finally(() => {
            busy = false;
        });
    };
}
const handlePartySafeHavenRest = onceAtATime(async () => {
    try {
        await confirmAndApplySafeHavenRestToAllCharacters();
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Party Safe Haven Rest failed', err);
        ui.notifications?.error('Safe Haven Rest failed - see console');
    }
});
const handleUnluckMenu = onceAtATime(async () => {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can open the Unluck menu');
        return;
    }
    try {
        await UnluckGmDialog.open();
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Unluck menu failed', err);
        ui.notifications?.error('Unluck menu failed - see console');
    }
});
const handleKnownNpcsMenu = onceAtATime(async () => {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can choose which NPCs players see');
        return;
    }
    try {
        await KnownNpcsGmDialog.open();
    }
    catch (err) {
        console.error('Mastery System | [ERROR] Important NPCs menu failed', err);
        ui.notifications?.error('Important NPCs menu failed - see console');
    }
});
const MASTERY_TOOL_HANDLERS = {
    safeHavenRestAll: handlePartySafeHavenRest,
    unluckMenu: handleUnluckMenu,
    knownNpcsMenu: handleKnownNpcsMenu,
};
function bindMasteryToolClicks() {
    const sceneControls = document.querySelector('#scene-controls');
    if (!sceneControls)
        return;
    const existing = sceneControls._masteryToolClickHandler;
    if (existing) {
        sceneControls.removeEventListener('click', existing, true);
    }
    const clickHandler = (ev) => {
        const target = ev.target;
        const button = target?.closest?.('[data-tool]');
        if (!button || !sceneControls.contains(button))
            return;
        const toolName = button.getAttribute('data-tool');
        const handler = toolName ? MASTERY_TOOL_HANDLERS[toolName] : undefined;
        if (!handler)
            return;
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        handler();
    };
    sceneControls._masteryToolClickHandler = clickHandler;
    sceneControls.addEventListener('click', clickHandler, true);
}
/**
 * Initialize scene controls
 */
export function initializeSceneControls() {
    Hooks.on('getSceneControlButtons', (controls) => {
        const isGM = !!game.user?.isGM;
        controls.mastery = {
            name: 'mastery',
            title: 'Mastery',
            icon: 'fas fa-gem',
            layer: 'TokenLayer',
            tools: [
                {
                    name: 'safeHavenRestAll',
                    title: 'Safe Haven Rest — All Characters',
                    icon: 'fas fa-bed',
                    visible: isGM,
                    button: true,
                    onClick: handlePartySafeHavenRest,
                },
                {
                    name: 'unluckMenu',
                    title: 'Unluck / Misfortune',
                    icon: 'fas fa-cloud-moon',
                    visible: isGM,
                    button: true,
                    onClick: handleUnluckMenu,
                },
                {
                    name: 'knownNpcsMenu',
                    title: 'Important NPCs',
                    icon: 'fas fa-id-badge',
                    visible: isGM,
                    button: true,
                    onClick: handleKnownNpcsMenu,
                },
            ],
            activeTool: '',
            visible: true,
            restricted: false,
        };
    });
    Hooks.once('ready', () => bindMasteryToolClicks());
    Hooks.on('renderSceneControls', () => bindMasteryToolClicks());
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
        rightColumn.append(stonePowersBtn);
    });
}
//# sourceMappingURL=scene-controls-mastery.js.map