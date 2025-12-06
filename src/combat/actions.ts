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
export async function resetActionsForRound(actor: any): Promise<void> {
  if (!actor) return;
  
  const system = actor.system;
  if (!system.actions) return;
  
  // Reset used counters
  const updates: any = {
    'system.actions.attack.used': 0,
    'system.actions.movement.used': 0,
    'system.actions.reaction.used': 0,
    
    // Reset temporary bonuses from Initiative Shop or other sources
    'system.actions.attack.bonus': 0,
    'system.actions.movement.bonus': 0,
    'system.actions.reaction.bonus': 0,
    
    // Reset conversions
    'system.actions.conversions.attackToMovement': 0,
    'system.actions.conversions.attackToReaction': 0,
    'system.actions.reaction.convertedThisRound': 0,
    
    // Recalculate max from base + bonus
    'system.actions.attack.max': system.actions.attack.base + system.actions.attack.bonus,
    'system.actions.movement.max': system.actions.movement.base + system.actions.movement.bonus,
    'system.actions.reaction.max': system.actions.reaction.base + system.actions.reaction.bonus
  };
  
  await actor.update(updates);
  
  console.log(`Mastery System | Reset actions for ${actor.name}`);
}

/**
 * Reset actions for an actor at the start of their turn
 * Used to expire converted Reactions from previous turn
 */
export async function resetActionsForTurn(actor: any): Promise<void> {
  if (!actor) return;
  
  const system = actor.system;
  if (!system.actions) return;
  
  // Remove converted Reactions that expired
  const convertedReactions = system.actions.reaction.convertedThisRound || 0;
  
  if (convertedReactions > 0) {
    const newMax = Math.max(
      system.actions.reaction.base,
      system.actions.reaction.max - convertedReactions
    );
    
    await actor.update({
      'system.actions.reaction.max': newMax,
      'system.actions.reaction.convertedThisRound': 0
    });
    
    console.log(`Mastery System | Expired ${convertedReactions} converted Reaction(s) for ${actor.name}`);
  }
}

/**
 * Mark an action as used
 * @param actor - The actor using the action
 * @param actionType - 'attack', 'movement', or 'reaction'
 * @param amount - Number of actions to use (default 1)
 */
export async function useAction(
  actor: any, 
  actionType: 'attack' | 'movement' | 'reaction',
  amount: number = 1
): Promise<boolean> {
  if (!actor || !actor.system.actions) return false;
  
  const action = actor.system.actions[actionType];
  const newUsed = action.used + amount;
  
  // Check if we have enough actions remaining
  if (newUsed > action.max) {
    ui.notifications?.warn(`Not enough ${actionType} actions remaining!`);
    return false;
  }
  
  await actor.update({
    [`system.actions.${actionType}.used`]: newUsed
  });
  
  console.log(`Mastery System | ${actor.name} used ${amount} ${actionType} action(s) (${newUsed}/${action.max})`);
  return true;
}

/**
 * Undo/unmark an action
 * @param actor - The actor
 * @param actionType - 'attack', 'movement', or 'reaction'
 * @param amount - Number of actions to unmark (default 1)
 */
export async function unuseAction(
  actor: any,
  actionType: 'attack' | 'movement' | 'reaction',
  amount: number = 1
): Promise<boolean> {
  if (!actor || !actor.system.actions) return false;
  
  const action = actor.system.actions[actionType];
  const newUsed = Math.max(0, action.used - amount);
  
  await actor.update({
    [`system.actions.${actionType}.used`]: newUsed
  });
  
  console.log(`Mastery System | ${actor.name} unmarked ${amount} ${actionType} action(s) (${newUsed}/${action.max})`);
  return true;
}

/**
 * Convert an Attack Action to Movement or Reaction
 * @param actor - The actor
 * @param targetType - 'movement' or 'reaction'
 * @returns Success boolean
 */
