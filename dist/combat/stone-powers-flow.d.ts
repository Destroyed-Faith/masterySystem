/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 */
/**
 * After stone powers for a round, roll initiative (dice + CR + shop) for all combatants once per round.
 */
export declare function runInitiativePhaseAfterStones(combat: Combat, round: number): Promise<void>;
export declare function openStonePowersForAllCombatants(combat: Combat, round: number): Promise<void>;
export declare function initializeStonePowersFlow(): void;
//# sourceMappingURL=stone-powers-flow.d.ts.map