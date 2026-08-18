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
/**
 * Rows a player can act on, plus the running totals. Pools without space are
 * dropped: offering a plus button that can never be pressed only adds noise.
 * A pool that already holds allocated stones stays in the list so they can be
 * taken back out again.
 */
export function planStoneRecovery(pools, allocation, points) {
    const total = Math.max(0, Math.floor(Number(points) || 0));
    let allocated = 0;
    const spaces = new Map();
    for (const pool of pools) {
        const space = stoneRecoverySpace(pool);
        spaces.set(pool.key, space);
        allocated += Math.min(space, Math.max(0, Math.floor(Number(allocation[pool.key]) || 0)));
    }
    const remaining = Math.max(0, total - allocated);
    const rows = [];
    for (const pool of pools) {
        const space = spaces.get(pool.key) ?? 0;
        const own = Math.min(space, Math.max(0, Math.floor(Number(allocation[pool.key]) || 0)));
        if (space <= 0 && own <= 0)
            continue;
        rows.push({
            key: pool.key,
            space,
            allocated: own,
            canAdd: remaining > 0 && own < space,
            canRemove: own > 0,
        });
    }
    const saturated = !rows.some((row) => row.allocated < row.space);
    return {
        points: total,
        allocated,
        remaining,
        rows,
        saturated,
        canFinish: remaining <= 0 || saturated,
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