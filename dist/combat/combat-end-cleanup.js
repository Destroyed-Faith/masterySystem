/**
 * Post-combat cleanup that runs on `combatEnd` / `deleteCombat`.
 *
 * Encounter-scoped resources always go away:
 *   - Temporary HP (sourced pools are cleared by `passive-triggers`; the scalar
 *     mirror is zeroed here so stone-granted / manual Temp HP cannot survive).
 *   - Leftover Initiative Colorless Stones (used or unused). Item-granted
 *     Colorless Stones stay and follow that item's own combat rule.
 *
 * Ongoing Special Effects are wiped from every combatant when the fight
 * ends — PCs and NPCs. Leftover stacks on the sheet were too noisy, and
 * leftover NPC tokens (dead or not) must not keep Mark / Slow / etc.
 */
import { getActionEconomyActor } from './action-economy.js';
import { getCombatActors } from './passive-triggers.js';
import { deleteAllMasteryActiveBuffEffects } from '../utils/active-buffs.js';
import { clearInitiativeColorlessStones, getTempColorlessStones, } from '../stones/colorless-stones.js';
/** Non-player combatants also lose Mastery active buffs after the fight. */
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
function combatantActors(combat) {
    const combatants = combat?.combatants;
    if (!combatants)
        return getCombatActors(combat);
    const iter = typeof combatants[Symbol.iterator] === 'function'
        ? Array.from(combatants)
        : Array.isArray(combatants)
            ? combatants
            : [];
    const out = [];
    const seen = new Set();
    for (const combatant of iter) {
        const actor = combatant?.actor;
        if (!actor)
            continue;
        const tokenId = String(combatant.tokenId || combatant.token?.id || actor.token?.id || '');
        const key = tokenId ? `t:${tokenId}` : `a:${actor.id ?? actor._id ?? ''}`;
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        out.push(actor);
    }
    return out;
}
function collectCleanupActors(combat) {
    const out = [];
    const seen = new Set();
    const add = (actor) => {
        if (!actor)
            return;
        for (const doc of actorWithEconomyOwner(actor)) {
            const tokenId = String(doc?.token?.id || '');
            const id = String(doc?.id ?? doc?._id ?? '');
            const key = tokenId ? `t:${tokenId}` : `a:${id}`;
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            out.push(doc);
        }
    };
    for (const actor of combatantActors(combat))
        add(actor);
    return out;
}
function iterateWorldActors() {
    const col = globalThis.game?.actors;
    if (!col)
        return [];
    if (Array.isArray(col))
        return col;
    if (Array.isArray(col.contents))
        return col.contents;
    if (typeof col[Symbol.iterator] === 'function')
        return Array.from(col);
    if (typeof col.filter === 'function')
        return col.filter(() => true);
    return [];
}
/**
 * Combatants plus anyone still holding Colorless Stones. deleteCombat often
 * drops combatant.actor before the hook runs; leftover Initiative must not
 * survive just because the combatant list is already empty.
 */
function collectColorlessCleanupActors(combat) {
    const out = [];
    const seen = new Set();
    const add = (actor) => {
        if (!actor)
            return;
        for (const doc of actorWithEconomyOwner(actor)) {
            const tokenId = String(doc?.token?.id || '');
            const id = String(doc?.id ?? doc?._id ?? '');
            const key = tokenId ? `t:${tokenId}` : `a:${id}`;
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            out.push(doc);
        }
    };
    for (const actor of collectCleanupActors(combat))
        add(actor);
    for (const actor of iterateWorldActors()) {
        if (getTempColorlessStones(actor) > 0)
            add(actor);
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
/** Leftover Initiative Colorless Stones vanish when the encounter ends. */
export async function clearColorlessStonesAfterCombat(combat) {
    for (const actor of collectColorlessCleanupActors(combat)) {
        try {
            await clearInitiativeColorlessStones(actor);
        }
        catch (err) {
            console.warn('Mastery System | Colorless stone cleanup after combat failed', err);
        }
    }
}
/** No-GM / player client: drop leftover Initiative stones on owned actors only. */
export async function clearOwnedInitiativeColorlessAfterCombat(combat) {
    const { canCurrentUserUpdateDocument } = await import('./combat-permissions.js');
    for (const actor of collectColorlessCleanupActors(combat)) {
        if (!canCurrentUserUpdateDocument(actor))
            continue;
        try {
            await clearInitiativeColorlessStones(actor);
        }
        catch (err) {
            console.warn('Mastery System | Owned colorless leftover cleanup failed', err);
        }
    }
}
/**
 * Drop ongoing Special Effects from everyone who was in the fight.
 * Mastery active buffs are still NPC-only — those are slotted powers, not Stati.
 */
export async function clearNpcOngoingEffectsAfterCombat(combat) {
    const { readActorStatusEffects } = await import('../system/active-specials.js');
    const { writeActorStatusList } = await import('../system/assign-status.js');
    for (const actor of collectCleanupActors(combat)) {
        if (isNpcSide(actor)) {
            try {
                await deleteAllMasteryActiveBuffEffects(actor);
            }
            catch (err) {
                console.warn('Mastery System | NPC active buff cleanup after combat failed', err);
            }
        }
        const list = readActorStatusEffects(actor);
        if (!list.length)
            continue;
        try {
            await writeActorStatusList(actor, []);
        }
        catch (err) {
            console.warn('Mastery System | special effect cleanup after combat failed', err);
        }
    }
}
/**
 * Fresh encounter: drop leftover Initiative Colorless Stones from a fight
 * that ended without cleanup (crash, no GM online). Item-granted stones stay.
 * A stale stone assignment snapshot would otherwise reappear in the dialog.
 *
 * Runs at encounter preparation, never at `combatStart` — round-1 stones are
 * bought during the prepare phase and must survive.
 */
export async function clearStaleStoneStateBeforeEncounter(combat) {
    if (!combat)
        return;
    for (const actor of collectColorlessCleanupActors(combat)) {
        try {
            await clearInitiativeColorlessStones(actor);
        }
        catch (err) {
            console.warn('Mastery System | Colorless stone reset before encounter failed', err);
        }
    }
    for (const actor of collectCleanupActors(combat)) {
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
        await clearAbsorptionForCombat(combat, collectColorlessCleanupActors(combat));
    }
    catch (err) {
        console.warn('Mastery System | Absorption cleanup failed', err);
    }
}
//# sourceMappingURL=combat-end-cleanup.js.map