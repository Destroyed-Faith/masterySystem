/**
 * Mid-combat Initiative Gain (Reaction: Initiative Gain and similar rules).
 * Updates the combatant's Initiative Score and re-sorts remaining turn order.
 */
/** Resolve the Combatant document for an actor in the active encounter. */
export declare function findCombatantForActor(combat: Combat, actor: Actor): Combatant | null;
export interface InitiativeGainResult {
    applied: boolean;
    oldInitiative: number;
    newInitiative: number;
    /** Human-readable summary for chat / notifications. */
    note: string;
}
/**
 * Add flat Initiative to a combatant after an attack resolves.
 * If they have not yet acted this round, re-sorts turn order for remaining turns.
 * If they already acted, only updates the score (order applies next round).
 */
export declare function applyMidCombatInitiativeGain(combat: Combat, actor: Actor, amount: number): Promise<InitiativeGainResult>;
//# sourceMappingURL=initiative-gain.d.ts.map