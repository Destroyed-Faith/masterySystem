/**
 * Read-only artifact sheet: current card plus a grayed next-level preview.
 */
export interface ArtifactSheetBaseValue {
    slot: string;
    label: string;
    value: string;
}
export interface ArtifactSheetAbility {
    name: string;
    type: string;
    effect: string;
    special: string;
    /** "Range Self · Cone 6m · MR Rounds" — empty when nothing to show. */
    reach: string;
}
export interface ArtifactSheetDisplay {
    level: number;
    baseValues: ArtifactSheetBaseValue[];
    abilities: ArtifactSheetAbility[];
    hasBaseValues: boolean;
    hasAbilities: boolean;
}
export interface ArtifactSheetNextPreview extends ArtifactSheetDisplay {
    label: string;
}
export declare function displayFromArtifactSystem(system: any, opts?: {
    level?: number;
}): ArtifactSheetDisplay;
/** Abilities that appear on `next` but not on the current card. */
export declare function newAbilitiesAtNextLevel(current: ArtifactSheetAbility[], next: ArtifactSheetAbility[]): ArtifactSheetAbility[];
/** Next evolution node(s), or a same-item +1 fallback when the table still has more rows. */
export declare function resolveNextArtifactPreviews(item: any): ArtifactSheetNextPreview[];
//# sourceMappingURL=artifact-sheet-preview.d.ts.map