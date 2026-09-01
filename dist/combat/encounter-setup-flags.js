/**
 * Per-combatant encounter-setup locks. Players cannot write the Combat
 * document, but they can usually update their own Combatant — so confirm
 * survives Join Game As / reload even when no GM client is connected.
 */
import { canCurrentUserUpdateDocument } from './combat-permissions.js';
export const COMBATANT_SETUP_FLAG = 'encounterSetupStep';
export function readCombatantSetupStep(combatant, combat) {
    if (!combatant || !combat?.id)
        return null;
    const raw = combatant.getFlag?.('mastery-system', COMBATANT_SETUP_FLAG);
    if (!raw || String(raw.combatId) !== String(combat.id))
        return null;
    return raw;
}
export async function persistCombatantSetupStep(combatant, combat, patch) {
    if (!combatant || !combat?.id || !canCurrentUserUpdateDocument(combatant))
        return false;
    const prev = readCombatantSetupStep(combatant, combat) ?? { combatId: String(combat.id) };
    try {
        await combatant.setFlag('mastery-system', COMBATANT_SETUP_FLAG, {
            ...prev,
            combatId: String(combat.id),
            ...patch,
        });
        return true;
    }
    catch (err) {
        console.warn('Mastery System | Could not persist combatant setup step', err);
        return false;
    }
}
export function findCombatantByActorId(combat, actorId) {
    return Array.from(combat.combatants).find((c) => String(c.actor?.id ?? '') === String(actorId));
}
export function isPassiveSelectionLocked(combat, actorId) {
    if (combat.flags?.['mastery-system']?.encounterSetup?.passives?.[actorId]?.locked)
        return true;
    return readCombatantSetupStep(findCombatantByActorId(combat, actorId), combat)?.passivesLocked === true;
}
export function isPassivesReviewedThisEncounter(combat, combatant) {
    return readCombatantSetupStep(combatant, combat)?.passivesReviewed === true;
}
export function isStoneRegenDone(combat, combatantId, round) {
    const done = combat.flags?.['mastery-system']?.stonePowersState?.regenDone?.[combatantId];
    if (Number(done) === Number(round))
        return true;
    const combatant = combat.combatants.get(combatantId);
    return Number(readCombatantSetupStep(combatant, combat)?.regenDoneRound) === Number(round);
}
export function isCombatantInitiativeConfirmed(combat, combatantId) {
    if (combat.flags?.['mastery-system']?.encounterSetup?.initiativeConfirmed?.[combatantId])
        return true;
    const combatant = combat.combatants.get(combatantId);
    return readCombatantSetupStep(combatant, combat)?.initiativeConfirmed === true;
}
//# sourceMappingURL=encounter-setup-flags.js.map