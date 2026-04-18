/**
 * Special Effects Reference for Mastery System
 *
 * All canonical Special Conditions and Effects that can appear during play.
 * Mirrors the SRD "Special Effect Cost Chapters" behaviour model:
 *   - diminishing   : decay X by 1 per round (X → 0)
 *   - timed         : fixed duration, refresh + keep higher X
 *   - untilUsed     : persist until consumed or internal counter reaches 0
 *   - instant       : resolve immediately, no tracking
 *   - support       : remove / reduce / end other effects
 *   - multiAttack   : structural multi-strike riders (Charged)
 *
 * Powers should store only the specialId and value, not the full name string.
 * Example: { specialId: "bleeding", value: 3 } instead of "Bleeding(3)"
 */
export type EffectCategory = 'diminishing' | 'timed' | 'untilUsed' | 'instant' | 'support' | 'multiAttack';
export interface SpecialEffect {
    id: string;
    name: string;
    category: EffectCategory;
    description: string;
    duration: string;
    stacking: 'Yes' | 'No' | 'Additive';
    removal: string;
    hasValue: boolean;
    /** Optional saving throw type: 'Body' | 'Mind' | 'Spirit' | combinations, or '—' */
    save?: string;
    /** Optional dedicated Remove Action skill (e.g. 'Medicine', 'Athletics', 'Meditation', 'Crafting') */
    removeAction?: string;
    /** Whether Cleanse / Dispel Magic can remove/reduce this effect */
    dispellable?: boolean;
    /** PP pricing formula as a compact reference (Start PP for diminishing, base formula otherwise) */
    pricing?: string;
    /** Starting PP for diminishing effects — used with T(X) = X*(X+1)/2 */
    startPP?: number;
    /** True if the effect uses the Charged tag by default (multi-attack riders) */
    charged?: boolean;
}
/**
 * Special Effect Reference (what Powers should store)
 */
export interface SpecialEffectReference {
    specialId: string;
    value?: number;
}
/**
 * Display label without (X) suffix (e.g. "Bleeding(X)" → "Bleeding")
 */
export declare function getEffectBaseName(name: string): string;
/**
 * Diminishing Effects — decay X by 1 per round at start of affected creature's turn.
 * Pricing: PP = startPP × T(X), with T(X) = X*(X+1)/2.
 */
export declare const DIMINISHING_EFFECTS: SpecialEffect[];
/**
 * Timed Effects — fixed duration, refresh on reapply, keep higher X.
 */
export declare const TIMED_EFFECTS: SpecialEffect[];
/**
 * Until Broken / Until Used Effects — persist until consumed or internal counter reaches 0.
 */
export declare const UNTIL_USED_EFFECTS: SpecialEffect[];
/**
 * Instant Effects — resolve immediately, no ongoing tracking.
 */
export declare const INSTANT_EFFECTS: SpecialEffect[];
/**
 * Support / Removal Effects — remove, reduce, or end ongoing effects.
 */
export declare const SUPPORT_EFFECTS: SpecialEffect[];
/**
 * Multi-Attack Structures — structural Charged riders that create additional strikes.
 */
export declare const MULTI_ATTACK_EFFECTS: SpecialEffect[];
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