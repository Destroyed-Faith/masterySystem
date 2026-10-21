/**
 * Stepped Autofire — shared ordered Damage Roll (pure helpers + session registry).
 * No Foundry globals: everything Foundry-specific is injected by the caller.
 *
 * Players Guide §Apply Damage Negation: for a shared Autofire Damage Roll every
 * defender declares Negation BEFORE rolling, separately for each eligible hit
 * (repeats on one creature included). The common Damage Pool is rolled ONCE; for
 * each hit, that hit's declared number of dice is omitted from the SAME ordered
 * shared roll, for that hit only.
 *
 * DICE-OMIT CONVENTION (deterministic, cannot be cherry-picked after the reveal):
 *   The omittable pool is the ordered list of negatable d8s in the exact order
 *   `calculateDamageResult` rolls them — Weapon/base, Martial Damage, Power,
 *   Passive, Raise d8s, NSC auto d8s (the same order the single-target negation
 *   strips them from the formula). Omission removes the FIRST `omitCount` dice of
 *   that list (index 0 .. omitCount-1). Omitted dice contribute nothing to total
 *   damage and nothing to the natural-8 minimum count.
 *
 * Non-negatable dice (Summon aura, conditional / vulnerability / buff riders,
 * Precision, manual bonus dice) and flat bonuses are NOT part of the omittable
 * pool; they are common to every hit.
 */
import type { SharedAoeDamagePayload } from './aoe-melee-resolution.js';
export { autofireRaiseShareKey, forgetSharedRaiseAllocation, peekSharedRaiseAllocation, raiseAllocShareKey, readAutofirePowerUseId, rememberSharedRaiseAllocation, } from './shared-raise-allocation.js';
/** The full negatable pool of one shared roll, in roll order. */
export type SharedDicePool = {
    /** One entry per negatable d8, in roll order (full pool, before per-hit omission). */
    orderedDieFaces: number[];
    /** Maximization: every face is an artificial 8 (not a natural 8). */
    artificial: boolean;
    /** Per-die floor already applied to the full total (Brutal Impact / Mark spend). */
    dieFloor: number;
};
export type SharedDiceTotals = {
    /** Sum of the kept (non-omitted) dice. */
    total: number;
    /** Natural 8s among the kept dice. */
    natural8s: number;
    omittedCount: number;
    keptCount: number;
    /** Contribution of the omitted dice to the full total (to subtract). */
    omittedTotal: number;
    /** Natural 8s among the omitted dice (to subtract from the full count8s). */
    omittedNatural8s: number;
};
/** Clamp a declared omit count to [0, poolSize]. */
export declare function normalizeOmitCount(omit: number, poolSize: number): number;
/**
 * Damage from a shared ordered die list when `omitCount` dice are omitted.
 * Omits the FIRST `omitCount` entries (see DICE-OMIT CONVENTION above). Pure; never
 * rolls. Omitted dice count toward neither `total` nor `natural8s`.
 */
export declare function damageFromSharedDice(faces: readonly number[], omitCount: number, opts?: {
    artificial?: boolean;
    dieFloor?: number;
}): SharedDiceTotals;
/**
 * Per-hit payload derived from the ONE shared roll. `totalDamage` and `count8s`
 * drop the omitted dice only; the shared faces are never re-rolled or mutated.
 */
export declare function sharedDamageForHit(shared: SharedAoeDamagePayload, omitCount: number, opts?: {
    keepRolls?: boolean;
}): SharedAoeDamagePayload;
/** Unique id for one Autofire Power use (stored as `powerUseId` / `autofireUseId`). */
export declare function newAutofirePowerUseId(attackerId?: string | null): string;
export type NegationPromptResult = {
    diceRemoved: number;
    note?: string;
    /** Gives the spent resources back (cancellation of the Power use's damage roll). */
    refund?: () => Promise<void>;
};
export interface AutofireDamageSession {
    readonly useId: string;
    readonly hitCount: number;
    /** One omit count per pending hit, in chain order (zeros until collected). */
    readonly omitCounts: number[];
    /** Size of the negatable pool the commitments were made against (null until collected). */
    poolDice: number | null;
    collected: boolean;
    /**
     * Prompt every hit in order (before any die is revealed) and record omit counts.
     * Idempotent: a second call (e.g. Faith reroll) returns the same commitments.
     */
    collectNegation(poolDice: number): Promise<number[]>;
    /** Resource refunds recorded for this Power use. */
    readonly refunds: Array<() => Promise<void>>;
    /** Notes for chat (one per hit that omitted dice). */
    readonly notes: string[];
}
export declare function createAutofireDamageSession(opts: {
    useId: string;
    hitCount: number;
    promptNegation: (hitIndex: number, poolDice: number) => Promise<NegationPromptResult>;
}): AutofireDamageSession;
export declare function registerAutofireSession(session: AutofireDamageSession): void;
export declare function getAutofireSession(useId: string | null | undefined): AutofireDamageSession | null;
/**
 * End an Autofire Power use: drop the in-memory session and its shared Raise
 * allocation. With `refund`, committed Negation spends are given back first (damage
 * roll cancelled / failed — no orphan spends).
 *
 * @returns number of refunds that ran.
 */
export declare function endAutofireSession(useId: string | null | undefined, opts?: {
    refund?: boolean;
}): Promise<number>;
/** Test helper: number of live sessions. */
export declare function autofireSessionCount(): number;
//# sourceMappingURL=autofire-shared-damage.d.ts.map