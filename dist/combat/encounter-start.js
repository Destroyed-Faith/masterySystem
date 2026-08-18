/**
 * Encounter Start Flow
 *
 * Prepare Combat: mark setup started, show the carousel, notify players.
 * Player clients walk Passives → Stones. The fight does not start yet.
 * Start Combat (GM): sort by initiative and call Foundry startCombat.
 */
import { CombatCarouselApp } from '../ui/combat-carousel.js';
import { syncCombatTurnToHighestInitiativeFirst } from './initiative-roll.js';
import { ENCOUNTER_SOCKET, canCurrentUserUpdateCombat, canCurrentUserUpdateDocument, emitEncounterSocketToPlayerOwners, getSimulatePlayerEncounterId, resolveLiveCombat, setSimulatePlayerEncounter, } from './combat-permissions.js';
import { findCombatantByActorId, persistCombatantSetupStep } from './encounter-setup-flags.js';
import { encounterStartBlockers, isLaunchingLiveCombat, setLaunchingLiveCombat, } from './stone-round-gate.js';
/**
 * Get encounter setup state from combat flags
 */
export function getEncounterSetup(combat) {
    const flags = combat.flags['mastery-system'] || {};
    const setup = flags.encounterSetup;
    if (!setup || setup.combatId !== combat.id) {
        // Initialize new setup state
        return {
            started: false,
            combatId: combat.id,
            passives: {},
            initiativeConfirmed: {},
            carouselShown: false
        };
    }
    return setup;
}
/**
 * Update encounter setup state in combat flags
 */
async function updateEncounterSetup(combat, updates) {
    const live = resolveLiveCombat(combat);
    if (!live || !canCurrentUserUpdateCombat(live))
        return;
    const current = getEncounterSetup(live);
    const updated = { ...current, ...updates };
    await live.setFlag('mastery-system', 'encounterSetup', updated);
}
/**
 * Handle passive selection completion for a combatant
 */
export async function handlePassiveSelectionComplete(combat, actorId, data) {
    const live = resolveLiveCombat(combat);
    if (!live)
        return;
    const combatant = findCombatantByActorId(live, actorId);
    await persistCombatantSetupStep(combatant, live, { passivesLocked: true });
    if (!canCurrentUserUpdateCombat(live)) {
        game.socket?.emit(ENCOUNTER_SOCKET, {
            type: 'passiveSelectionComplete',
            combatId: combat.id,
            actorId,
            data,
        });
        return;
    }
    const setup = getEncounterSetup(live);
    setup.passives[actorId] = {
        locked: true,
        data: data || {},
    };
    await updateEncounterSetup(live, { passives: setup.passives });
}
/**
 * Handle initiative shop confirmation for a combatant
 */
