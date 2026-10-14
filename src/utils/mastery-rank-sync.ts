/**
 * Mastery Rank synchronisation helpers.
 *
 * Mechanical Mastery Rank is the stored `system.mastery.rank` (GM / sheet).
 * Lifetime XP still yields a **suggested** rank (`suggestedMasteryRank` /
 * `system.mastery.suggestedRank`) so the sheet can show e.g. ↗5 — the GM may
 * leave the character below (or above) that suggestion.
 */

import { MR_ADVANCEMENT } from './constants.js';

/** Recommended starting Mastery Rank (Players Guide 7224–7226). */
export const STARTING_MASTERY_RANK = 2;

/** World setting `defaultMasteryRank` (fallback when an actor has no MR stored). */
export function getWorldDefaultMasteryRank(): number {
    try {
        const raw = (game as any)?.settings?.get('mastery-system', 'defaultMasteryRank');
        const n = Math.floor(Number(raw) || STARTING_MASTERY_RANK);
        return Math.max(1, Math.min(8, n));
    } catch {
        return STARTING_MASTERY_RANK;
    }
}

/** DF Core v0.9.9.1 Mastery Rank from Lifetime XP. 0 XP is MR2. 1000+ is MR8. */
export function masteryRankFromLifetimeXp(lifetimeXp: number): number {
    const xp = Math.max(0, Math.floor(Number(lifetimeXp) || 0));
    let mr = STARTING_MASTERY_RANK;
    for (const row of MR_ADVANCEMENT) {
        if (xp >= row.lifetimeXp) mr = row.mr;
    }
    return mr;
}

/**
 * Suggested Mastery Rank from Lifetime XP (or permanent Stones when XP is unset).
 * Display / sync hint only — does not override the stored rank.
 */
export function suggestedMasteryRank(actorOrSystem: any): number {
    const system = actorOrSystem?.system ?? actorOrSystem ?? null;
    if (!system || typeof system !== 'object') return getWorldDefaultMasteryRank();
    const xpRaw = system?.progression?.lifetimeXp;
    if (xpRaw != null && xpRaw !== '' && Number.isFinite(Number(xpRaw))) {
        return masteryRankFromLifetimeXp(Number(xpRaw));
    }
    const totalStones = Number(system?.stones?.total ?? 0);
    if (Number.isFinite(totalStones) && totalStones > 0) {
        return deriveMasteryRankFromStones(totalStones);
    }
    return getWorldDefaultMasteryRank();
}

/**
 * The Mastery Rank used by rules calculations: stored `system.mastery.rank`.
 * Falls back to the XP/Stone suggestion only when no usable rank is stored.
 */
export function getRulesMasteryRank(actorOrSystem: any): number {
    const system = actorOrSystem?.system ?? actorOrSystem ?? null;
    if (!system || typeof system !== 'object') return getWorldDefaultMasteryRank();
    const stored = Math.floor(Number(system?.mastery?.rank) || 0);
    if (stored >= 1) return Math.min(8, stored);
    return suggestedMasteryRank(system);
}

/**
 * Lowest Lifetime XP that produces this permanent Stone total
 * (Stones = 2 + floor(XP / 20)). Used when a sheet has Stones but no XP field.
 */
export function lifetimeXpFloorFromPermanentStones(totalStones: number): number {
    const stones = Math.max(0, Math.floor(Number(totalStones) || 0));
    return Math.max(0, (stones - 2) * 20);
}

/** Suggested Mastery Rank from a permanent Stone total earned by Lifetime XP. */
export function deriveMasteryRankFromStones(totalStones: number): number {
    return masteryRankFromLifetimeXp(lifetimeXpFloorFromPermanentStones(totalStones));
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
    const storedXp = system.progression?.lifetimeXp;
    const suggestedRank = storedXp == null
        ? deriveMasteryRankFromStones(totalStones)
        : masteryRankFromLifetimeXp(Number(storedXp) || 0);
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
 *   • The "+1 Keep on all rolls" effect is implicit — dice subsystems
 *     use `getRulesMasteryRank` (stored Mastery Rank).
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
