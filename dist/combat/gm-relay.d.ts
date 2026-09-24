/**
 * Player → GM relays for writes Foundry only accepts from a GM
 * (combat turns, NPC/unlinked-target actor updates).
 */
export declare function settleGmRelay(requestId: string, ok: boolean): void;
/** Keys a player may ask the GM to write onto a target actor. */
export declare function isRelayableActorUpdate(update: unknown): boolean;
export declare function updateActorViaGm(actor: any, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<void>;
/** Only contest cards may be rewritten by a non-author through the GM. */
export declare function isRelayableMessageUpdate(message: any, update: unknown): boolean;
/**
 * Update a chat message that the current user may not own (the opponent in
 * an Attribute Contest answers on the initiator's card). Authors and GMs
 * write directly; everyone else asks the GM.
 */
export declare function updateChatMessageViaGm(message: any, update: Record<string, unknown>): Promise<void>;
export declare function requestCombatNextTurn(): Promise<boolean>;
/** Write a combatant's initiative. Players cannot update the Combat document. */
export declare function requestSetCombatantInitiative(combatant: {
    id?: string;
    parent?: {
        id?: string;
    };
    combat?: {
        id?: string;
    };
}, initiative: number, flags?: Record<string, unknown>): Promise<boolean>;
/**
 * Yield to the next combatant: set this initiative just below theirs, then advance.
 * Returns false when already last in the round.
 */
export declare function initiativeAfterDelay(nextInitiative: number): number;
/** Ghost / restore a defeated enemy token + combatant. Players cannot write these. */
export declare function requestDefeatedPresentation(args: {
    actor?: {
        id?: string;
        uuid?: string;
    };
    tokenId?: string;
    defeated: boolean;
}): Promise<boolean>;
export declare function requestDelayInitiative(): Promise<boolean>;
//# sourceMappingURL=gm-relay.d.ts.map