/**
 * Canonical Skill Raise allowances (DF Players Guide 2026-10-23).
 * Paid Raises add +4 TN each; Free Raises add 0 TN.
 */
export declare const SKILL_RAISE_EFFECTS: readonly ["scope", "speed", "quality", "efficiency", "insight", "safety"];
export type SkillRaiseEffect = (typeof SKILL_RAISE_EFFECTS)[number];
export interface SkillRaiseAllowance {
    maxPaid: number;
    maxFree: number;
    maxTotal: number;
}
export declare function getSkillRaiseAllowance(rank: number): SkillRaiseAllowance;
/** Base Task TN = Task Level × 4. */
export declare function skillTaskBaseTn(taskLevel: number): number;
export declare function finalSkillTn(baseTn: number, paidRaises: number): number;
export interface RaiseAllocationCheck {
    ok: boolean;
    paid: number;
    free: number;
    total: number;
    error?: string;
}
export declare function validateSkillRaiseAllocation(rank: number, paid: number, free: number): RaiseAllocationCheck;
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