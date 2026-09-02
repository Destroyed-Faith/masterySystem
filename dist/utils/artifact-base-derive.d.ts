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
    /** Human-readable or parseable derived value (stored when no override). */
    display: string;
    /** Optional richer label for UI (e.g. "Armor 4 (Light)"); falls back to display. */
    label?: string;
    /** Whether this type derives a value at all (false ⇒ free-form qualitative). */
    derivable: boolean;
}
export type ArtifactArmorWeightClass = 'light' | 'medium' | 'heavy';
/** Mundane armor base (Light 4 / Medium 8 / Heavy 12). */
export declare const ARTIFACT_ARMOR_MUNDANE_BASE: Record<ArtifactArmorWeightClass, number>;
export declare function normalizeArtifactArmorWeight(raw: string | null | undefined): ArtifactArmorWeightClass | null;
/** Absolute Armor total for an Artifact Body Armor at the given level. */
export declare function artifactArmorTotalForLevel(weight: ArtifactArmorWeightClass, level: number): number;
/**
 * Artifact Armor Bonus stored on the `bodyArmor` Base Value
 * (absolute total minus mundane Light/Medium/Heavy base).
 */
export declare function artifactArmorBonusForLevel(weight: ArtifactArmorWeightClass, level: number): number;
/** Final Evade Modifier for an Artifact Body Armor at the given level. */
export declare function artifactArmorEvadeForLevel(weight: ArtifactArmorWeightClass, level: number): number;
/**
 * @deprecated Old shared +4…+14 Artifact Armor Bonus. All Artifact Body Armors
 * now use `artifactArmorBonusForLevel(weight, level)` instead.
 */
export declare function bodyArmorBonusForLevel(level: number): number;
/** @deprecated Alias of Light Armor Artifact Evade (`artifactArmorEvadeForLevel('light', …)`). */
export declare function noArmorEvadeForLevel(level: number): number;
/** @deprecated Alias of Light Armor Artifact bonus. */
export declare function soulSigilArmorForLevel(level: number): number;
/** @deprecated Alias of Light Armor Artifact total. */
export declare function soulSigilArmorTotalForLevel(level: number): number;
/** Feet Evade (Elorian Stride). L1–2=+1, L3–4=+2, … L9–10=+5. */
export declare function feetEvadeForLevel(level: number): number;
/** Minor Armor (Head / Feet). L1-2=+1, L3-4=+2 … L9-10=+5. */
export declare function minorArmorForLevel(level: number): number;
/** Feet movement bonus. L1-2=+1, L3-4=+2 … L9-10=+5. */
export declare function feetMovementForLevel(level: number): number;
/**
 * Base weapon dice from the physical Base Profile (before the per-level
 * artifact bonus):
 *   • One-handed (melee or ranged) → 2d8
 *   • Two-handed (melee or ranged) → 4d8
 *   • anything else (natural weapon / unknown) → 0 (pure per-level scaling)
 */
export declare function baseProfileWeaponDice(profile?: string | null): number;
/**
 * Weapon Damage. A weapon deals its Base Profile dice (2d8 one-handed / 4d8
 * two-handed) plus +1d8 per artifact level. So a two-handed artifact at L2 is
 * 4 + 2 = 6d8; a one-handed at L2 is 2 + 2 = 4d8.
 */
export declare function weaponDamageForLevel(level: number, profile?: string | null): string;
/**
 * Spell Focus baseline — 1:1 the same value as Weapon Damage for the profile,
 * but the dice boost Spell damage instead of dealing weapon damage.
 */
export declare function spellFocusForLevel(level: number, profile?: string | null): string;
/**
 * Canonical weapon damage for a standard one/two-handed (melee or ranged)
 * Artifact Weapon, derived live from its physical Base Profile + Artifact
 * level: 2d8 (one-handed) / 4d8 (two-handed) base + 1d8 per level.
 *
 * Returns `null` for non-weapon / custom / natural / Spell-Focus profiles
 * (base dice 0) so callers fall back to the value stored on the item. Deriving
 * live means existing artifacts always reflect the current rule even when their
 * baked `artifactWeapon.damage` predates the base-profile scaling fix.
 */
export declare function deriveArtifactWeaponDamage(profile: string | null | undefined, level: number): string | null;
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