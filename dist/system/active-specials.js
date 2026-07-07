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
    }
    return undefined;
}
/** Normalized list of a creature's active Specials (id + value). */
export function readActiveSpecials(actor) {
    const list = actor?.system?.statusEffects;
    if (!Array.isArray(list))
        return [];
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
//# sourceMappingURL=active-specials.js.map