export async function handleInitiativeConfirmed(combat, combatantId, finalInitiative) {
    const setup = getEncounterSetup(combat);
    setup.initiativeConfirmed[combatantId] = true;
    const liveForFlag = resolveLiveCombat(combat);
    const combatant = liveForFlag?.combatants.get(combatantId);
    await persistCombatantSetupStep(combatant, liveForFlag, { initiativeConfirmed: true });
    if (!canCurrentUserUpdateCombat(liveForFlag)) {
        game.socket?.emit(ENCOUNTER_SOCKET, {
            type: 'initiativeConfirmed',
            combatId: combat.id,
            combatantId,
            finalInitiative,
        });
        return;
    }
    const live = resolveLiveCombat(combat);
    if (!live)
        return;
    await updateEncounterSetup(live, { initiativeConfirmed: setup.initiativeConfirmed });
    combat = live;
    // Check if all PCs have confirmed (only GM can start combat)
    if (game.user?.isGM) {
        const allPCs = Array.from(combat.combatants).filter((c) => c.actor?.type === 'character');
        const allConfirmed = allPCs.length > 0 && allPCs.every((pc) => setup.initiativeConfirmed[pc.id]);
        if (allConfirmed) {
            game.socket?.emit(ENCOUNTER_SOCKET, {
                type: 'msRefreshCarousel',
                combatId: combat.id
            });
            CombatCarouselApp.refresh();
            ui.notifications?.info(game.i18n?.localize('MASTERY.encounterSetup.shopAllDone') ||
                'Alle Spieler haben die Initiative Exchange bestätigt. NSC-Ini prüfen, dann Kampf starten.');
        }
    }
}
export { encounterStartBlockers, isEncounterPreparing, isLaunchingLiveCombat, } from './stone-round-gate.js';
/** GM: roll leftover NPC initiative, sort, then actually start the fight. */
export async function launchLiveCombat(combat) {
    if (!game.user?.isGM) {
        ui.notifications?.warn(game.i18n?.localize('MASTERY.encounterSetup.gmOnly') || 'Nur der SL kann den Kampf starten.');
        return false;
    }
    const live = resolveLiveCombat(combat);
    if (!live)
        return false;
    combat = live;
    if (combat.started) {
        ui.notifications?.warn(game.i18n?.localize('MASTERY.encounterSetup.alreadyLive') || 'Der Kampf läuft bereits.');
        return false;
    }
    const blockers = encounterStartBlockers(combat);
    if (blockers.length) {
        ui.notifications?.warn((game.i18n?.localize('MASTERY.encounterSetup.startBlocked') || 'Noch offen: {list}').replace('{list}', blockers.join(', ')));
        return false;
    }
    setLaunchingLiveCombat(true);
    try {
        try {
            const { rollNpcInitiativeOnly } = await import('./initiative-roll.js');
            await rollNpcInitiativeOnly(combat);
        }
        catch (err) {
            console.error('Mastery System | NPC initiative before live start failed', err);
        }
        if (typeof combat.setupTurns === 'function') {
            await combat.setupTurns();
        }
        await combat.startCombat();
        const after = resolveLiveCombat(combat) ?? combat;
        if (typeof after.setupTurns === 'function') {
            await after.setupTurns();
        }
        await syncCombatTurnToHighestInitiativeFirst(after);
    }
    finally {
        setLaunchingLiveCombat(false);
    }
    CombatCarouselApp.refresh();
    ui.notifications?.info(game.i18n?.localize('MASTERY.encounterSetup.combatStarted') ||
        'Kampf gestartet. Höchste Initiative handelt zuerst.');
    return true;
}
/** Native Foundry Start Combat during prepare is redirected or blocked. */
export async function ensureEncounterSetupStarted(combat) {
    const live = resolveLiveCombat(combat);
    if (!live)
        return;
    const setup = getEncounterSetup(live);
    if (setup.started)
        return;
    if (!canCurrentUserUpdateCombat(live))
        return;
    await updateEncounterSetup(live, { started: true });
}
/**
 * Begin encounter: mark started, show carousel, tell player owners to set up.
 * Does not open Passives / Stones / Shop on the GM client.
 */
export async function beginEncounter(combat) {
    const canWrite = !!(game.user?.isGM || canCurrentUserUpdateDocument(combat));
    if (!canWrite && !getSimulatePlayerEncounterId()) {
        ui.notifications?.warn(game.i18n?.localize('MASTERY.startEncounter.needGm') || 'Nur der SL kann den Kampf vorbereiten.');
        return;
    }
    const setup = getEncounterSetup(combat);
    if (setup.started || combat.round > 0) {
        ui.notifications?.warn(game.i18n?.localize('MASTERY.startEncounter.already') || 'Schon in Vorbereitung');
        return;
    }
    await updateEncounterSetup(combat, { started: true });
    if (game.user?.isGM) {
        try {
            const { clearStaleStoneStateBeforeEncounter } = await import('./combat-end-cleanup.js');
            await clearStaleStoneStateBeforeEncounter(combat);
        }
        catch (err) {
            console.warn('Mastery System | Could not clear stale stone state before encounter', err);
        }
    }
    const currentSetup = getEncounterSetup(combat);
    if (!currentSetup.carouselShown) {
        CombatCarouselApp.open();
        game.socket?.emit(ENCOUNTER_SOCKET, {
            type: 'msShowCarousel',
            combatId: combat.id
        });
        await updateEncounterSetup(combat, { carouselShown: true });
    }
    try {
        const { rollNpcInitiativeOnly } = await import('./initiative-roll.js');
        await rollNpcInitiativeOnly(combat);
    }
    catch (err) {
        console.error('Mastery System | NPC initiative at encounter start failed', err);
    }
    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor || actor.type !== 'character')
            continue;
        emitEncounterSocketToPlayerOwners(actor, {
            type: 'openPassiveSelection',
            combatId: combat.id,
            combatantId: combatant.id,
            actorId: actor.id,
        });
    }
    const { resumePlayerEncounterSetup } = await import('./player-encounter-setup.js');
    void resumePlayerEncounterSetup(combat);
    ui.notifications?.info(game.i18n?.localize('MASTERY.encounterSetup.prepareStarted') ||
        'Vorbereitung gestartet. Spieler wählen Passives und Steine (Initiative Exchange). Danach „Kampf starten“.');
}
/**
 * Debounce helper for carousel refresh
 */
