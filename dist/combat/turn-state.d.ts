/**
 * Combat Turn State Management
 *
 * DEPRECATED: This file is kept for backwards compatibility.
 * New code should use combat/action-economy.ts instead.
 *
 * This file now wraps the action-economy system for compatibility.
 */
/**
 * Legacy TurnState interface (for backwards compatibility)
 * @deprecated Use RoundState from action-economy.ts instead
 */
export interface TurnState {
    round: number;
    turn: number;
    actions: {
        move: number;
        attack: number;
        reaction: number;
    };
    stoneUses: Record<string, number>;
}
/**
 * Get base actions for a combatant
 * PCs and NPCs both get: { move: 1, attack: 1, reaction: 1 }
 */
export declare function getBaseActions(): TurnState['actions'];
/**
 * Get turn state from combatant flag or create default
 * @deprecated Use getRoundState from action-economy.ts instead
 */
export declare function getTurnState(combatant: Combatant): TurnState;
/**
 * Set turn state on combatant
 * @deprecated Use setRoundState from action-economy.ts instead
 */
export declare function setTurnState(combatant: Combatant, state: TurnState): Promise<void>;
/**
 * Reset turn state for a new turn
 * - Resets used counts to 0
 * - Keeps totals and bonuses from round state
 */
export declare function resetTurnState(combatant: Combatant): Promise<void>;
/**
 * Decrement an action from turn state
 * Returns true if successful, false if no actions left
 */
export declare function decrementAction(combatant: Combatant, actionType: 'move' | 'attack' | 'reaction'): Promise<boolean>;
/**
 * Add an action to turn state (from stone powers, etc.)
 */
export declare function addAction(combatant: Combatant, actionType: 'move' | 'attack' | 'reaction', amount?: number): Promise<void>;
//# sourceMappingURL=turn-state.d.ts.map