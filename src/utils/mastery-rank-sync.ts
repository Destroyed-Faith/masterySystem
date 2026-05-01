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

import { MR_ADVANCEMENT } from './constants.js';

/** Recommended starting Mastery Rank (Players Guide 7224–7226). */
export const STARTING_MASTERY_RANK = 2;

/** Compute the suggested Mastery Rank from a total Stone count. */
export function deriveMasteryRankFromStones(totalStones: number): number {
    const stones = Math.max(0, Math.floor(Number(totalStones) || 0));
    let mr = STARTING_MASTERY_RANK;
    for (const row of MR_ADVANCEMENT) {
        if (stones >= row.stones) mr = row.mr;
    }
    return mr;
}

/** Tier label for the supplied Mastery Rank ("Adept" .. "Legend"). */
export function tierLabelForMasteryRank(masteryRank: number): string {
    const mr = Math.max(STARTING_MASTERY_RANK, Math.floor(Number(masteryRank) || STARTING_MASTERY_RANK));
    let label = 'Adept';
    for (const row of MR_ADVANCEMENT) {
        if (mr >= row.mr) label = row.tier;
    }
    return label;
}

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

export function recommendMasteryRank(actor: any): MasteryRankRecommendation {
    const system = actor?.system || {};
    const totalStones = Number(system.stones?.total ?? 0);
    const currentRank = Math.max(STARTING_MASTERY_RANK, Math.floor(Number(system.mastery?.rank ?? STARTING_MASTERY_RANK)));
    const suggestedRank = deriveMasteryRankFromStones(totalStones);
    return {
        currentRank,
        suggestedRank,
        delta: suggestedRank - currentRank,
        tier: tierLabelForMasteryRank(suggestedRank),
        needsSync: suggestedRank !== currentRank,
    };
}

/**
 * Push the suggested rank to the actor (and to the rank-derived
 * resources). Returns the recommendation that was applied.
 *
 * `applyBundle = false` only updates `system.mastery.rank` so the GM can
 * preview the change without granting Mastery Charges or Schticks
 * automatically.
 */
export async function syncActorMasteryRank(actor: any, options?: { applyBundle?: boolean }): Promise<MasteryRankRecommendation> {
    const rec = recommendMasteryRank(actor);
    if (!actor || !rec.needsSync) return rec;

    const update: Record<string, unknown> = {
        'system.mastery.rank': rec.suggestedRank,
    };
    await actor.update(update);

    if (options?.applyBundle && rec.delta > 0) {
        await applyRankUpBundle(actor, rec.delta);
    }
    return rec;
}

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
export async function applyRankUpBundle(actor: any, delta: number): Promise<void> {
    const steps = Math.max(1, Math.floor(Number(delta) || 1));
    if (!actor) return;

    const system = actor.system || {};
    const newRank = Math.max(STARTING_MASTERY_RANK, Math.floor(Number(system.mastery?.rank ?? STARTING_MASTERY_RANK)));

    const update: Record<string, unknown> = {};

    // Mastery Charges (+1 per rank gained, also bumped to MR as a floor).
    const currentMaxCharges = Math.max(0, Math.floor(Number(system.masteryCharges?.max ?? 0)));
    const currentNowCharges = Math.max(0, Math.floor(Number(system.masteryCharges?.value ?? currentMaxCharges)));
    const nextMaxCharges = Math.max(currentMaxCharges + steps, newRank);
    update['system.masteryCharges.max'] = nextMaxCharges;
    update['system.masteryCharges.value'] = Math.min(currentNowCharges + steps, nextMaxCharges);

    // Schticks: ensure one row per Mastery Rank (Players Guide 3148–3152).
    const existingSchticks: any[] = Array.isArray(system.schticks?.ranks) ? [...system.schticks.ranks] : [];
    const wantedLen = newRank;
    while (existingSchticks.length < wantedLen) {
        existingSchticks.push({
            rank: existingSchticks.length + 1,
            schtickName: '',
            manifestation: '',
        });
    }
    update['system.schticks.ranks'] = existingSchticks.slice(0, wantedLen);

    await actor.update(update);
}
