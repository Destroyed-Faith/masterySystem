/**
 * Martial Skills were removed from the rules.
 *
 * A removed Skill's investment is split, never guessed into one pool:
 *
 * - Ranks from the original 40 Character Creation Skill Points, and ranks
 *   later placed from the unspent Skill Point pool, return to
 *   `system.skillPoints.unspent`. They stay Skill Points.
 * - Ranks bought with XP return as unrestricted Free XP (`system.points.xpFree`).
 *   `freeEarned` is not increased: a refund is not newly earned XP.
 *   The XP amount comes from XP history when that history accounts for the
 *   ranks. With no history, the unchanged Skill band table is used, because
 *   Skill costs did not change in v0.9.9.0. If history exists but does not
 *   match the ranks, the character is marked for review and nothing is refunded.
 *
 * Lifetime XP, Total XP earned, and Free XP earned are not changed.
 * The migration is idempotent: a flag plus `martialSkillsRefund.xpSettled`
 * stops a second run from refunding again.
 */
import { skillBandCost } from '../utils/constants.js';
import { expandHistoryRows } from '../utils/xp-history.js';
/** Legacy Skill keys. Migration-only; these are not Skills any more. */
export const LEGACY_MARTIAL_SKILL_KEYS = [
    'handToHand',
    'meleeWeapons',
    'rangedWeapons',
    'defensiveCombat',
    'combatReflexes',
];
export const MARTIAL_SKILLS_REFUND_FLAG = 'martialSkillsRefunded';
function rating(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
function hasFlag(actor, key) {
    try {
        if (actor?.getFlag?.('mastery-system', key) === true)
            return true;
    }
    catch {
        /* fall through to raw flags */
    }
    return actor?.flags?.['mastery-system']?.[key] === true;
}
function hasAnyLegacyKey(record) {
    if (!record || typeof record !== 'object')
        return false;
    return LEGACY_MARTIAL_SKILL_KEYS.some((key) => key in record);
}
function isLegacyKey(key) {
    return LEGACY_MARTIAL_SKILL_KEYS.includes(key);
}
function martialHistory(actor) {
    const rows = expandHistoryRows(actor?.system?.xp?.history);
    let count = 0;
    let netXp = 0;
    let netRanks = 0;
    for (const row of rows) {
        if (row.category !== 'skill' || !isLegacyKey(String(row.key || '')))
            continue;
        count += 1;
        netXp += -Number(row.signedAmount) || 0;
        if (Number.isFinite(row.from) && Number.isFinite(row.to))
            netRanks += Number(row.to) - Number(row.from);
    }
    return { rows: count, netXp, netRanks };
}
function bandCostBetween(fromRank, toRank) {
    let sum = 0;
    for (let rank = fromRank + 1; rank <= toRank; rank += 1)
        sum += skillBandCost(rank);
    return sum;
}
function earnedXp(system) {
    const xp = system?.xp ?? {};
    return rating(xp.totalEarned) + rating(xp.freeEarned);
}
export function planMartialSkillsRefund(actor) {
    const system = actor?.system ?? {};
    const skills = system.skills && typeof system.skills === 'object' ? system.skills : {};
    const alreadyRefunded = hasFlag(actor, MARTIAL_SKILLS_REFUND_FLAG);
    const prior = system.progression?.martialSkillsRefund;
    const xpSettled = alreadyRefunded && prior?.xpSettled === true;
    const byKey = {};
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
        if (!(key in skills))
            continue;
        byKey[key] = rating(skills[key]);
    }
    const hasLegacyData = hasAnyLegacyKey(skills) ||
        hasAnyLegacyKey(system.skillsSpent) ||
        hasAnyLegacyKey(system.skillPoints?.placed) ||
        hasAnyLegacyKey(system.xp?.postCreationProgress?.skills) ||
        hasAnyLegacyKey(system.xp?.postCreationProgress?.skillsSpent) ||
        hasAnyLegacyKey(system.creation?.skillsRedistributeBackup);
    const creationBudget = system.creation?.complete === false;
    const deferred = system.creation?.skillsRedistributing === true;
    const empty = {
        alreadyRefunded,
        xpSettled,
        byKey,
        startingPoints: 0,
        xpRanks: 0,
        xpRefund: 0,
        xpSource: 'none',
        review: [],
        refund: 0,
        hasLegacyData,
        creationBudget,
        deferred,
    };
    if (deferred || alreadyRefunded || creationBudget || xpSettled)
        return empty;
    const snap = system.xp?.postCreationProgress;
    const hasSnapshot = snap && typeof snap === 'object' && snap.skills && typeof snap.skills === 'object';
    const placed = system.skillPoints?.placed && typeof system.skillPoints.placed === 'object'
        ? system.skillPoints.placed
        : {};
    const history = martialHistory(actor);
    const earned = earnedXp(system);
    let startingPoints = 0;
    let xpRanks = 0;
    let bandXp = 0;
    const review = [];
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
        if (!(key in skills))
            continue;
        const current = rating(skills[key]);
        const placedHere = rating(placed[key]);
        if (hasSnapshot) {
            const baseline = rating(snap.skills[key]);
            const above = current - baseline - placedHere;
            if (above < 0) {
                review.push({ key, reason: 'Snapshot or placed Skill Points exceed the current Rating.' });
                continue;
            }
            startingPoints += baseline + placedHere;
            xpRanks += above;
            bandXp += bandCostBetween(baseline + placedHere, current);
            continue;
        }
        const spent = rating(system.xp?.totalSpent) + rating(system.xp?.freeSpent);
        if (history.rows === 0 && (earned === 0 || spent === 0)) {
            startingPoints += current;
            continue;
        }
        review.push({
            key,
            reason: 'No post-creation snapshot, so starting Skill Points and later XP cannot be separated.',
        });
    }
    if (review.length) {
        return { ...empty, startingPoints: 0, xpRanks: 0, xpRefund: 0, xpSource: 'ambiguous', review };
    }
    let xpRefund = 0;
    let xpSource = 'none';
    if (xpRanks > 0) {
        if (history.rows > 0) {
            if (history.netRanks !== xpRanks || history.netXp < 0) {
                return {
                    ...empty,
                    xpSource: 'ambiguous',
                    review: [{
                            key: 'history',
                            reason: `XP history covers ${history.netRanks} Martial ranks (${history.netXp} XP) but the build has ${xpRanks} XP-paid ranks.`,
                        }],
                };
            }
            xpRefund = history.netXp;
            xpSource = 'history';
        }
        else if (earned === 0) {
            startingPoints += xpRanks;
            xpRanks = 0;
        }
        else {
            xpRefund = bandXp;
            xpSource = 'canonical-band';
        }
    }
    return {
        ...empty,
        startingPoints,
        xpRanks,
        xpRefund,
        xpSource,
        refund: startingPoints,
    };
}
function stripLegacyUpdates(system, updates) {
    for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
        if (hasAnyLegacyKey(system.skills) && key in system.skills) {
            updates[`system.skills.-=${key}`] = null;
        }
        if (hasAnyLegacyKey(system.skillsSpent) && key in system.skillsSpent) {
            updates[`system.skillsSpent.-=${key}`] = null;
        }
        if (hasAnyLegacyKey(system.skillPoints?.placed) && key in system.skillPoints.placed) {
            updates[`system.skillPoints.placed.-=${key}`] = null;
        }
        const backup = system.creation?.skillsRedistributeBackup;
        if (hasAnyLegacyKey(backup) && key in backup) {
            updates[`system.creation.skillsRedistributeBackup.-=${key}`] = null;
        }
    }
    const snap = system.xp?.postCreationProgress;
    if (snap && typeof snap === 'object') {
        let snapshotRefund = 0;
        for (const key of LEGACY_MARTIAL_SKILL_KEYS) {
            if (hasAnyLegacyKey(snap.skills) && key in snap.skills) {
                snapshotRefund += rating(snap.skills[key]);
                updates[`system.xp.postCreationProgress.skills.-=${key}`] = null;
            }
            if (hasAnyLegacyKey(snap.skillsSpent) && key in snap.skillsSpent) {
                updates[`system.xp.postCreationProgress.skillsSpent.-=${key}`] = null;
            }
        }
        if (snapshotRefund > 0) {
            const prior = rating(snap.skillPointsUnspent);
            updates['system.xp.postCreationProgress.skillPointsUnspent'] = prior + snapshotRefund;
        }
    }
}
function historyRefundEntry(actor, xpRefund) {
    const xp = actor?.system?.xp ?? {};
    const points = actor?.system?.points ?? {};
    const available = rating(points.xpFree);
    const totalEarned = rating(xp.totalEarned);
    const totalSpent = rating(xp.totalSpent);
    const prior = Array.isArray(xp.history) ? [...xp.history] : [];
    prior.push({
        ts: Date.now(),
        kind: 'adjust',
        category: 'xp',
        amount: xpRefund,
        note: 'refund: free — removed Martial Skill XP returned as Free XP',
        details: { martialSkillXpRefund: xpRefund, pool: 'xpFree' },
        before: { available, totalEarned, totalSpent },
        after: {
            available: available + xpRefund,
            totalEarned,
            totalSpent,
        },
    });
    return prior.length > 200 ? prior.slice(-200) : prior;
}
/**
 * The first Martial refund turned every rank into Skill Points. When that
 * record has no `xpSettled` flag, move only the XP-paid ranks back out of
 * the unspent Skill Point pool and into Free XP. Lifetime XP stays.
 * If the points were already placed onto other Skills, leave the character
 * for review instead of taking those Skills back.
 */
