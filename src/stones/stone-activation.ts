/**
 * Stone Power Activation System
 * 
 * Implements:
 * - Power registry with attribute associations
 * - Exponential cost calculation (1, 2, 4, 8, 16...)
 * - Pool deduction and round state updates
 */

import { 
  spendStoneAbility,
  type RoundState,
  type AttributeKey
} from '../combat/action-economy.js';

// Import canonical stone powers definition
import { STONE_POWERS, type StonePower } from './stone-powers.js';

// Re-export for backward compatibility
export { STONE_POWERS, type StonePower };

/**
 * Activate a stone power
 * 
 * @param actor The actor using the power
 * @param combatant The combatant in combat
 * @param abilityId The stone power ID
 * @param attributeKey For generic powers, which attribute pool to use
 * @returns true if successful, false if failed (insufficient stones, etc.)
 */
export async function activateStonePower(options: {
  actor: Actor;
  combatant: Combatant;
  abilityId: string;
  attributeKey?: AttributeKey;
}): Promise<boolean> {
  const { actor, combatant, abilityId, attributeKey } = options;
  
  // Get power definition
  const power = STONE_POWERS[abilityId];
  if (!power) {
    ui.notifications?.error(`Unknown stone power: ${abilityId}`);
    return false;
  }
  
  // Determine which attribute pool to use
  let poolAttribute: AttributeKey;
  if (power.attribute === 'generic') {
    if (!attributeKey) {
      ui.notifications?.error('Generic power requires an attribute to be specified');
      return false;
    }
    poolAttribute = attributeKey;
  } else {
    poolAttribute = power.attribute;
  }
  
  // Use the action economy system to handle stone spending
  return await spendStoneAbility(
    actor,
    combatant,
    poolAttribute,
    abilityId,
    async (_roundState: RoundState) => {
      // Apply power effect (modifies roundState)
      await power.apply(actor, combatant);
    }
  );
}

/**
 * Get available stone powers for an actor
 * (could filter based on mastery rank, unlocked powers, etc.)
 */
export function getAvailableStonePowers(_actor: Actor): StonePower[] {
  // For now, return all powers
  // Could filter based on:
  // - Mastery rank
  // - Unlocked trees
  // - Equipment
  return Object.values(STONE_POWERS);
}

