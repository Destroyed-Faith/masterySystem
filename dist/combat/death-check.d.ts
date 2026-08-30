/**
 * Incapacitation & Death Checks (Players Guide "Incapacitation & Death").
 *
 * When all Health Bars are depleted the creature is Incapacitated. At the end
 * of each of its turns the GM rolls a Death Check:
 *   - Pool: the higher of Vitality or Resolve, keep dice equal to Mastery Rank.
 *   - TN = 8 × Mastery Rank.
 *   - Success → +1 Success (4 Successes → Stabilized).
 *   - Failure → +1 Death Mark (4 Death Marks → dead).
 *
 * Skill Points, Vitality spends and health penalties never modify the pool.
 * The state lives in `flags.mastery-system.deathState` and resets as soon as
 * the creature has any HP again (healing wakes it immediately).
 */
export declare const DEATH_STATE_FLAG = "deathState";
export interface DeathState {
    successes: number;
    marks: number;
    stabilized: boolean;
    dead: boolean;
}
export declare function emptyDeathState(): DeathState;
export declare function readDeathState(actor: any): DeathState;
export declare function clearDeathState(actor: any): Promise<void>;
/** All Health Bars fully depleted. */
export declare function isIncapacitated(actor: any): boolean;
/** Pool attribute: the higher of Vitality or Resolve. */
export declare function deathCheckPool(actor: any): {
    attribute: string;
    dice: number;
    keep: number;
    tn: number;
};
export interface DeathCheckResult {
    rolled: boolean;
    total?: number;
    tn?: number;
    success?: boolean;
    state?: DeathState;
}
/**
 * Roll one Death Check for an Incapacitated creature and update its state.
 * Posts a GM-whispered chat card. No-op if the creature is not incapacitated,
 * already Stabilized, or already dead.
 */
export declare function maybeRollDeathCheck(actor: any): Promise<DeathCheckResult>;
/**
 * Ally stabilization (Medicine, 1 Attack Action): on success the patient
 * counts as having 4 Successes. TN = 12 × patient Mastery Rank (handled by
 * the Medicine roll itself — this helper only records the result).
 */
export declare function markStabilized(actor: any): Promise<void>;
//# sourceMappingURL=death-check.d.ts.map