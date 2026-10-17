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