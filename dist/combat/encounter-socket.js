/**
 * Encounter dialogs (passives, stone powers, initiative shop) for the
 * owning player — not only the GM. Combat document writes stay on the GM.
 */
import { ENCOUNTER_SOCKET, resolveLiveCombat, shouldShowEncounterDialogLocally, } from './combat-permissions.js';
let socketRegistered = false;
export function registerEncounterSocket() {
    if (socketRegistered)
        return;
    if (typeof game === 'undefined' || !game.socket)
        return;
    socketRegistered = true;
    game.socket.on(ENCOUNTER_SOCKET, (payload) => {
        void handleEncounterSocket(payload);
    });
}
async function handleEncounterSocket(payload) {
    if (!payload || typeof payload !== 'object')
        return;
    if (payload.action)
        return;
    const { type, combatId, combatantId, actorId, userId, data, finalInitiative, round } = payload;
    if (userId && userId !== game.user?.id)
        return;
    if (type === 'playerStartEncounter') {
        if (!game.user?.isGM)
            return;
        try {
            const { createAndBeginEncounter } = await import('./start-encounter.js');
            await createAndBeginEncounter({
                tokenIds: Array.isArray(payload.tokenIds) ? payload.tokenIds.map(String) : [],
                sceneId: String(payload.sceneId ?? ''),
                openLocally: false,
            });
        }
        catch (err) {
            console.error('Mastery System | Player Start Encounter failed', err);
        }
        return;
    }
    const combat = resolveLiveCombat(combatId);
    if (!combat || (combatId && combat.id !== combatId))
        return;
    switch (type) {
        case 'openPassiveSelection':
        case 'openStonePowers':
        case 'openInitiativeShop': {
            if (!shouldShowEncounterDialogLocally(combat.combatants.get(combatantId)?.actor))
                return;
            try {
                const { resumePlayerEncounterSetup } = await import('./player-encounter-setup.js');
                await resumePlayerEncounterSetup(combat);
            }
            catch (err) {
                console.error('Mastery System | Error resuming player encounter setup', err);
            }
            break;
        }
        case 'passiveSelectionComplete': {
            if (!game.user?.isGM)
                return;
            const { handlePassiveSelectionComplete } = await import('./encounter-start.js');
            await handlePassiveSelectionComplete(combat, actorId, data);
            break;
        }
        case 'stonePowersComplete': {
            if (!game.user?.isGM)
                return;
            const { handleStonePowersComplete } = await import('./stone-powers-flow.js');
            await handleStonePowersComplete(combat, combatantId, Number(round) || combat.round || 1);
            break;
        }
        case 'stoneRecoveryComplete': {
            if (!game.user?.isGM)
                return;
            const { handleStoneRecoveryComplete } = await import('./stone-powers-flow.js');
            await handleStoneRecoveryComplete(combat, combatantId, Number(round) || combat.round || 1);
            break;
        }
        case 'forceEncounterDialog': {
            const combatant = combat.combatants.get(combatantId);
            if (!combatant?.actor || !shouldShowEncounterDialogLocally(combatant.actor))
                return;
            try {
                const { openEncounterDialogLocally } = await import('./encounter-setup-status.js');
                await openEncounterDialogLocally(payload.kind, combatant, combat);
            }
            catch (err) {
                console.error('Mastery System | Forced encounter dialog failed', err);
            }
            break;
        }
        case 'initiativeConfirmed': {
            if (!game.user?.isGM)
                return;
            const { handleInitiativeConfirmed } = await import('./encounter-start.js');
            await handleInitiativeConfirmed(combat, combatantId, Number(finalInitiative) || 0);
            break;
        }
        case 'msShowCarousel': {
            const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
            CombatCarouselApp.open();
            break;
        }
        case 'msRefreshCarousel': {
            const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
            CombatCarouselApp.refresh();
            break;
        }
        default:
            break;
    }
}
//# sourceMappingURL=encounter-socket.js.map