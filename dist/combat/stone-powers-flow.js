/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { buildCombatTurnSnapshot, buildCombatantsIteratorOrder, logInitiativeOrderDebug, } from '../utils/combat-trace-debug.js';
import { executeInitiativePhase, syncCombatTurnToHighestInitiativeFirst, } from './initiative-roll.js';
import { clearStonePowersConfigurationLocksInCombat, regenStonesEndOfRound, refillStonePoolsFromAttributes, resetRoundState, syncStonePoolCapsFromAttributes } from './action-economy.js';
import { log } from '../utils/logger.js';
const SOCKET_NAME = 'system.mastery-system';
function getStonePowersState(combat) {
    const flags = combat.flags['mastery-system'] || {};
    const state = flags.stonePowersState;
    if (!state) {
        return {
            roundStonesPrompted: {},
            stonesDone: {},
            initiativePhaseDoneByRound: {}
        };
    }
    return {
        ...state,
        initiativePhaseDoneByRound: state.initiativePhaseDoneByRound || {}
    };
}
async function updateStonePowersState(combat, updates) {
    const current = getStonePowersState(combat);
    const updated = { ...current, ...updates };
    await combat.setFlag('mastery-system', 'stonePowersState', updated);
}
async function markStonePowersDone(combat, combatantId, round) {
    const state = getStonePowersState(combat);
    state.stonesDone[combatantId] = round;
    await updateStonePowersState(combat, { stonesDone: state.stonesDone });
}
function areAllCombatantsDone(combat, round) {
    const state = getStonePowersState(combat);
    const allCombatants = Array.from(combat.combatants);
    return allCombatants.every((combatant) => state.stonesDone[combatant.id] === round);
}
/**
 * After stone powers: Round 1 runs the full initiative phase (dice + CR + Initiative Shop
 * for PCs, `setupTurns`, Mastery first-actor sync). Rounds 2+ keep the existing Initiative —
 * per the Players Guide, Initiative is NOT rolled again each round and the Initiative Shop
 * does not reopen automatically (only effects like Wits Stone Powers may allow it). We only
 * re-sync the turn pointer to the highest remaining Initiative. Idempotent per round via
 * `initiativePhaseDoneByRound`.
 */
