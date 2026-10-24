/**
 * Canonical Skill Raise allowances (DF Players Guide 2026-10-24).
 * Paid Raises (+4 TN) are chosen before the roll.
 * Free Raises (+0 TN) become available automatically on success.
 * Effect allocation (Scope/Speed/…) happens after success on the result card.
 * Combat and Ritual Raises keep their own pre-roll allocation elsewhere.
 */
export declare const SKILL_RAISE_EFFECTS: readonly ["scope", "speed", "quality", "efficiency", "insight", "safety"];
export type SkillRaiseEffect = (typeof SKILL_RAISE_EFFECTS)[number];
export type SkillRaiseEffectAllocation = Record<SkillRaiseEffect, number>;
export declare const SKILL_RAISE_EFFECT_LABELS: Record<SkillRaiseEffect, {
    label: string;
    summary: string;
}>;
export interface SkillRaiseAllowance {
    maxPaid: number;
    maxFree: number;
    maxTotal: number;
}
export declare function getSkillRaiseAllowance(rank: number): SkillRaiseAllowance;
/** Free Raises unlocked by Rank; available only after a successful Skill Check. */
export declare function freeAllowance(rank: number): number;
/** Maximum Paid Raises that may be declared before the roll. */
export declare function paidCap(rank: number): number;
/** Base Task TN = Task Level × 4. */
export declare function skillTaskBaseTn(taskLevel: number): number;
export declare function finalSkillTn(baseTn: number, paidRaises: number): number;
/**
 * Clamp a requested Paid Raise count to the Rank paid cap.
 * Returns the clamped value and whether it was reduced.
 */
export declare function clampPaidRaises(rank: number, paid: number): {
    paid: number;
    clamped: boolean;
};
/** Dropdown options: `0 Paid — Final TN 12`, … */
export declare function paidRaiseSelectOptions(rank: number, baseTn: number): Array<{
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
 * Validate Paid (+ optional Free) against Rank caps.
 * For ordinary Skill Checks, Free is not chosen pre-roll — pass free=0 when
 * validating the pre-roll declaration; use `skillCheckSuccessRaiseBudget` after success.
 */
export declare function validateSkillRaiseAllocation(rank: number, paid: number, free: number): RaiseAllocationCheck;
/** Validate only the pre-roll Paid declaration (Free is auto on success). */
export declare function validatePaidRaisesDeclaration(rank: number, paid: number): RaiseAllocationCheck;
/** Raise budget after a successful ordinary Skill Check (at-roll Rank snapshot). */
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
/** Post-success: total allocated effects must be ≤ available (Paid + Free). */
export declare function validateSkillRaiseEffectAllocation(available: number, allocation: Partial<SkillRaiseEffectAllocation> | null | undefined): EffectAllocationCheck;
/** Passive Skill Value = 2 × relevant Attribute. */
export declare function passiveSkillValue(attribute: number): number;
export declare function passiveSkillSucceeds(attribute: number, finalTn: number): boolean;
/** Starting creation: 20 Skill Creation Points, 2 per Rank, five Rank-2 Specializations. */
export declare const SKILL_CREATION_POINTS = 20;
export declare const SKILL_CREATION_COST_PER_RANK = 2;
export declare const STARTING_SPECIALIZATION_COUNT = 5;
export declare const STARTING_SPECIALIZATION_RANK = 2;
export declare const SPECIALIZATION_XP_PER_RANK = 4;
//# sourceMappingURL=skill-raises.d.ts.map