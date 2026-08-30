/**
 * Weapon range utilities — flat maximum ranges.
 *
 * Players Guide "Weapon Properties":
 *   • Ranged (X m) — "You may make a ranged weapon attack up to X m."
 *   • Thrown (X m) — "You may make a ranged attack by throwing the weapon
 *     up to X m."
 *
 * There are no Range Bands, no percentage pool reduction at distance, and no
 * Agility range scaling in the current rulebook: an attack inside the printed
 * maximum uses the full pool, an attack beyond it is not legal.
 */

/** Default maximum when a ranged weapon has no printed range. */
export const DEFAULT_WEAPON_RANGE_M = 32;

/**
 * Parse a printed range string into its flat maximum in meters. Accepts the
 * rulebook form (`"32 m"`, `"Ranged (32 m)"`, `"Thrown (16 m)"`) and legacy
 * band notation (`"8/16/32m"` → 32). Returns `null` when no distance exists.
 */
export function parseMaxRangeM(raw: string | null | undefined): number | null {
    if (!raw) return null;
    const numbers = String(raw).match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;
    const max = Math.max(...numbers.map((n) => Number(n)));
    return Number.isFinite(max) && max > 0 ? max : null;
}

/** Canonical printed form for a flat maximum range. */
export function rangeTextFromMax(maxRangeM: number): string {
    const m = Math.max(1, Math.floor(Number(maxRangeM) || 0));
    return `${m}m`;
}

/**
 * NPC stat-block range → flat maximum. The sheet's Long/Max field is the
 * binding maximum; the legacy Short field no longer matters.
 */
export function npcMaxRangeM(longM: number): number {
    const long = Math.floor(Number(longM) || 0);
    return long > 0 ? long : DEFAULT_WEAPON_RANGE_M;
}

export interface RangeCheckResult {
    inRange: boolean;
    maxRangeM: number;
    distanceM: number;
}

/** Flat range check: full pool inside the maximum, illegal beyond it. */
export function checkWeaponRange(opts: {
    rangeText: string | null | undefined;
    distanceM: number;
}): RangeCheckResult {
    const maxRangeM = parseMaxRangeM(opts.rangeText) ?? DEFAULT_WEAPON_RANGE_M;
    const distanceM = Math.max(0, Number(opts.distanceM) || 0);
    return { inRange: distanceM <= maxRangeM, maxRangeM, distanceM };
}
