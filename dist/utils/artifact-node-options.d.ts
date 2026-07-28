/**
 * Dropdown option lists for the artifact node editor (weapon catalog + special effects + powers).
 */
export type ArtifactSpecialSelectOption = {
    id: string;
    label: string;
    hasValue: boolean;
};
/**
 * All special IDs for artifact weapon rows: rulebook effects, weapon table, every mastery power definition.
 */
export declare function getArtifactSpecialSelectOptions(): ArtifactSpecialSelectOption[];
export type ArtifactPowerCatalogGroup = {
    category: string;
    options: {
        id: string;
        label: string;
    }[];
};
/**
 * Power catalog options for the Level Progression picker, grouped by category
 * (Active, Reaction, Active Buff, Movement, Passive). The `id` is the catalog
 * `templateId`; the label is the human-readable template name.
 */
export declare function getArtifactPowerCatalogOptions(): ArtifactPowerCatalogGroup[];
/**
 * Free Trait: every weapon artifact may pick exactly ONE of these weapon
 * properties for free, on top of the base type's innate abilities. The list is
 * rules-vetted: Spell Focus is excluded (too strong), pure drawbacks (Heavy,
 * Load) and delivery modes (Ranged, Thrown, Set) are not pickable here.
 */
export declare const ARTIFACT_FREE_TRAIT_OPTIONS: readonly string[];
/** Innate lines: catalog table + all keys from WEAPON_PROPERTIES. */
export declare function getArtifactWeaponInnateOptions(): string[];
/** Damage dice presets (matches former artifact builder). */
export declare function getArtifactWeaponDamagePresets(): {
    value: string;
    label: string;
}[];
/** Artifact tree node editor: 1d8 … 8d8 only. */
export declare function getArtifactTreeWeaponDamagePresets(): {
    value: string;
    label: string;
}[];
/**
 * Accessory slots aligned with the canonical 7-slot character sheet
 * equipment vocabulary (non-weapon/armor/shield).
 */
export declare const ARTIFACT_GEAR_SLOT_OPTIONS: {
    value: string;
    label: string;
}[];
//# sourceMappingURL=artifact-node-options.d.ts.map