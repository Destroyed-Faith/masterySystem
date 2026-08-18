/**
 * Combat Reflexes on initiative. The skill used to be asked for in a popup right
 * after the roll, which meant a decision before the player could see anything.
 * It now lives in the Initiative Exchange row of the Stone Powers dialog, where
 * the Initiative score and the stone conversion are visible at the same time.
 *
 * Each point costs one point out of the Combat Reflexes pool and raises the
 * Initiative score by one. Points added this round are tracked on the combatant
 * so they can be given back — and so the per-roll cap survives a reopened dialog.
 */
export declare const CR_SKILL_KEY = "combatReflexes";
export interface CombatReflexesInitiativeState {
    rating: number;
    spent: number;
    /** Skill points left in the pool. */
    remainingPool: number;
    /** Cap per initiative roll from the Mastery Rank. */
    capPerRoll: number;
    /** Points already put into initiative this round. */
    usedThisRound: number;
    /** Points the player may still add now. */
    addable: number;
    canAdd: boolean;
    canRemove: boolean;
}
/** Limits for spending Combat Reflexes on initiative. */
export declare function getCombatReflexesInitiativeLimits(actor: any, masteryRank: number): {
    maxThisRoll: number;
    remainingPool: number;
    capPerRoll: number;
};
export declare function combatReflexesUsedThisRound(combatant: any): number;
/**
 * What the Initiative Exchange row shows. `addable` respects both the pool and
 * the per-roll cap; `canRemove` needs initiative left to take the point back out
 * of, because the score may already have been converted into stones.
 */
export declare function combatReflexesInitiativeState(actor: any, combatant: any, masteryRank: number): CombatReflexesInitiativeState;
/**
 * Move one Combat Reflexes point into or out of the initiative score.
 * @returns the new initiative score, or null when the step is not allowed.
 */
export declare function stepCombatReflexesInitiative(actor: any, combatant: any, delta: number, masteryRank: number): Promise<number | null>;
/** New round: the per-roll cap starts over. */
export declare function resetCombatReflexesRoundUsage(combatant: any): Promise<void>;
//# sourceMappingURL=combat-reflexes.d.ts.map