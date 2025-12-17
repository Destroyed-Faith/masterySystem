/**
 * Initiative Rolling System
 * Handles initiative calculation and rolling for combatants
 */
/**
 * Calculate base initiative for an actor
 * Base = Agility + Wits + Combat Reflexes
 */
export declare function calculateBaseInitiative(actor: any): number;
/**
 * Initiative roll breakdown
 */
export interface InitiativeRollBreakdown {
    baseInitiative: number;
    diceTotal: number;
    totalInitiative: number;
    masteryRank: number;
    rollResult: any;
}
/**
 * Roll initiative for a combatant
 * Returns breakdown object with base, dice, total, and roll details
 */
export declare function rollInitiativeForCombatant(combatant: Combatant): Promise<InitiativeRollBreakdown>;
/**
 * Roll initiative for all combatants in a combat
 * NPCs roll automatically, PCs get Initiative Shop dialog
 */
export declare function rollInitiativeForAllCombatants(combat: Combat): Promise<void>;
//# sourceMappingURL=initiative-roll.d.ts.map