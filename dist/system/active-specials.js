/**
 * Shared read helpers for a creature's active Special Effects.
 *
 * On-hit specials are stored on the actor as `system.statusEffects[]` entries
 * (`{ id?, name?, value? }`). These helpers resolve them to canonical ids and
 * numeric values so derived-stat maluses (Slow, Corrode, Expose, Soulburn,
 * Weaken, Disoriented), the start-of-turn Tick, and combat riders can read a
 * single normalized view.
 */
import { getEffect, getEffectById, canonicalSpecialId } from '../utils/special-effects.js';
import { tokenDocOfActor } from './status-target.js';
function readMasteryFlag(actor, key) {
    if (!actor)
        return undefined;
    if (typeof actor.getFlag === 'function') {
        try {
            const flagged = actor.getFlag('mastery-system', key);
            if (flagged !== undefined)
                return flagged;
        }
        catch {
            /* fall through */
        }
    }
    return actor.flags?.['mastery-system']?.[key];
}
/**
 * Persist without `{ id: ... }` arrays. Foundry ActorDelta treats those as
 * embedded documents and drops them on unlinked NPC tokens.
 */
export function encodeStatusFlag(list) {
    return JSON.stringify(coerceStatusEffectsArray(list).map((entry) => {
        const row = {
            k: String(entry?.id ?? ''),
            n: String(entry?.name ?? ''),
            v: entry?.value ?? null,
        };
        if (entry?.source)
            row.s = String(entry.source);
        if (entry?.sourceUuid)
            row.u = String(entry.sourceUuid);
        if (entry?.sourceMasteryRank != null)
            row.m = Number(entry.sourceMasteryRank);
        if (entry?.timestamp != null)
            row.t = Number(entry.timestamp);
        return row;
    }));
}
function rowFromFlag(entry) {
    return {
        id: String(entry.k || ''),
        name: String(entry.n || ''),
        value: entry.v,
        source: entry.s,
        sourceUuid: entry.u,
        sourceMasteryRank: entry.m,
        timestamp: entry.t,
    };
}
/** Read the JSON flag, a leftover array flag, or a raw list. */
export function decodeStatusFlag(raw) {
    if (raw === undefined || raw === null)
        return undefined;
    let parsed = raw;
    if (typeof raw === 'string') {
        const text = raw.trim();
        if (!text)
            return undefined;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            return undefined;
        }
    }
    if (Array.isArray(parsed)) {
        return parsed.map((entry) => {
            if (entry && typeof entry === 'object' && entry.id == null && (entry.k != null || entry.n != null)) {
                return rowFromFlag(entry);
            }
            return entry;
        });
    }
    if (parsed && typeof parsed === 'object') {
        return coerceStatusEffectsArray(parsed);
    }
    return undefined;
}
/**
 * Live Specials on a creature. Scene-token flags survive unlinked NPCs;
 * actor flags and `system.statusEffects` are fallbacks.
 */
export function readActorStatusEffects(actor, tokenHint) {
    const token = tokenDocOfActor(actor) ?? tokenDocOfActor(tokenHint);
    const fromToken = decodeStatusFlag(readMasteryFlag(token, 'statusJson'));
    if (fromToken !== undefined)
        return coerceStatusEffectsArray(fromToken);
    const fromJson = decodeStatusFlag(readMasteryFlag(actor, 'statusJson'));
    if (fromJson !== undefined)
        return coerceStatusEffectsArray(fromJson);
    const fromFlag = decodeStatusFlag(readMasteryFlag(actor, 'statusEffects'));
    if (fromFlag !== undefined)
        return coerceStatusEffectsArray(fromFlag);
    return coerceStatusEffectsArray(actor?.system?.statusEffects);
}
function slugSpecialName(name) {
    return String(name || '')
        .replace(/\(X\)/gi, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
}
/** Resolve the canonical special id for a stored status entry. */
export function statusEntryId(entry) {
    if (entry?.id) {
        const byId = getEffectById(entry.id);
        if (byId)
            return byId.id;
        return canonicalSpecialId(entry.id);
    }
    if (entry?.name) {
        const byName = getEffect(entry.name);
        if (byName)
            return byName.id;
        const slug = slugSpecialName(entry.name);
        if (slug)
            return slug;
    }
    return undefined;
}
/** Normalized list of a creature's active Specials (id + value). */
export function readActiveSpecials(actor) {
    const list = readActorStatusEffects(actor);
    const out = [];
    for (const entry of list) {
        const id = statusEntryId(entry);
        if (!id)
            continue;
        out.push({ id, value: Math.max(0, Math.floor(Number(entry?.value ?? 0))) });
    }
    return out;
}
/**
 * Total value of a given active Special on a creature (0 when absent).
 * Diminishing Specials track a single stack value, so entries are summed.
 */
export function getActiveSpecialValue(actor, id) {
    let total = 0;
    for (const s of readActiveSpecials(actor)) {
        if (s.id === id)
            total += s.value;
    }
    return total;
}
/**
 * Whether a given Special is present on a creature at all — including
 * valueless conditions (Stunned, Prone, Immovable) whose entries carry no
 * numeric stack.
 */
export function hasActiveSpecial(actor, id) {
    const list = readActorStatusEffects(actor);
    for (const entry of list) {
        if (statusEntryId(entry) === id)
            return true;
    }
    return false;
}
/** Coerce Foundry object-shaped `statusEffects` to a real array. */
export function coerceStatusEffectsArray(raw) {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === 'object') {
        return Object.keys(raw)
            .filter((k) => /^\d+$/.test(k))
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => raw[k]);
    }
    return [];
}
/**
 * Reduce (or remove) one statusEffects entry by `steps`.
 * Non-positive / missing values are treated as a single stack (any reduce removes).
 */
export function reduceStatusEffectAt(list, index, steps) {
    const next = coerceStatusEffectsArray(list).map((e) => ({ ...e }));
    const i = Math.floor(Number(index));
    const n = Math.max(1, Math.floor(Number(steps) || 1));
    if (!Number.isFinite(i) || i < 0 || i >= next.length)
        return next;
    const entry = next[i];
    const rawVal = entry.value;
    const cur = rawVal === undefined || rawVal === null || rawVal === ''
        ? 0
        : Math.floor(Number(rawVal));
    if (!Number.isFinite(cur) || cur <= 0) {
        next.splice(i, 1);
        return next;
    }
    const remaining = cur - n;
    if (remaining <= 0) {
        next.splice(i, 1);
    }
    else {
        next[i] = { ...entry, value: remaining };
    }
    return next;
}
//# sourceMappingURL=active-specials.js.map