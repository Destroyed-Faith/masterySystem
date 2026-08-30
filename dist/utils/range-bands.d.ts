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
export declare const DEFAULT_WEAPON_RANGE_M = 32;
/**
 * Parse a printed range string into its flat maximum in meters. Accepts the
 * rulebook form (`"32 m"`, `"Ranged (32 m)"`, `"Thrown (16 m)"`) and legacy
 * band notation (`"8/16/32m"` → 32). Returns `null` when no distance exists.
 */
export declare function parseMaxRangeM(raw: string | null | undefined): number | null;
/** Canonical printed form for a flat maximum range. */
export declare function rangeTextFromMax(maxRangeM: number): string;
/**
 * NPC stat-block range → flat maximum. The sheet's Long/Max field is the
 * binding maximum; the legacy Short field no longer matters.
 */
export declare function npcMaxRangeM(longM: number): number;
export interface RangeCheckResult {
    inRange: boolean;
    maxRangeM: number;
    distanceM: number;
}
/** Flat range check: full pool inside the maximum, illegal beyond it. */
export declare function checkWeaponRange(opts: {
    rangeText: string | null | undefined;
    distanceM: number;
}): RangeCheckResult;
//# sourceMappingURL=range-bands.d.ts.map