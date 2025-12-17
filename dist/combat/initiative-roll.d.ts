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
 * Roll initiative for a combatant
 * Returns the total initiative value (base + dice roll)
 */
export declare function rollInitiativeForCombatant(combatant: Combatant): Promise<number>;
/**
 * Roll initiative for all combatants in a combat
 * NPCs roll automatically, PCs get Initiative Shop dialog
 */
export declare function rollInitiativeForAllCombatants(combat: Combat): Promise<void>;
//# sourceMappingURL=initiative-roll.d.ts.map