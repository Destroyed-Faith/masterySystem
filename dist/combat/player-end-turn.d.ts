/** Only turn/round fields — the shape Foundry writes for nextTurn. */
export declare function isTurnAdvanceChange(changed: Record<string, unknown> | null | undefined): boolean;
/**
 * One step forward from the current combatant (including wrapping the round
 * when they are last). Rejects skipping the rest of the round.
 */
export declare function isSingleTurnStep(combat: {
    turn?: number;
    round?: number;
    turns?: unknown[];
    combatants?: {
        size?: number;
    };
}, changed: Record<string, unknown>): boolean;
/** Current combatant's owner may write the next-turn update. */
export declare function playerMayWriteOwnTurnAdvance(combat: any, user: any, changed: Record<string, unknown> | null | undefined): boolean;
//# sourceMappingURL=player-end-turn.d.ts.map