/**
 * Per-combatant encounter-setup locks. Players cannot write the Combat
 * document, but they can usually update their own Combatant — so confirm
 * survives Join Game As / reload even when no GM client is connected.
 */
export declare const COMBATANT_SETUP_FLAG = "encounterSetupStep";
export interface CombatantSetupStep {
    combatId: string;
    passivesLocked?: boolean;
    /** Player opened the Passives picker from Stone Powers this encounter. */
    passivesReviewed?: boolean;
    stonesDoneRound?: number;
    regenDoneRound?: number;
    initiativeConfirmed?: boolean;
}
export declare function readCombatantSetupStep(combatant: Combatant | null | undefined, combat: Combat | null | undefined): CombatantSetupStep | null;
export declare function persistCombatantSetupStep(combatant: Combatant | null | undefined, combat: Combat | null | undefined, patch: Partial<Omit<CombatantSetupStep, 'combatId'>>): Promise<boolean>;
export declare function findCombatantByActorId(combat: Combat, actorId: string): Combatant | undefined;
export declare function isPassiveSelectionLocked(combat: Combat, actorId: string): boolean;
export declare function isPassivesReviewedThisEncounter(combat: Combat | null | undefined, combatant: Combatant | null | undefined): boolean;
export declare function isStoneRegenDone(combat: Combat, combatantId: string, round: number): boolean;
export declare function isCombatantInitiativeConfirmed(combat: Combat, combatantId: string): boolean;
//# sourceMappingURL=encounter-setup-flags.d.ts.map