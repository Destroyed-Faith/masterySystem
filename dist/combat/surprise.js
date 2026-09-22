/**
 * Surprise — a GM-set token status, not a rulebook surprise round.
 *
 * While the status is on, Evade is halved. Applying it pins Initiative at 0
 * so everyone who still has a normal score acts first.
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
/** Half Evade, rounded down. Unsurprised scores pass through. */
export function evadeAfterSurprise(evade, surprised) {
    const n = Math.max(0, Math.floor(Number(evade) || 0));
    if (!surprised)
        return n;
    return Math.floor(n / 2);
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
/** Pin every matching combatant at Initiative 0. GM only. No-op outside combat. */
export async function pinSurprisedInitiative(actor, combat) {
    const game = globalThis.game;
    if (!game?.user?.isGM)
        return;
    const tracker = combat ?? game.combat;
    if (!tracker?.combatants || !actor)
        return;
    const matches = combatantsForActor(tracker, actor);
    let changed = false;
    for (const combatant of matches) {
        const current = Number(combatant.initiative);
        if (current !== 0)
            changed = true;
        try {
            await combatant.update({ initiative: 0 });
        }
        catch (err) {
            console.warn('Mastery System | Surprise initiative pin failed', err);
            continue;
        }
        try {
            await combatant.setFlag?.('mastery-system', 'msInitiativeValue', 0);
            await combatant.unsetFlag?.('mastery-system', 'pendingInitiativeShop');
            if (actor.type !== 'character') {
                await combatant.setFlag?.('mastery-system', 'npcInitiativeRolled', true);
            }
        }
        catch {
            /* flags are best-effort */
        }
    }
    if (!changed || matches.length === 0)
        return;
    try {
        const ChatMessage = globalThis.ChatMessage;
        if (typeof ChatMessage?.create === 'function') {
            const name = String(actor.name || 'Creature');
            await ChatMessage.create({
                speaker: typeof ChatMessage.getSpeaker === 'function' ? ChatMessage.getSpeaker({ actor }) : undefined,
                content: `<p><strong>Surprise</strong> — ${name}: Evade halved, Initiative 0.</p>`,
            });
        }
    }
    catch (err) {
        console.warn('Mastery System | Surprise chat note failed', err);
    }
}
//# sourceMappingURL=surprise.js.map