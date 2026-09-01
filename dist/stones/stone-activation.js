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
import { STONE_POWERS, resolveStonePowerId, tierForUseIndex, stonePowerSkipsFirstTier, stonePowerSupportPrefillApplies, effectiveStoneSupportPrefillTier, } from './stone-powers.js';
import { getArtifactStoneSupportPrefill } from '../utils/artifact-stone-functions.js';
import { isInitiativeBoostUsedThisCombat } from './colorless-stones.js';
export function resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier) {
    const rampSkip = stonePowerSkipsFirstTier(abilityId) ? 1 : 0;
    const effective = effectiveStoneSupportPrefillTier(abilityId, prefillTier);
    const supportApplies = stonePowerSupportPrefillApplies(abilityId, prefillTier);
    const paidUses = Math.max(0, Math.floor(Number(rawUsesBefore) || 0));
    const prefillBaseline = supportApplies ? Math.max(0, effective - 1) : 0;
    const usesBefore = Math.max(paidUses + rampSkip, prefillBaseline);
    return {
        tier: tierForUseIndex(usesBefore),
        cost: calculateStoneCost(paidUses + rampSkip),
        supportApplies,
    };
}
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
    const { combatant, abilityId, attributeKey, colorlessSpent = 0 } = options;
    const actor = getActionEconomyActor(options.actor) ?? options.actor;
    // Get power definition
    const power = STONE_POWERS[resolveStonePowerId(abilityId)];
    if (!power) {
        ui.notifications?.error(`Unknown stone power: ${abilityId}`);
        return false;
    }
    if (power.id === 'wits.initiativeBoost' && isInitiativeBoostUsedThisCombat(combatant)) {
        ui.notifications?.warn('Initiative Boost may be used only once per combat.');
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
    // Artifact Stone Power Support may only raise an already-activated ability.
    // The character must pay the first published tier themselves (T2 when T1
    // does not exist). Support never activates that first tier.
    const combat = game.combat;
    const rawUsesBefore = abilityId.startsWith('generic.')
        ? getGenericStonePowerUsageCount(actor, abilityId, combat)
        : getStoneUsageCount(actor, poolAttribute, abilityId, combat);
    // T2-start powers (no Tier 1, e.g. Extra Attack) start one segment higher:
    // the first activation is Tier 2 and the player pays the Tier-2 cost.
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId, poolAttribute);
    const { tier, cost } = resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier);
    // Use the action economy system to handle stone spending
    return await spendStoneAbility(actor, combatant, poolAttribute, abilityId, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    }, cost, colorlessSpent);
}
/**
 * General-Macht aktivieren, wenn die Zahlung über mehrere Stein-Pools verteilt ist (Dialog-Lanes).
 */
export async function activateGenericStonePowerMixed(options) {
    const { combatant, abilityId, perAttributeStones } = options;
    const actor = getActionEconomyActor(options.actor) ?? options.actor;
    const power = STONE_POWERS[resolveStonePowerId(abilityId)];
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
    // any equipped artifact (attribute-agnostic match). The effect tier is
    // floored to the prefill tier while the player only pays the raw wave
    // cost (the Artifact Support Stones are provided by the artifact).
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId);
    const { tier, cost } = resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier);
    return spendGenericStoneAbilityWithPerAttributeDeductions(actor, combatant, abilityId, perAttributeStones, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    }, cost);
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