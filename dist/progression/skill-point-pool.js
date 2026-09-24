/**
 * Unspent Skill Points after character creation.
 *
 * Refunds (for example when a Skill is removed from the rules) land in
 * `system.skillPoints.unspent`. One unspent Skill Point buys one Skill Rating
 * point in the normal Skill progression UI; ranks bought this way are recorded
 * per Skill in `system.skillPoints.placed` so that removing them gives the
 * Skill Point back instead of refunding XP. Skill Points never become XP.
 */
function toCount(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
export function readSkillPointPool(system) {
    const raw = system?.skillPoints;
    const placed = {};
    const rawPlaced = raw?.placed;
    if (rawPlaced && typeof rawPlaced === 'object') {
        for (const [key, value] of Object.entries(rawPlaced)) {
            const n = toCount(value);
            if (n > 0)
                placed[key] = n;
        }
    }
    return { unspent: toCount(raw?.unspent), placed };
}
/**
 * Decide which pending Skill rank changes are paid with unspent Skill Points
 * and which cost XP.
 *
 * Positive steps consume the pool in the order the Skills were clicked
 * (`pendingMap` insertion order) until it is empty; the rest cost XP by the
 * banded Skill cost of the rank reached. Negative steps first give back ranks
 * that were placed from the pool on that Skill, then refund XP for the rest.
 */
export function allocateSkillPending(opts) {
    let poolLeft = opts.pool.unspent;
    let poolSpent = 0;
    let poolReturned = 0;
    let xpNet = 0;
    const perSkill = {};
    for (const [key, rawPending] of Object.entries(opts.pendingMap || {})) {
        const pending = Math.floor(Number(rawPending) || 0);
        if (!pending)
            continue;
        const current = Math.max(0, Math.floor(Number(opts.currentRank(key)) || 0));
        const entry = {
            key,
            pending,
            poolSteps: 0,
            xpSteps: 0,
            poolReturned: 0,
            xpRefundSteps: 0,
            xpNet: 0,
        };
        if (pending > 0) {
            entry.poolSteps = Math.min(pending, poolLeft);
            poolLeft -= entry.poolSteps;
            poolSpent += entry.poolSteps;
            entry.xpSteps = pending - entry.poolSteps;
            for (let i = entry.poolSteps + 1; i <= pending; i += 1) {
                entry.xpNet += opts.skillBandCost(current + i);
            }
        }
        else {
            const steps = Math.min(Math.abs(pending), current);
            const placedHere = toCount(opts.pool.placed[key]);
            entry.poolReturned = Math.min(steps, placedHere);
            poolReturned += entry.poolReturned;
            entry.xpRefundSteps = steps - entry.poolReturned;
            for (let i = 0; i < entry.xpRefundSteps; i += 1) {
                const refundRank = current - entry.poolReturned - i;
                if (refundRank <= 0)
                    break;
                entry.xpNet -= opts.skillBandCost(refundRank);
            }
        }
        xpNet += entry.xpNet;
        perSkill[key] = entry;
    }
    return {
        poolSpent,
        poolReturned,
        poolAfter: opts.pool.unspent - poolSpent + poolReturned,
        xpNet,
        perSkill,
    };
}
/** Actor update keys for the pool after a confirmed batch. */
export function skillPointPoolUpdate(pool, allocation) {
    const updates = {
        'system.skillPoints.unspent': Math.max(0, allocation.poolAfter),
    };
    for (const entry of Object.values(allocation.perSkill)) {
        const delta = entry.poolSteps - entry.poolReturned;
        if (!delta)
            continue;
        const next = Math.max(0, toCount(pool.placed[entry.key]) + delta);
        if (next > 0)
            updates[`system.skillPoints.placed.${entry.key}`] = next;
        else
            updates[`system.skillPoints.placed.-=${entry.key}`] = null;
    }
    return updates;
}
//# sourceMappingURL=skill-point-pool.js.map