/**
 * Fear — accumulated dread that removes dice from attribute pools.
 * Only GM-driven or explicit rule calls should invoke Fear Checks.
 *
 * Pending graded Fear Check (canvas decision, 2026-10-17):
 * Resolve k1 — no TN picker. Bands: <8 → +2 Fear, <16 → +1 Fear, ≥16 → +0.
 * Official players-guide still describes TN 8/12 binary until rulebooks are updated.
 */
/** Soft band: below this total → +2 Fear. */
export declare const FEAR_CHECK_BAND_HARD = 8;
/** Clear band: at/above this total → +0 Fear; between hard and clear → +1. */
export declare const FEAR_CHECK_BAND_CLEAR = 16;
/** @deprecated Use FEAR_CHECK_BAND_HARD — kept for older imports. */
export declare const FEAR_CHECK_TN_NORMAL = 8;
/** @deprecated Graded Fear Check no longer uses a separate extreme TN. */
export declare const FEAR_CHECK_TN_EXTREME = 16;
export declare function getFear(actor: any): number;
export declare function setFear(actor: any, value: number): Promise<void>;
/** Apply a signed delta; returns the new Fear total. */
export declare function applyFearDelta(actor: any, delta: number): Promise<number>;
/**
 * Fear gained from a Resolve k1 Fear Check total.
 * < 8 → 2, < 16 → 1, ≥ 16 → 0.
 */
export declare function fearGainedFromCheckTotal(total: number): number;
export declare function formatFearCheckBandNote(total: number, fearGained: number): string;
export interface FearCheckResult {
    rolled: boolean;
    total?: number;
    /** Clear-band reference (16) for display — not a binary pass TN. */
    tn: number;
    /** True when no Fear was gained (total ≥ 16). */
    success?: boolean;
    fearGained?: number;
    fearBefore?: number;
    fearAfter?: number;
    poolDice?: number;
}
/**
 * Resolve k1 Fear Check. No Skill Points, no Raises, no TN picker.
 * Graded outcome vs bands 8 / 16.
 */
export declare function runFearCheck(actor: any, _ignoredTn?: number): Promise<FearCheckResult>;
/** GM helper: run a graded Fear Check for one actor (no TN picker). */
export declare function promptGmFearCheck(actor: any): Promise<FearCheckResult | null>;
//# sourceMappingURL=fear.d.ts.map