export async function runInitiativePhaseAfterStones(combat, round) {
    const state = getStonePowersState(combat);
    logInitiativeOrderDebug('runInitiativePhaseAfterStones.enter', {
        round,
        initiativePhaseDoneForRound: !!state.initiativePhaseDoneByRound?.[round],
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
    if (state.initiativePhaseDoneByRound?.[round]) {
        log.debug('Mastery System | Initiative phase already done for round', round);
        return;
    }
    try {
        if (round <= 1) {
            logInitiativeOrderDebug('runInitiativePhaseAfterStones.runningExecuteInitiativePhase', {
                round,
                snapshot: buildCombatTurnSnapshot(combat),
            });
            await executeInitiativePhase(combat);
        }
        else {
            log.debug('Mastery System | Round', round, '— Initiative persists (no reroll / no shop); syncing turn pointer only');
            if (typeof combat.setupTurns === 'function') {
                await combat.setupTurns();
            }
            await syncCombatTurnToHighestInitiativeFirst(combat);
        }
    }
    catch (e) {
        console.error('Mastery System | Initiative phase failed', e);
        throw e;
    }
    const s = getStonePowersState(combat);
    await updateStonePowersState(combat, {
        initiativePhaseDoneByRound: { ...(s.initiativePhaseDoneByRound || {}), [round]: true }
    });
    logInitiativeOrderDebug('runInitiativePhaseAfterStones.done', {
        round,
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
}
async function openStonePowersForCombatant(combat, combatant, round) {
    const actor = combatant.actor;
    if (!actor) {
        console.warn('Mastery System | Cannot open stone powers: no actor for combatant', combatant.id);
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    if (actor.type === 'npc' || actor.type === 'summon' || actor.type === 'divine') {
        log.debug('Mastery System | Auto-resolving stone powers for NPC', actor.name);
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    const user = game.user;
    if (!user) {
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    if (!user.isGM && !actor.isOwner) {
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    try {
        log.debug('Mastery System | Opening stone powers dialog for', actor.name, 'round', round);
        await StonePowersDialog.showForActor(actor, combatant);
        await markStonePowersDone(combat, combatant.id, round);
        log.debug('Mastery System | Stone powers completed for', actor.name, 'round', round);
    }
    catch (error) {
        console.error('Mastery System | Error in stone powers dialog', error);
        await markStonePowersDone(combat, combatant.id, round);
    }
}
/**
 * Bei `updateCombat` mit neuem `round`: Locks für Stone-Powers-UI leeren, RoundState aller
 * Combatants zurücksetzen; ab Runde 2 zuerst Regen-Dialoge, dann Stone Powers + Initiative
 * (sofern `combat.started`). Runde 1: nur Reset — Stone Powers übernimmt `combatStart` /
 * Encounter-Flow.
 */
export async function runMasteryCombatRoundAdvancePipeline(combat, newRound) {
    await clearStonePowersConfigurationLocksInCombat(combat);
    // Wits "Initiative Boost" lasts "this round": remove last round's temporary
    // boost from the persisted Initiative before the new round is set up.
    for (const combatant of combat.combatants) {
        try {
            const boost = Number(combatant.getFlag('mastery-system', 'msInitiativeBoostThisRound') ?? 0) || 0;
            if (boost > 0) {
                const cur = Number(combatant.initiative ?? 0) || 0;
                const restored = Math.max(0, cur - boost);
                await combatant.update({ initiative: restored });
                await combatant.setFlag('mastery-system', 'msInitiativeValue', restored);
                log.debug('Mastery System | Initiative Boost expired', {
                    combatant: combatant.name,
                    boost,
                    restored,
                });
            }
            if (boost !== 0) {
                await combatant.unsetFlag('mastery-system', 'msInitiativeBoostThisRound');
            }
        }
        catch (e) {
            console.warn('Mastery System | Failed to revert Initiative Boost', e);
        }
    }
    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (actor)
            await resetRoundState(actor, combatant, combat);
    }
    if (newRound <= 1)
        return;
    await regenStonesEndOfRound(combat);
    if (combat.started) {
        await openStonePowersForAllCombatants(combat, newRound);
    }
}
export async function openStonePowersForAllCombatants(combat, round) {
    const state = getStonePowersState(combat);
    if (state.roundStonesPrompted[round]) {
        log.debug('Mastery System | Stone powers already prompted for round', round);
        return;
    }
    // Encounter flow opens round-1 stones before `combatStart`; `prepareBaseData` skips refilling
    // pools while in combat — persisted 0/0 pools never get current. Use combatant.actor so
    // unlinked token PCs get the same document the dialog uses.
    for (const c of combat.combatants) {
        const a = c.actor;
        if (!a || a.type !== 'character')
            continue;
        if (round === 1) {
            await refillStonePoolsFromAttributes(a);
        }
        else {
            await syncStonePoolCapsFromAttributes(a);
        }
    }
    await updateStonePowersState(combat, {
        roundStonesPrompted: { ...state.roundStonesPrompted, [round]: true }
    });
    log.debug('Mastery System | Opening stone powers for all combatants, round', round);
    const allCombatants = Array.from(combat.combatants);
    for (const combatant of allCombatants) {
        await openStonePowersForCombatant(combat, combatant, round);
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (areAllCombatantsDone(combat, round)) {
        log.debug('Mastery System | All combatants completed stone powers for round', round);
        await runInitiativePhaseAfterStones(combat, round);
    }
}
async function handleStonePowersComplete(combat, combatantId, round) {
    await markStonePowersDone(combat, combatantId, round);
    if (areAllCombatantsDone(combat, round)) {
        log.debug('Mastery System | All combatants completed stone powers for round', round);
        await runInitiativePhaseAfterStones(combat, round);
    }
}
export function initializeStonePowersFlow() {
    log.debug('Mastery System | Initializing stone powers flow system');
    game.socket?.on(SOCKET_NAME, async (payload) => {
        const { type, combatId, combatantId, round } = payload;
        if (type !== 'stonePowersComplete')
            return;
        const combat = game.combat;
        if (!combat || combat.id !== combatId)
            return;
        await handleStonePowersComplete(combat, combatantId, round);
    });
}
//# sourceMappingURL=stone-powers-flow.js.map