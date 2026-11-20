/**
 * Active Challenge session (world) — group progress for Challenge Rolls.
 *
 * Professional Roles remain ordinary Professions/Perception/Untrained.
 * Combat Special Challenge(X) is unrelated.
 */
export declare const ACTIVE_CHALLENGE_SETTING = "activeChallenge";
export declare const ACTIVE_CHALLENGE_FLAG_SCOPE = "mastery-system";
export interface ActiveChallengeState {
    id: string;
    objective: string;
    target: number;
    accumulated: number;
    contributorActorIds: string[];
    startedAt: number;
}
export interface StartActiveChallengeInput {
    objective: string;
    target: number;
    id?: string;
    startedAt?: number;
}
export interface RecordContributionResult {
    ok: boolean;
    state: ActiveChallengeState | null;
    successesApplied: number;
    complete: boolean;
    error?: string;
}
export declare function normalizeActiveChallenge(raw: unknown): ActiveChallengeState | null;
export declare function isChallengeComplete(state: ActiveChallengeState): boolean;
export declare function actorAlreadyContributed(state: ActiveChallengeState, actorId: string): boolean;
/** Pure: build a new active Challenge. */
export declare function planStartActiveChallenge(input: StartActiveChallengeInput): {
    ok: true;
    state: ActiveChallengeState;
} | {
    ok: false;
    error: string;
};
/**
 * Pure: apply one participant's Challenge Successes.
 * Marks the actor as having contributed even on 0 Successes (failed check).
 */
export declare function planRecordChallengeContribution(state: ActiveChallengeState | null, actorId: string, successes: number): RecordContributionResult;
export declare function registerActiveChallengeSettings(): void;
export declare function readActiveChallenge(): ActiveChallengeState | null;
export declare function startActiveChallenge(input: StartActiveChallengeInput): Promise<{
    ok: boolean;
    state?: ActiveChallengeState;
    error?: string;
}>;
export declare function clearActiveChallenge(): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function recordChallengeContribution(actorId: string, successes: number): Promise<RecordContributionResult>;
export declare function typicalTargetOptions(): Array<{
    value: number;
    label: string;
}>;
//# sourceMappingURL=active-challenge.d.ts.map