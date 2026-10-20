/**
 * GM Turn Deferral — preserve a Turn without Delay Initiative (score change)
 * and without End Turn completion.
 */
export declare const DEFERRED_IDS_FLAG = "deferredCombatantIds";
export declare const TURN_STARTED_IDS_FLAG = "turnStartedCombatantIds";
export declare const COMPLETED_IDS_FLAG = "completedCombatantIds";
export declare const DEFER_ORDER_FLAG = "deferOrderIds";
export declare function readDeferredIds(combat: any): string[];
export declare function readTurnStartedIds(combat: any): string[];
export declare function readCompletedIds(combat: any): string[];
export declare function readDeferOrderIds(combat: any): string[];
export declare function isCombatantDeferred(combat: any, combatantId: string): boolean;
export declare function hasCombatantStartedTurn(combat: any, combatantId: string): boolean;
export declare function markTurnStarted(combat: any, combatantId: string): Promise<void>;
export declare function markTurnCompleted(combat: any, combatantId: string): Promise<void>;
/** Whether start-of-turn effects should run for this combatant. */
export declare function shouldRunTurnStartEffects(combat: any, combatantId: string): boolean;
/**
 * Build executable order: completed (in current turns order) →
 * non-deferred remaining (initiative / surprise order) → deferred remaining.
 */
export declare function buildDeferredRoundOrder(turnIds: string[], deferredIds: string[], completedIds: string[]): string[];
export declare function deferCombatantTurn(combat: any, combatantId?: string | null): Promise<{
    ok: boolean;
    message: string;
}>;
export declare function pendingDeferredBlocksRoundAdvance(combat: any): boolean;
export declare function clearDeferStateForNewRound(combat: any): Promise<void>;
/** Sort compare aid: when defer order cache present, use it. */
export declare function compareByDeferOrder(combat: any, aId: string, bId: string): number | null;
//# sourceMappingURL=turn-defer.d.ts.map