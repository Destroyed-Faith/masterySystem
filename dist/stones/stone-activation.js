/**
 * Stone Power Activation System
 *
 * Implements:
 * - Power registry with attribute associations
 * - Universal four-Rank costs (Normal 1/2/4/8, Premium 2/4/6/8)
 * - Pool deduction and round state updates
 */
import { spendStoneAbility, spendGenericStoneAbilityWithPerAttributeDeductions, getActionEconomyActor, getStoneUsageCount, getGenericStonePowerUsageCount, incrementStoneUsage, incrementGenericStonePowerUsage } from '../combat/action-economy.js';
// Import canonical stone powers definition
import { STONE_POWERS, STONE_TIER_HARD_MAX, resolveOncePerCombatStoneTier, resolveStonePowerId, tierForUseIndex, stonePowerRankCost, stonePowerSupportPrefillApplies, effectiveStoneSupportPrefillTier, isRetiredStonePower, RETIRED_STONE_POWER_MESSAGE, } from './stone-powers.js';
import { getArtifactStoneSupportPrefill } from '../utils/artifact-stone-functions.js';
import { isOncePerCombatPowerUsed, markOncePerCombatPowerUsed } from './colorless-stones.js';
import { payAndApplyRemoveScar, REMOVE_SCAR_POWER_ID } from './remove-scar.js';
import { stonePowerAllowsColorless, stonePowerColorlessRejectMessage } from './stone-payment-rules.js';
/**
 * Each activation this Round raises the Ability one Rank. The Rank's
 * additional cost follows the Ability's Normal or Premium curve. A Stone
 * Power Support prefill makes exactly its named Rank free; every lower Rank
 * is activated and paid normally. `legal` is false past Rank 4.
 */
export function resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier) {
    const prefill = effectiveStoneSupportPrefillTier(abilityId, prefillTier);
    const supportApplies = stonePowerSupportPrefillApplies(abilityId, prefillTier);
    const paidUses = Math.max(0, Math.floor(Number(rawUsesBefore) || 0));
    const rank = paidUses + 1;
    const legal = rank <= STONE_TIER_HARD_MAX;
    const cost = legal && rank === prefill ? 0 : stonePowerRankCost(abilityId, rank);
    return {
        tier: tierForUseIndex(paidUses),
        cost,
        supportApplies,
        legal,
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
    const { combatant, abilityId, attributeKey, colorlessSpent = 0, placedCount } = options;
    const actor = getActionEconomyActor(options.actor) ?? options.actor;
    // Get power definition
    const power = STONE_POWERS[resolveStonePowerId(abilityId)];
    if (!power) {
        ui.notifications?.error(`Unknown stone power: ${abilityId}`);
        return false;
    }
    if (isRetiredStonePower(power.id)) {
        ui.notifications?.warn(RETIRED_STONE_POWER_MESSAGE);
        return false;
    }
    if (power.oncePerCombat && isOncePerCombatPowerUsed(combatant, power.id)) {
        ui.notifications?.warn(`${power.name} may be used only once per combat.`);
        return false;
    }
    if (!stonePowerAllowsColorless(power.id) && colorlessSpent > 0) {
        ui.notifications?.warn(stonePowerColorlessRejectMessage(power.id));
        return false;
    }
    if (power.id === REMOVE_SCAR_POWER_ID) {
        const prefillTier = getArtifactStoneSupportPrefill(actor, power.id, 'vitality');
        return payAndApplyRemoveScar(actor, {
            colorlessSpent,
            supportPrefillTier: prefillTier,
        });
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
    // Stone Power Support pre-fills exactly one named Rank (it costs nothing);
    // every lower Rank is activated and paid normally.
    const combat = game.combat;
    const rawUsesBefore = abilityId.startsWith('generic.')
        ? getGenericStonePowerUsageCount(actor, abilityId, combat)
        : getStoneUsageCount(actor, poolAttribute, abilityId, combat);
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId, poolAttribute);
    const cluster = power.oncePerCombat && placedCount != null && options.tier == null
        ? resolveOncePerCombatStoneTier(abilityId, placedCount, prefillTier)
        : null;
    if (cluster && cluster.tier < 1) {
        return false;
    }
    const explicitRank = options.tier != null && options.cost != null;
    const resolved = explicitRank
        ? {
            tier: Math.floor(Number(options.tier)),
            cost: Math.max(0, Math.floor(Number(options.cost))),
            legal: Math.floor(Number(options.tier)) >= 1 && Math.floor(Number(options.tier)) <= STONE_TIER_HARD_MAX,
        }
        : cluster
            ? { tier: cluster.tier, cost: Math.max(0, Math.floor(Number(placedCount) || 0)), legal: true }
            : resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier);
    const { tier, cost } = resolved;
    if (tier > 4 || !resolved.legal) {
        ui.notifications?.warn(`${power.name} ends at Rank 4.`);
        return false;
    }
    // Use the action economy system to handle stone spending
    const ok = await spendStoneAbility(actor, combatant, poolAttribute, abilityId, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    }, cost, colorlessSpent);
    if (ok && power.oncePerCombat) {
        await markOncePerCombatPowerUsed(combatant, power.id);
    }
    if (ok)
        await recordExtraStoneRankUsage(actor, abilityId, poolAttribute, options.ranksGained);
    return ok;
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
    // any equipped artifact (attribute-agnostic match). The pre-filled Rank
    // costs nothing; the other Ranks are paid from the chosen pools.
    const prefillTier = getArtifactStoneSupportPrefill(actor, abilityId);
    const explicitRank = options.tier != null && options.cost != null;
    const resolved = explicitRank
        ? {
            tier: Math.floor(Number(options.tier)),
            cost: Math.max(0, Math.floor(Number(options.cost))),
            legal: Math.floor(Number(options.tier)) >= 1 &&
                Math.floor(Number(options.tier)) <= STONE_TIER_HARD_MAX,
        }
        : resolveStonePowerActivation(abilityId, rawUsesBefore, prefillTier);
    const { tier, cost } = resolved;
    if (tier > 4 || !resolved.legal) {
        ui.notifications?.warn(`${power.name} ends at Rank 4.`);
        return false;
    }
    const ok = await spendGenericStoneAbilityWithPerAttributeDeductions(actor, combatant, abilityId, perAttributeStones, async (_roundState) => {
        await power.apply({ actor, combatant, tier, cost });
    }, cost);
    if (ok)
        await recordExtraStoneRankUsage(actor, abilityId, undefined, options.ranksGained);
    return ok;
}
/**
 * Spend already records the first Rank. Further complete Ranks on the same
 * card need the remaining usage steps so the next wave starts at the right cost.
 */
async function recordExtraStoneRankUsage(actor, abilityId, attribute, ranksGained) {
    const steps = Math.max(1, Math.floor(Number(ranksGained) || 1));
    if (steps <= 1)
        return;
    const combat = game.combat ?? null;
    for (let i = 1; i < steps; i += 1) {
        if (abilityId.startsWith('generic.')) {
            await incrementGenericStonePowerUsage(actor, abilityId, combat);
        }
        else if (attribute) {
            await incrementStoneUsage(actor, attribute, abilityId, combat);
        }
    }
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