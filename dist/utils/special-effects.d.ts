/**
 * Special Effects Reference for Mastery System
 *
 * All Special Conditions, Effects, and ongoing statuses that can appear during play.
 * Each entry lists what it does, how long it lasts, how it stacks, and how it can be removed.
 *
 * Powers should store only the specialId and value, not the full name string.
 * Example: { specialId: "bleeding", value: 3 } instead of "Bleeding(3)"
 */
export type EffectCategory = 'physical' | 'mental' | 'damage' | 'support';
export interface SpecialEffect {
    id: string;
    name: string;
    category: EffectCategory;
    description: string;
    duration: string;
    stacking: 'Yes' | 'No' | 'Additive';
    removal: string;
    hasValue: boolean;
}
/**
 * Special Effect Reference (what Powers should store)
 */
export interface SpecialEffectReference {
    specialId: string;
    value?: number;
}
/**
 * Physical Effects
 */
export declare const PHYSICAL_EFFECTS: SpecialEffect[];
/**
 * Mental Effects
 */
export declare const MENTAL_EFFECTS: SpecialEffect[];
/**
 * Damage & Combat Modifiers
 */
export declare const DAMAGE_EFFECTS: SpecialEffect[];
/**
 * Support & Cleansing Effects
 */
export declare const SUPPORT_EFFECTS: SpecialEffect[];
/**
 * All special effects combined
 */
export declare const ALL_SPECIAL_EFFECTS: SpecialEffect[];
/**
 * Map of all special effects by ID for quick lookup
 */
export declare const SPECIAL_EFFECTS_BY_ID: Map<string, SpecialEffect>;
/**
 * Get all effects by category
 */
export declare function getEffectsByCategory(category: EffectCategory): SpecialEffect[];
/**
 * Get an effect by ID (preferred method)
 */
export declare function getEffectById(id: string): SpecialEffect | undefined;
/**
 * Get an effect by name (legacy support)
 */
export declare function getEffect(name: string): SpecialEffect | undefined;
/**
 * Format a SpecialEffectReference to display string (e.g., { specialId: "bleeding", value: 3 } -> "Bleeding(3)")
 */
export declare function formatEffectReference(ref: SpecialEffectReference): string;
/**
 * Parse effect string to SpecialEffectReference (e.g., "Bleeding(3)" -> { specialId: "bleeding", value: 3 })
 */
export declare function parseEffectString(effectString: string): SpecialEffectReference | null;
/**
 * Parse effect value from effect string (e.g., "Bleeding(3)" -> 3) - legacy function
 */
export declare function parseEffectValue(effectString: string): number | null;
/**
 * Format effect with value (e.g., "Bleeding", 3 -> "Bleeding(3)") - legacy function
 */
export declare function formatEffectWithValue(effectName: string, value: number): string;
/**
 * Convert array of SpecialEffectReference to array of display strings
 */
export declare function formatEffectReferences(refs: SpecialEffectReference[]): string[];
/**
 * Convert array of effect strings to array of SpecialEffectReference
 */
export declare function parseEffectStrings(effectStrings: string[]): SpecialEffectReference[];
//# sourceMappingURL=special-effects.d.ts.map