/**
 * Weapon Specials shared by artifacts, raise options, and the damage pipeline.
 *
 * Catalog Specials (Penetration, Precision, …) ride the wielded weapon as a
 * printed rank. They are off until a Raise turns that rank on. The same
 * Special must not be applied twice.
 */
import type { PowerSnapshot } from '../combat/raise-resolution.js';
export interface WeaponSpecialEntry {
    key: string;
    rank: number;
}
export declare function specialKeyFromLabel(label: string): string;
/** Parse a weapon special string or `{ specialId, value }` into a raisable catalog Special. */
export declare function parseWeaponSpecialRaw(raw: unknown): WeaponSpecialEntry | null;
export declare function weaponSpecialEntries(weapon: any): WeaponSpecialEntry[];
/**
 * Add weapon Specials that the power snapshot does not already list.
 * Existing power ranks are left alone so a chosen Special is not doubled.
 */
/**
 * Power Specials stay on the hit. Weapon Specials stay off until a Raise.
 */
export declare function parkWeaponSpecialsForRaises(snapshot: PowerSnapshot, onHitKeys: Iterable<string>): {
    onHit: PowerSnapshot;
    raiseSource: PowerSnapshot;
};
export declare function mergeWeaponSpecialsIntoSnapshot(snapshot: PowerSnapshot, entries: WeaponSpecialEntry[]): PowerSnapshot;
/** Base Value rows of type `weaponSpecial` with a positive numeric rank. */
export declare function specialRefsFromBaseValueRows(rows: unknown): Array<{
    specialId: string;
    value: number;
}>;
/**
 * When an artifact weapon blob has no Specials, recover them from its Base
 * Values, then from the chosen mundane base type (`weapon:heavy-crossbow`, …).
 */
export declare function backfillArtifactWeaponSpecials(sys: any, existing: unknown): unknown[];
/**
 * On-hit Specials are the ones the resolved power snapshot already lists.
 * A printed weapon Special stays off until a Raise turns that rank on.
 */
export declare function selectOnHitSpecialEffects(available: Array<{
    type?: string;
    effect?: string;
}>): string[];
//# sourceMappingURL=weapon-specials.d.ts.map