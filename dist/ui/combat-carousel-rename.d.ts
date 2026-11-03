/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 * Only writes / re-renders when a displayed name actually changes.
 */
/** Opt-in console tracing: `game.masteryCarouselRenameDebug(true)`. */
export declare let CAROUSEL_RENAME_DEBUG: boolean;
export declare function setCarouselRenameDebug(on: boolean): void;
export declare function logCarouselRename(...args: unknown[]): void;
/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render
 * only when something actually changed.
 */
export declare function syncCombatCarouselNamesForActor(actor: any, reason?: string): Promise<boolean>;
/** Persist a typed name on the Actor, then sync the carousel if needed. */
export declare function applyActorDisplayName(actor: any, rawName: string, reason?: string): Promise<void>;
export declare function registerCombatCarouselRenameHooks(): void;
//# sourceMappingURL=combat-carousel-rename.d.ts.map