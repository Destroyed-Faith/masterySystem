/**
 * Post-damage / status-surface reaction follow-ups (Overload, Cleanse).
 * These are deliberately outside the attack Reaction Window timing.
 */
/**
 * After actual HP bar damage, if the target has Reactive Overload ready,
 * post a chat card so they can spend a Reaction to multiply Absorbed Damage.
 */
export declare function maybeOfferReactiveOverloadChat(target: Actor, hpLost: number, combat: Combat | null): Promise<void>;
/**
 * When ongoing effects apply, offer Reactive Cleanse if equipped.
 */
export declare function maybeOfferReactiveCleanseChat(target: Actor, appliedSpecials: string[], combat: Combat | null): Promise<void>;
/** Bind chat buttons for Overload / Cleanse prompts. */
export declare function registerReactionFollowupChatHandlers(): void;
//# sourceMappingURL=reaction-followups.d.ts.map