/**
 * Base Type catalog for the Artifact Node Editor.
 *
 * Lets the GM pick a standard rulebook weapon / armor / shield as the *base*
 * an artifact is built on (e.g. "Light Crossbow", "Heavy Armor"). Selecting a
 * base type pre-fills the Slot, Base Profile, weapon/armor/shield profile,
 * innate abilities, specials and the matching Base Value rows — the GM can then
 * fine-tune from there, or pick "Custom" to author everything by hand.
 *
 * Pure data + pure helpers: no DOM, no Foundry types. Consumed by
 * `src/artifacts/node-editor.ts`.
 */
import type { ArtifactBaseProfileKey, ArtifactBaseValueType, ArtifactSlotKey, ArtifactWeaponSpecialRef } from '../types/item.js';
/** A single selectable option in the Base Type dropdown. */
export interface ArtifactBaseTypeOption {
    id: string;
    label: string;
}
/** An <optgroup> of base-type options (Weapons / Armor / Shields). */
export interface ArtifactBaseTypeGroup {
    group: string;
    options: ArtifactBaseTypeOption[];
}
/** One prefilled Base Value row derived from the base type. */
export interface ArtifactBaseTypeBaseValue {
    type: ArtifactBaseValueType;
    /** For `weaponSpecial` rows: the chosen special id. */
    specialId?: string;
}
interface WeaponBaseTypePrefill {
    kind: 'weapon';
    slot: ArtifactSlotKey;
    baseProfile: ArtifactBaseProfileKey;
    weaponType: 'melee' | 'ranged';
    hands: number;
    damage: string;
    range: string;
    innateAbilities: string[];
    specials: ArtifactWeaponSpecialRef[];
    baseValues: ArtifactBaseTypeBaseValue[];
}
interface ArmorBaseTypePrefill {
    kind: 'armor';
    slot: ArtifactSlotKey;
    baseProfile: ArtifactBaseProfileKey;
    armorType: 'light' | 'medium' | 'heavy';
    armorValue: number;
    evadeModifier: number;
    skillPenalty: string;
    baseValues: ArtifactBaseTypeBaseValue[];
}
interface ShieldBaseTypePrefill {
    kind: 'shield';
    slot: ArtifactSlotKey;
    baseProfile: ArtifactBaseProfileKey;
    shieldType: 'parry' | 'medium' | 'tower';
    shieldValue: number;
    evadeBonus: number;
    skillPenalty: string;
    baseValues: ArtifactBaseTypeBaseValue[];
}
export type ArtifactBaseTypePrefill = WeaponBaseTypePrefill | ArmorBaseTypePrefill | ShieldBaseTypePrefill;
/**
 * The base-type options, grouped for the dropdown. Excludes "Unarmed" (no real
 * weapon base). Sorted alphabetically inside each group.
 */
export declare function getArtifactBaseTypeGroups(): ArtifactBaseTypeGroup[];
/**
 * Resolve a base-type id into a normalized prefill descriptor, or `null` for an
 * unknown / "Custom" selection.
 */
export declare function resolveArtifactBaseType(id: string): ArtifactBaseTypePrefill | null;
export {};
//# sourceMappingURL=artifact-base-type-catalog.d.ts.map