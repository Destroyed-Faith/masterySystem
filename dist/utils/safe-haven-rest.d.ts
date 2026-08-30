/**
 * Safe Haven Rest — restore per-rest resources on a character.
 * Players Guide: one night rest in a Safe Haven (secure + comfortable).
 */
export declare const SAFE_HAVEN_REST_INFO = "Safe Haven Rest: active Health Bar + 1 Scarred Bar restored; Skill Points, Reroll Points, Mastery Charges, daily resources, Sealed Stones and Stones lost until Safe Haven Rest refreshed. You may create, replace, or dismiss Minor Magic Items.";
/**
 * Health-bar updates for a rest (Players Guide "Rests"):
 *   - Night Rest / Safe Haven Rest: restore the current ACTIVE Health Bar to
 *     full (boxes only).
 *   - Safe Haven Rest additionally restores ONE Scarred Health Bar
 *     (counts as a Day of Rest).
 * Bars deplete from index 0 first, so scarred (fully emptied) bars form a
 * prefix and the active bar is the first bar with boxes left.
 */
export declare function buildRestHealthBarUpdates(system: any, opts: {
    restoreOneScarredBar: boolean;
}): Record<string, unknown>;
/** Sealed stones a Word of Recall mark keeps out of the refresh. */
export interface SafeHavenSealHold {
    /** Per stone-pool attribute counts that must stay Sealed. */
    attrCounts?: Record<string, number>;
    /** Generic `system.stones.sealed` count that must stay Sealed. */
    generic?: number;
}
/** Actor updates for one Safe Haven Rest (no flags / side effects). */
export declare function buildSafeHavenRestUpdates(system: any, opts?: {
    sealHold?: SafeHavenSealHold | null;
}): Record<string, unknown>;
export declare function applySafeHavenRest(actor: any): Promise<void>;
/**
 * Night Rest (8 h, anywhere): restores the current active Health Bar to full
 * (boxes only). No Scarred Bars, no daily/Sealed refresh.
 */
export declare function applyNightRest(actor: any): Promise<void>;
/**
 * Day of Rest (24 h natural recovery): restores 1 Scarred Health Bar.
 * Lacerate / Blight block natural recovery until treated.
 */
export declare function applyDayOfRest(actor: any): Promise<boolean>;
export declare function listWorldCharacters(): any[];
/** GM: confirm, then rest every world character actor. */
export declare function confirmAndApplySafeHavenRestToAllCharacters(): Promise<number>;
//# sourceMappingURL=safe-haven-rest.d.ts.map