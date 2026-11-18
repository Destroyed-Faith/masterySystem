/**
 * Ritual System — Core Ritual TN helpers.
 *
 * Base Ritual TN = 4 × max(3, Task Level) (DF Guide 2026-10-23).
 * Final Ritual TN = Base + 4 × Paid Raises (one final TN; no partial named tier).
 * Stones Sealed by total Raises (Paid+Free): 0–1→1, 2–3→2, 4–8→3.
 * All 16 Core Rituals are universally available — see `src/rules/core-rituals.ts`.
 */
/**
 * Base Ritual TN from Task Level (minimum 3 → TN 12).
 * The first argument is the Task Level / source level, not caster MR.
 */
export declare function calculateRitualTN(taskLevel: number, modifier?: number): number;
/** Universal Core Ritual catalogue (16). */
export declare function listUniversalCoreRituals(): readonly import("../rules/core-rituals.js").CoreRitualDefinition[];
export declare function sealedStonesForRitualRaises(totalRaises: number): number;
export declare function calculateRitualRaiseTN(baseTn: number, declaredRaises: number): number;
export type RitualDeclaredOutcome = {
    success: boolean;
    appliedRaise: number;
    /** `raise0` kept for type compat; DF 2026 no longer awards partial named tiers. */
    kind: 'fail' | 'raise0' | 'full';
};
/**
 * One final Ritual TN: Base + 4×Paid Raises.
 * Missing the final TN fails the entire declared attempt (no partial named tier).
 */
export declare function resolveRitualDeclaredOutcome(opts: {
    rollTotal: number;
    baseTn: number;
    declaredRaises: number;
}): RitualDeclaredOutcome;
//# sourceMappingURL=rituals.d.ts.map