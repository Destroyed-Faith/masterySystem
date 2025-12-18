/**
 * Combat Turn State Management
 * 
 * DEPRECATED: This file is kept for backwards compatibility.
 * New code should use combat/action-economy.ts instead.
 * 
 * This file now wraps the action-economy system for compatibility.
 */

import { 
  getRoundState, 
  setRoundState, 
  resetTurnState as resetTurnStateNew,
  spendAttackAction,
  spendMovementAction,
  spendReactionAction
} from './action-economy.js';

/**
 * Legacy TurnState interface (for backwards compatibility)
 * @deprecated Use RoundState from action-economy.ts instead
 */
export interface TurnState {
  round: number;
  turn: number;
  actions: {
    move: number;
    attack: number;  // Shared by Attack, Buff, Utility
    reaction: number;
  };
  stoneUses: Record<string, number>; // abilityKey -> uses this turn
}

/**
 * Get base actions for a combatant
 * PCs and NPCs both get: { move: 1, attack: 1, reaction: 1 }
 */
export function getBaseActions(): TurnState['actions'] {
  return {
    move: 1,
    attack: 1,
    reaction: 1
  };
}

/**
 * Get turn state from combatant flag or create default
 * @deprecated Use getRoundState from action-economy.ts instead
 */
export function getTurnState(combatant: Combatant): TurnState {
  const actor = combatant.actor;
  if (!actor) {
    return {
      round: game.combat?.round || 1,
      turn: game.combat?.turn || 0,
      actions: getBaseActions(),
      stoneUses: {}
    };
  }
  
  const roundState = getRoundState(actor, game.combat);
  
  // Convert to legacy format
  return {
    round: roundState.round,
    turn: roundState.turn,
    actions: {
      move: roundState.movementActions.total - roundState.movementActions.used,
      attack: roundState.attackActions.total - roundState.attackActions.used,
      reaction: roundState.reactionActions.total - roundState.reactionActions.used
    },
    stoneUses: {} // Legacy - stone usage is now tracked differently
  };
}

/**
 * Set turn state on combatant
 * @deprecated Use setRoundState from action-economy.ts instead
 */
export async function setTurnState(combatant: Combatant, state: TurnState): Promise<void> {
  const actor = combatant.actor;
  if (!actor) return;
  
  const roundState = getRoundState(actor, game.combat);
  
  // Update used counts based on legacy state
  roundState.movementActions.used = roundState.movementActions.total - state.actions.move;
  roundState.attackActions.used = roundState.attackActions.total - state.actions.attack;
  roundState.reactionActions.used = roundState.reactionActions.total - state.actions.reaction;
  
  await setRoundState(actor, roundState);
}

/**
 * Reset turn state for a new turn
 * - Resets used counts to 0
 * - Keeps totals and bonuses from round state
 */
export async function resetTurnState(combatant: Combatant): Promise<void> {
  const combat = game.combat;
  if (!combat) return;
  
  const actor = combatant.actor;
  if (!actor) return;
  
  await resetTurnStateNew(actor, combat);
  
  console.log(`Mastery System | Turn state reset for ${combatant.name}`);
}

/**
 * Decrement an action from turn state
 * Returns true if successful, false if no actions left
 */
export async function decrementAction(
  combatant: Combatant, 
  actionType: 'move' | 'attack' | 'reaction'
): Promise<boolean> {
  const actor = combatant.actor;
  if (!actor) return false;
  
  const combat = game.combat;
  
  switch (actionType) {
    case 'move':
      return await spendMovementAction(actor, combat);
    case 'attack':
      return await spendAttackAction(actor, combat);
    case 'reaction':
      return await spendReactionAction(actor, combat);
    default:
      return false;
  }
}

/**
 * Add an action to turn state (from stone powers, etc.)
 */
export async function addAction(
  combatant: Combatant,
  actionType: 'move' | 'attack' | 'reaction',
  amount: number = 1
): Promise<void> {
  const actor = combatant.actor;
  if (!actor) return;
  
  const roundState = getRoundState(actor, game.combat);
  
  switch (actionType) {
    case 'move':
      roundState.movementActions.total += amount;
      break;
    case 'attack':
      roundState.attackActions.total += amount;
      break;
    case 'reaction':
      roundState.reactionActions.total += amount;
      break;
  }
  
  await setRoundState(actor, roundState);
}

