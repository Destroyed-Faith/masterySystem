/**
 * Actor sheet identity: original world Actor vs unlinked (synthetic) Token actor.
 *
 * Foundry: `actor.isToken === true` means a synthetic Actor embedded in an
 * unlinked Token. Linked Tokens open the world Actor (`isToken === false`).
 * Do not infer from names.
 */
export type ActorSheetIdentityKind = 'unlinked-token' | 'original';
export interface ActorSheetIdentityContext {
    kind: ActorSheetIdentityKind;
    /** True only for synthetic actors from unlinked tokens. */
    isUnlinkedToken: boolean;
    /**
     * Permanent progression (XP, powers, stones, shop, …) is locked for the current user.
     * Players are locked on unlinked tokens; GMs may still edit for testing.
     * Combat state (HP, specials, spent stones) remains editable for everyone.
     */
    progressionLocked: boolean;
    /** Show the optional unobtrusive "original character" chip. */
    showOriginalBadge: boolean;
    /** World Actor id behind an unlinked token, when known. */
    originalActorId: string | null;
    originalActorName: string | null;
    /** User may open the world Actor sheet (OBSERVER+). */
    canOpenOriginal: boolean;
}
/** True when `actor` is a synthetic Actor from an unlinked Token. */
export declare function isUnlinkedTokenActor(actor: any): boolean;
/** True when the current user is a GM (Foundry `game.user.isGM`). */
export declare function isCurrentUserGm(): boolean;
/**
 * Permanent progression edits are blocked on unlinked token sheets for players.
 * GMs may still edit (Dispatch/test tokens are throwaway). Combat stays editable for everyone.
 * Returns false after a warning when locked.
 */
export declare function assertProgressionEditable(actor: any, opts?: {
    silent?: boolean;
}): boolean;
/** World Actor that seeded this unlinked token, or null. */
export declare function resolveOriginalActorFromTokenActor(actor: any): any | null;
export declare function userCanViewActor(actor: any, user?: any): boolean;
/** Template context for the shared identity banner / badge. */
export declare function buildActorSheetIdentityContext(actor: any): ActorSheetIdentityContext;
/** Open the world Actor sheet for an unlinked token actor (no sync). */
export declare function openOriginalActorSheetFromTokenActor(actor: any): Promise<boolean>;
/** Bind the "Open Original Character" control (safe to call on every render). */
export declare function bindActorSheetIdentityControls(root: HTMLElement | JQuery, actor: any): void;
//# sourceMappingURL=actor-sheet-identity.d.ts.map