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
import { MR_ADVANCEMENT } from './constants.js';
/** Recommended starting Mastery Rank (Players Guide 7224–7226). */
export const STARTING_MASTERY_RANK = 2;
/** Compute the suggested Mastery Rank from a total Stone count. */
export function deriveMasteryRankFromStones(totalStones) {
    const stones = Math.max(0, Math.floor(Number(totalStones) || 0));
    let mr = STARTING_MASTERY_RANK;
    for (const row of MR_ADVANCEMENT) {
        if (stones >= row.stones)
            mr = row.mr;
    }
    return mr;
}
/** Tier label for the supplied Mastery Rank ("Adept" .. "Legend"). */
export function tierLabelForMasteryRank(masteryRank) {
    const mr = Math.max(STARTING_MASTERY_RANK, Math.floor(Number(masteryRank) || STARTING_MASTERY_RANK));
    let label = 'Adept';
    for (const row of MR_ADVANCEMENT) {
        if (mr >= row.mr)
            label = row.tier;
    }
    return label;
}
export function recommendMasteryRank(actor) {
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
export async function syncActorMasteryRank(actor, options) {
    const rec = recommendMasteryRank(actor);
    if (!actor || !rec.needsSync)
        return rec;
    const update = {
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
export async function applyRankUpBundle(actor, delta) {
    const steps = Math.max(1, Math.floor(Number(delta) || 1));
    if (!actor)
        return;
    const system = actor.system || {};
    const newRank = Math.max(STARTING_MASTERY_RANK, Math.floor(Number(system.mastery?.rank ?? STARTING_MASTERY_RANK)));
    const update = {};
    // Mastery Charges (+1 per rank gained, also bumped to MR as a floor).
    const currentMaxCharges = Math.max(0, Math.floor(Number(system.masteryCharges?.max ?? 0)));
    const currentNowCharges = Math.max(0, Math.floor(Number(system.masteryCharges?.value ?? currentMaxCharges)));
    const nextMaxCharges = Math.max(currentMaxCharges + steps, newRank);
    update['system.masteryCharges.max'] = nextMaxCharges;
    update['system.masteryCharges.value'] = Math.min(currentNowCharges + steps, nextMaxCharges);
    // Schticks: ensure one row per Mastery Rank (Players Guide 3148–3152).
    const existingSchticks = Array.isArray(system.schticks?.ranks) ? [...system.schticks.ranks] : [];
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
//# sourceMappingURL=mastery-rank-sync.js.map