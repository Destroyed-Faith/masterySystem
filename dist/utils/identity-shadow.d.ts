/**
 * C1 Shadow-Compare: legacy path decides; identity path runs in parallel and logs diffs.
 * Never changes combat outcomes (plan §10.5 / Batch C1 / K5).
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
/**
 * Compare legacy decision vs identity decision and return the preferred path.
 *
 * - `prefer: 'legacy'` (default, C1): always returns legacy; identity is shadow-only.
 * - `prefer: 'identity'` (K8 cluster cuts): returns identity when it resolves to a
 *   concrete value; on unresolved/throw, falls back to legacy unless
 *   `unresolvedFallsBackToLegacy: false` (then returns the unresolved object cast
 *   through as T — callers must narrow).
 */
export declare function compareIdentityDecision<T>(siteId: string, legacyDecision: T, identityDecisionFactory: () => unknown, ref?: Record<string, unknown>, opts?: {
    prefer?: IdentityDecisionPrefer;
    unresolvedFallsBackToLegacy?: boolean;
}): T;
//# sourceMappingURL=identity-shadow.d.ts.map