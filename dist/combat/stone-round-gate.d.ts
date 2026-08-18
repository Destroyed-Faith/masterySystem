/**
 * Hold the new round until every PC confirms stone assignment.
 * NPCs do not block. The GM cannot skip the wait with Next Turn.
 */
export declare function isStonePowersDone(combat: Combat, combatantId: string, round: number): boolean;
export declare function pendingStoneCombatants(combat: Combat, round?: number): Combatant[];
export declare function pendingStonePlayerNames(combat: Combat, round?: number): string[];
export declare function arePlayerStonesReadyForRound(combat: Combat, round?: number): boolean;
export declare function setLaunchingLiveCombat(value: boolean): void;
export declare function isLaunchingLiveCombat(): boolean;
export declare function isEncounterPreparing(combat: Combat | null | undefined): boolean;
export declare function encounterStartBlockers(combat: Combat): string[];
/** @returns true if actions / turn advance must wait for stone confirm. */
export declare function warnIfPlayerStonesPending(combat: Combat | null | undefined): boolean;
/** GM walks each open PC and can confirm stones on their behalf. */
export declare function assignPendingStonesAsGm(combat: Combat): Promise<number>;
/** Blocks Foundry tracker Next Turn / Next Round while PC stones are still open. */
export declare function initializeStoneRoundGate(): void;
//# sourceMappingURL=stone-round-gate.d.ts.map