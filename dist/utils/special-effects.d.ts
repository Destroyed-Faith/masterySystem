/**
 * Special Effects Reference for Mastery System
 *
 * All Special Conditions, Effects, and ongoing statuses that can appear during play.
 * Each entry lists what it does, how long it lasts, how it stacks, and how it can be removed.
 */
export type EffectCategory = 'physical' | 'mental' | 'damage' | 'support';
export interface SpecialEffect {
    name: string;
    category: EffectCategory;
    description: string;
    duration: string;
    stacking: 'Yes' | 'No' | 'Additive';
    removal: string;
    hasValue: boolean;
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
 * Get all effects by category
 */
export declare function getEffectsByCategory(category: EffectCategory): SpecialEffect[];
/**
 * Get an effect by name
 */
export declare function getEffect(name: string): SpecialEffect | undefined;
/**
 * Parse effect value from effect string (e.g., "Bleeding(3)" -> 3)
 */
export declare function parseEffectValue(effectString: string): number | null;
/**
 * Format effect with value (e.g., "Bleeding", 3 -> "Bleeding(3)")
 */
export declare function formatEffectWithValue(effectName: string, value: number): string;
//# sourceMappingURL=special-effects.d.ts.map