/**
 * Safe Haven Rest — restore per-rest resources on a character.
 * Players Guide: one night rest in a Safe Haven (secure + comfortable).
 */
export declare const SAFE_HAVEN_REST_INFO = "Safe Haven Rest: HP, Stress, Scars, Stones, Mastery Charges, Skills, Reroll Points and Echo uses fully restored. You may create, replace, or dismiss Minor Magic Items.";
/** Actor updates for one Safe Haven Rest (no flags / side effects). */
export declare function buildSafeHavenRestUpdates(system: any): Record<string, unknown>;
export declare function applySafeHavenRest(actor: any): Promise<void>;
export declare function listWorldCharacters(): any[];
/** GM: confirm, then rest every world character actor. */
export declare function confirmAndApplySafeHavenRestToAllCharacters(): Promise<number>;
//# sourceMappingURL=safe-haven-rest.d.ts.map