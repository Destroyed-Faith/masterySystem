/**
 * Legacy Skill Point pool — retired.
 *
 * DF Professions replaced creation Skill Points. Remaining `system.skillPoints`
 * data is cleared by `retireActorSkillPoints` (unspent ranks become Free XP).
 * Allocation helpers always treat pending Skill changes as XP-only.
 */
export interface SkillPointPool {
    unspent: number;
    placed: Record<string, number>;
}
export interface SkillPendingSkillAllocation {
    key: string;
    pending: number;
    /** Always 0 — Skill Points are retired. */
    poolSteps: number;
    /** Positive ranks paid with XP. */
    xpSteps: number;
    /** Always 0 — Skill Points are retired. */
    poolReturned: number;
    /** Negative ranks that refund XP. */
    xpRefundSteps: number;
    /** Net XP for this Skill only (positive = spend, negative = refund). */
    xpNet: number;
}
export interface SkillPendingAllocation {
    poolSpent: number;
    poolReturned: number;
    poolAfter: number;
    xpNet: number;
    perSkill: Record<string, SkillPendingSkillAllocation>;
}
/** Always empty — Skill Points no longer exist as a spendable pool. */
export declare function readSkillPointPool(_system?: any): SkillPointPool;
/** Raw leftover Skill Points still stored on an actor (pre-retirement). */
export declare function readLegacySkillPointResidue(system: any): SkillPointPool;
/**
 * Convert leftover unspent Skill Points to Free XP and clear the pool.
 * Placed ranks stay on Skills; only the obsolete currency is removed.
 */
export declare function planSkillPointRetirement(system: any): {
    needed: boolean;
    convertedXp: number;
    updates: Record<string, unknown>;
};
/**
 * Pending Skill rank changes are XP-only (Skill Points retired).
 */
export declare function allocateSkillPending(opts: {
    pendingMap: Record<string, number>;
    currentRank: (key: string) => number;
    pool?: SkillPointPool;
    skillBandCost: (rank: number) => number;
}): SkillPendingAllocation;
/** Clears any leftover Skill Point fields after a confirmed batch. */
export declare function skillPointPoolUpdate(_pool: SkillPointPool, _allocation: SkillPendingAllocation): Record<string, unknown>;
//# sourceMappingURL=skill-point-pool.d.ts.map