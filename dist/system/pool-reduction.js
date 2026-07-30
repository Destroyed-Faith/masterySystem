/**
 * Canonical flat pool reductions from named Specials.
 *
 * Player's Guide "Order of Pool Reduction":
 *   1. base Attribute pool
 *   2. Skill full-/half-pool rule
 *   3. flat pool changes — including Weaken / Soulburn / Challenge / Disoriented
 *   4. percentage-based Health Penalty (dice loss rounded down)
 *   5. Minimum Pool = Mastery Rank (applied LAST)
 *   6. Keep = Mastery Rank unless a rule explicitly changes it
 *
 * Weaken(X):   −X dice from every rolled pool based on Might, Agility, or Intellect.
 * Soulburn(X): −X dice from every rolled pool based on Wits, Influence, or Resolve.
 * Vitality pools are affected by neither Special. Both reduce rolled pools only —
 * never the Attribute itself, Keep, Damage Pools, or derived values.
 *
 * Challenge(X): bound to the creature that applied it. Attack Pools for attacks
 * that do NOT include the challenger as a target are reduced by X. If the
 * challenger is included, the pool is not reduced.
 */
import { getActiveSpecialValue, readActiveSpecials } from './active-specials.js';
import { SPECIAL_EFFECTS_BY_ID } from '../utils/special-effects.js';
/** Attributes whose rolled pools are reduced by Weaken(X). */
export const WEAKEN_ATTRIBUTES = new Set(['might', 'agility', 'intellect']);
/** Attributes whose rolled pools are reduced by Soulburn(X). */
export const SOULBURN_ATTRIBUTES = new Set(['wits', 'influence', 'resolve']);
/**
 * Weaken / Soulburn reduction for a rolled pool built from `poolAttribute`.
 * Returns 0 when the attribute is unknown or not covered (e.g. Vitality).
 */
export function attributePoolReduction(actor, poolAttribute) {
    const out = { reduction: 0, notes: [] };
    const attr = String(poolAttribute ?? '').trim().toLowerCase();
    if (!actor || !attr)
        return out;
    if (WEAKEN_ATTRIBUTES.has(attr)) {
        const weaken = getActiveSpecialValue(actor, 'weaken');
        if (weaken > 0) {
            out.reduction += weaken;
            out.notes.push(`Weaken(${weaken}): −${weaken} dice (${attr} pool)`);
        }
    }
    if (SOULBURN_ATTRIBUTES.has(attr)) {
        const soulburn = getActiveSpecialValue(actor, 'soulburn');
        if (soulburn > 0) {
            out.reduction += soulburn;
            out.notes.push(`Soulburn(${soulburn}): −${soulburn} dice (${attr} pool)`);
        }
    }
    return out;
}
/** Read the current Challenge state on an actor (one challenger at a time). */
export function readChallengeState(actor) {
    const state = { value: 0, challengerUuid: null, challengerName: null };
    const list = actor?.system?.statusEffects;
    if (!Array.isArray(list))
        return state;
    for (const entry of list) {
        const id = String(entry?.id ?? '').toLowerCase();
        const name = String(entry?.name ?? '').toLowerCase();
        if (id === 'challenge' || name === 'challenge') {
            state.value += Math.max(0, Math.floor(Number(entry?.value ?? 0)));
            if (!state.challengerUuid && entry?.sourceUuid)
                state.challengerUuid = String(entry.sourceUuid);
            if (!state.challengerName && entry?.source)
                state.challengerName = String(entry.source);
        }
    }
    // Fallback via canonical reader in case entries only carry legacy names.
    if (state.value === 0)
        state.value = getActiveSpecialValue(actor, 'challenge');
    return state;
}
/**
 * Loose reference match: `refs` may contain actor ids, actor UUIDs
 * (`Actor.xyz`), or token-actor UUIDs (`Scene.x.Token.y`). The challenger is
 * "included as a target" when any ref resolves to the same underlying actor.
 */
