/**
 * Stone Power Activation System
 *
 * Implements:
 * - Power registry with attribute associations
 * - Exponential cost calculation (1, 2, 4, 8, 16...)
 * - Pool deduction and round state updates
 */
import { spendStoneAbility, getRoundState, setRoundState } from '../combat/action-economy.js';
/**
 * Registry of stone powers
 */
export const STONE_POWERS = {
    'generic.extraAttack': {
        id: 'generic.extraAttack',
        name: 'Extra Attack',
        attribute: 'generic',
        category: 'action',
        description: 'Gain +1 Attack action this round',
        apply: async (actor, _combatant) => {
            const combat = game.combat;
            const roundState = getRoundState(actor, combat);
            roundState.attackActions.total += 1;
            if (!roundState.stoneBonuses) {
                roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
            }
            roundState.stoneBonuses.extraAttacks += 1;
            await setRoundState(actor, roundState);
        }
    },
    'agility.extraReaction': {
        id: 'agility.extraReaction',
        name: 'Extra Reaction',
        attribute: 'agility',
        category: 'reaction',
        description: 'Gain +1 Reaction this round',
        apply: async (actor, _combatant) => {
            const combat = game.combat;
            const roundState = getRoundState(actor, combat);
            roundState.reactionActions.total += 1;
            if (!roundState.stoneBonuses) {
                roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
            }
            roundState.stoneBonuses.extraReactions += 1;
            await setRoundState(actor, roundState);
        }
    },
    'generic.movePlus8m': {
        id: 'generic.movePlus8m',
        name: 'Extra Movement',
        attribute: 'generic',
        category: 'action',
        description: 'Gain +8m movement this round',
        apply: async (actor, _combatant) => {
            const combat = game.combat;
            const roundState = getRoundState(actor, combat);
            roundState.moveBonusMeters += 8;
            if (!roundState.stoneBonuses) {
                roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
            }
            roundState.stoneBonuses.extraMoveMeters += 8;
            await setRoundState(actor, roundState);
        }
    },
    'intellect.extraSpell': {
        id: 'intellect.extraSpell',
        name: 'Extra Spell',
        attribute: 'intellect',
        category: 'action',
        description: 'Gain +1 Attack action this round (spell attacks only)',
        apply: async (actor, _combatant) => {
            const combat = game.combat;
            const roundState = getRoundState(actor, combat);
            roundState.attackActions.total += 1;
            if (!roundState.stoneBonuses) {
                roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
            }
            roundState.stoneBonuses.extraAttacks += 1;
            await setRoundState(actor, roundState);
            // Mark that this is spell-only (could be validated elsewhere)
            await _combatant.setFlag('mastery-system', 'extraSpellAction', true);
        }
    }
};
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
    const { actor, combatant, abilityId, attributeKey } = options;
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
    // Use the action economy system to handle stone spending
    return await spendStoneAbility(actor, combatant, poolAttribute, abilityId, async (_roundState) => {
        // Apply power effect (modifies roundState)
        await power.apply(actor, combatant);
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