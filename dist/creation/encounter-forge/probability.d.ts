/**
 * Deterministic dice probability engine for the Encounter Forge.
 *
 * The Mastery System rolls pools of exploding d8 ("roll & keep"): roll `pool`
 * dice, each die explodes on a natural 8 (roll again, add), keep the `keep`
 * highest per-die totals and sum them.
 *
 * This module computes exact probability mass functions (PMFs) for those
 * rolls instead of sampling with Math.random. Same inputs always produce the
 * same outputs, so the wizard never "rerolls" an encounter on rerender.
 *
 * APPROXIMATION BOUND (documented, deliberate):
 * A die explosion chain is theoretically unbounded. We truncate at
 * `EXPLOSION_DEPTH` consecutive explosions; a die that reaches the cap rolls
 * one final non-exploding d8. The probability that a single die is affected
 * is (1/8)^EXPLOSION_DEPTH = 1/4096, and the per-die mean error is
 * (1/8)^4 × (36/7 − 4.5) ≈ 1.6e-4. All results in this module are exact for
 * the truncated die. This error is far below anything visible in encounter
 * balance (hit chances shift by < 0.1 percentage points).
 */
/** Consecutive explosions modeled exactly; see module docs for error bound. */
export declare const EXPLOSION_DEPTH = 4;
/** Highest value a single (truncated) exploding d8 can reach: 8*4 + 8. */
export declare const MAX_DIE_VALUE: number;
/** Exact mean of an untruncated exploding d8 (rules constant: 36/7). */
export declare const EXPLODING_D8_MEAN: number;
/** PMF indexed by value; index 0 unused for single dice. */
export type Pmf = Float64Array;
/** PMF of one exploding d8, truncated at EXPLOSION_DEPTH explosions. */
export declare function singleDiePmf(): Pmf;
/**
 * PMF of the sum of `count` exploding d8 (keep all).
 * NOTE: Mastery damage dice do NOT explode (see damage-dialog.ts:
 * "damage dice do not explode unless a rule explicitly says so").
 * Use `plainDamagePmf` / `damageJointPmf` for damage rolls; this helper is
 * for rolls that keep all exploding dice (e.g. initiative).
 */
export declare function explodingSumPmf(count: number): Pmf;
/** Mean of a single plain (non-exploding) d8 — rules constant for damage dice. */
export declare const PLAIN_D8_MEAN = 4.5;
/** PMF of the sum of `count` plain d8 (damage dice never explode by default). */
export declare function plainDamagePmf(count: number): Pmf;
/**
 * Joint distribution of (damage sum, count of natural 8s) for `count` plain
 * d8. Needed for the minimum-damage rule: when Armor + DR reduce a hit to 0,
 * the target still takes 1 damage per natural 8 rolled.
 * Returned as an array indexed by eights-count; each entry is a PMF over sums.
 */
export declare function damageJointPmf(count: number): Pmf[];
/**
 * Exact PMF of "roll `pool` exploding d8, keep the `keep` highest, sum them".
 *
 * Algorithm: process die values from highest to lowest. State = (dice that
 * still have a value at or below the current level, keep slots left) with a
 * partial-sum PMF. At each level the number of dice showing exactly that
 * value is binomial with the conditional probability p(v) / P(die <= v).
 * Once all keep slots are used, lower dice cannot change the sum and the
 * state is absorbed into the result. Exact (for the truncated die), no
 * sampling.
 */
export declare function poolKeepPmf(pool: number, keep: number): Pmf;
/** Mean of a PMF. */
export declare function pmfMean(pmf: Pmf): number;
/** P(X >= tn). */
export declare function pmfAtLeast(pmf: Pmf, tn: number): number;
/** Smallest value x with P(X <= x) >= q (q in [0,1]). */
export declare function pmfQuantile(pmf: Pmf, q: number): number;
/** Hit chance of a pool/keep roll against a target number. */
export declare function hitChance(pool: number, keep: number, tn: number): number;
/**
 * Expected raises of a pool/keep roll against a TN, counting misses as 0.
 * Raise rule (rules constant): one raise per full +4 over the TN.
 */
export declare function expectedRaises(pool: number, keep: number, tn: number, raiseStep?: number): number;
/** E[max(0, X - reduction)] for a damage PMF (e.g. damage after flat armor). */
export declare function expectedOverThreshold(pmf: Pmf, reduction: number): number;
/** Clear all caches (only used by tests measuring determinism/perf). */
export declare function clearProbabilityCaches(): void;
//# sourceMappingURL=probability.d.ts.map