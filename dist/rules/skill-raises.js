/**
 * Skill Raises + Spec XP (Destroyed Faith Skill System).
 *
 * Standard Skill Checks: optional uncapped Paid Raises (+4 TN each) declared
 * before the roll. Free Raises from Skill Rank are retired.
 * Effect allocation (Scope/Speed/…) uses Paid Raises only after success.
 * Combat and Ritual Raises keep their own paths elsewhere.
 */
export const SKILL_RAISE_EFFECTS = [
    'scope',
    'speed',
    'quality',
    'efficiency',
    'insight',
    'safety',
];
export const SKILL_RAISE_EFFECT_LABELS = {
    scope: { label: 'Scope', summary: 'Double eligible quantity each Raise (same task).' },
    speed: { label: 'Speed', summary: 'Halve feasible work time per Raise (realistic minimums).' },
    quality: { label: 'Quality', summary: 'Improve agreed quality or clarity one step.' },
    efficiency: { label: 'Efficiency', summary: 'Reduce avoidable waste or effort.' },
    insight: { label: 'Insight', summary: 'One relevant, supportable clue.' },
    safety: { label: 'Safety', summary: 'Mitigate one foreseeable secondary complication.' },
};
/** Soft UI hint for Paid Raise steppers (not a hard rules cap). */
export const SKILL_PAID_RAISE_UI_HINT_MAX = 8;
/**
 * Raise allowance for UI/legacy callers.
 * Rank 0 (untrained): no Raises. Rank 1+: Paid uncapped (maxPaid = Infinity proxy via large number).
 */
export function getSkillRaiseAllowance(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (r <= 0)
        return { maxPaid: 0, maxFree: 0, maxTotal: 0 };
    // Uncapped Paid — UI may still hint at SKILL_PAID_RAISE_UI_HINT_MAX.
    return { maxPaid: Number.POSITIVE_INFINITY, maxFree: 0, maxTotal: Number.POSITIVE_INFINITY };
}
/** @deprecated Free Raises retired; always 0. */
export function freeAllowance(_rank) {
    return 0;
}
/**
 * Hard Paid Raise cap for validation.
 * Untrained (Rank 0) → 0; otherwise uncapped (no finite Rank table).
 */
export function paidCap(rank) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    return r <= 0 ? 0 : Number.POSITIVE_INFINITY;
}
/** Base Task TN = Task Level × 4. */
export function skillTaskBaseTn(taskLevel) {
    const level = Math.max(1, Math.floor(Number(taskLevel) || 1));
    return level * 4;
}
export function finalSkillTn(baseTn, paidRaises) {
    const paid = Math.max(0, Math.floor(Number(paidRaises) || 0));
    return Math.max(0, Math.floor(Number(baseTn) || 0)) + paid * 4;
}
/**
 * Normalize Paid Raises: ≥ 0 integer; Rank 0 forces 0.
 * Never clamps trained Paid Raises to a Rank table.
 */
export function clampPaidRaises(rank, paid) {
    const raw = Math.max(0, Math.floor(Number(paid) || 0));
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (r <= 0) {
        return { paid: 0, clamped: raw !== 0 };
    }
    return { paid: raw, clamped: false };
}
/** Dropdown / stepper options for dialogs (UI hint range, not a hard cap). */
export function paidRaiseSelectOptions(rank, baseTn, uiMax = SKILL_PAID_RAISE_UI_HINT_MAX) {
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    const cap = r <= 0 ? 0 : Math.max(0, Math.floor(Number(uiMax) || SKILL_PAID_RAISE_UI_HINT_MAX));
    const base = Math.max(0, Math.floor(Number(baseTn) || 0));
    const out = [];
    for (let paid = 0; paid <= cap; paid++) {
        const tn = finalSkillTn(base, paid);
        out.push({ paid, finalTn: tn, label: `${paid} Paid → TN ${tn}` });
    }
    return out;
}
/**
 * Validate Paid Raises. Free must be 0 (retired).
 * Untrained Rank 0 cannot declare Paid Raises.
 */
