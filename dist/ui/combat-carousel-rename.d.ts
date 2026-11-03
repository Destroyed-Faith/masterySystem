/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 * Temporary verbose logging is on so we can see which step fails in play.
 */
/** Flip to false once rename sync is confirmed stable. */
export declare let CAROUSEL_RENAME_DEBUG: boolean;
export declare function setCarouselRenameDebug(on: boolean): void;
export declare function logCarouselRename(...args: unknown[]): void;
/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render.
 */
export declare function syncCombatCarouselNamesForActor(actor: any, reason?: string): Promise<void>;
/** Persist a typed name on the Actor, then sync the carousel. */
export declare function applyActorDisplayName(actor: any, rawName: string, reason?: string): Promise<void>;
export declare function registerCombatCarouselRenameHooks(): void;
//# sourceMappingURL=combat-carousel-rename.d.ts.map