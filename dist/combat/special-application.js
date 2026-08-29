/**
 * Diminishing Special application limit and Natural Special Recovery.
 *
 * Application limit: a creature may receive at most 4 × Mastery Rank *new*
 * points of the same Diminishing Special during one combat Round. Existing
 * stacks from earlier Rounds do not count. Excess is ignored (not a max
 * stack). Tracking is internal — overflow is announced on the applying chat
 * message, not as a sheet counter.
 *
 * Natural Recovery: after Ticks at the start of the creature's Turn, the
 * creature chooses *one* negative Diminishing Special and reduces it by
 * Mastery Rank (minimum 0). Unused reduction is lost and cannot move to
 * another Special. A stored Stone Powers plan still applies at turn start;
 * otherwise the HUD applies the choice. A Special that reaches 0 ends.
 */
import { getEffectBaseName, getEffectById } from '../utils/special-effects.js';
import { readActiveSpecials, statusEntryId } from '../system/active-specials.js';
export const SPECIAL_ROUND_APPS_FLAG = 'specialRoundApps';
export const NATURAL_RECOVERY_FLAG = 'naturalSpecialRecovery';
export const SPECIAL_APPLICATION_LIMIT_PER_MR = 4;
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.specials.${key}`);
    return raw && raw !== `MASTERY.specials.${key}` ? raw : fallback;
}
function locFormat(key, data, fallback) {
    const formatted = globalThis.game?.i18n?.format?.(`MASTERY.specials.${key}`, data);
    if (formatted && formatted !== `MASTERY.specials.${key}`)
        return formatted;
    return fallback;
}
export function actorMasteryRank(actor) {
    return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}
export function specialApplicationLimit(masteryRank) {
    return SPECIAL_APPLICATION_LIMIT_PER_MR * Math.max(1, Math.floor(Number(masteryRank) || 1));
}
export function isDiminishingSpecialId(id) {
    if (!id)
        return false;
    return getEffectById(id)?.category === 'diminishing';
}
/** Regeneration is diminishing but beneficial — Natural Recovery never targets it. */
export function isNegativeDiminishingSpecialId(id) {
    if (!id)
        return false;
    const effect = getEffectById(id);
    if (!effect || effect.category !== 'diminishing')
        return false;
    return effect.polarity !== 'positive';
}
/** Negative diminishing Specials with a live stack — the HUD token source. */
export function listHudDiminishingSpecials(actor) {
    const rows = new Map();
    for (const s of readActiveSpecials(actor)) {
        if (!isNegativeDiminishingSpecialId(s.id) || s.value <= 0)
            continue;
        rows.set(s.id, (rows.get(s.id) ?? 0) + s.value);
    }
    return [...rows.entries()]
        .map(([id, value]) => ({ id, value, label: specialDisplayName(id) }))
        .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}
export function specialDisplayName(id) {
    const effect = getEffectById(id);
    return effect ? getEffectBaseName(effect.name) : id;
}
export function emptySpecialRoundApps(combat) {
    return {
        combatId: String(combat?.id ?? ''),
        round: Math.max(0, Math.floor(Number(combat?.round) || 0)),
        counts: {},
    };
}
export function readSpecialRoundApps(actor) {
    const raw = typeof actor?.getFlag === 'function'
        ? actor.getFlag('mastery-system', SPECIAL_ROUND_APPS_FLAG)
        : actor?.flags?.['mastery-system']?.[SPECIAL_ROUND_APPS_FLAG];
    if (!raw || typeof raw !== 'object')
        return null;
    const counts = {};
    const src = raw.counts;
    if (src && typeof src === 'object') {
        for (const [k, v] of Object.entries(src)) {
            const n = Math.max(0, Math.floor(Number(v) || 0));
            if (k && n > 0)
                counts[k] = n;
        }
    }
    return {
        combatId: String(raw.combatId ?? ''),
        round: Math.max(0, Math.floor(Number(raw.round) || 0)),
        counts,
    };
}
/** Reset counts when the combat or Round changes. */
export function syncSpecialRoundApps(stored, combat) {
    const next = emptySpecialRoundApps(combat);
    if (!stored)
        return next;
    if (stored.combatId !== next.combatId || stored.round !== next.round)
        return next;
    return { ...stored, counts: { ...stored.counts } };
}
export function remainingSpecialApplication(apps, specialId, limit) {
    const used = Math.max(0, Math.floor(Number(apps.counts[specialId]) || 0));
    return Math.max(0, limit - used);
}
export function addSpecialApplication(apps, specialId, amount) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    if (!specialId || add <= 0)
        return apps;
    const counts = { ...apps.counts };
    counts[specialId] = Math.max(0, Math.floor(Number(counts[specialId]) || 0)) + add;
    return { ...apps, counts };
}
/**
 * How many of `requested` new points may land this Round.
 * Out of combat, or for non-diminishing Specials, the full request lands.
 */
export function clampSpecialApplication(actor, specialId, requested, combat, priorApps) {
    const want = Math.max(0, Math.floor(Number(requested) || 0));
    if (!specialId || want <= 0 || !isDiminishingSpecialId(specialId) || !combat?.id) {
        return { applied: want, ignored: 0, limit: 0, usedThisRound: 0, nextApps: priorApps ?? null };
    }
    const limit = specialApplicationLimit(actorMasteryRank(actor));
    const apps = syncSpecialRoundApps(priorApps ?? readSpecialRoundApps(actor), combat);
    const remaining = remainingSpecialApplication(apps, specialId, limit);
    const applied = Math.min(want, remaining);
    const ignored = want - applied;
    const nextApps = addSpecialApplication(apps, specialId, applied);
    const usedThisRound = Math.max(0, Math.floor(Number(nextApps.counts[specialId]) || 0));
    return { applied, ignored, limit, usedThisRound, nextApps };
}
export function formatApplicationLimitNote(specialId, ignored, limit, masteryRank) {
    const name = specialDisplayName(specialId);
    return locFormat('applicationLimit', { name, ignored, limit, rank: masteryRank }, `${name}: ${ignored} new point(s) ignored — Round limit ${limit} (4 × MR ${masteryRank}) already reached.`);
}
export function formatNaturalRecoveryNote(specialId, before, after, reducedBy) {
    const name = specialDisplayName(specialId);
    if (after <= 0) {
        return locFormat('naturalRecoveryEnded', { name, reduced: reducedBy }, `Natural Recovery −${reducedBy} MR → ${name} ended`);
    }
    return locFormat('naturalRecovery', { name, before, after, reduced: reducedBy }, `Natural Recovery −${reducedBy} MR → ${name}(${before}) → ${name}(${after})`);
}
export function pickNaturalRecoveryTarget(entries) {
    const eligible = entries.filter((e) => isNegativeDiminishingSpecialId(e.id) && e.value > 0);
    if (!eligible.length)
        return null;
    eligible.sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
    return eligible[0];
}
export function applyNaturalRecoveryToValue(value, amount) {
    const before = Math.max(0, Math.floor(Number(value) || 0));
    const reduce = Math.max(0, Math.floor(Number(amount) || 0));
    const after = Math.max(0, before - reduce);
    return { after, reduced: before - after };
}
function eligibleRecoveryValues(entries) {
    const rows = new Map();
    for (const e of entries) {
        if (!isNegativeDiminishingSpecialId(e.id) || e.value <= 0)
            continue;
        rows.set(e.id, (rows.get(e.id) ?? 0) + Math.max(0, Math.floor(Number(e.value) || 0)));
    }
    return rows;
}
/** Spend the full MR on one Special (highest stack). Leftover is lost. */
export function greedyNaturalRecoveryPlan(entries, masteryRank) {
    const budget = Math.max(0, Math.floor(Number(masteryRank) || 0));
    if (budget <= 0)
        return [];
    const pick = pickNaturalRecoveryTarget([...eligibleRecoveryValues(entries).entries()].map(([id, value]) => ({ id, value })));
    if (!pick)
        return [];
    const { after, reduced } = applyNaturalRecoveryToValue(pick.value, budget);
    if (reduced <= 0)
        return [];
    return [{ id: pick.id, before: pick.value, after, reduced }];
}
export function clampNaturalRecoveryAllocations(entries, allocations, masteryRank) {
    const values = eligibleRecoveryValues(entries);
    let budget = Math.max(0, Math.floor(Number(masteryRank) || 0));
    const out = {};
    for (const id of Object.keys(allocations ?? {}).sort()) {
        if (!values.has(id))
            continue;
        const want = Math.max(0, Math.floor(Number(allocations?.[id]) || 0));
        const spend = Math.min(want, values.get(id) ?? 0, budget);
        if (spend > 0) {
            out[id] = spend;
            budget -= spend;
        }
    }
    return out;
}
export function planFromAllocations(entries, allocations, masteryRank) {
    const values = eligibleRecoveryValues(entries);
    const clamped = clampNaturalRecoveryAllocations(entries, allocations, masteryRank);
    const steps = [];
    for (const id of Object.keys(clamped).sort()) {
        const before = values.get(id) ?? 0;
        const reduced = clamped[id] ?? 0;
        if (reduced <= 0 || before <= 0)
            continue;
        steps.push({ id, before, after: before - reduced, reduced });
    }
    return steps;
}
export function specialRoundAppsUpdate(state) {
    if (!state)
        return {};
    return { [`flags.mastery-system.${SPECIAL_ROUND_APPS_FLAG}`]: state };
}
function sanitizeAllocations(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object')
        return out;
    for (const [k, v] of Object.entries(raw)) {
        const n = Math.max(0, Math.floor(Number(v) || 0));
        if (k && n > 0)
            out[k] = n;
    }
    return out;
}
export function emptyNaturalRecoveryChoice(combat) {
    return {
        combatId: String(combat?.id ?? ''),
        round: Math.max(0, Math.floor(Number(combat?.round) || 0)),
        chosen: false,
        allocations: {},
    };
}
export function readNaturalRecoveryChoice(actor) {
    const raw = typeof actor?.getFlag === 'function'
        ? actor.getFlag('mastery-system', NATURAL_RECOVERY_FLAG)
        : actor?.flags?.['mastery-system']?.[NATURAL_RECOVERY_FLAG];
    if (!raw || typeof raw !== 'object')
        return null;
    const src = raw;
    const allocations = sanitizeAllocations(src.allocations);
    // Legacy single-target flag: dump the whole remaining MR onto that Special.
    if (!Object.keys(allocations).length && src.specialId) {
        allocations[String(src.specialId)] = Number.MAX_SAFE_INTEGER;
    }
    return {
        combatId: String(src.combatId ?? ''),
        round: Math.max(0, Math.floor(Number(src.round) || 0)),
        chosen: src.chosen === true,
        allocations,
    };
}
export function matchingNaturalRecoveryChoice(actor, combat) {
    const stored = readNaturalRecoveryChoice(actor);
    if (!stored || !combat?.id)
        return null;
    const combatId = String(combat.id);
    const round = Math.max(0, Math.floor(Number(combat.round) || 0));
    if (stored.combatId !== combatId || stored.round !== round)
        return null;
    return stored;
}
export function naturalRecoveryAllocatedTotal(allocations) {
    let sum = 0;
    for (const n of Object.values(allocations ?? {}))
        sum += Math.max(0, Math.floor(Number(n) || 0));
    return sum;
}
function actorRecoveryEntries(actor) {
    const rows = new Map();
    for (const s of readActiveSpecials(actor)) {
        if (!isNegativeDiminishingSpecialId(s.id) || s.value <= 0)
            continue;
        rows.set(s.id, (rows.get(s.id) ?? 0) + s.value);
    }
    return [...rows.entries()].map(([id, value]) => ({ id, value }));
}
export function listNaturalRecoveryOptions(actor, combat) {
    const choice = matchingNaturalRecoveryChoice(actor, combat);
    const entries = actorRecoveryEntries(actor);
    const rank = actorMasteryRank(actor);
    const skipped = choice?.chosen === true && naturalRecoveryAllocatedTotal(choice.allocations) <= 0;
    const allocated = skipped ? {} : clampNaturalRecoveryAllocations(entries, choice?.allocations, rank);
    const spent = naturalRecoveryAllocatedTotal(allocated);
    return entries
        .map((row) => {
        const n = allocated[row.id] ?? 0;
        return {
            id: row.id,
            value: row.value,
            label: `${specialDisplayName(row.id)}(${row.value})`,
            allocated: n,
            canAdd: n < row.value && spent < rank,
            canRemove: n > 0,
        };
    })
        .sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
}
async function writeNaturalRecoveryChoice(actor, next) {
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', NATURAL_RECOVERY_FLAG, next);
        return;
    }
    if (typeof actor.update === 'function') {
        await actor.update({ [`flags.mastery-system.${NATURAL_RECOVERY_FLAG}`]: next });
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = { ...(actor.flags['mastery-system'] || {}), [NATURAL_RECOVERY_FLAG]: next };
}
export async function setNaturalRecoveryAllocations(actor, combat, allocations, chosen = true) {
    if (!actor || !combat?.id)
        return;
    const next = {
        ...emptyNaturalRecoveryChoice(combat),
        chosen,
        allocations: clampNaturalRecoveryAllocations(actorRecoveryEntries(actor), allocations, actorMasteryRank(actor)),
    };
    await writeNaturalRecoveryChoice(actor, next);
}
export async function setNaturalRecoverySkipped(actor, combat) {
    if (!actor || !combat?.id)
        return;
    await writeNaturalRecoveryChoice(actor, { ...emptyNaturalRecoveryChoice(combat), chosen: true, allocations: {} });
}
export async function changeNaturalRecoveryAllocation(actor, combat, specialId, delta) {
    if (!actor || !combat?.id || !specialId)
        return;
    const choice = matchingNaturalRecoveryChoice(actor, combat);
    const skipped = choice?.chosen === true && naturalRecoveryAllocatedTotal(choice.allocations) <= 0;
    const current = skipped ? {} : { ...(choice?.allocations ?? {}) };
    current[specialId] = Math.max(0, Math.floor(Number(current[specialId]) || 0) + Math.trunc(Number(delta) || 0));
    await setNaturalRecoveryAllocations(actor, combat, current, true);
}
/**
 * A stored Stone Powers plan (or skip) wins for this Round. With no plan the
 * HUD applies one Special after Ticks — the tick engine does not auto-spend.
 */
export function resolveNaturalRecoveryPlan(actor, entries, combat, masteryRank) {
    const rank = Math.max(0, Math.floor(Number(masteryRank) || 0));
    const choice = matchingNaturalRecoveryChoice(actor, combat);
    if (choice?.chosen) {
        if (naturalRecoveryAllocatedTotal(choice.allocations) <= 0)
            return [];
        return planFromAllocations(entries, choice.allocations, rank);
    }
    return [];
}
function isSameActor(actor, other) {
    if (!actor || !other)
        return false;
    if (actor === other)
        return true;
    const aId = String(actor.id ?? actor._id ?? '');
    const bId = String(other.id ?? other._id ?? '');
    if (aId && bId && aId === bId)
        return true;
    const aUuid = String(actor.uuid ?? '');
    const bUuid = String(other.uuid ?? '');
    return !!aUuid && !!bUuid && aUuid === bUuid;
}
export function isCurrentCombatantActor(actor, combat) {
    return isSameActor(actor, combat?.combatant?.actor);
}
export function isNaturalRecoveryUsed(actor, combat) {
    return matchingNaturalRecoveryChoice(actor, combat)?.chosen === true;
}
export function isNaturalRecoveryAvailable(actor, combat) {
    if (!actor || !combat?.id || combat.started === false)
        return false;
    if (!isCurrentCombatantActor(actor, combat))
        return false;
    if (isNaturalRecoveryUsed(actor, combat))
        return false;
    if (actorMasteryRank(actor) <= 0)
        return false;
    return listHudDiminishingSpecials(actor).length > 0;
}
function reduceSpecialEntries(list, specialId, amount) {
    const reduce = Math.max(0, Math.floor(Number(amount) || 0));
    let before = 0;
    let left = reduce;
    const next = [];
    for (const entry of list) {
        const id = statusEntryId(entry);
        const match = !!id && id === specialId && isNegativeDiminishingSpecialId(id);
        const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));
        if (!match) {
            next.push(entry);
            continue;
        }
        before += value;
        if (left <= 0) {
            if (value > 0)
                next.push({ ...entry, id: specialId, value });
            continue;
        }
        const { after, reduced } = applyNaturalRecoveryToValue(value, left);
        left -= reduced;
        if (after > 0)
            next.push({ ...entry, id: specialId, value: after });
    }
    const after = Math.max(0, before - (reduce - left));
    return { next, before, after, reduced: before - after };
}
/**
 * Apply Natural Special Recovery to exactly one Special (full Mastery Rank).
 * Writes `system.statusEffects` and marks the turn as used.
 */
export async function applyNaturalSpecialRecovery(actor, specialId, combat) {
    if (!actor || !specialId)
        return { ok: false, reason: 'missing' };
    if (!combat?.id)
        return { ok: false, reason: 'no-combat' };
    if (!isNaturalRecoveryAvailable(actor, combat))
        return { ok: false, reason: 'unavailable' };
    if (!isNegativeDiminishingSpecialId(specialId))
        return { ok: false, reason: 'not-eligible' };
    const rank = actorMasteryRank(actor);
    const system = actor.system;
    const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
    const { next, before, after, reduced } = reduceSpecialEntries(list, specialId, rank);
    if (reduced <= 0)
        return { ok: false, reason: 'empty' };
    const choice = {
        ...emptyNaturalRecoveryChoice(combat),
        chosen: true,
        allocations: { [specialId]: reduced },
    };
    const update = {
        'system.statusEffects': next,
        [`flags.mastery-system.${NATURAL_RECOVERY_FLAG}`]: choice,
    };
    if (typeof actor.update === 'function') {
        await actor.update(update);
    }
    else {
        actor.system = actor.system || {};
        actor.system.statusEffects = next;
        actor.flags = actor.flags || {};
        actor.flags['mastery-system'] = { ...(actor.flags['mastery-system'] || {}), [NATURAL_RECOVERY_FLAG]: choice };
    }
    const name = specialDisplayName(specialId);
    return { ok: true, id: specialId, name, before, after, reduced };
}
export function formatNaturalRecoveryChat(result) {
    if (!result.ok || !result.name)
        return '';
    return locFormat('naturalRecoveryChat', { name: result.name, reduced: result.reduced }, `Natural Special Recovery: ${result.name} reduced by ${result.reduced}.`);
}
//# sourceMappingURL=special-application.js.map