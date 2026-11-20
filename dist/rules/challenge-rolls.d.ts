/**
 * Challenge Rolls — universal group progress over Standard Training Checks.
 *
 * Not a separate dice system. Combat Special Challenge(X) is unrelated.
 * Intellect Stone Free Raises remain Combat-only and never count here.
 */
/** Declared eligible Raises needed for a second Challenge Success. */
export declare const CHALLENGE_PROGRESS_RAISE_THRESHOLD = 4;
/** Hard cap per contribution (pass + four-Raise bonus). */
export declare const MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION = 2;
/** Typical announced targets (GM may choose differently; not MR-scaled). */
export declare const TYPICAL_COMPLEX_CHALLENGE_TARGET = 2;
export declare const TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET = 3;
/**
 * Free Raise provenance for Challenge progress eligibility.
 * Only sources that explicitly permit Challenge Rolls may count.
 */
export type ChallengeFreeRaiseSource = 'intellect-stone-combat' | 'profession-rank' | 'explicit-challenge-roll' | 'other';
export declare function isEligibleChallengeFreeRaise(source: ChallengeFreeRaiseSource): boolean;
/** Paid Raises always count toward the four-Raise progress threshold when declared for it. */
export declare function eligibleRaisesTowardChallengeProgress(input: {
    paidRaisesTowardProgress: number;
    freeRaisesTowardProgress?: number;
    freeRaiseSource?: ChallengeFreeRaiseSource;
}): number;
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
export declare function resolveChallengeContribution(input: ChallengeContributionInput): ChallengeContributionResult;
/** Convenience: Base TN from Task Level, then resolve. */
export declare function resolveChallengeContributionFromTaskLevel(input: Omit<ChallengeContributionInput, 'baseTn'> & {
    taskLevel: number;
}): ChallengeContributionResult;
export interface ChallengeProgressState {
    target: number;
    accumulated: number;
    complete: boolean;
    remaining: number;
}
export declare function accumulateChallengeProgress(contributionSuccesses: number[], target: number): ChallengeProgressState;
export declare function typicalChallengeTarget(complexity: 'complex' | 'very-complex'): number;
//# sourceMappingURL=challenge-rolls.d.ts.map