function correctEarlierSkillPointRefund(actor, updates) {
    const system = actor.system ?? {};
    const prior = system.progression?.martialSkillsRefund ?? {};
    const history = martialHistory(actor);
    const unspent = rating(system.skillPoints?.unspent);
    stripLegacyUpdates(system, updates);
    const earned = earnedXp(system);
    const spent = rating(system.xp?.totalSpent) + rating(system.xp?.freeSpent);
    if (history.rows === 0 && earned > 0 && spent > 0) {
        const review = [{
                key: 'history',
                reason: 'An earlier refund turned the whole Martial Rating into Skill Points, and no XP history remains to separate starting points from XP.',
            }];
        const previous = JSON.stringify(system.progression?.martialSkillsRefundReview ?? null);
        if (previous === JSON.stringify(review) && Object.keys(updates).length === 0)
            return null;
        updates['system.progression.martialSkillsRefundReview'] = review;
        return updates;
    }
    if (history.rows === 0 || history.netRanks <= 0 || history.netXp <= 0) {
        updates['system.progression.martialSkillsRefund'] = {
            ...prior,
            xpRefund: 0,
            xpRanks: 0,
            xpSource: 'none',
            xpSettled: true,
        };
        return updates;
    }
    if (history.netRanks > unspent) {
        const review = [{
                key: 'history',
                reason: `${history.netRanks} XP-paid Martial ranks (${history.netXp} XP) were refunded as Skill Points, but only ${unspent} remain unspent.`,
            }];
        const previous = JSON.stringify(system.progression?.martialSkillsRefundReview ?? null);
        if (previous === JSON.stringify(review) && Object.keys(updates).length === 0)
            return null;
        updates['system.progression.martialSkillsRefundReview'] = review;
        return updates;
    }
    updates['system.skillPoints.unspent'] = unspent - history.netRanks;
    updates['system.points.xpFree'] = rating(system.points?.xpFree) + history.netXp;
    updates['system.xp.history'] = historyRefundEntry(actor, history.netXp);
    updates['system.progression.martialSkillsRefund'] = {
        ...prior,
        total: Math.max(0, rating(prior.total) - history.netRanks),
        xpRefund: history.netXp,
        xpRanks: history.netRanks,
        xpSource: 'history',
        xpSettled: true,
    };
    updates['system.progression.-=martialSkillsRefundReview'] = null;
    return updates;
}
/**
 * Update batch for one character, or `null` when nothing needs to change.
 * An ambiguous character is only marked for review; Skills and XP stay put.
 */
