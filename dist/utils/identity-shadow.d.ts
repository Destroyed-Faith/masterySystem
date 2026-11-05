/**
 * C1 Shadow-Compare: legacy path decides; identity path runs in parallel and logs diffs.
 * Never changes combat outcomes (plan §10.5 / Batch C1 / K5).
 *
 * Post-K9 A1: shadow logging is **off by default** in production. Opt in via
 * `setIdentityShadowEnabled(true)` or the world setting `identityShadowCompare`.
 * Legacy decisions may be passed as thunks so the text path is not evaluated
 * when identity resolves and shadow is disabled.
 */
export type IdentityShadowDecision = {
    kind: 'resolved';
    templateId: string | null;
    artifactFunctionId: string | null;
    category: string | null;
    rank: number | null;
    extras?: Record<string, unknown>;
} | {
    kind: 'unresolved';
    reason: string;
} | {
    kind: 'legacy';
    value: unknown;
};
export interface IdentityShadowEntry {
    siteId: string;
    at: string;
    legacy: unknown;
    identity: unknown;
    equal: boolean;
    ref?: Record<string, unknown>;
    /** Stable dedupe key (siteId + fingerprint). */
    dedupeKey: string;
}
/** Soft cap — oldest mismatch entries are dropped first when exceeded. */
export declare const IDENTITY_SHADOW_LOG_CAP = 500;
export declare function setIdentityShadowEnabled(value: boolean): void;
export declare function isIdentityShadowEnabled(): boolean;
export declare function getIdentityShadowLog(): readonly IdentityShadowEntry[];
export declare function clearIdentityShadowLog(): void;
export declare function getIdentityShadowSkipCount(): number;
export declare function exportIdentityShadowReport(opts?: {
    cluster?: string;
}): {
    generatedAt: string;
    total: number;
    mismatches: number;
    skippedNpcOrManeuver: number;
    cluster?: string;
    entries: IdentityShadowEntry[];
};
/** Group mismatches by siteId prefix (first segment before `.`). */
export declare function exportIdentityShadowClusterReports(): Record<string, ReturnType<typeof exportIdentityShadowReport>>;
export type IdentityDecisionPrefer = 'legacy' | 'identity';
/** Eager value or lazy thunk — thunks skip text/legacy work when identity wins. */
export type LegacyDecisionInput<T> = T | (() => T);
/**
 * Compare legacy decision vs identity decision and return the preferred path.
 *
 * - `prefer: 'legacy'` (default, C1): always returns legacy; identity is shadow-only.
 * - `prefer: 'identity'` (K8 cluster cuts): returns identity when it resolves to a
 *   concrete value; on unresolved/throw, falls back to legacy unless
 *   `unresolvedFallsBackToLegacy: false` (then returns the unresolved object cast
 *   through as T — callers must narrow).
 *
 * Pass `legacyDecision` as a thunk (`() => …`) so the text/name path is not
 * evaluated when shadow is off and identity resolves.
 */
export declare function compareIdentityDecision<T>(siteId: string, legacyDecision: LegacyDecisionInput<T>, identityDecisionFactory: () => unknown, ref?: Record<string, unknown>, opts?: {
    prefer?: IdentityDecisionPrefer;
    unresolvedFallsBackToLegacy?: boolean;
}): T;
//# sourceMappingURL=identity-shadow.d.ts.map