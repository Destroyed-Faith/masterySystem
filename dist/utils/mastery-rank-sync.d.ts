/**
 * Mastery Rank synchronisation helpers.
 *
 * New spec — Mastery Rank Progression (driven by total Stones):
 *
 *   | Total Stones | Suggested MR        | Tier         |
 *   |--------------|---------------------|--------------|
 *   |   1 –  7     | MR 2 — Adept        | Trained      |
 *   |   8 – 13     | MR 3 — Expert       | Veteran      |
 *   |  14 – 20     | MR 4 — Master       | Hero-tier    |
 *   |  21 – 29     | MR 5 — Grandmaster  | Apex         |
 *   |  30 – 39     | MR 6 — Legend       | Mythic       |
 *   |  40 – 49     | MR 7 — Mythic       | Mythic+      |
 *   |  50 – 70     | MR 8 — Godlevel     | Divine       |
 *
 *   Rank-up bundle:
 *       – +1 Mastery Charge (used by Charged powers)
 *       – +1 Keep on all rolls (handled by the dice subsystem reading
 *         `system.mastery.rank`)
 *       – +1 Schtick slot per Mastery Rank
 *
 *   MR 8 Divine Scale: `getDivineScale(totalStones)` further classifies
 *   Godlevel characters as Lesser / True / High / Apex God for display.
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