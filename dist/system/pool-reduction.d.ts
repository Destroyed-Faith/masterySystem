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
 * Apply Cleanse(X) to exactly one Special on `actor`.
 *
 * - Always affects a single Special (no split). Excess X is lost.
 * - If `chosenId` is omitted and only one cleansable Special exists, that one is used.
 * - If multiple exist and none is chosen, returns `applied: false` (caller should prompt).
 * Pure: does not persist — caller updates the actor.
 */
export declare function applyCleanseToList(statusEffects: any[], cleanseX: number, chosenId?: string | null): CleanseApplyResult;
/**
 * Persist Cleanse(X) onto an actor. When multiple Specials are eligible and
 * `chosenId` is omitted, opens a Dialog so the user picks exactly one.
 */
export declare function applyCleanseToActor(actor: any, cleanseX: number, chosenId?: string | null): Promise<CleanseApplyResult>;
//# sourceMappingURL=pool-reduction.d.ts.map