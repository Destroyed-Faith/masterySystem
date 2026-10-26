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
export function resolveComparativeSkillCheck(
  totals: ComparativeSkillTotals,
): ComparativeSkillOutcome {
  const a = Math.floor(Number(totals.challengerTotal) || 0);
  const b = Math.floor(Number(totals.defenderTotal) || 0);
  if (a > b) {
    return {
      winner: 'challenger',
      challengerWins: true,
      tieFavorsDefender: false,
      margin: a - b,
    };
  }
  if (a < b) {
    return {
      winner: 'defender',
      challengerWins: false,
      tieFavorsDefender: false,
      margin: b - a,
    };
  }
  return {
    winner: 'tie-defender',
    challengerWins: false,
    tieFavorsDefender: true,
    margin: 0,
  };
}

/** Stealth (challenger) vs Perception (observer/defender). */
export function stealthBeatsObserver(stealthTotal: number, perceptionTotal: number): boolean {
  return resolveComparativeSkillCheck({
    challengerTotal: stealthTotal,
    defenderTotal: perceptionTotal,
  }).challengerWins;
}
