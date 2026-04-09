/**
 * Dropdown option lists for the artifact node editor (weapon catalog + properties).
 */
/** Combat specials parsed from the mastery weapon table (comma-separated). */
export declare function getArtifactWeaponSpecialOptions(): string[];
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