/**
 * Canonical flat pool reductions from named Specials.
 *
 * Player's Guide "Order of Pool Reduction":
 *   1. base Attribute pool
 *   2. Skill full-/half-pool rule
 *   3. flat pool changes — including Weaken / Soulburn / Challenge / Disoriented
 *   4. percentage-based Health Penalty (dice loss rounded down)
 *   5. Minimum Pool = Mastery Rank (applied LAST)
 *   6. Keep = Mastery Rank unless a rule explicitly changes it
 *
 * Weaken(X):   −X dice from every rolled pool based on Might, Agility, or Intellect.
 * Soulburn(X): −X dice from every rolled pool based on Wits, Influence, or Resolve.
 * Vitality pools are affected by neither Special. Both reduce rolled pools only —
 * never the Attribute itself, Keep, Damage Pools, or derived values.
 *
 * Challenge(X): bound to the creature that applied it. Attack Pools for attacks
 * that do NOT include the challenger as a target are reduced by X. If the
 * challenger is included, the pool is not reduced.
 */
/** Attributes whose rolled pools are reduced by Weaken(X). */
export declare const WEAKEN_ATTRIBUTES: ReadonlySet<string>;
/** Attributes whose rolled pools are reduced by Soulburn(X). */
export declare const SOULBURN_ATTRIBUTES: ReadonlySet<string>;
export interface PoolReductionResult {
    /** Total dice removed (sum of all applicable Specials). */
    reduction: number;
    /** Human-readable notes for the chat card / flavor line. */
    notes: string[];
}
/**
 * Weaken / Soulburn reduction for a rolled pool built from `poolAttribute`.
 * Returns 0 when the attribute is unknown or not covered (e.g. Vitality).
 */
export declare function attributePoolReduction(actor: any, poolAttribute: string | undefined): PoolReductionResult;
export interface ChallengeState {
    value: number;
    challengerUuid: string | null;
    challengerName: string | null;
}
/** Read the current Challenge state on an actor (one challenger at a time). */
export declare function readChallengeState(actor: any): ChallengeState;
/**
 * Resolve targets to their underlying actor references for challenger matching.
 * Accepts actor ids / uuids and token ids (resolved on the active scene).
 */
export declare function normalizeTargetRefs(refs: Array<string | null | undefined>): string[];
/**
 * Challenge reduction for an Attack Pool. `targetRefs` is the set of actor /
 * token references the attack includes as targets (primary + AoE targets).
 */
export declare function challengePoolReduction(actor: any, targetRefs: string[]): PoolReductionResult;
/**
 * Apply the Challenge stacking rule when a new Challenge(X) lands on `target`:
 * - same challenger → add stacks (X → X + Y)
 * - different challenger → replace only if the new value is higher
 * Returns the updated statusEffects array entry list (does not persist).
 */
export declare function mergeChallengeEntry(list: any[], newValue: number, sourceName: string, sourceUuid: string | null): any[];
/** All active specials on the actor that Cleanse may target (dispellable, value > 0). */
export declare function cleansableSpecials(actor: any): Array<{
    id: string;
    value: number;
}>;
export interface CleanseApplyResult {
    /** Whether a Special was reduced. */
    applied: boolean;
    /** Canonical id of the Special that was reduced, if any. */
    specialId: string | null;
    /** Value removed (≤ cleanseX). */
    reducedBy: number;
    /** Remaining value after cleanse (0 = ended). */
    remaining: number;
    /** True when the full Cleanse(X) was spent on that one Special (Absorption gate). */
    fullValueSpent: boolean;
    /** Updated statusEffects list (not persisted). */
    statusEffects: any[];
}
/**
 * Apply a portion of a Cleanse to exactly one Special in the list.
 *
 * Single-target primitive used by `distributeCleanseAcrossList` — the
 * rulebook allows the Cleanse value to be distributed freely across several
 * eligible Specials.
 * Pure: does not persist — caller updates the actor.
 */
export declare function applyCleanseToList(statusEffects: any[], cleanseX: number, chosenId?: string | null): CleanseApplyResult;
export interface CleanseDistributionStep {
    specialId: string;
    before: number;
    after: number;
    reducedBy: number;
}
export interface CleanseDistributeResult {
    applied: boolean;
    totalReduced: number;
    /** Unspent Cleanse value (lost per the rulebook). */
    leftover: number;
    steps: CleanseDistributionStep[];
    /** Updated statusEffects list (not persisted). */
    statusEffects: any[];
}
/**
 * Distribute Cleanse(X) freely across eligible Specials (Players Guide
 * "Cleanse(X)": remove up to X total points from one or more ongoing
 * negative Specials that list Cleanse: Yes; distribution is free; unused
 * value is lost).
 *
 * - With `allocations` (specialId → points) the given split is applied,
 *   clamped to each Special's current value and the total budget X.
 * - Without `allocations` the budget is spent greedily: highest stack
 *   first, spilling over into the next until X is exhausted.
 * Pure: does not persist — caller updates the actor.
 */
export declare function distributeCleanseAcrossList(statusEffects: any[], cleanseX: number, allocations?: Record<string, number> | null): CleanseDistributeResult;
/** Human-readable summary of a Cleanse distribution ("Corrode 4→1, Hex ended"). */
export declare function formatCleanseDistribution(result: CleanseDistributeResult): string;
/**
 * Persist Cleanse(X) onto an actor. When multiple Specials are eligible and
 * `chosenId` is omitted, the value is distributed greedily across all
 * eligible Specials (free distribution per the rulebook).
 */
export declare function applyCleanseToActor(actor: any, cleanseX: number, chosenId?: string | null): Promise<CleanseApplyResult>;
//# sourceMappingURL=pool-reduction.d.ts.map