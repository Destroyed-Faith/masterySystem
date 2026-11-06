/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 *
 * Unlinked NPC copies must match by Token id only — never by shared actorId.
 * Save always pushes combatant.name even when the Actor already holds the new name.
 */
export { actorMatchesCombatant, actorTokenId } from './combat-carousel-helpers.js';
/**
 * Off by default — enable with: game.masteryCarouselRenameDebug(true)
 */
export declare let CAROUSEL_RENAME_DEBUG: boolean;
export declare function setCarouselRenameDebug(on: boolean): void;
export declare function logCarouselRename(...args: unknown[]): void;
/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render
 * when the displayed label would change.
 */
export declare function syncCombatCarouselNamesForActor(actor: any, reason?: string): Promise<boolean>;
/** Persist a typed name on the Actor, then always attempt combatant sync. */
export declare function applyActorDisplayName(actor: any, rawName: string, reason?: string): Promise<void>;
export declare function registerCombatCarouselRenameHooks(): void;
//# sourceMappingURL=combat-carousel-rename.d.ts.map