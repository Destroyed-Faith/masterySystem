/**
 * One-shot GM migration: legacy single-key `elvenStride` embedded items → one of the
 * four lineage-specific echo artifacts (Fire / Earth / Water / Air).
 *
 * Lineage is resolved from the item's stamped `system.elementalLineage`, else the
 * actor's `system.echo.subChoiceKey` from the old racial sub-choice, else Fire.
 * Evolution progress (current node) is preserved by remapping `elvenStride-lN` →
 * `elvenStride{Lineage}-lN` on the already-seeded world library.
 */
import { findEchoArtifactRootInWorld, findEchoArtifactWorldItem, } from '../utils/seed-artifact-library.js';
import { readActorArtifactProgress, serializeActorArtifactProgress, } from '../utils/artifact-actor-rules.js';
const SETTING_NAMESPACE = 'mastery-system';
const LINEAGE_TO_STRIDE_KEY = {
    fire: 'elvenStrideFire',
    earth: 'elvenStrideEarth',
    water: 'elvenStrideWater',
    air: 'elvenStrideAir',
};
function resolveStrideKey(actor, item) {
    const fromItem = String(item.system?.elementalLineage || '').toLowerCase();
    const fromActor = String(actor.system?.echo?.subChoiceKey || '').toLowerCase();
    return LINEAGE_TO_STRIDE_KEY[fromItem] || LINEAGE_TO_STRIDE_KEY[fromActor] || 'elvenStrideFire';
}
function isLegacyElvenStrideItem(item) {
    return (item?.type === 'artifact' &&
        item.getFlag?.(SETTING_NAMESPACE, 'echoArtifactKey') === 'elvenStride');
}
/** Migrate legacy `elvenStride` actor copies to a lineage-specific tree. */
export async function runElvenStrideLineageMigration(actors) {
    if (!game.user?.isGM)
        return;
    let migrated = 0;
    for (const actor of actors) {
        const legacyItems = Array.from(actor.items || []).filter(isLegacyElvenStrideItem);
        for (const legacy of legacyItems) {
            const newKey = resolveStrideKey(actor, legacy);
            const newRoot = findEchoArtifactRootInWorld(newKey);
            if (!newRoot)
                continue;
            const oldNodeId = String(legacy.getFlag(SETTING_NAMESPACE, 'evolutionNodeId') || 'elvenStride-l1');
            const levelSuffix = oldNodeId.replace(/^elvenStride-/, '');
            const newNodeId = `${newKey}-${levelSuffix}`;
            const targetWorld = findEchoArtifactWorldItem(newKey, (it) => it.getFlag(SETTING_NAMESPACE, 'nodeId') === newNodeId) ||
                newRoot;
            const equip = legacy.getFlag(SETTING_NAMESPACE, 'equipment');
            const sys = foundry.utils.duplicate(targetWorld.system || {});
            await legacy.update({
                name: targetWorld.name,
                img: targetWorld.img,
                system: sys,
                'flags.mastery-system.echoArtifactKey': newKey,
                'flags.mastery-system.echoBound': true,
                'flags.mastery-system.evolutionRootItemId': newRoot.id,
                'flags.mastery-system.evolutionNodeId': newNodeId,
            });
            if (equip) {
                await legacy.setFlag(SETTING_NAMESPACE, 'equipment', equip);
            }
            const actorId = actor.id;
            const levels = { ...(newRoot.getFlag(SETTING_NAMESPACE, 'actorLevels') || {}) };
            const prev = readActorArtifactProgress(levels[actorId], newNodeId);
            levels[actorId] = serializeActorArtifactProgress({
                nodeId: newNodeId,
                linked: prev.linked !== false,
            });
            await newRoot.setFlag(SETTING_NAMESPACE, 'actorLevels', levels);
            migrated += 1;
        }
    }
    if (migrated > 0) {
        console.log(`Mastery System | Migrated ${migrated} legacy Elven Stride item(s) to lineage-specific trees.`);
    }
}
//# sourceMappingURL=elven-stride-lineage-migration.js.map