function refMatchesChallenger(challengerUuid, ref) {
    if (!ref)
        return false;
    if (ref === challengerUuid)
        return true;
    // Compare trailing id segments (Actor.<id> vs plain <id>).
    const tail = (s) => s.split('.').pop() ?? s;
    if (tail(ref) === tail(challengerUuid))
        return true;
    return false;
}
/**
 * Resolve targets to their underlying actor references for challenger matching.
 * Accepts actor ids / uuids and token ids (resolved on the active scene).
 */
export function normalizeTargetRefs(refs) {
    const out = [];
    for (const raw of refs) {
        const r = String(raw ?? '').trim();
        if (!r)
            continue;
        out.push(r);
        try {
            const tokenDoc = globalThis.canvas?.tokens?.get?.(r)?.document;
            const tokenActor = tokenDoc?.actor;
            if (tokenActor?.uuid)
                out.push(String(tokenActor.uuid));
            if (tokenActor?.id)
                out.push(String(tokenActor.id));
        }
        catch {
            /* canvas unavailable (tests / headless) */
        }
    }
    return out;
}
/**
 * Challenge reduction for an Attack Pool. `targetRefs` is the set of actor /
 * token references the attack includes as targets (primary + AoE targets).
 */
export function challengePoolReduction(actor, targetRefs) {
    const out = { reduction: 0, notes: [] };
    if (!actor)
        return out;
    const state = readChallengeState(actor);
    if (state.value <= 0)
        return out;
    const challenger = state.challengerUuid;
    if (challenger) {
        const included = targetRefs.some((ref) => refMatchesChallenger(challenger, ref));
        if (included) {
            out.notes.push(`Challenge(${state.value}) not applied — challenger is a target`);
            return out;
        }
    }
    // Unknown challenger (legacy data): the reduction still applies, since the
    // attack cannot be shown to include the challenger.
    out.reduction = state.value;
    const who = state.challengerName ? ` (challenger: ${state.challengerName})` : '';
    out.notes.push(`Challenge(${state.value}): −${state.value} Attack Dice${who}`);
    return out;
}
/**
 * Apply the Challenge stacking rule when a new Challenge(X) lands on `target`:
 * - same challenger → add stacks (X → X + Y)
 * - different challenger → replace only if the new value is higher
 * Returns the updated statusEffects array entry list (does not persist).
 */
export function mergeChallengeEntry(list, newValue, sourceName, sourceUuid) {
    const isChallenge = (e) => String(e?.id ?? '').toLowerCase() === 'challenge' ||
        String(e?.name ?? '').toLowerCase() === 'challenge';
    const existing = list.find(isChallenge);
    if (!existing) {
        return [
            ...list,
            {
                id: 'challenge',
                name: 'Challenge',
                value: newValue,
                source: sourceName,
                sourceUuid: sourceUuid ?? undefined,
                timestamp: Date.now(),
            },
        ];
    }
    const sameSource = (sourceUuid && existing.sourceUuid && String(existing.sourceUuid) === sourceUuid) ||
        (!existing.sourceUuid && !sourceUuid);
    if (sameSource) {
        existing.value = Math.max(0, Math.floor(Number(existing.value ?? 0))) + newValue;
        if (sourceUuid && !existing.sourceUuid)
            existing.sourceUuid = sourceUuid;
        return list;
    }
    // Different challenger: replace only if strictly higher.
    if (newValue > Math.max(0, Math.floor(Number(existing.value ?? 0)))) {
        existing.value = newValue;
        existing.source = sourceName;
        existing.sourceUuid = sourceUuid ?? undefined;
        existing.timestamp = Date.now();
    }
    return list;
}
/** All active specials on the actor that Cleanse may target (dispellable, value > 0). */
export function cleansableSpecials(actor) {
    return readActiveSpecials(actor).filter((s) => s.value > 0 && isCleansable(s.id));
}
function isCleansable(id) {
    const effect = SPECIAL_EFFECTS_BY_ID.get(id);
    return !!effect?.dispellable;
}
/**
 * Apply Cleanse(X) to exactly one Special on `actor`.
 *
 * - Always affects a single Special (no split). Excess X is lost.
 * - If `chosenId` is omitted and only one cleansable Special exists, that one is used.
 * - If multiple exist and none is chosen, returns `applied: false` (caller should prompt).
 * Pure: does not persist — caller updates the actor.
 */
