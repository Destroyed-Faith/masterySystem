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
/** Innate lines: catalog table + all keys from WEAPON_PROPERTIES. */
export declare function getArtifactWeaponInnateOptions(): string[];
/** Damage dice presets (matches former artifact builder). */
export declare function getArtifactWeaponDamagePresets(): {
    value: string;
    label: string;
}[];
/** Accessory slots aligned with character sheet equipment (non-weapon/armor/shield). */
export declare const ARTIFACT_GEAR_SLOT_OPTIONS: {
    value: string;
    label: string;
}[];
//# sourceMappingURL=artifact-node-options.d.ts.map