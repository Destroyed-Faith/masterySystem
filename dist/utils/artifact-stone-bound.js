/**
 * Legacy leftover: older worlds stored `artifactActivationStoneAttr` as a
 * permanent Link-Stone reservation. Attunement no longer reserves a Stone.
 * Collectors remain so a GM can clear stale flags; spendable-pool math
 * must not subtract these bindings.
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
        if (!byRoot.has(rootKey)) {
            byRoot.set(rootKey, { rootKey, stoneAttr, artifactName: String(item.name ?? '') });
        }
    }
    return Array.from(byRoot.values());
}
/** Artifact names binding a stone, grouped by attribute pool. */
export function artifactBindingNamesByAttr(actor) {
    const out = {};
    for (const b of collectArtifactActivationBindings(actor)) {
        (out[b.stoneAttr] ??= []).push(b.artifactName);
    }
    return out;
}
/**
 * Permanent Link-Stone reservation is retired. Always returns 0 so spendable
 * pools, Stone Power gems, and printouts never treat Attunement as a Bind.
 * Use `collectArtifactActivationBindings` only to find leftover flags to clear.
 */
export function countArtifactActivationStones(_actor, _attr) {
    return 0;
}
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export function effectiveStonePoolAfterBindings(maxStones, sustained, artifactBound) {
    return Math.max(0, maxStones - sustained - artifactBound);
}
//# sourceMappingURL=artifact-stone-bound.js.map