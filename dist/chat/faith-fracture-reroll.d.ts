/**
 * Faith Fracture reroll: spend 1 current Faith Fracture to reroll a Mastery chat roll once (globally per message).
 */
/** Chat line under a rerolled result. A GM emergency reroll does not name a spender. */
export declare function faithRerollNote(note: {
    spenderName: string;
    free?: boolean;
}): string;
/** How many Reroll Points the button should advertise for this viewer. */
export declare function faithRerollPointsForButton(recipeActor: any, isGm: boolean, isOwnRoll: boolean, user?: User | null | undefined): number | null;
/** Players spend a point. The GM button is an emergency reroll and does not. */
export declare function faithRerollButtonCopy(isGm: boolean, isOwnRoll: boolean, remaining?: number | null): {
    label: string;
    title: string;
};
/**
 * GM-only: spend faith, mark message consumed, post new roll. Serialized per message id.
 * `gmFree` is only for the GM clicking the button on their own client. It does not
 * spend anyone's Reroll Points. Player requests never set it.
 */
export declare function executeFaithFractureReroll(messageId: string, spenderActorId: string, requesterUserId: string, options?: {
    gmFree?: boolean;
}): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function registerFaithFractureRerollHandlers(): void;
//# sourceMappingURL=faith-fracture-reroll.d.ts.map