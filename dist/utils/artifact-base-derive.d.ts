/**
 * Artifact Base Value derivation — turns a Base Profile + Base Value type +
 * Artifact Level into the concrete value, using the canonical scaling tables
 * from `D:\DestroyedFaith\Powers\Artefacts.md`.
 *
 * The Edit Artifact Node dialog uses these helpers so the GM never types a
 * raw value like "4d8 + 4". Damage / Armor / Evade / Movement / etc. are
 * derived automatically; only the *choice* (which Special, which type) is
 * manual. A small override is still allowed for fairness tuning.
 *
 * Pure data + pure helpers. No Foundry, no DOM.
 */
import type { ArtifactBaseValueType } from './artifact-rules.js';
/**
 * Derived value for a value-based Weapon Special at the given level, or `null`
 * if the Special is qualitative (no numeric value).
 */
export declare function scaleWeaponSpecial(idOrLabel: string, level: number): number | null;
/** Is this Special value-based (scales) vs qualitative (no number)? */
export declare function isScalingWeaponSpecial(idOrLabel: string): boolean;
export interface DerivedBaseValue {
    /** Human-readable derived value, e.g. "4d8", "+7 Armor", "+14 Evade". */
    display: string;
    /** Whether this type derives a value at all (false ⇒ free-form qualitative). */
    derivable: boolean;
}
/** Body Armor: Artifact Armor Bonus. L1=+4 … L9=+12, L10=+14. */
export declare function bodyArmorBonusForLevel(level: number): number;
/** No-Armor Body Evade. L1=+8 … L9=+24, L10=+26. */
export declare function noArmorEvadeForLevel(level: number): number;
/** Feet Evade (Base Value A). L1=+2 … L9=+10, L10=+12. */
export declare function feetEvadeForLevel(level: number): number;
/** Minor Armor (Head / Feet). L1-2=+1, L3-4=+2 … L9-10=+5. */
export declare function minorArmorForLevel(level: number): number;
/** Feet movement bonus. L1-2=+1, L3-4=+2 … L9-10=+5. */
export declare function feetMovementForLevel(level: number): number;
/** Weapon Damage baseline. L1=1d8 … L10=10d8. */
export declare function weaponDamageForLevel(level: number): string;
/**
 * Spell Focus baseline. Mirrors Weapon Damage (L1=+1d8 … L10=+10d8) but the
 * value boosts Spell damage instead of dealing weapon damage.
 */
export declare function spellFocusForLevel(level: number): string;
/** Thrown Range baseline. L1=6 m … L10=15 m. */
export declare function thrownRangeForLevel(level: number): number;
/** Sense depth tier word. L1-3 Detect, L4-6 Locate, L7-9 Identify, L10 Target. */
export declare function senseTierForLevel(level: number): string;
/**
 * Derive the read-only display string for a non-Special Base Value type at the
 * given level. `profile` disambiguates `evade` (body no-armor vs feet) and
 * `bodyArmor`/`headArmor` minor-vs-full armor.
 */
export declare function deriveBaseValueDisplay(type: ArtifactBaseValueType, level: number, profile?: string): DerivedBaseValue;
//# sourceMappingURL=artifact-base-derive.d.ts.map