export function martialSkillsRefundUpdate(actor) {
    if (!actor || (actor.type && actor.type !== 'character'))
        return null;
    const plan = planMartialSkillsRefund(actor);
    if (plan.deferred)
        return null;
    const system = actor.system ?? {};
    const updates = {};
    if (plan.review.length) {
        const previous = JSON.stringify(system.progression?.martialSkillsRefundReview ?? null);
        const next = JSON.stringify(plan.review);
        if (previous === next)
            return null;
        updates['system.progression.martialSkillsRefundReview'] = plan.review;
        return updates;
    }
    if (plan.alreadyRefunded && plan.xpSettled && !plan.hasLegacyData)
        return null;
    if (plan.alreadyRefunded && plan.xpSettled) {
        stripLegacyUpdates(system, updates);
        return Object.keys(updates).length ? updates : null;
    }
    if (plan.alreadyRefunded && !plan.xpSettled) {
        return correctEarlierSkillPointRefund(actor, updates);
    }
    if (!plan.alreadyRefunded) {
        stripLegacyUpdates(system, updates);
        if (!plan.creationBudget) {
            const currentUnspent = rating(system.skillPoints?.unspent);
            updates['system.skillPoints.unspent'] = currentUnspent + plan.startingPoints;
            if (plan.xpRefund > 0) {
                updates['system.points.xpFree'] = rating(system.points?.xpFree) + plan.xpRefund;
                updates['system.xp.history'] = historyRefundEntry(actor, plan.xpRefund);
            }
        }
        updates[`flags.mastery-system.${MARTIAL_SKILLS_REFUND_FLAG}`] = true;
        updates['system.progression.martialSkillsRefund'] = {
            total: plan.startingPoints,
            xpRefund: plan.creationBudget ? 0 : plan.xpRefund,
            xpRanks: plan.creationBudget ? 0 : plan.xpRanks,
            xpSource: plan.creationBudget ? 'none' : plan.xpSource,
            byKey: plan.byKey,
            creationBudget: plan.creationBudget,
            xpSettled: true,
            migratedAt: Date.now(),
        };
        updates['system.progression.-=martialSkillsRefundReview'] = null;
        return Object.keys(updates).length ? updates : null;
    }
    return Object.keys(updates).length ? updates : null;
}
export async function runMartialSkillsRefundMigration(actors) {
    const user = globalThis.game?.user;
    if (user && user.isGM === false)
        return 0;
    let migrated = 0;
    for (const actor of actors || []) {
        if (!actor || actor.type !== 'character')
            continue;
        const update = martialSkillsRefundUpdate(actor);
        if (!update)
            continue;
        try {
            await actor.update(update);
            migrated += 1;
        }
        catch (err) {
            console.warn('Mastery System | Martial Skills refund migration failed', actor?.name, err);
        }
    }
    return migrated;
}
//# sourceMappingURL=martial-skills-refund-migration.js.map