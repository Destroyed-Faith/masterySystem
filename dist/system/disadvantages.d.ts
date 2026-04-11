/**
 * Disadvantages System for Mastery System
 * Defines all available disadvantages that characters can take during creation
 */
export interface DisadvantageField {
    name: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    label: string;
    placeholder?: string;
    options?: Array<{
        value: string;
        label: string;
    }>;
    required?: boolean;
    min?: number;
    max?: number;
    /** For textarea */
    rows?: number;
}
/** Optional collapsible sections in the config dialog (structure + examples). */
export interface DisadvantageInfoSection {
    title: string;
    items: string[];
}
export interface DisadvantageExamplePreset {
    label: string;
    /** Body text; with `presetFillsNameAndContext`, label → `name` and this → `context` */
    text: string;
}
export interface DisadvantageDefinition {
    id: string;
    name: string;
    basePoints: number | number[];
    description: string;
    fields?: DisadvantageField[];
    effect?: string;
    /** Shown as <details> blocks above the long description */
    infoSections?: DisadvantageInfoSection[];
    /** Dropdown that inserts into the primary text field (wired in character sheet) */
    examplePresets?: DisadvantageExamplePreset[];
    /** Field name to receive preset inserts when not using presetFillsNameAndContext */
    presetTargetField?: string;
    /** Preset option: set `name` from label and `context` from text */
    presetFillsNameAndContext?: boolean;
    /** Put long rules / info sections in a collapsible block below the form fields */
    collapsibleRulesBelow?: boolean;
}
/**
 * All available Disadvantages
 * Based on Mastery System rules - during character creation players must take at least
 * CONFIG.MASTERY.creation.minDisadvantagePoints (default 2) and at most maxDisadvantagePoints (8).
 * Disadvantage Points = Starting Faith Fractures (both current and maximum)
 */
export declare const DISADVANTAGES: DisadvantageDefinition[];
/**
 * Get disadvantage definition by ID
 */
export declare function getDisadvantageDefinition(id: string): DisadvantageDefinition | undefined;
/**
 * Get all disadvantage definitions
 */
export declare function getDisadvantageDefinitions(): DisadvantageDefinition[];
/**
 * Legacy mental-restrictions: `restriction` textarea, optional `type`, flat 2 pts until severity is set.
 */
export declare function detailsForMentalRestrictionsDialog(details?: Record<string, any>): Record<string, any>;
/** Migrate old physical-scars (scar / description only) to tier + name + context when opening the dialog. */
export declare function detailsForPhysicalScarsDialog(details?: Record<string, any>): Record<string, any>;
/**
 * Calculate points for a disadvantage selection
 */
export declare function calculateDisadvantagePoints(disadvantageId: string, details: Record<string, any>): number;
/**
 * Validate disadvantage selection
 */
export declare function validateDisadvantageSelection(selections: Array<{
    id: string;
    details: Record<string, any>;
}>): {
    valid: boolean;
    totalPoints: number;
    error?: string;
};
//# sourceMappingURL=disadvantages.d.ts.map