/**
 * Mark(X) Damage Floor — pure helpers (no Foundry dependency).
 *
 * Rules: when a creature hits a Marked target, it *may* spend any amount of
 * Mark. Spent Mark becomes the Damage Floor for that roll: each damage die
 * below the spent value is treated as that value. Mark is then reduced by
 * the amount spent.
 */
/**
 * Mark Damage Floor: each active damage-die face below `spend` is raised to
 * `spend`. Returns the flat bonus added to the damage total.
 * Spend 0 → no floor (attacker declined to use Mark).
 */
export function computeMarkFloorBonus(damageChatRolls, spend, existingFloor = 0) {
    const floor = Math.max(0, Math.floor(Number(spend) || 0));
    if (floor <= 0)
        return 0;
    const prior = Math.max(0, Math.floor(Number(existingFloor) || 0));
    let bonus = 0;
    for (const roll of damageChatRolls) {
        for (const term of roll?.terms || []) {
            const results = term?.results;
            if (!Array.isArray(results))
                continue;
            for (const res of results) {
                if (res?.active === false)
                    continue;
                const face = Number(res?.result);
                if (!Number.isFinite(face))
                    continue;
                // A previously applied floor (e.g. Brutal Impact) already raised this
                // die — only the remaining gap counts.
                const effective = Math.max(face, prior);
                if (effective < floor)
                    bonus += floor - effective;
            }
        }
    }
    return bonus;
}
/** Clamp a chosen Mark spend to `[0, markOnTarget]`. */
export function clampMarkSpend(markOnTarget, chosen) {
    const max = Math.max(0, Math.floor(Number(markOnTarget) || 0));
    const spend = Math.max(0, Math.floor(Number(chosen) || 0));
    return Math.min(max, spend);
}
//# sourceMappingURL=mark-floor.js.map