export function validateSkillRaiseAllocation(rank, paid, free) {
    const p = Math.max(0, Math.floor(Number(paid) || 0));
    const f = Math.max(0, Math.floor(Number(free) || 0));
    const total = p + f;
    const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
    if (f > 0) {
        return { ok: false, paid: p, free: f, total, error: 'Free Raises are no longer granted by Skill Rank.' };
    }
    if (r <= 0 && p > 0) {
        return { ok: false, paid: p, free: f, total, error: 'Untrained rolls get 0 Raises.' };
    }
    return { ok: true, paid: p, free: 0, total: p };
}
/** Validate only the pre-roll Paid declaration. */
export function validatePaidRaisesDeclaration(rank, paid) {
    return validateSkillRaiseAllocation(rank, paid, 0);
}
/** Raise budget after success — Paid only (Free retired). */
export function skillCheckSuccessRaiseBudget(skillRankAtRoll, paidRaisesDeclared) {
    const { paid } = clampPaidRaises(skillRankAtRoll, paidRaisesDeclared);
    return { available: paid, paid, free: 0 };
}
export function emptySkillRaiseEffectAllocation() {
    return {
        scope: 0,
        speed: 0,
        quality: 0,
        efficiency: 0,
        insight: 0,
        safety: 0,
    };
}
export function sumSkillRaiseEffects(allocation) {
    if (!allocation)
        return 0;
    let total = 0;
    for (const key of SKILL_RAISE_EFFECTS) {
        total += Math.max(0, Math.floor(Number(allocation[key]) || 0));
    }
    return total;
}
export function normalizeSkillRaiseEffectAllocation(raw) {
    const out = emptySkillRaiseEffectAllocation();
    if (!raw || typeof raw !== 'object')
        return out;
    for (const key of SKILL_RAISE_EFFECTS) {
        out[key] = Math.max(0, Math.floor(Number(raw[key]) || 0));
    }
    return out;
}
/** Post-success: total allocated effects must be ≤ available (Paid only). */
export function validateSkillRaiseEffectAllocation(available, allocation) {
    const cap = Math.max(0, Math.floor(Number(available) || 0));
    const normalized = normalizeSkillRaiseEffectAllocation(allocation);
    const spent = sumSkillRaiseEffects(normalized);
    if (spent > cap) {
        return {
            ok: false,
            allocation: normalized,
            spent,
            available: cap,
            error: `Allocated ${spent} Raise effects but only ${cap} available.`,
        };
    }
    return { ok: true, allocation: normalized, spent, available: cap };
}
/** Passive Skill Value = 2 × relevant Attribute. */
export function passiveSkillValue(attribute) {
    return 2 * Math.max(0, Math.floor(Number(attribute) || 0));
}
export function passiveSkillSucceeds(attribute, finalTn) {
    return passiveSkillValue(attribute) >= Math.floor(Number(finalTn) || 0);
}
/** Starting creation: 20 Skill Creation Points, 2 per Rank, five Rank-2 Specializations. */
export const SKILL_CREATION_POINTS = 20;
export const SKILL_CREATION_COST_PER_RANK = 2;
export const STARTING_SPECIALIZATION_COUNT = 5;
export const STARTING_SPECIALIZATION_RANK = 2;
/**
 * XP to purchase the given Rank (1–8). Future advancements only —
 * never used to refund or reprice existing character ranks.
 */
export const SPECIALIZATION_XP_COST_BY_RANK = {
    1: 4,
    2: 4,
    3: 6,
    4: 8,
    5: 10,
    6: 12,
    7: 14,
    8: 16,
};
/** @deprecated Prefer specializationXpCostToReach — flat 4 was the old ladder. */
export const SPECIALIZATION_XP_PER_RANK = 4;
/** XP cost to buy Rank `nextRank` (1–8). 0 if out of range. */
export function specializationXpCostToReach(nextRank) {
    const r = Math.floor(Number(nextRank) || 0);
    return SPECIALIZATION_XP_COST_BY_RANK[r] ?? 0;
}
/** Total XP to go from `fromRank` (inclusive start after) to `toRank` inclusive. */
export function specializationXpCostFromTo(fromRank, toRank) {
    const from = Math.max(0, Math.floor(Number(fromRank) || 0));
    const to = Math.max(0, Math.min(8, Math.floor(Number(toRank) || 0)));
    let total = 0;
    for (let r = from + 1; r <= to; r++) {
        total += specializationXpCostToReach(r);
    }
    return total;
}
//# sourceMappingURL=skill-raises.js.map