/**
 * Post-damage / status-surface reaction follow-ups (Overload, Cleanse).
 * These are deliberately outside the attack Reaction Window timing.
 */
/**
 * After actual HP bar damage, if the target has Reactive Overload ready,
 * post a chat card so they can spend a Reaction to multiply Absorbed Damage.
 */
export declare function maybeOfferReactiveOverloadChat(target: Actor, hpLost: number, combat: Combat | null): Promise<void>;
/** Bonus Stones of a Reaction: Absorption Surge item (printed table by Power Level). */
export declare function absorptionSurgeStonesFor(item: any): number;
/**
 * After a damage instance used at least one Passive: Absorption trigger, offer
 * Reaction: Absorption Surge (1 Reaction, once per damage instance, once per Round).
 */
export declare function maybeOfferAbsorptionSurgeChat(target: Actor, combat: Combat | null, attacker?: Actor | null): Promise<void>;
/**
 * When Specials apply, offer Reaction: Cleanse if equipped. Cleanse(X) may only
 * reduce one of the triggering Specials.
 */
export declare function maybeOfferReactiveCleanseChat(target: Actor, appliedSpecials: string[], combat: Combat | null): Promise<void>;
/** Bind chat buttons for Overload / Cleanse prompts. */
export declare function registerReactionFollowupChatHandlers(): void;
//# sourceMappingURL=reaction-followups.d.ts.map