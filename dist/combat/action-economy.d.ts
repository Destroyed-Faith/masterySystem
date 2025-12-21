/**
 * Action Economy System
 *
 * Manages per-round action budgets, stone spending, and initiative shop bonuses
 * for the Mastery System combat rules.
 */
export type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';
/**
 * Round state stored on actor flags
 * Tracks action budgets, bonuses, and stone usage per round
 */
export interface RoundState {
    round: number;
    turn: number;
    isPC: boolean;
    movementActions: {
        total: number;
        used: number;
    };
    attackActions: {
        total: number;
        used: number;
    };
    reactionActions: {
        total: number;
        used: number;
    };
    moveBonusMeters: number;
    initiativeShop?: {
        round: number;
        extraMovement: number;
        initiativeSwap: boolean;
        extraAttack: boolean;
    };
    stoneBonuses?: {
        extraAttacks: number;
        extraReactions: number;
        extraMoveMeters: number;
        damageBonus?: number;
        armorPenetration?: number;
        evadeBonus?: number;
        critRaises?: number;
        tempArmor?: number;
        freeRaises?: number;
        saveKeepBonus?: number;
        spellPoolDice?: number;
        spellKeepDice?: number;
    };
}
/**
 * Stone usage tracking key format: `${attribute}:${abilityKey}:${round}:${turn}`
 */
export type StoneUsageKey = string;
/**
 * Check if an actor is a PC
 */
export declare function isPC(actor: Actor | null | undefined): boolean;
/**
 * Get round state from actor flags
 */
export declare function getRoundState(actor: Actor, combat: Combat | null): RoundState;
/**
 * Set round state on actor
 */
export declare function setRoundState(actor: Actor, state: RoundState): Promise<void>;
/**
 * Apply initiative shop bonuses to round state
 * Called when shop purchases are made or at start of round
 */
export declare function applyInitiativeShopBonuses(actor: Actor, combatant: Combatant, combat: Combat): Promise<void>;
/**
 * Spend an attack action (used by Attack, Buff, Utility)
 */
export declare function spendAttackAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Spend a movement action
 */
export declare function spendMovementAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Spend a reaction action
 */
export declare function spendReactionAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Get available attack actions (remaining count)
 */
export declare function getAvailableAttackActions(actor: Actor, combat: Combat | null): number;
/**
 * Get available movement actions (remaining count)
 */
export declare function getAvailableMovementActions(actor: Actor, combat: Combat | null): number;
/**
 * Consume an attack action (alias for spendAttackAction)
 */
export declare function consumeAttackAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Consume a movement action (alias for spendMovementAction)
 */
export declare function consumeMovementAction(actor: Actor, combat: Combat | null): Promise<boolean>;
/**
 * Get stone usage count for an ability this turn
 */
export declare function getStoneUsageCount(actor: Actor, attribute: AttributeKey, abilityKey: string, combat: Combat | null): number;
/**
 * Increment stone usage count for an ability this turn
 */
export declare function incrementStoneUsage(actor: Actor, attribute: AttributeKey, abilityKey: string, combat: Combat | null): Promise<void>;
/**
 * Calculate exponential stone cost: 2^(usesThisTurn)
 */
export declare function calculateStoneCost(usesThisTurn: number): number;
/**
 * Get stone pool for an attribute
 */
export declare function getStonePool(actor: Actor, attribute: AttributeKey): {
    current: number;
    max: number;
};
/**
 * Set stone pool current value
 */
export declare function setStonePool(actor: Actor, attribute: AttributeKey, current: number): Promise<void>;
/**
 * Spend stones for an ability and apply its effect
 *
 * @param actor The actor using the ability
 * @param combatant The combatant in combat
 * @param attribute Which attribute pool to use
 * @param abilityKey Unique key for this ability (e.g., 'generic.extraAttack')
 * @param applyEffect Function to apply the ability effect (adds actions/bonuses to roundState)
 * @returns true if successful, false if failed
 */
export declare function spendStoneAbility(actor: Actor, _combatant: Combatant, attribute: AttributeKey, abilityKey: string, applyEffect: (roundState: RoundState) => Promise<void>): Promise<boolean>;
/**
 * Regenerate stones at end of round
 * Shows dialog for each PC to allocate regen points (mastery rank per attribute)
 */
export declare function regenStonesEndOfRound(combat: Combat): Promise<void>;
/**
 * Restore all stone pools to max after combat
 */
export declare function restoreStonesAfterCombat(combat: Combat): Promise<void>;
/**
 * Initialize round state for all combatants at combat start
 */
export declare function initializeCombatRoundState(combat: Combat): Promise<void>;
/**
 * Reset turn state (called on turn change)
 * Resets used counts but keeps totals and bonuses
 */
export declare function resetTurnState(actor: Actor, combat: Combat | null): Promise<void>;
/**
 * Reset round state (called on round change)
 * Clears bonuses and re-applies initiative shop for new round
 */
export declare function resetRoundState(actor: Actor, combatant: Combatant, combat: Combat): Promise<void>;
//# sourceMappingURL=action-economy.d.ts.map