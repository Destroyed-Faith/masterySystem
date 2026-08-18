/**
 * Combat Reflexes on initiative. The skill used to be asked for in a popup right
 * after the roll, which meant a decision before the player could see anything.
 * It now lives in the Initiative Exchange row of the Stone Powers dialog, where
 * the Initiative score and the stone conversion are visible at the same time.
 *
 * Skills are not spent point by point: a skill has four uses per Safe Haven Rest
 * and each use applies the Mastery Rank at once — the four boxes on the sheet and
 * on the printout. The rating (capped at MR × 4) fills those boxes left to right,
 * so a rating below the cap leaves the last boxes short or empty.
 *
 * For Combat Reflexes one use raises the Initiative score by the points it costs.
 * Uses taken this round are recorded on the combatant so a box can be un-ticked
 * — and so the record dies with the score when initiative is rolled again.
 */
export declare const CR_SKILL_KEY = "combatReflexes";
/** Uses per Safe Haven Rest — the four boxes next to every skill. */
export declare const SKILL_USE_BOXES = 4;
export interface CombatReflexesUseBox {
    index: number;
    /** Points this box holds — the Mastery Rank, or less on a short rating. */
    size: number;
    /** Points already spent out of this box. */
    used: number;
    /** Points still in this box. */
    remaining: number;
    /** No rating reaches this box. */
    unavailable: boolean;
    /** Fully spent. */
    spent: boolean;
    /** The next box to tick. */
    canSpend: boolean;
    /** The box a click gives back (only a use taken this round). */
    canUndo: boolean;
}
export interface CombatReflexesInitiativeState {
    rating: number;
    spent: number;
    /** Skill points left across all boxes. */
    remainingPool: number;
    /** Points one use costs at this Mastery Rank. */
    pointsPerUse: number;
    boxes: CombatReflexesUseBox[];
    /** Points the next use would put into initiative (0 when none is left). */
    nextUse: number;
    usedThisRound: number;
    canSpend: boolean;
    canUndo: boolean;
}
/** Limits for spending Combat Reflexes on initiative. */
export declare function getCombatReflexesInitiativeLimits(actor: any, masteryRank: number): {
    maxThisRoll: number;
    remainingPool: number;
    capPerRoll: number;
};
/** Amounts taken this round, oldest first. */
export declare function combatReflexesRoundSpends(combatant: any): number[];
export declare function combatReflexesUsedThisRound(combatant: any): number;
/**
 * The four boxes as the Initiative Exchange row shows them. Only the leftmost
 * box with points left can be ticked; only a use taken this round can be given
 * back, and only while the initiative it produced is still there — the score may
 * already have been converted into stones.
 */
export declare function combatReflexesInitiativeState(actor: any, combatant: any, masteryRank: number): CombatReflexesInitiativeState;
/**
 * Tick the next box: spend one use and raise the initiative score by its points.
 * @returns the new initiative score, or null when no use is left.
 */
export declare function spendCombatReflexesUse(actor: any, combatant: any, masteryRank: number): Promise<number | null>;
/**
 * Un-tick the last box taken this round: the points go back into the pool and
 * back out of the initiative score.
 * @returns the new initiative score, or null when there is nothing to give back.
 */
export declare function undoCombatReflexesUse(actor: any, combatant: any, masteryRank: number): Promise<number | null>;
/** A fresh initiative roll replaces the score, so this round's record is void. */
export declare function resetCombatReflexesRoundUsage(combatant: any): Promise<void>;
//# sourceMappingURL=combat-reflexes.d.ts.map