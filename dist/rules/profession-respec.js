/**
 * Profession Respec — replace a free starting Profession in place.
 *
 * GM may always replace an uninvested Rank-2 starting Profession (no XP change).
 * Players may do the same only when World Setting `allowProfessionRespecBeta` is on.
 * Once XP is invested (or Rank rises past 2), the starting Profession is locked.
 * Perception is never touched.
 */
import { inferProfessionXpInvested, STARTING_SPECIALIZATION_RANK } from './skill-raises.js';
import { isCharacterPerceptionSpec, paidSpecializations, professionIdentityKey, validateSpecializationList, } from './specializations.js';
export const PROFESSION_RESPEC_SETTING = 'allowProfessionRespecBeta';
export function isProfessionRespecEnabled(settings = globalThis
    ?.game?.settings) {
    try {
        return !!settings?.get?.('mastery-system', PROFESSION_RESPEC_SETTING);
    }
    catch {
        return false;
    }
}
/**
 * Mark the first four paid Professions as starting slots when none are stamped yet.
 * Used for legacy / migrated characters. Does not convert later XP-learned rows when
 * any startingSlot already exists (GM Grant restores missing slots explicitly).
 */
export function ensureStartingProfessionSlots(specs) {
    if (specs.some((s) => s.startingSlot === true))
        return specs;
    let remaining = 4;
    let changed = false;
    const next = specs.map((s) => {
        if (isCharacterPerceptionSpec(s) || remaining <= 0)
            return s;
        remaining -= 1;
        changed = true;
        return { ...s, startingSlot: true };
    });
    return changed ? next : specs;
}
export function isRespecableProfession(specs, id) {
    const stamped = ensureStartingProfessionSlots(specs);
    const target = stamped.find((s) => s.id === id);
    if (!target || isCharacterPerceptionSpec(target))
        return false;
    if (target.startingSlot !== true)
        return false;
    const rank = Math.max(0, Math.floor(Number(target.rank) || 0));
    if (rank > STARTING_SPECIALIZATION_RANK)
        return false;
    return inferProfessionXpInvested(target) <= 0;
}
/**
 * Replace one uninvested Rank-2 starting Profession in place.
 * Rank and startingSlot stay; XP is never refunded or charged.
 */
export function planProfessionRespec(specs, input) {
    const stamped = ensureStartingProfessionSlots(specs);
    const replaceId = String(input.replaceId || '').trim();
    const name = String(input.name || '').trim();
    const origin = String(input.origin || '').trim();
    const scope = String(input.scope || '').trim();
    const category = String(input.category || '').trim();
    if (!replaceId) {
        return { ok: false, error: 'Select a Profession to replace.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
    }
    if (!name) {
        return { ok: false, error: 'Name the replacement Profession.', specializations: stamped, preservedRank: 0, previousName: '', nextName: '' };
    }
    if (!scope) {
        return { ok: false, error: 'Agree a one-sentence scope.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
    }
    if (isCharacterPerceptionSpec({ name })) {
        return {
            ok: false,
            error: 'Perception is free and separate — it cannot be a Profession respec target or replacement.',
            specializations: stamped,
            preservedRank: 0,
            previousName: '',
            nextName: name,
        };
    }
    const current = stamped.find((s) => s.id === replaceId);
    if (!current) {
        return { ok: false, error: 'Profession not found.', specializations: stamped, preservedRank: 0, previousName: '', nextName: name };
    }
    if (isCharacterPerceptionSpec(current)) {
        return {
            ok: false,
            error: 'Perception cannot be replaced through Profession respec.',
            specializations: stamped,
            preservedRank: current.rank,
            previousName: current.name,
            nextName: name,
        };
    }
    if (current.startingSlot !== true) {
        return {
            ok: false,
            error: 'Profession respec only replaces the four free starting Professions.',
            specializations: stamped,
            preservedRank: current.rank,
            previousName: current.name,
            nextName: name,
        };
    }
    const currentRank = Math.max(0, Math.floor(Number(current.rank) || 0));
    if (currentRank > STARTING_SPECIALIZATION_RANK || inferProfessionXpInvested(current) > 0) {
        return {
            ok: false,
            error: 'Profession respec is only allowed at Rank 2 with no invested XP. Once XP is spent, the Profession is locked.',
            specializations: stamped,
            preservedRank: current.rank,
            previousName: current.name,
            nextName: name,
        };
    }
    const nextId = professionIdentityKey(name);
    const duplicate = stamped.some((s) => s.id !== replaceId &&
        (s.id === nextId || normalizeName(s.name) === normalizeName(name)));
    if (duplicate) {
        return {
            ok: false,
            error: `A Profession named "${name}" already exists.`,
            specializations: stamped,
            preservedRank: current.rank,
            previousName: current.name,
            nextName: name,
        };
    }
    const priorInvested = Math.max(0, Math.floor(Number(current.xpInvested) || 0));
    const replacement = {
        id: nextId,
        name,
        ...(origin ? { origin } : {}),
        scope,
        rank: current.rank,
        startingSlot: true,
        ...(category ? { category } : {}),
        ...(priorInvested > 0 ? { xpInvested: priorInvested } : {}),
        ...(current.gmGranted ? { gmGranted: true } : {}),
    };
    const next = stamped.map((s) => (s.id === replaceId ? replacement : s));
    const check = validateSpecializationList(next);
    if (!check.ok) {
        return {
            ok: false,
            error: check.errors.join(' '),
            specializations: stamped,
            preservedRank: current.rank,
            previousName: current.name,
            nextName: name,
        };
    }
    return {
        ok: true,
        specializations: next,
        preservedRank: current.rank,
        previousName: current.name,
        nextName: name,
    };
}
function normalizeName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}
/** Count paid starting slots (for tests / UI). */
export function countStartingProfessionSlots(specs) {
    return ensureStartingProfessionSlots(specs).filter((s) => s.startingSlot === true).length;
}
export function listRespecableProfessions(specs) {
    return ensureStartingProfessionSlots(specs).filter((s) => s.startingSlot === true &&
        !isCharacterPerceptionSpec(s) &&
        Math.max(0, Math.floor(Number(s.rank) || 0)) <= STARTING_SPECIALIZATION_RANK &&
        inferProfessionXpInvested(s) <= 0);
}
/** Re-export helper used by UI to confirm paid-only lists. */
export { paidSpecializations };
//# sourceMappingURL=profession-respec.js.map