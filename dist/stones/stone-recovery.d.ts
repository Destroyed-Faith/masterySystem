/**
 * Stone Recovery maths — round 2+, the player decides which spent stones come
 * back (Mastery Rank many). Kept free of Foundry globals so it can be tested;
 * the Stone Powers dialog renders these rows above its power matrix.
 */
export interface StoneRecoveryPoolInput {
    key: string;
    /** Pool capacity from the attribute. */
    max: number;
    /** Stones currently sitting in the pool. */
    current: number;
    /** Capacity tied up by Sustain — never refills. */
    sustained: number;
}
export interface StoneRecoveryRow {
    key: string;
    /** Free space the recovery could fill. */
    space: number;
    /** Stones currently in the pool (manual "−" correction can take these out). */
    current: number;
    /**
     * Positive = stones recovered into the pool. Negative = manual correction:
     * the player marks stones as spent that the sheet wrongly shows as Ready.
     */
    allocated: number;
    canAdd: boolean;
    canRemove: boolean;
}
export interface StoneRecoveryPlan {
    points: number;
    allocated: number;
    remaining: number;
    rows: StoneRecoveryRow[];
    /** No pool can take another stone — the rest of the points is simply lost. */
    saturated: boolean;
    /**
     * Always true: Confirm must never block. Unused Mastery Rank points are
     * simply skipped (player may recover fewer stones than the budget).
     */
    canFinish: boolean;
}
/** Space a pool offers: capacity minus Sustain, minus what is already in it. */
export declare function stoneRecoverySpace(pool: StoneRecoveryPoolInput): number;
/**
 * Rows a player can act on, plus the running totals. Every pool with capacity
 * gets a row: "+" takes a spent stone back (Mastery Rank budget), "−" marks a
 * stone as spent when the sheet wrongly shows it as Ready (manual correction,
 * costs no budget). Confirm never blocks.
 */
export declare function planStoneRecovery(pools: readonly StoneRecoveryPoolInput[], allocation: Readonly<Record<string, number>>, points: number): StoneRecoveryPlan;
/** Positive allocation trimmed to what the pools can actually take, for the actor update. */
export declare function clampStoneRecoveryAllocation(pools: readonly StoneRecoveryPoolInput[], allocation: Readonly<Record<string, number>>, points: number): Record<string, number>;
/**
 * Manual "−" corrections: stones the player marks as spent (positive counts,
 * clamped to what the pool currently holds). Costs no Mastery Rank budget.
 */
export declare function stoneRecoveryManualSpends(pools: readonly StoneRecoveryPoolInput[], allocation: Readonly<Record<string, number>>): Record<string, number>;
//# sourceMappingURL=stone-recovery.d.ts.map