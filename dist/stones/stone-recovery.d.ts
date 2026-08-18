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
    canFinish: boolean;
}
/** Space a pool offers: capacity minus Sustain, minus what is already in it. */
export declare function stoneRecoverySpace(pool: StoneRecoveryPoolInput): number;
/**
 * Rows a player can act on, plus the running totals. Pools without space are
 * dropped: offering a plus button that can never be pressed only adds noise.
 * A pool that already holds allocated stones stays in the list so they can be
 * taken back out again.
 */
export declare function planStoneRecovery(pools: readonly StoneRecoveryPoolInput[], allocation: Readonly<Record<string, number>>, points: number): StoneRecoveryPlan;
/** Allocation trimmed to what the pools can actually take, for the actor update. */
export declare function clampStoneRecoveryAllocation(pools: readonly StoneRecoveryPoolInput[], allocation: Readonly<Record<string, number>>, points: number): Record<string, number>;
//# sourceMappingURL=stone-recovery.d.ts.map