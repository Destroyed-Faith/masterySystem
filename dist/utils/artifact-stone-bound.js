/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */
/**
 * True when the artifact is currently worn/bound on the actor. A stone is only
 * ever bound by an artifact that is actually equipped — a deactivated or
 * unequipped (e.g. stale duplicate) copy must never block a Stone Powers gem.
 *
 * Kept local (not imported from artifact-actor-rules) to avoid a circular
 * import; the logic mirrors `isArtifactEquippedOnActor`.
 */
function artifactIsWorn(item) {
    if (!item)
        return false;
    const sys = item.system || {};
    if (item.getFlag?.('mastery-system', 'echoBound'))
        return true;
    if (sys.binding === 'echo')
        return true;
    if (sys.equipped === true)
        return true;
    try {
        const slot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof slot === 'string' && slot.length > 0)
            return true;
    }
    catch {
        // ignore
    }
    return false;
}
/**
 * Collect the actor's currently-binding artifact activations, deduplicated per
 * artifact tree. Self-healing: only counts artifacts that are still
 * `artifactActivated === true` AND worn — so a GM reset / unequip / stale
 * duplicate immediately releases the stone. Duplicate embedded copies of the
 * same artifact tree only ever bind a single stone.
 */
export function collectArtifactActivationBindings(actor) {
    const A = actor;
    if (!A?.items?.filter)
        return [];
    const byRoot = new Map();
    for (const item of A.items.filter((i) => i.type === 'artifact')) {
        if (item.getFlag?.('mastery-system', 'artifactActivated') !== true)
            continue;
        const stoneAttr = item.getFlag?.('mastery-system', 'artifactActivationStoneAttr');
        if (typeof stoneAttr !== 'string' || !stoneAttr.trim())
            continue;
        if (!artifactIsWorn(item))
            continue;
        const rootKey = item.getFlag?.('mastery-system', 'evolutionRootItemId') ||
            item.getFlag?.('mastery-system', 'echoArtifactKey') ||
            String(item.id);
        if (!byRoot.has(rootKey))
            byRoot.set(rootKey, { rootKey, stoneAttr });
    }
    return Array.from(byRoot.values());
}
/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export function countArtifactActivationStones(actor, attr) {
    const bindings = collectArtifactActivationBindings(actor);
    if (!attr)
        return bindings.length;
    return bindings.filter((b) => b.stoneAttr === attr).length;
}
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export function effectiveStonePoolAfterBindings(maxStones, sustained, artifactBound) {
    return Math.max(0, maxStones - sustained - artifactBound);
}
//# sourceMappingURL=artifact-stone-bound.js.map