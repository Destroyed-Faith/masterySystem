/**
 * Comparative Skill Checks (Destroyed Faith).
 *
 * Both sides roll Attribute k MR with Skill Advantage / optional Skill Crit.
 * No Task TN. No Skill Raises. Higher result wins; ties favor the defender/observer.
 */
export type ComparativeRole = 'challenger' | 'defender';
export interface ComparativeSkillTotals {
    challengerTotal: number;
    defenderTotal: number;
}
export interface ComparativeSkillOutcome {
    winner: ComparativeRole | 'tie-defender';
    challengerWins: boolean;
    /** True when totals are equal — defender/observer prevails. */
    tieFavorsDefender: boolean;
    margin: number;
}
/**
 * Resolve a comparative check from two final kept totals.
 * Ties favor the defender (observer / contested party).
 */
export declare function resolveComparativeSkillCheck(totals: ComparativeSkillTotals): ComparativeSkillOutcome;
/** Stealth (challenger) vs Perception (observer/defender). */
export declare function stealthBeatsObserver(stealthTotal: number, perceptionTotal: number): boolean;
//# sourceMappingURL=comparative-skill-check.d.ts.map