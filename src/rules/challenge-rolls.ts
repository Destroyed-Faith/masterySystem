/**
 * Challenge Rolls — universal group progress over Standard Training Checks.
 *
 * Not a separate dice system. Combat Special Challenge(X) is unrelated.
 * Intellect Stone Free Raises remain Combat-only and never count here.
 */

import { finalSkillTn, skillTaskBaseTn } from './skill-raises.js';

/** Declared eligible Raises needed for a second Challenge Success. */
export const CHALLENGE_PROGRESS_RAISE_THRESHOLD = 4;

/** Hard cap per contribution (pass + four-Raise bonus). */
export const MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION = 2;

/** Typical announced targets (GM may choose differently; not MR-scaled). */
export const TYPICAL_COMPLEX_CHALLENGE_TARGET = 2;
export const TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET = 3;

/**
 * Free Raise provenance for Challenge progress eligibility.
 * Only sources that explicitly permit Challenge Rolls may count.
 */
export type ChallengeFreeRaiseSource =
  | 'intellect-stone-combat'
  | 'profession-rank'
  | 'explicit-challenge-roll'
  | 'other';

export function isEligibleChallengeFreeRaise(source: ChallengeFreeRaiseSource): boolean {
  return source === 'explicit-challenge-roll';
}

/** Paid Raises always count toward the four-Raise progress threshold when declared for it. */
export function eligibleRaisesTowardChallengeProgress(input: {
  paidRaisesTowardProgress: number;
  freeRaisesTowardProgress?: number;
  freeRaiseSource?: ChallengeFreeRaiseSource;
}): number {
  const paid = Math.max(0, Math.floor(Number(input.paidRaisesTowardProgress) || 0));
  const freeRaw = Math.max(0, Math.floor(Number(input.freeRaisesTowardProgress) || 0));
  const source = input.freeRaiseSource ?? 'other';
  const free = isEligibleChallengeFreeRaise(source) ? freeRaw : 0;
  return paid + free;
}

export interface ChallengeContributionInput {
  /** Final kept Training Roll total. */
  rollTotal: number;
  /** Base Task TN = Task Level × 4 (or an already computed base). */
  baseTn: number;
  /** Paid Raises declared before the roll (+4 TN each). */
  paidRaises: number;
  /**
   * Raises declared toward Challenge Progress (usually the Paid count when
   * seeking the second Success). Free Raises only if source-eligible.
   */
  paidRaisesTowardProgress?: number;
  freeRaisesTowardProgress?: number;
  freeRaiseSource?: ChallengeFreeRaiseSource;
  /** True if this character already contributed to this Challenge. */
  alreadyContributed?: boolean;
}

export interface ChallengeContributionResult {
  ok: boolean;
  finalTn: number;
  metFinalTn: boolean;
  eligibleRaisesTowardProgress: number;
  successes: number;
  error?: string;
}

/**
 * Resolve one participant's Challenge contribution.
 * Failure vs Final TN → 0. Pass → 1. Pass with ≥4 eligible progress Raises → 2 (max).
 */
export function resolveChallengeContribution(
  input: ChallengeContributionInput,
): ChallengeContributionResult {
  if (input.alreadyContributed) {
    return {
      ok: false,
      finalTn: 0,
      metFinalTn: false,
      eligibleRaisesTowardProgress: 0,
      successes: 0,
      error: 'Each participant ordinarily rolls once per Challenge.',
    };
  }

  const paid = Math.max(0, Math.floor(Number(input.paidRaises) || 0));
  const baseTn = Math.max(0, Math.floor(Number(input.baseTn) || 0));
  const finalTn = finalSkillTn(baseTn, paid);
  const rollTotal = Math.floor(Number(input.rollTotal) || 0);
  const metFinalTn = rollTotal >= finalTn;

  const towardProgress = eligibleRaisesTowardChallengeProgress({
    paidRaisesTowardProgress:
      input.paidRaisesTowardProgress !== undefined ? input.paidRaisesTowardProgress : paid,
    freeRaisesTowardProgress: input.freeRaisesTowardProgress,
    freeRaiseSource: input.freeRaiseSource,
  });

  if (!metFinalTn) {
    return {
      ok: true,
      finalTn,
      metFinalTn: false,
      eligibleRaisesTowardProgress: towardProgress,
      successes: 0,
    };
  }

  let successes = 1;
  if (towardProgress >= CHALLENGE_PROGRESS_RAISE_THRESHOLD) {
    successes = MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION;
  }

  return {
    ok: true,
    finalTn,
    metFinalTn: true,
    eligibleRaisesTowardProgress: towardProgress,
    successes,
  };
}

/** Convenience: Base TN from Task Level, then resolve. */
export function resolveChallengeContributionFromTaskLevel(
  input: Omit<ChallengeContributionInput, 'baseTn'> & { taskLevel: number },
): ChallengeContributionResult {
  const { taskLevel, ...rest } = input;
  return resolveChallengeContribution({
    ...rest,
    baseTn: skillTaskBaseTn(taskLevel),
  });
}

export interface ChallengeProgressState {
  target: number;
  accumulated: number;
  complete: boolean;
  remaining: number;
}

export function accumulateChallengeProgress(
  contributionSuccesses: number[],
  target: number,
): ChallengeProgressState {
  const tgt = Math.max(1, Math.floor(Number(target) || 1));
  const accumulated = contributionSuccesses.reduce((sum, n) => {
    const s = Math.max(0, Math.min(MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION, Math.floor(Number(n) || 0)));
    return sum + s;
  }, 0);
  const complete = accumulated >= tgt;
  return {
    target: tgt,
    accumulated,
    complete,
    remaining: Math.max(0, tgt - accumulated),
  };
}

export function typicalChallengeTarget(complexity: 'complex' | 'very-complex'): number {
  return complexity === 'very-complex'
    ? TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET
    : TYPICAL_COMPLEX_CHALLENGE_TARGET;
}
