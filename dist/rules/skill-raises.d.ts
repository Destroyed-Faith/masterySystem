/**
 * Skill Raises + Spec XP (Destroyed Faith Skill System).
 *
 * Standard Skill Checks: optional uncapped Paid Raises (+4 TN each) declared
 * before the roll. Free Raises from Skill Rank are retired.
 * Effect allocation (Scope/Speed/…) uses Paid Raises only after success.
 * Combat and Ritual Raises keep their own paths elsewhere.
 */
export declare const SKILL_RAISE_EFFECTS: readonly ["scope", "speed", "quality", "efficiency", "insight", "safety"];
export type SkillRaiseEffect = (typeof SKILL_RAISE_EFFECTS)[number];
export type SkillRaiseEffectAllocation = Record<SkillRaiseEffect, number>;
export declare const SKILL_RAISE_EFFECT_LABELS: Record<SkillRaiseEffect, {
    label: string;
    summary: string;
}>;
export interface SkillRaiseAllowance {
    /** Paid Raises are uncapped for trained Skills; 0 when untrained (Rank 0). */
    maxPaid: number;
    /** Always 0 — Skill Free Raise progression retired. */
    maxFree: number;
    maxTotal: number;
}
/** Soft UI hint for Paid Raise steppers (not a hard rules cap). */
export declare const SKILL_PAID_RAISE_UI_HINT_MAX = 8;
/**
 * Raise allowance for UI/legacy callers.
 * Rank 0 (untrained): no Raises. Rank 1+: Paid uncapped (maxPaid = Infinity proxy via large number).
 */
export declare function getSkillRaiseAllowance(rank: number): SkillRaiseAllowance;
/** @deprecated Free Raises retired; always 0. */
export declare function freeAllowance(_rank: number): number;
/**
 * Hard Paid Raise cap for validation.
 * Untrained (Rank 0) → 0; otherwise uncapped (no finite Rank table).
 */
export declare function paidCap(rank: number): number;
/** Base Task TN = Task Level × 4. */
export declare function skillTaskBaseTn(taskLevel: number): number;
export declare function finalSkillTn(baseTn: number, paidRaises: number): number;
/**
 * Normalize Paid Raises: ≥ 0 integer; Rank 0 forces 0.
 * Never clamps trained Paid Raises to a Rank table.
 */
export declare function clampPaidRaises(rank: number, paid: number): {
    paid: number;
    clamped: boolean;
};
/** Dropdown / stepper options for dialogs (UI hint range, not a hard cap). */
export declare function paidRaiseSelectOptions(rank: number, baseTn: number, uiMax?: number): Array<{
    paid: number;
    finalTn: number;
    label: string;
}>;
export interface RaiseAllocationCheck {
    ok: boolean;
    paid: number;
    free: number;
    total: number;
    error?: string;
}
/**
 * Validate Paid Raises. Free must be 0 (retired).
 * Untrained Rank 0 cannot declare Paid Raises.
 */
export declare function validateSkillRaiseAllocation(rank: number, paid: number, free: number): RaiseAllocationCheck;
/** Validate only the pre-roll Paid declaration. */
export declare function validatePaidRaisesDeclaration(rank: number, paid: number): RaiseAllocationCheck;
/** Raise budget after success — Paid only (Free retired). */
export declare function skillCheckSuccessRaiseBudget(skillRankAtRoll: number, paidRaisesDeclared: number): {
    available: number;
    paid: number;
    free: number;
};
export declare function emptySkillRaiseEffectAllocation(): SkillRaiseEffectAllocation;
export declare function sumSkillRaiseEffects(allocation: Partial<SkillRaiseEffectAllocation> | null | undefined): number;
export declare function normalizeSkillRaiseEffectAllocation(raw: Partial<SkillRaiseEffectAllocation> | null | undefined): SkillRaiseEffectAllocation;
export interface EffectAllocationCheck {
    ok: boolean;
    allocation: SkillRaiseEffectAllocation;
    spent: number;
    available: number;
    error?: string;
}
/** Post-success: total allocated effects must be ≤ available (Paid only). */
export declare function validateSkillRaiseEffectAllocation(available: number, allocation: Partial<SkillRaiseEffectAllocation> | null | undefined): EffectAllocationCheck;
/** Passive Skill Value = 2 × relevant Attribute. */
export declare function passiveSkillValue(attribute: number): number;
export declare function passiveSkillSucceeds(attribute: number, finalTn: number): boolean;
/** Starting creation: 20 Skill Creation Points, 2 per Rank, five Rank-2 Specializations. */
export declare const SKILL_CREATION_POINTS = 20;
export declare const SKILL_CREATION_COST_PER_RANK = 2;
export declare const STARTING_SPECIALIZATION_COUNT = 5;
export declare const STARTING_SPECIALIZATION_RANK = 2;
/**
 * XP to purchase the given Rank (1–8). Future advancements only —
 * never used to refund or reprice existing character ranks.
 */
export declare const SPECIALIZATION_XP_COST_BY_RANK: Record<number, number>;
/** @deprecated Prefer specializationXpCostToReach — flat 4 was the old ladder. */
export declare const SPECIALIZATION_XP_PER_RANK = 4;
/** XP cost to buy Rank `nextRank` (1–8). 0 if out of range. */
export declare function specializationXpCostToReach(nextRank: number): number;
/** Total XP to go from `fromRank` (inclusive start after) to `toRank` inclusive. */
export declare function specializationXpCostFromTo(fromRank: number, toRank: number): number;
//# sourceMappingURL=skill-raises.d.ts.map