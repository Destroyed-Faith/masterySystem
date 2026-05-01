/**
 * Languages of the Known Realms — Players Guide 3100–3127 ("Choose a
 * Language"). Every character speaks the **Common Tongue** plus one
 * additional language reflecting their origin / training.
 *
 * The list is intentionally short and open. GMs may approve additional
 * world-specific languages by adding entries to a per-world setting; this
 * module only exposes the canon defaults.
 */
export interface LanguageDefinition {
    /** Stable key used in `system.languages.known[]`. */
    key: string;
    /** Display name as it appears in the Players Guide. */
    name: string;
    /** One-line flavour description. */
    description: string;
    /**
     * If `true` the language is considered universal — every character
     * speaks it without spending the picker slot. In current canon only
     * the Common Tongue qualifies.
     */
    isCommon?: boolean;
}
export declare const LANGUAGES: LanguageDefinition[];
/** Look up a language by key. */
export declare function getLanguage(key: string): LanguageDefinition | undefined;
/** Picker options ordered with the Common Tongue first. */
export declare function getPickerOptions(): LanguageDefinition[];
/**
 * The Common Tongue key — Players Guide 3102 declares it as the
 * universal language all characters speak.
 */
export declare const COMMON_LANGUAGE_KEY = "common";
/**
 * Players Guide 3103: "choose **one other language**" beyond the Common
 * Tongue at character creation.
 */
export declare const STARTING_PICKED_LANGUAGES = 1;
/**
 * Validate the language list on an actor against the creation rule.
 *
 * Returns the cleaned list (Common Tongue prepended, duplicates removed,
 * unknown keys stripped) plus a flag indicating whether the count of
 * non-Common picks matches the creation rule (`STARTING_PICKED_LANGUAGES`).
 */
export declare function normalizeKnownLanguages(known: unknown): {
    cleaned: string[];
    pickedNonCommon: number;
    creationValid: boolean;
};
//# sourceMappingURL=languages.d.ts.map