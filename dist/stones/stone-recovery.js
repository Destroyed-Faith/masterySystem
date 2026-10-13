/**
 * Stone Recovery maths — round 2+, the player decides which spent stones come
 * back (Mastery Rank many). Kept free of Foundry globals so it can be tested;
 * the Stone Powers dialog renders these rows above its power matrix.
 */
/** Space a pool offers: capacity minus Sustain, minus what is already in it. */
export function stoneRecoverySpace(pool) {
    const max = Math.max(0, Math.floor(Number(pool.max) || 0));
    const current = Math.max(0, Math.floor(Number(pool.current) || 0));
    const sustained = Math.max(0, Math.floor(Number(pool.sustained) || 0));
    return Math.max(0, max - sustained - current);
}
function poolCurrent(pool) {
    return Math.max(0, Math.floor(Number(pool.current) || 0));
}
function poolMax(pool) {
    return Math.max(0, Math.floor(Number(pool.max) || 0));
}
/** Allocation clamped to [0, +space] for one pool — recovery only ever adds. */
function clampOwn(pool, raw) {
    const n = Math.floor(Number(raw) || 0);
    if (!Number.isFinite(n) || n <= 0)
        return 0;
    return Math.min(stoneRecoverySpace(pool), n);
}
/**
 * Rows a player can act on, plus the running totals. Every pool with capacity
 * gets a row: "+" takes a spent stone back (Mastery Rank budget), "−" undoes
 * one of your own "+" clicks. Allocation never goes below zero. Confirm never
 * blocks.
 */
export function planStoneRecovery(pools, allocation, points) {
    const total = Math.max(0, Math.floor(Number(points) || 0));
    let allocated = 0;
    for (const pool of pools) {
        allocated += clampOwn(pool, allocation[pool.key]);
    }
    const remaining = Math.max(0, total - allocated);
    const rows = [];
    for (const pool of pools) {
        if (poolMax(pool) <= 0)
            continue;
        const space = stoneRecoverySpace(pool);
        const own = clampOwn(pool, allocation[pool.key]);
        rows.push({
            key: pool.key,
            space,
            current: poolCurrent(pool),
            allocated: own,
            canAdd: remaining > 0 && own < space,
            canRemove: own > 0,
        });
    }
    const saturated = remaining > 0 && !rows.some((row) => row.allocated < row.space);
    return {
        points: total,
        allocated,
        remaining,
        rows,
        saturated,
        // Never gate the fight on filling the Mastery Rank budget.
        canFinish: true,
    };
}
/** Allocation trimmed to what the pools can actually take, for the actor update. */
export function clampStoneRecoveryAllocation(pools, allocation, points) {
    const out = {};
    let left = Math.max(0, Math.floor(Number(points) || 0));
    for (const pool of pools) {
        if (left <= 0)
            break;
        const want = Math.max(0, Math.floor(Number(allocation[pool.key]) || 0));
        const take = Math.min(want, stoneRecoverySpace(pool), left);
        if (take <= 0)
            continue;
        out[pool.key] = take;
        left -= take;
    }
    return out;
}
//# sourceMappingURL=stone-recovery.js.map