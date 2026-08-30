/**
 * Post-combat cleanup that runs on `combatEnd` / `deleteCombat`.
 *
 * Encounter-scoped resources always go away:
 *   - Temporary HP (sourced pools are cleared by `passive-triggers`; the scalar
 *     mirror is zeroed here so stone-granted / manual Temp HP cannot survive).
 *   - Temporary Colorless Stones (also on the action-economy owner document).
 *
 * Ongoing Special Effects are treated asymmetrically on purpose: NPC-side
 * creatures are wiped, player characters keep theirs. Players must resolve
 * their own stacks after the fight — that is part of the rules, not a bug.
 */
import { getActionEconomyActor } from './action-economy.js';
import { getCombatActors } from './passive-triggers.js';
import { deleteAllMasteryActiveBuffEffects } from '../utils/active-buffs.js';
import { clearTempColorlessStones } from '../stones/colorless-stones.js';
/** Actors whose ongoing effects are cleaned up automatically after the fight. */
function isNpcSide(actor) {
    return String(actor?.type ?? '') !== 'character';
}
/** Actor + action-economy owner (differs for unlinked token PCs), deduplicated. */
function actorWithEconomyOwner(actor) {
    const owner = getActionEconomyActor(actor) ?? actor;
    if (!owner || owner === actor || String(owner.id ?? '') === String(actor.id ?? '')) {
        return [actor];
    }
    return [actor, owner];
}
function collectCleanupActors(combat) {
    const out = [];
    const seen = new Set();
    for (const actor of getCombatActors(combat)) {
        for (const doc of actorWithEconomyOwner(actor)) {
            const id = String(doc?.id ?? doc?._id ?? '');
            if (id && seen.has(id))
                continue;
            if (id)
                seen.add(id);
            out.push(doc);
        }
    }
    return out;
}
/** Zero the Temp HP mirror on every combatant — Temp HP never outlives a fight. */
export async function resetTempHpAfterCombat(combat) {
    for (const actor of collectCleanupActors(combat)) {
        const current = Math.max(0, Math.floor(Number(actor?.system?.health?.tempHP ?? 0) || 0));
        if (current <= 0)
            continue;
        try {
            await actor.update?.({ 'system.health.tempHP': 0 });
        }
        catch (err) {
            console.warn('Mastery System | Temp HP reset after combat failed', err);
        }
    }
}
/** Leftover Temporary Colorless Stones vanish when the encounter ends. */
export async function clearColorlessStonesAfterCombat(combat) {
    for (const actor of collectCleanupActors(combat)) {
        try {
            await clearTempColorlessStones(actor);
        }
        catch (err) {
            console.warn('Mastery System | Colorless stone cleanup after combat failed', err);
        }
    }
}
/**
 * Drop ongoing Special Effects and Mastery active buffs from NPC-side
 * creatures. Player characters keep both so they have to resolve them
 * themselves after the encounter.
 */
export async function clearNpcOngoingEffectsAfterCombat(combat) {
    for (const actor of getCombatActors(combat)) {
        if (!isNpcSide(actor))
            continue;
        try {
            await deleteAllMasteryActiveBuffEffects(actor);
        }
        catch (err) {
            console.warn('Mastery System | NPC active buff cleanup after combat failed', err);
        }
        const list = actor?.system?.statusEffects;
        const hasSpecials = Array.isArray(list)
            ? list.length > 0
            : !!list && typeof list === 'object' && Object.keys(list).length > 0;
        if (!hasSpecials)
            continue;
        try {
            await actor.update?.({ 'system.statusEffects': [] });
        }
        catch (err) {
            console.warn('Mastery System | NPC special effect cleanup after combat failed', err);
        }
    }
}
/**
 * Fresh encounter: drop leftovers from a fight that ended without cleanup
 * (crash, no GM online, world from before the cleanup existed). Colorless
 * Stones only ever come from Initiative Exchange, so anything present before
 * the first conversion is stale, and a stale stone assignment snapshot would
 * otherwise reappear in the Stone Powers dialog.
 *
 * Runs at encounter preparation, never at `combatStart` — round-1 stones are
 * bought during the prepare phase and must survive.
 */
export async function clearStaleStoneStateBeforeEncounter(combat) {
    if (!combat)
        return;
    for (const actor of collectCleanupActors(combat)) {
        try {
            await clearTempColorlessStones(actor);
        }
        catch (err) {
            console.warn('Mastery System | Colorless stone reset before encounter failed', err);
        }
        try {
            await actor.unsetFlag?.('mastery-system', 'stonePowersRoundPlan');
        }
        catch (err) {
            console.warn('Mastery System | Could not clear stale stone assignment snapshot', err);
        }
    }
}
/** Single entry point for the `combatEnd` / `deleteCombat` hooks (GM only). */
export async function runCombatEndCleanup(combat) {
    if (!combat)
        return;
    await resetTempHpAfterCombat(combat);
    await clearColorlessStonesAfterCombat(combat);
    await clearNpcOngoingEffectsAfterCombat(combat);
    // A new post-combat First Aid window opens (once per creature per combat).
    try {
        const { clearFirstAidFlags } = await import('../utils/first-aid.js');
        await clearFirstAidFlags(collectCleanupActors(combat));
    }
    catch (err) {
        console.warn('Mastery System | First Aid flag reset failed', err);
    }
    // Damage Negation Reserve and accumulated Absorbed Damage die with the combat.
    try {
        const { clearDamageNegationForCombat } = await import('./damage-negation.js');
        await clearDamageNegationForCombat(combat);
    }
    catch (err) {
        console.warn('Mastery System | Damage Negation cleanup failed', err);
    }
    try {
        const { clearAbsorptionForCombat } = await import('./absorption.js');
        await clearAbsorptionForCombat(combat);
    }
    catch (err) {
        console.warn('Mastery System | Absorption cleanup failed', err);
    }
}
//# sourceMappingURL=combat-end-cleanup.js.map