/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */
/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export function countArtifactActivationStones(actor, attr) {
    const A = actor;
    if (!A?.items?.filter)
        return 0;
    let total = 0;
    for (const item of A.items.filter((i) => i.type === 'artifact')) {
        if (item.getFlag?.('mastery-system', 'artifactActivated') !== true)
            continue;
        const stoneAttr = item.getFlag?.('mastery-system', 'artifactActivationStoneAttr');
        if (typeof stoneAttr !== 'string' || !stoneAttr.trim())
            continue;
        if (attr && stoneAttr !== attr)
            continue;
        total += 1;
    }
    return total;
}
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export function effectiveStonePoolAfterBindings(maxStones, sustained, artifactBound) {
    return Math.max(0, maxStones - sustained - artifactBound);
}
//# sourceMappingURL=artifact-stone-bound.js.map