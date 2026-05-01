/**
 * Mastery Rank synchronisation helpers.
 *
 * Source: Players Guide 7207–7270 ("Mastery Rank Progression").
 *
 *   • Starting Point (7224–7226): characters begin at MR 2.
 *   • Recommended Mastery Progression (7232–7239):
 *
 *       | Total Stones | Suggested MR        | Tier         |
 *       |--------------|---------------------|--------------|
 *       |   1 –  7     | M2 — Adept          | Trained adv. |
 *       |   8 – 11     | M3 — Expert         | Veteran      |
 *       |  12 – 15     | M4 — Master         | Hero-tier    |
 *       |  16 – 19     | M5 — Grandmaster    | Apex hero    |
 *       |  20+         | M6 — Legend         | Mythic       |
 *
 *     The implementation in `MR_ADVANCEMENT` (constants.ts) was never
 *     consulted; this module provides `deriveMasteryRankFromStones`,
 *     `syncActorMasteryRank`, and `applyRankUpBundle` so the runtime
 *     can wire stones → MR + the rank-up bundle (+1 Mastery Charge,
 *     +1 Keep, +1 Schtick slot) automatically.
 *
 *   • Rank-up bundle (7263–7268):
 *       – +1 Mastery Charge (used by Charged powers)
 *       – +1 Keep on all rolls (handled by the dice subsystem reading
 *         `system.mastery.rank`)
 *       – +1 Schtick slot per Mastery Rank (Players Guide 3148–3152)
 *
 *   • Shared Mastery (7246–7254): the GM may opt to keep the party's
 *     MR in sync. This helper exposes the *suggested* MR; whether the
 *     world actually applies it is a GM decision.
 */
/** Recommended starting Mastery Rank (Players Guide 7224–7226). */
export declare const STARTING_MASTERY_RANK = 2;
/** Compute the suggested Mastery Rank from a total Stone count. */
export declare function deriveMasteryRankFromStones(totalStones: number): number;
/** Tier label for the supplied Mastery Rank ("Adept" .. "Legend"). */
export declare function tierLabelForMasteryRank(masteryRank: number): string;
/**
 * Compare the actor's current `system.mastery.rank` against the value
 * derived from `system.stones.total` and return a recommendation. The
 * caller (UI / chat command) decides whether to apply it via
 * `applyRankUpBundle`.
 */
export interface MasteryRankRecommendation {
    currentRank: number;
    suggestedRank: number;
    delta: number;
    tier: string;
    /** True iff the suggested rank differs from the current rank. */
    needsSync: boolean;
}
export declare function recommendMasteryRank(actor: any): MasteryRankRecommendation;
/**
 * Push the suggested rank to the actor (and to the rank-derived
 * resources). Returns the recommendation that was applied.
 *
 * `applyBundle = false` only updates `system.mastery.rank` so the GM can
 * preview the change without granting Mastery Charges or Schticks
 * automatically.
 */
export declare function syncActorMasteryRank(actor: any, options?: {
    applyBundle?: boolean;
}): Promise<MasteryRankRecommendation>;
/**
 * Apply the **Rank-Up Bundle** documented at Players Guide 7263–7268.
 *
 *   • +1 Mastery Charge per rank gained (`system.masteryCharges.max`).
 *   • +1 Schtick slot per rank gained (`system.schticks.ranks` table
 *     receives one new empty row per gained rank, capped at the new
 *     `system.mastery.rank`).
 *   • The "+1 Keep on all rolls" effect is implicit — every dice
 *     subsystem already reads `system.mastery.rank` directly.
 *
 * The function is intentionally idempotent on the *target* rank: callers
 * may invoke it once with `delta = 1` per rank gained or with
 * `delta = N` to fast-forward several ranks at once.
 */
export declare function applyRankUpBundle(actor: any, delta: number): Promise<void>;
//# sourceMappingURL=mastery-rank-sync.d.ts.map