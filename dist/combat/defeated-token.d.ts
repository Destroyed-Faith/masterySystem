/**
 * Defeated enemies stay on the scene as a ghosted corpse.
 *
 * Do not delete the token (body, loot, revive, boss phase). Player characters
 * at 0 HP stay fully present — Last Breath / Death Checks still need a target.
 * Only the final NPC Health pool counts: boss phase advance runs first.
 */
export declare const DEFEATED_TOKEN_ALPHA = 0.35;
export declare const DOWNED_FLAG = "downed";
export declare const PRE_DOWNED_ALPHA_FLAG = "preDownedAlpha";
export declare function isPlayerCharacterActor(actor: any): boolean;
/** True when this NPC has a Health pool at 0 and no further phase to load. */
export declare function isNpcFinallyDefeated(actor: any): boolean;
export declare function tokenHasDownedFlag(token: any): boolean;
export declare function findCombatantForToken(token: any): any;
/**
 * Dead enemies (or anyone the GM marked defeated) are not legal targets.
 * Characters at 0 HP stay targetable unless explicitly marked defeated.
 */
export declare function tokenIsExcludedAsTarget(token: any): boolean;
export declare function filterExcludedTargetIds(tokenIds: Iterable<string>): Set<string>;
export interface DefeatedPresentationArgs {
    actor?: any;
    tokenId?: string;
    defeated: boolean;
}
/** GM-side / local writes: ghost the token and mark the combatant defeated. */
export declare function writeDefeatedPresentation(args: DefeatedPresentationArgs): Promise<void>;
/** Ghost / restore a token. Players relay to the GM (token + combat writes). */
export declare function applyDefeatedPresentation(args: DefeatedPresentationArgs): Promise<void>;
/**
 * After HP / phase writes: ghost a finally-downed NPC, or restore one that
 * got HP back. No-op for player characters.
 */
export declare function syncNpcDefeatedPresentationAfterHpChange(actor: any, opts?: {
    tokenId?: string;
}): Promise<void>;
//# sourceMappingURL=defeated-token.d.ts.map