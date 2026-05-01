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
/** Default Players Guide bands when none are printed. */
export const DEFAULT_RANGE_BANDS = { short: 8, medium: 16, long: 32 };
/**
 * Parse a Players-Guide-style range string (`"8/16/32m"`, `"8 / 16 / 32 m"`,
 * `"Ranged (8/16/32m)"`, …) into structured bands. Returns `null` when no
 * triple of meters can be extracted.
 */
export function parseRangeBands(raw) {
    if (!raw)
        return null;
    const m = String(raw).match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
    if (!m) {
        // Single distance fallback (e.g. legacy `30m`): treat as Short=N,
        // Medium=2N, Long=4N to mimic the canonical 8/16/32 doubling.
        const single = String(raw).match(/(\d+)/);
        if (!single)
            return null;
        const n = Number(single[1]);
        if (!Number.isFinite(n) || n <= 0)
            return null;
        return { short: n, medium: n * 2, long: n * 4 };
    }
    return {
        short: Number(m[1]),
        medium: Number(m[2]),
        long: Number(m[3]),
    };
}
/**
 * Apply Agility scaling: every full 8 Agility extends the bands by
 * +1 / +2 / +4 m respectively (Players Guide 7515–7521).
 */
export function applyAgilityScaling(bands, agility) {
    const steps = Math.max(0, Math.floor(Number(agility) || 0) >> 0);
    const k = Math.floor(steps / 8);
    return {
        short: bands.short + k * 1,
        medium: bands.medium + k * 2,
        long: bands.long + k * 4,
    };
}
/** Classify a distance in meters against a set of bands. */
export function classifyDistance(distanceM, bands) {
    if (!Number.isFinite(distanceM) || distanceM <= 0)
        return 'short';
    if (distanceM <= bands.short)
        return 'short';
    if (distanceM <= bands.medium)
        return 'medium';
    if (distanceM <= bands.long)
        return 'long';
    return 'out-of-range';
}
/**
 * Multiplier on the dice pool for a given band.
 *   Short → 1.00, Medium → 0.75, Long → 0.50, Out-of-range → 0.
 */
export function poolMultiplier(band) {
    switch (band) {
        case 'short': return 1;
        case 'medium': return 0.75;
        case 'long': return 0.5;
        case 'out-of-range': return 0;
    }
}
/**
 * Apply a band multiplier to a dice pool (rounded down, minimum 1 when the
 * shot is in range — `0` only for `out-of-range`).
 */
export function applyBandToPool(pool, band) {
    const m = poolMultiplier(band);
    if (m === 0)
        return 0;
    return Math.max(1, Math.floor(pool * m));
}
/**
 * Convenience: combine the full pipeline — parse + scale + classify + apply.
 */
export function dicePoolAtDistance(opts) {
    const parsed = parseRangeBands(opts.rangeText) ?? DEFAULT_RANGE_BANDS;
    const bands = applyAgilityScaling(parsed, opts.agility);
    const band = classifyDistance(opts.distanceM, bands);
    const pool = applyBandToPool(opts.pool, band);
    return { band, pool, bands };
}
//# sourceMappingURL=range-bands.js.map