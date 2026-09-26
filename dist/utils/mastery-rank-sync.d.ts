/**
 * Mastery Rank synchronisation helpers.
 *
 * DF Core v0.9.9.1: Mastery Rank comes from Lifetime XP, not Stone count.
 * A permanent Stone total earned as 2 + floor(XP / 20) implies that XP, so
 * `deriveMasteryRankFromStones` stays as a fallback when only the Stone total
 * is known. The live sheet rank may still be set by the GM; the suggested
 * rank is the Lifetime XP value.
 */
/** Recommended starting Mastery Rank (Players Guide 7224–7226). */
export declare const STARTING_MASTERY_RANK = 2;
/** World setting `defaultMasteryRank` (fallback when an actor has no MR stored). */
export declare function getWorldDefaultMasteryRank(): number;
/** DF Core v0.9.9.1 Mastery Rank from Lifetime XP. 0 XP is MR2. 1000+ is MR8. */
export declare function masteryRankFromLifetimeXp(lifetimeXp: number): number;
/**
 * Lowest Lifetime XP that produces this permanent Stone total
 * (Stones = 2 + floor(XP / 20)). Used when a sheet has Stones but no XP field.
 */
export declare function lifetimeXpFloorFromPermanentStones(totalStones: number): number;
/** Suggested Mastery Rank from a permanent Stone total earned by Lifetime XP. */
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