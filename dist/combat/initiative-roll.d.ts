/**
 * Initiative Rolling System
 * Each round: Mastery Rank d8 (keep all, 8s explode) + optional Combat Reflexes spend (≤ MR×4, pool-limited).
 * Final score before the Initiative Shop = dice total + CR spent.
 */
export interface InitiativeRollOptions {
    /** If false, no dialog; CR spend is 0 (e.g. non-owner client). */
    promptCombatReflexes?: boolean;
}
/**
 * Initiative roll breakdown (pre–Initiative Shop).
 */
export interface InitiativeRollBreakdown {
    /** Sum of Mastery Rank d8 (exploding 8s). */
    diceTotal: number;
    /** Combat Reflexes points added to this roll (also updates skillsSpent). */
    combatReflexesSpent: number;
    /** Dice + CR — pool for the shop; order uses points left after shopping. */
    totalInitiative: number;
    /** Flat modifier from equipped armor, shield, and weapon (e.g. Heavy). */
    equipmentInitiativeModifier: number;
    masteryRank: number;
    rollResult: any;
}
/**
 * Limits for spending Combat Reflexes on initiative (used by Initiative Shop dropdown).
 */
export declare function getCombatReflexesInitiativeLimits(actor: any, masteryRank: number): {
    maxThisRoll: number;
    remainingPool: number;
    capPerRoll: number;
};
/**
 * Roll initiative for one combatant (dice + optional CR). Sets combatant.initiative to the pre-shop total.
 * NPCs: dice only. PCs: may prompt to spend CR (owner/GM).
 */
export declare function rollInitiativeForCombatant(combatant: Combatant, options?: InitiativeRollOptions): Promise<InitiativeRollBreakdown>;
/**
 * Full initiative phase: NPCs auto; PCs with owner/GM get shop; others auto roll without CR prompt.
 */
export declare function executeInitiativePhase(combat: Combat): Promise<void>;
/** @deprecated Prefer executeInitiativePhase; kept for compatibility. */
export declare function rollInitiativeForAllCombatants(combat: Combat): Promise<void>;
//# sourceMappingURL=initiative-roll.d.ts.map