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
export const DEFAULT_RANGE_BANDS: RangeBands = { short: 8, medium: 16, long: 32 };

/**
 * NPC sheet Short/Long meters → Players Guide Short/Medium/Long bands.
 * Short (= "Min" on the sheet) is the gifted full-pool band (0…short).
 * Long (= "Max") is absolute maximum. Medium is midway.
 */
export function bandsFromNpcShortLong(shortM: number, longM: number): RangeBands {
  let long = Math.max(1, Math.floor(Number(longM) || 0));
  let short = Math.floor(Number(shortM) || 0);
  if (!Number.isFinite(long) || long <= 0) long = DEFAULT_RANGE_BANDS.long;
  if (!Number.isFinite(short) || short <= 0) {
    // No explicit short → approximate 8/16/32 proportions from long.
    short = Math.max(1, Math.floor(long / 4));
  }
  if (short > long) short = long;
  let medium = Math.floor((short + long) / 2);
  if (medium < short) medium = short;
  if (medium > long) medium = long;
  return { short, medium, long };
}

export function rangeTextFromBands(bands: RangeBands): string {
  return `${bands.short}/${bands.medium}/${bands.long}m`;
}

/**
 * Parse a Players-Guide-style range string (`"8/16/32m"`, `"8 / 16 / 32 m"`,
 * `"Ranged (8/16/32m)"`, …) into structured bands. Returns `null` when no
 * triple of meters can be extracted.
 */
export function parseRangeBands(raw: string | null | undefined): RangeBands | null {
    if (!raw) return null;
    const m = String(raw).match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
    if (!m) {
        // Single distance fallback (e.g. legacy `30m`): treat as Short=N,
        // Medium=2N, Long=4N to mimic the canonical 8/16/32 doubling.
        const single = String(raw).match(/(\d+)/);
        if (!single) return null;
        const n = Number(single[1]);
        if (!Number.isFinite(n) || n <= 0) return null;
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
export function applyAgilityScaling(bands: RangeBands, agility: number): RangeBands {
    const steps = Math.max(0, Math.floor(Number(agility) || 0) >> 0);
    const k = Math.floor(steps / 8);
    return {
        short: bands.short + k * 1,
        medium: bands.medium + k * 2,
        long: bands.long + k * 4,
    };
}

/** Classify a distance in meters against a set of bands. */
export function classifyDistance(distanceM: number, bands: RangeBands): RangeBandKind {
    if (!Number.isFinite(distanceM) || distanceM <= 0) return 'short';
    if (distanceM <= bands.short) return 'short';
    if (distanceM <= bands.medium) return 'medium';
    if (distanceM <= bands.long) return 'long';
    return 'out-of-range';
}

/**
 * Multiplier on the dice pool for a given band.
 *   Short → 1.00, Medium → 0.75, Long → 0.50, Out-of-range → 0.
 */
export function poolMultiplier(band: RangeBandKind): number {
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
export function applyBandToPool(pool: number, band: RangeBandKind): number {
    const m = poolMultiplier(band);
    if (m === 0) return 0;
    return Math.max(1, Math.floor(pool * m));
}

/**
 * Convenience: combine the full pipeline — parse + scale + classify + apply.
 */
export function dicePoolAtDistance(opts: {
    rangeText: string | null | undefined;
    agility: number;
    distanceM: number;
    pool: number;
}): { band: RangeBandKind; pool: number; bands: RangeBands } {
    const parsed = parseRangeBands(opts.rangeText) ?? DEFAULT_RANGE_BANDS;
    const bands = applyAgilityScaling(parsed, opts.agility);
    const band = classifyDistance(opts.distanceM, bands);
    const pool = applyBandToPool(opts.pool, band);
    return { band, pool, bands };
}
