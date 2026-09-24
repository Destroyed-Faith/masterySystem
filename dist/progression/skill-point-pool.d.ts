/**
 * Unspent Skill Points after character creation.
 *
 * Refunds (for example when a Skill is removed from the rules) land in
 * `system.skillPoints.unspent`. One unspent Skill Point buys one Skill Rating
 * point in the normal Skill progression UI; ranks bought this way are recorded
 * per Skill in `system.skillPoints.placed` so that removing them gives the
 * Skill Point back instead of refunding XP. Skill Points never become XP.
 */
export interface SkillPointPool {
    unspent: number;
    placed: Record<string, number>;
}
export interface SkillPendingSkillAllocation {
    key: string;
    pending: number;
    /** Positive ranks paid with unspent Skill Points (ranks current+1 … current+poolSteps). */
    poolSteps: number;
    /** Positive ranks paid with XP. */
    xpSteps: number;
    /** Negative ranks that return a Skill Point to the pool. */
    poolReturned: number;
    /** Negative ranks that refund XP. */
    xpRefundSteps: number;
    /** Net XP for this Skill only (positive = spend, negative = refund). */
    xpNet: number;
}
export interface SkillPendingAllocation {
    /** Unspent Skill Points consumed by positive steps. */
    poolSpent: number;
    /** Skill Points returned to the pool by negative steps. */
    poolReturned: number;
    /** Pool after confirming these changes. */
    poolAfter: number;
    /** Net XP for the whole batch (positive = spend, negative = refund). */
    xpNet: number;
    perSkill: Record<string, SkillPendingSkillAllocation>;
}
export declare function readSkillPointPool(system: any): SkillPointPool;
/**
 * Decide which pending Skill rank changes are paid with unspent Skill Points
 * and which cost XP.
 *
 * Positive steps consume the pool in the order the Skills were clicked
 * (`pendingMap` insertion order) until it is empty; the rest cost XP by the
 * banded Skill cost of the rank reached. Negative steps first give back ranks
 * that were placed from the pool on that Skill, then refund XP for the rest.
 */
export declare function allocateSkillPending(opts: {
    pendingMap: Record<string, number>;
    currentRank: (key: string) => number;
    pool: SkillPointPool;
    skillBandCost: (rank: number) => number;
}): SkillPendingAllocation;
/** Actor update keys for the pool after a confirmed batch. */
export declare function skillPointPoolUpdate(pool: SkillPointPool, allocation: SkillPendingAllocation): Record<string, unknown>;
//# sourceMappingURL=skill-point-pool.d.ts.map