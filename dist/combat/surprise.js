/**
 * Surprise status marks a creature as unaware for contests.
 * Round-1 Surprise Priority is a separate flag and does not change Initiative.
 */
import { hasActiveSpecial, coerceStatusEffectsArray, readActorStatusEffects, statusEntryId, } from '../system/active-specials.js';
export const SURPRISE_STATUS_ID = 'surprise';
function statusIdOf(raw) {
    if (typeof raw === 'string')
        return raw.trim().toLowerCase();
    if (!raw || typeof raw !== 'object')
        return '';
    const rec = raw;
    return String(rec.id || rec.name || '').trim().toLowerCase();
}
/** True when an ActiveEffect / status document is the Surprise condition. */
export function effectCarriesSurprise(effect) {
    if (!effect)
        return false;
    const statuses = effect.statuses ?? effect.system?.statuses;
    if (statuses?.has?.(SURPRISE_STATUS_ID))
        return true;
    if (Array.isArray(statuses)) {
        if (statuses.some((s) => statusIdOf(s) === SURPRISE_STATUS_ID))
            return true;
    }
    else if (statuses && typeof statuses === 'object') {
        for (const key of Object.keys(statuses)) {
            if (key.toLowerCase() === SURPRISE_STATUS_ID)
                return true;
        }
    }
    const coreId = String(effect.flags?.core?.statusId ?? '').trim().toLowerCase();
    if (coreId === SURPRISE_STATUS_ID)
        return true;
    const name = String(effect.name ?? effect.label ?? '').trim().toLowerCase();
    return name === 'surprise' || name === 'surprised';
}
export function statusListHasSurprise(raw) {
    return coerceStatusEffectsArray(raw).some((entry) => {
        const id = statusEntryId(entry) || statusIdOf(entry);
        return id === SURPRISE_STATUS_ID || id === 'surprised';
    });
}
/** Token HUD (`actor.statuses` / effects) or the sheet `system.statusEffects` list. */
export function actorHasSurprise(actor) {
    if (!actor)
        return false;
    if (hasActiveSpecial(actor, SURPRISE_STATUS_ID))
        return true;
    if (statusListHasSurprise(readActorStatusEffects(actor)))
        return true;
    const statuses = actor.statuses;
    if (statuses?.has?.(SURPRISE_STATUS_ID))
        return true;
    if (statuses && typeof statuses[Symbol.iterator] === 'function' && typeof statuses.has !== 'function') {
        for (const entry of statuses) {
            const id = statusIdOf(entry);
            if (id === SURPRISE_STATUS_ID || id === 'surprised')
                return true;
        }
    }
    else if (statuses && typeof statuses.forEach === 'function') {
        let found = false;
        statuses.forEach((entry) => {
            const id = statusIdOf(entry);
            if (id === SURPRISE_STATUS_ID || id === 'surprised')
                found = true;
        });
        if (found)
            return true;
    }
    const effects = actor.effects;
    const list = effects?.contents
        ? effects.contents
        : effects && typeof effects[Symbol.iterator] === 'function'
            ? Array.from(effects)
            : [];
    return list.some((effect) => effectCarriesSurprise(effect));
}
/**
 * The old Surprise status halved Evade. Core v0.9.9.5 does not.
 * The score passes through. `surprised` stays in the signature so older callers compile.
 */
export function evadeAfterSurprise(evade, _surprised) {
    return Math.max(0, Math.floor(Number(evade) || 0));
}
function combatantList(combat) {
    const bag = combat?.combatants;
    if (!bag)
        return [];
    if (Array.isArray(bag.contents))
        return bag.contents;
    if (typeof bag.values === 'function')
        return Array.from(bag.values());
    if (typeof bag[Symbol.iterator] === 'function')
        return Array.from(bag);
    return [];
}
export function combatantsForActor(combat, actor) {
    if (!combat || !actor)
        return [];
    const actorId = String(actor.id ?? '');
    const baseId = String(actor._id ?? actor.id ?? '');
    const tokenId = String(actor.token?.id ?? actor.token?.document?.id ?? '');
    return combatantList(combat).filter((c) => {
        if (actorId && String(c.actor?.id ?? '') === actorId)
            return true;
        if (baseId && String(c.actorId ?? '') === baseId)
            return true;
        if (tokenId && String(c.tokenId ?? '') === tokenId)
            return true;
        return false;
    });
}
/**
 * Surprise Priority (Core v0.9.9.5): during Round 1 this creature acts before
 * combatants without the flag. The Initiative Score itself is not changed.
 */
/** Round 1, or before combat has started, and only against an unaware target. */
export function surprisePriorityShouldGrant(opts) {
    if (!opts.targetUnaware)
        return false;
    if (!opts.combatStarted)
        return true;
    return Math.floor(Number(opts.round) || 1) <= 1;
}
/** Attack against an unaware creature at the start of a fight. Initiative numbers stay put. */
export async function applySurprisePriorityForAttack(attacker, target, combat) {
    const { detectTargetUnaware } = await import('../contests/contest-card.js');
    const unaware = await detectTargetUnaware(attacker, target);
    const grant = surprisePriorityShouldGrant({
        combatStarted: combat?.started === true,
        round: Number(combat?.round) || 1,
        targetUnaware: unaware,
    });
    if (grant)
        await grantSurprisePriority(attacker, true);
    return grant;
}
export async function grantSurprisePriority(actor, enabled = true) {
    if (!actor?.setFlag)
        return;
    if (!enabled) {
        await actor.unsetFlag?.('mastery-system', 'surprisePriority');
    }
    else {
        await actor.setFlag('mastery-system', 'surprisePriority', true);
    }
    const combat = globalThis.game?.combat;
    if (combat && typeof combat.setupTurns === 'function') {
        try {
            await combat.setupTurns();
        }
        catch (err) {
            console.warn('Mastery System | Surprise Priority reorder failed', err);
        }
    }
}
/**
 * Retired. Surprise no longer pins Initiative at 0 or halves Evade.
 * Round-1 order is Surprise Priority (`grantSurprisePriority`).
 */
export async function pinSurprisedInitiative(_actor, _combat) {
    return;
}
//# sourceMappingURL=surprise.js.map