let carouselRefreshTimeout = null;
function refreshOpenCharacterSheets(combat) {
    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor || actor.type !== 'character')
            continue;
        const sheet = actor.sheet;
        if (sheet?.rendered) {
            try {
                void sheet.render?.(false);
            }
            catch {
                /* best-effort live setup status */
            }
        }
    }
}
function debouncedCarouselRefresh(delay = 150) {
    if (carouselRefreshTimeout !== null) {
        clearTimeout(carouselRefreshTimeout);
    }
    carouselRefreshTimeout = window.setTimeout(() => {
        const combat = game.combat;
        if (!combat)
            return;
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started and carousel is open
        if (setup?.started && CombatCarouselApp.instance && CombatCarouselApp.instance.rendered) {
            CombatCarouselApp.refresh();
        }
        carouselRefreshTimeout = null;
    }, delay);
}
/**
 * Initialize encounter start system
 */
export function initializeEncounterStart() {
    Hooks.on('preUpdateCombat', (combat, changes, _options, userId) => {
        if (userId !== game.user?.id)
            return;
        if (isLaunchingLiveCombat())
            return;
        if (changes?.round === undefined)
            return;
        const nextRound = Number(changes.round);
        if (!(combat.round === 0 && nextRound > 0))
            return;
        const setup = getEncounterSetup(combat);
        if (!setup.started) {
            void beginEncounter(combat);
        }
        else {
            void launchLiveCombat(combat);
        }
        return false;
    });
    // Hook: Update carousel when combat changes (debounced)
    Hooks.on('updateCombat', (combat, changes) => {
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started
        if (setup?.started) {
            debouncedCarouselRefresh(150);
        }
        const ms = changes?.flags?.['mastery-system'];
        if (ms?.encounterSetup || ms?.stonePowersState) {
            refreshOpenCharacterSheets(combat);
        }
        if (setup?.started || ms?.encounterSetup) {
            void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
                void resumePlayerEncounterSetup(combat);
            });
        }
    });
    // Hook: Update carousel when combatant changes (debounced)
    Hooks.on('updateCombatant', (_combatant, changes, _options, _userId) => {
        const combat = game.combat;
        if (!combat)
            return;
        const flags = combat.flags['mastery-system'] || {};
        const setup = flags.encounterSetup;
        // Only refresh if encounter setup has started
        if (setup?.started) {
            debouncedCarouselRefresh(150);
        }
        if (changes?.flags?.['mastery-system']) {
            refreshOpenCharacterSheets(combat);
        }
    });
    // Cleanup on combat end
    Hooks.on('deleteCombat', () => {
        // Clear any pending refresh
        if (carouselRefreshTimeout !== null) {
            clearTimeout(carouselRefreshTimeout);
            carouselRefreshTimeout = null;
        }
        setSimulatePlayerEncounter(null);
        void import('./player-encounter-setup.js').then(({ clearPlayerEncounterSetupSession }) => {
            clearPlayerEncounterSetupSession();
        });
    });
    Hooks.on('canvasReady', () => {
        void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
            void resumePlayerEncounterSetup();
        });
    });
    void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
        void resumePlayerEncounterSetup();
    });
}
//# sourceMappingURL=encounter-start.js.map