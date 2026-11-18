/**
 * Legacy Skill Point pool — retired.
 *
 * DF Professions replaced creation Skill Points. Remaining `system.skillPoints`
 * data is cleared by `retireActorSkillPoints` (unspent ranks become Free XP).
 * Allocation helpers always treat pending Skill changes as XP-only.
 */
function toCount(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
/** Always empty — Skill Points no longer exist as a spendable pool. */
export function readSkillPointPool(_system) {
    return { unspent: 0, placed: {} };
}
/** Raw leftover Skill Points still stored on an actor (pre-retirement). */
export function readLegacySkillPointResidue(system) {
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
 * Convert leftover unspent Skill Points to Free XP and clear the pool.
 * Placed ranks stay on Skills; only the obsolete currency is removed.
 */
export function planSkillPointRetirement(system) {
    const residue = readLegacySkillPointResidue(system);
    const hasPlaced = Object.keys(residue.placed).length > 0;
    if (residue.unspent <= 0 && !hasPlaced) {
        return { needed: false, convertedXp: 0, updates: {} };
    }
    const freeNow = Math.max(0, Math.floor(Number(system?.points?.xpFree) || 0));
    const freeEarned = Math.max(0, Math.floor(Number(system?.xp?.freeEarned) || 0));
    return {
        needed: true,
        convertedXp: residue.unspent,
        updates: {
            'system.skillPoints': { unspent: 0, placed: {} },
            ...(residue.unspent > 0
                ? {
                    'system.points.xpFree': freeNow + residue.unspent,
                    'system.xp.freeEarned': freeEarned + residue.unspent,
                }
                : {}),
        },
    };
}
/**
 * Pending Skill rank changes are XP-only (Skill Points retired).
 */
export function allocateSkillPending(opts) {
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
            entry.xpSteps = pending;
            for (let i = 1; i <= pending; i += 1) {
                entry.xpNet += opts.skillBandCost(current + i);
            }
        }
        else {
            const steps = Math.min(Math.abs(pending), current);
            entry.xpRefundSteps = steps;
            for (let i = 0; i < entry.xpRefundSteps; i += 1) {
                const refundRank = current - i;
                if (refundRank <= 0)
                    break;
                entry.xpNet -= opts.skillBandCost(refundRank);
            }
        }
        xpNet += entry.xpNet;
        perSkill[key] = entry;
    }
    return {
        poolSpent: 0,
        poolReturned: 0,
        poolAfter: 0,
        xpNet,
        perSkill,
    };
}
/** Clears any leftover Skill Point fields after a confirmed batch. */
export function skillPointPoolUpdate(_pool, _allocation) {
    return {
        'system.skillPoints': { unspent: 0, placed: {} },
    };
}
//# sourceMappingURL=skill-point-pool.js.map