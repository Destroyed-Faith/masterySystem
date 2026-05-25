/**
 * Stone Power Activation System
 *
 * Implements:
 * - Power registry with attribute associations
 * - Exponential cost calculation (1, 2, 4, 8, 16...)
 * - Pool deduction and round state updates
 */
import { spendStoneAbility, spendGenericStoneAbilityWithPerAttributeDeductions, getActionEconomyActor, getStoneUsageCount, getGenericStonePowerUsageCount, calculateStoneCost } from '../combat/action-economy.js';
// Import canonical stone powers definition
import { STONE_POWERS, tierForUseIndex } from './stone-powers.js';
import { getArtifactStoneSupportPrefill } from '../utils/artifact-stone-functions.js';
// Re-export for backward compatibility
export { STONE_POWERS };
/**
 * Activate a stone power
 *
 * @param actor The actor using the power
 * @param combatant The combatant in combat
 * @param abilityId The stone power ID
 * @param attributeKey For generic powers, which attribute pool to use
 * @returns true if successful, false if failed (insufficient stones, etc.)
 */
export async function activateStonePower(options) {
    const { combatant, abilityId, attributeKey } = options;
    const actor = getActionEconomyActor(options.actor) ?? options.actor;
    // Get power definition
    const power = STONE_POWERS[abilityId];
    if (!power) {
        ui.notifications?.error(`Unknown stone power: ${abilityId}`);
        return false;
    }
    // Determine which attribute pool to use
    let poolAttribute;
    if (power.attribute === 'generic') {
        if (!attributeKey) {
            ui.notifications?.error('Generic power requires an attribute to be specified');
            return false;
        }
        poolAttribute = attributeKey;
    }
    else {
        poolAttribute = power.attribute;
    }
    // Compute the tier from the current usage count (BEFORE the increment
    // that spendStoneAbility will perform on success). The cost matches.
    //
    // Artifact "Stone Power Support" Stone Functions pre-fill the activation
    // to a higher tier. The pre-fill behaves as if the power had been used
    // `prefillTier - 1` times already this turn, so the first activation
    // jumps to the prefill tier and pays the cost matching that tier.
    // Subsequent activations on the same turn scale normally from there.
    const combat = game.combat;
    const rawUsesBefore = abilityId.startsWith('generic.')
        ? getGenericStonePowerUsageCount(actor, abilityId, combat)
        : getStoneUsageCount(actor, poolAttribute, abilityId, combat);
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId, poolAttribute);
    const prefillBaseline = Math.max(0, prefillTier - 1);
    const usesBefore = Math.max(rawUsesBefore, prefillBaseline);
    const tier = tierForUseIndex(usesBefore);
    const cost = calculateStoneCost(usesBefore);
    // Use the action economy system to handle stone spending
    return await spendStoneAbility(actor, combatant, poolAttribute, abilityId, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    });
}
/**
 * General-Macht aktivieren, wenn die Zahlung über mehrere Stein-Pools verteilt ist (Dialog-Lanes).
 */
export async function activateGenericStonePowerMixed(options) {
    const { combatant, abilityId, perAttributeStones } = options;
    const actor = getActionEconomyActor(options.actor) ?? options.actor;
    const power = STONE_POWERS[abilityId];
    if (!power) {
        ui.notifications?.error(`Unknown stone power: ${abilityId}`);
        return false;
    }
    if (power.attribute !== 'generic') {
        ui.notifications?.error('activateGenericStonePowerMixed is only for generic powers');
        return false;
    }
    const combat = game.combat;
    const rawUsesBefore = getGenericStonePowerUsageCount(actor, abilityId, combat);
    // Generic / multi-pool activations get the highest Support prefill from
    // any equipped artifact (attribute-agnostic match).
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId);
    const prefillBaseline = Math.max(0, prefillTier - 1);
    const usesBefore = Math.max(rawUsesBefore, prefillBaseline);
    const tier = tierForUseIndex(usesBefore);
    const cost = calculateStoneCost(usesBefore);
    return spendGenericStoneAbilityWithPerAttributeDeductions(actor, combatant, abilityId, perAttributeStones, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    });
}
/**
 * Get available stone powers for an actor
 * (could filter based on mastery rank, unlocked powers, etc.)
 */
export function getAvailableStonePowers(_actor) {
    // For now, return all powers
    // Could filter based on:
    // - Mastery rank
    // - Unlocked trees
    // - Equipment
    return Object.values(STONE_POWERS);
}
//# sourceMappingURL=stone-activation.js.map