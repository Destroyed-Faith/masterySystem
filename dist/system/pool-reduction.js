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
 * Apply a portion of a Cleanse to exactly one Special in the list.
 *
 * Single-target primitive used by `distributeCleanseAcrossList` — the
 * rulebook allows the Cleanse value to be distributed freely across several
 * eligible Specials.
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
 * Distribute Cleanse(X) freely across eligible Specials (Players Guide
 * "Cleanse(X)": remove up to X total points from one or more ongoing
 * negative Specials that list Cleanse: Yes; distribution is free; unused
 * value is lost).
 *
 * - With `allocations` (specialId → points) the given split is applied,
 *   clamped to each Special's current value and the total budget X.
 * - Without `allocations` the budget is spent greedily: highest stack
 *   first, spilling over into the next until X is exhausted.
 * Pure: does not persist — caller updates the actor.
 */
export function distributeCleanseAcrossList(statusEffects, cleanseX, allocations) {
    let budget = Math.max(0, Math.floor(Number(cleanseX) || 0));
    let list = Array.isArray(statusEffects) ? statusEffects.map((e) => ({ ...e })) : [];
    const steps = [];
    const eligibleRows = () => list
        .map((e) => {
        const rawId = String(e?.id ?? '').toLowerCase();
        const name = String(e?.name ?? '').toLowerCase();
        const canon = SPECIAL_EFFECTS_BY_ID.get(rawId)
            ? rawId
            : [...SPECIAL_EFFECTS_BY_ID.values()].find((eff) => eff.name.toLowerCase() === name)?.id;
        return { entry: e, id: canon ?? '', value: Math.max(0, Math.floor(Number(e?.value ?? 0))) };
    })
        .filter((r) => r.id && r.value > 0 && isCleansable(r.id));
    const spendOn = (id, amount) => {
        if (amount <= 0 || budget <= 0)
            return;
        const spend = Math.min(amount, budget);
        const result = applyCleanseToList(list, spend, id);
        if (!result.applied)
            return;
        list = result.statusEffects;
        budget -= result.reducedBy;
        steps.push({
            specialId: id,
            before: result.remaining + result.reducedBy,
            after: result.remaining,
            reducedBy: result.reducedBy,
        });
    };
    if (allocations && Object.keys(allocations).length > 0) {
        for (const [id, amount] of Object.entries(allocations)) {
            spendOn(String(id).toLowerCase(), Math.max(0, Math.floor(Number(amount) || 0)));
            if (budget <= 0)
                break;
        }
    }
    else {
        // Greedy: highest stack first, spill over until the budget is spent.
        let guard = 64;
        while (budget > 0 && guard-- > 0) {
            const rows = eligibleRows().sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
            if (!rows.length)
                break;
            spendOn(rows[0].id, rows[0].value);
        }
    }
    const totalReduced = steps.reduce((s, st) => s + st.reducedBy, 0);
    return {
        applied: totalReduced > 0,
        totalReduced,
        leftover: budget,
        steps,
        statusEffects: list,
    };
}
/** Human-readable summary of a Cleanse distribution ("Corrode 4→1, Hex ended"). */
export function formatCleanseDistribution(result) {
    return result.steps
        .map((s) => s.after > 0
        ? `${s.specialId}(${s.before}) → ${s.specialId}(${s.after})`
        : `${s.specialId}(${s.before}) ended`)
        .join(', ');
}
/**
 * Persist Cleanse(X) onto an actor. When multiple Specials are eligible and
 * `chosenId` is omitted, the value is distributed greedily across all
 * eligible Specials (free distribution per the rulebook).
 */
export async function applyCleanseToActor(actor, cleanseX, chosenId) {
    const list = Array.isArray(actor?.system?.statusEffects)
        ? [...actor.system.statusEffects]
        : [];
    // Explicit single-target pick (legacy callers / Reactive Cleanse).
    if (chosenId) {
        const result = applyCleanseToList(list, cleanseX, chosenId);
        if (result.applied && actor?.update) {
            await actor.update({ 'system.statusEffects': result.statusEffects });
        }
        return result;
    }
    // Free distribution across all eligible Specials (rulebook default).
    const distributed = distributeCleanseAcrossList(list, cleanseX);
    if (distributed.applied && actor?.update) {
        await actor.update({ 'system.statusEffects': distributed.statusEffects });
    }
    const first = distributed.steps[0] ?? null;
    return {
        applied: distributed.applied,
        specialId: first?.specialId ?? null,
        reducedBy: distributed.totalReduced,
        remaining: first?.after ?? 0,
        fullValueSpent: distributed.leftover <= 0 && distributed.totalReduced > 0,
        statusEffects: distributed.statusEffects,
    };
}
//# sourceMappingURL=pool-reduction.js.map