/**
 * Action Economy Management for Mastery System
 *
 * Handles tracking and resetting of actions per round:
 * - Attack Actions (base 1, can be gained/converted)
 * - Movement Actions (base 1, can be gained/converted)
 * - Reactions (base 1, can be gained/converted, expire at turn start)
 *
 * Action Conversion Rules:
 * - May convert extra Attack Actions to Movement or Reactions
 * - Must keep at least 1 Attack Action
 * - Max conversions = Mastery Rank per round
 * - Converted Reactions expire at start of next turn
 */
/**
 * Reset all action counters for an actor at the start of a new round
 * Called automatically by combat round hook
 */
export declare function resetActionsForRound(actor: any): Promise<void>;
/**
 * Reset actions for an actor at the start of their turn
 * Used to expire converted Reactions from previous turn
 */
export declare function resetActionsForTurn(actor: any): Promise<void>;
/**
 * Mark an action as used
 * @param actor - The actor using the action
 * @param actionType - 'attack', 'movement', or 'reaction'
 * @param amount - Number of actions to use (default 1)
 */
export declare function useAction(actor: any, actionType: 'attack' | 'movement' | 'reaction', amount?: number): Promise<boolean>;
/**
 * Undo/unmark an action
 * @param actor - The actor
 * @param actionType - 'attack', 'movement', or 'reaction'
 * @param amount - Number of actions to unmark (default 1)
 */
export declare function unuseAction(actor: any, actionType: 'attack' | 'movement' | 'reaction', amount?: number): Promise<boolean>;
/**
 * Convert an Attack Action to Movement or Reaction
 * @param actor - The actor
 * @param targetType - 'movement' or 'reaction'
 * @returns Success boolean
 */
export declare function convertAttackAction(actor: any, targetType: 'movement' | 'reaction'): Promise<boolean>;
/**
 * Undo a conversion
 * @param actor - The actor
 * @param conversionType - 'movement' or 'reaction'
 */
export declare function undoConversion(actor: any, conversionType: 'movement' | 'reaction'): Promise<boolean>;
/**
 * Get action status for display
 * @param actor - The actor
 * @returns Object with action counts
 */
export declare function getActionStatus(actor: any): {
    attack: {
        used: number;
        max: number;
        remaining: number;
    };
    movement: {
        used: number;
        max: number;
        remaining: number;
    };
    reaction: {
        used: number;
        max: number;
        remaining: number;
    };
    conversions: {
        total: number;
        max: number;
        remaining: number;
    };
};
//# sourceMappingURL=actions.d.ts.map