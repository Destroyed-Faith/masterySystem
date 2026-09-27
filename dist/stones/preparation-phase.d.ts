/**
 * Preparation Phase order for one combat round:
 * Initiative Boost → Initiative Exchange → Stone Assignment → locked.
 *
 * Initiative Boost must change Initiative before Exchange reads it.
 * Initiative Colorless Stones bought in Exchange are Ready in that same
 * Preparation Phase. Confirming the assignment locks the round; reopening
 * must not buy those Stones again.
 */
export declare const PREPARATION_PHASE_FLAG = "preparationPhase";
export declare const INITIATIVE_BOOST_POWER_ID = "wits.initiativeBoost";
export type PreparationBoost = 'pending' | 'skipped' | 'applied';
export type PreparationStep = 'roll' | 'boost' | 'exchange' | 'assignment' | 'locked';
export interface PreparationPhaseState {
    combatId: string;
    round: number;
    boost: PreparationBoost;
    /** Rank applied this round. 0 when skipped or still pending. */
    boostTier: number;
    exchange: 'pending' | 'done';
    /** Stones this Preparation Phase already bought. Reopen must not buy them again. */
    exchangeStones: number;
    assignment: 'open' | 'confirmed';
}
export declare function emptyPreparationPhase(combatId: string, round: number): PreparationPhaseState;
export declare function readPreparationPhase(raw: unknown, combatId: string, round: number): PreparationPhaseState;
/**
 * Once-per-combat Boost already spent, or this round's assignment already
 * confirmed, must not open those steps again.
 */
export declare function reconcilePreparationPhase(state: PreparationPhaseState, opts: {
    boostAlreadyUsed?: boolean;
    assignmentConfirmed?: boolean;
}): PreparationPhaseState;
export declare function preparationStep(state: PreparationPhaseState, needsRoll?: boolean): PreparationStep;
/** Initiative Exchange reads this score: the roll, then Initiative Boost. */
export declare function initiativeAfterBoost(initiative: number, boostTier: number, masteryRank: number): number;
/**
 * Wits Stones to reach `rank`, using the same cumulative curve as the card.
 * `prefillTier` is one Rank the artifact already paid.
 */
export declare function initiativeBoostRankCost(rank: number, prefillTier?: number): number | null;
export declare function skipInitiativeBoost(state: PreparationPhaseState): {
    state: PreparationPhaseState;
    changed: boolean;
};
export declare function applyInitiativeBoost(state: PreparationPhaseState, tier: number): {
    state: PreparationPhaseState;
    changed: boolean;
};
export declare function planInitiativeExchange(state: PreparationPhaseState, stones: number): {
    state: PreparationPhaseState;
    changed: boolean;
    stones: number;
};
export declare function confirmPreparationAssignment(state: PreparationPhaseState): PreparationPhaseState;
/** GM reset reopens assignment. It does not buy Initiative Stones again. */
export declare function reopenPreparationAssignment(state: PreparationPhaseState): PreparationPhaseState;
//# sourceMappingURL=preparation-phase.d.ts.map