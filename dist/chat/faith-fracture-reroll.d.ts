/**
 * Faith Fracture reroll: spend 1 current Faith Fracture to reroll a Mastery chat roll once (globally per message).
 */
/**
 * GM-only: spend faith, mark message consumed, post new roll. Serialized per message id.
 */
export declare function executeFaithFractureReroll(messageId: string, spenderActorId: string, requesterUserId: string): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function registerFaithFractureRerollHandlers(): void;
//# sourceMappingURL=faith-fracture-reroll.d.ts.map