export function applyCleanseToList(statusEffects, cleanseX, chosenId) {
    const x = Math.max(0, Math.floor(Number(cleanseX) || 0));
    const list = Array.isArray(statusEffects) ? statusEffects.map((e) => ({ ...e })) : [];
    const empty = {
        applied: false,
        specialId: null,
        reducedBy: 0,
        remaining: 0,
        fullValueSpent: false,
        statusEffects: list,
    };
    if (x <= 0)
        return empty;
    const candidates = list.filter((e) => {
        const id = String(e?.id ?? '').toLowerCase();
        const name = String(e?.name ?? '').toLowerCase();
        const value = Math.max(0, Math.floor(Number(e?.value ?? 0)));
        if (value <= 0)
            return false;
        const canon = SPECIAL_EFFECTS_BY_ID.get(id) ? id : [...SPECIAL_EFFECTS_BY_ID.values()].find((eff) => eff.name.toLowerCase() === name)?.id;
        return !!canon && isCleansable(canon);
    });
    if (candidates.length === 0)
        return empty;
    let target = chosenId
        ? candidates.find((e) => String(e?.id ?? '').toLowerCase() === chosenId.toLowerCase() ||
            String(e?.name ?? '').toLowerCase() === chosenId.toLowerCase())
        : candidates.length === 1
            ? candidates[0]
            : undefined;
    if (!target)
        return empty;
    const before = Math.max(0, Math.floor(Number(target.value ?? 0)));
    const reducedBy = Math.min(x, before);
    const remaining = before - reducedBy;
    target.value = remaining;
    if (remaining <= 0) {
        const idx = list.indexOf(target);
        if (idx >= 0)
            list.splice(idx, 1);
    }
    return {
        applied: reducedBy > 0,
        specialId: String(target.id ?? target.name ?? '').toLowerCase() || null,
        reducedBy,
        remaining,
        fullValueSpent: reducedBy >= x && before >= x,
        statusEffects: list,
    };
}
/**
 * Persist Cleanse(X) onto an actor. When multiple Specials are eligible and
 * `chosenId` is omitted, opens a Dialog so the user picks exactly one.
 */
export async function applyCleanseToActor(actor, cleanseX, chosenId) {
    const list = Array.isArray(actor?.system?.statusEffects)
        ? [...actor.system.statusEffects]
        : [];
    const eligible = cleansableSpecials(actor);
    let pick = chosenId ?? null;
    if (!pick && eligible.length > 1 && typeof globalThis.Dialog === 'function') {
        pick = await new Promise((resolve) => {
            const buttons = {};
            for (const s of eligible) {
                const label = `${s.id}(${s.value})`;
                buttons[s.id] = {
                    label,
                    callback: () => resolve(s.id),
                };
            }
            buttons.cancel = {
                label: 'Cancel',
                callback: () => resolve(null),
            };
            new globalThis.Dialog({
                title: `Cleanse(${Math.floor(cleanseX)}) — choose one Special`,
                content: `<p>Cleanse affects exactly one Special. Excess value is lost.</p>`,
                buttons,
                default: eligible[0]?.id,
                close: () => resolve(null),
            }).render(true);
        });
        if (!pick) {
            return {
                applied: false,
                specialId: null,
                reducedBy: 0,
                remaining: 0,
                fullValueSpent: false,
                statusEffects: list,
            };
        }
    }
    const result = applyCleanseToList(list, cleanseX, pick);
    if (result.applied && actor?.update) {
        await actor.update({ 'system.statusEffects': result.statusEffects });
    }
    return result;
}
//# sourceMappingURL=pool-reduction.js.map