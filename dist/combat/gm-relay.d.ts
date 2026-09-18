/**
 * Player → GM relays for writes Foundry only accepts from a GM
 * (combat turns, NPC/unlinked-target actor updates).
 */
export declare function settleGmRelay(requestId: string, ok: boolean): void;
/** Keys a player may ask the GM to write onto a target actor. */
export declare function isRelayableActorUpdate(update: unknown): boolean;
export declare function updateActorViaGm(actor: any, update: Record<string, unknown>, options?: Record<string, unknown>): Promise<void>;
export declare function requestCombatNextTurn(): Promise<boolean>;
/**
 * Yield to the next combatant: set this initiative just below theirs, then advance.
 * Returns false when already last in the round.
 */
export declare function initiativeAfterDelay(nextInitiative: number): number;
export declare function requestDelayInitiative(): Promise<boolean>;
//# sourceMappingURL=gm-relay.d.ts.map