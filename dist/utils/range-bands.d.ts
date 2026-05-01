/**
 * Range Bands utilities.
 *
 * Source: Players Guide 7483–7537.
 *
 *   • Ranged Powers / Weapons list their range as `Short / Medium / Long`
 *     in meters, e.g. `8/16/32m`.
 *   • Dice Pool at Range:
 *       Short  = 100% of the pool
 *       Medium =  75%
 *       Long   =  50%
 *     Always round down, minimum **1 die**.
 *   • Agility scaling: every full **8 Agility** adds **+1 / +2 / +4 m** to
 *     the Short / Medium / Long bands respectively.
 */
export type RangeBandKind = 'short' | 'medium' | 'long' | 'out-of-range';
export interface RangeBands {
    /** Maximum Short-range distance in meters. */
    short: number;
    /** Maximum Medium-range distance in meters. */
    medium: number;
    /** Maximum Long-range distance in meters. */
    long: number;
}
/** Default Players Guide bands when none are printed. */
export declare const DEFAULT_RANGE_BANDS: RangeBands;
/**
 * Parse a Players-Guide-style range string (`"8/16/32m"`, `"8 / 16 / 32 m"`,
 * `"Ranged (8/16/32m)"`, …) into structured bands. Returns `null` when no
 * triple of meters can be extracted.
 */
export declare function parseRangeBands(raw: string | null | undefined): RangeBands | null;
/**
 * Apply Agility scaling: every full 8 Agility extends the bands by
 * +1 / +2 / +4 m respectively (Players Guide 7515–7521).
 */
export declare function applyAgilityScaling(bands: RangeBands, agility: number): RangeBands;
/** Classify a distance in meters against a set of bands. */
export declare function classifyDistance(distanceM: number, bands: RangeBands): RangeBandKind;
/**
 * Multiplier on the dice pool for a given band.
 *   Short → 1.00, Medium → 0.75, Long → 0.50, Out-of-range → 0.
 */
export declare function poolMultiplier(band: RangeBandKind): number;
/**
 * Apply a band multiplier to a dice pool (rounded down, minimum 1 when the
 * shot is in range — `0` only for `out-of-range`).
 */
export declare function applyBandToPool(pool: number, band: RangeBandKind): number;
/**
 * Convenience: combine the full pipeline — parse + scale + classify + apply.
 */
export declare function dicePoolAtDistance(opts: {
    rangeText: string | null | undefined;
    agility: number;
    distanceM: number;
    pool: number;
}): {
    band: RangeBandKind;
    pool: number;
    bands: RangeBands;
};
//# sourceMappingURL=range-bands.d.ts.map