export async function convertAttackAction(
  actor: any,
  targetType: 'movement' | 'reaction'
): Promise<boolean> {
  if (!actor || !actor.system.actions) return false;
  
  const system = actor.system;
  const masteryRank = system.mastery?.rank || 2;
  
  // Check conversion rules
  const totalConversions = 
    system.actions.conversions.attackToMovement + 
    system.actions.conversions.attackToReaction;
  
  // Cannot exceed Mastery Rank conversions per round
  if (totalConversions >= masteryRank) {
    ui.notifications?.warn(`Can only convert ${masteryRank} Attack Action(s) per round (Mastery Rank limit)!`);
    return false;
  }
  
  // Must keep at least 1 Attack Action
  const availableAttacks = system.actions.attack.max - system.actions.attack.used;
  const afterConversion = availableAttacks - 1;
  
  if (afterConversion < 1) {
    ui.notifications?.warn('Must keep at least 1 Attack Action! Cannot convert your last Attack.');
    return false;
  }
  
  // Perform conversion
  const updates: any = {};
  
  if (targetType === 'movement') {
    updates['system.actions.conversions.attackToMovement'] = system.actions.conversions.attackToMovement + 1;
    updates['system.actions.movement.max'] = system.actions.movement.max + 1;
  } else {
    updates['system.actions.conversions.attackToReaction'] = system.actions.conversions.attackToReaction + 1;
    updates['system.actions.reaction.max'] = system.actions.reaction.max + 1;
    updates['system.actions.reaction.convertedThisRound'] = (system.actions.reaction.convertedThisRound || 0) + 1;
  }
  
  // Reduce available Attack Actions
  updates['system.actions.attack.used'] = system.actions.attack.used + 1;
  
  await actor.update(updates);
  
  ui.notifications?.info(`Converted 1 Attack Action to ${targetType}!`);
  console.log(`Mastery System | ${actor.name} converted Attack to ${targetType}`);
  
  return true;
}

/**
 * Undo a conversion
 * @param actor - The actor
 * @param conversionType - 'movement' or 'reaction'
 */
export async function undoConversion(
  actor: any,
  conversionType: 'movement' | 'reaction'
): Promise<boolean> {
  if (!actor || !actor.system.actions) return false;
  
  const system = actor.system;
  const conversionField = conversionType === 'movement' 
    ? 'attackToMovement' 
    : 'attackToReaction';
  
  const currentConversions = system.actions.conversions[conversionField];
  
  if (currentConversions <= 0) {
    ui.notifications?.warn(`No ${conversionType} conversions to undo!`);
    return false;
  }
  
  const updates: any = {};
  
  updates[`system.actions.conversions.${conversionField}`] = currentConversions - 1;
  updates[`system.actions.${conversionType}.max`] = system.actions[conversionType].max - 1;
  updates['system.actions.attack.used'] = Math.max(0, system.actions.attack.used - 1);
  
  if (conversionType === 'reaction') {
    updates['system.actions.reaction.convertedThisRound'] = 
      Math.max(0, (system.actions.reaction.convertedThisRound || 0) - 1);
  }
  
  await actor.update(updates);
  
  ui.notifications?.info(`Undid conversion to ${conversionType}!`);
  console.log(`Mastery System | ${actor.name} undid conversion to ${conversionType}`);
  
  return true;
}

/**
 * Get action status for display
 * @param actor - The actor
 * @returns Object with action counts
 */
export function getActionStatus(actor: any): {
  attack: { used: number; max: number; remaining: number };
  movement: { used: number; max: number; remaining: number };
  reaction: { used: number; max: number; remaining: number };
  conversions: { total: number; max: number; remaining: number };
} {
  const system = actor.system;
  
  if (!system.actions) {
    return {
      attack: { used: 0, max: 1, remaining: 1 },
      movement: { used: 0, max: 1, remaining: 1 },
      reaction: { used: 0, max: 1, remaining: 1 },
      conversions: { total: 0, max: 2, remaining: 2 }
    };
  }
  
  const masteryRank = system.mastery?.rank || 2;
  const totalConversions = 
    (system.actions.conversions?.attackToMovement || 0) + 
    (system.actions.conversions?.attackToReaction || 0);
  
  return {
    attack: {
      used: system.actions.attack.used || 0,
      max: system.actions.attack.max || 1,
      remaining: (system.actions.attack.max || 1) - (system.actions.attack.used || 0)
    },
    movement: {
      used: system.actions.movement.used || 0,
      max: system.actions.movement.max || 1,
      remaining: (system.actions.movement.max || 1) - (system.actions.movement.used || 0)
    },
    reaction: {
      used: system.actions.reaction.used || 0,
      max: system.actions.reaction.max || 1,
      remaining: (system.actions.reaction.max || 1) - (system.actions.reaction.used || 0)
    },
    conversions: {
      total: totalConversions,
      max: masteryRank,
      remaining: masteryRank - totalConversions
    }
  };
}

