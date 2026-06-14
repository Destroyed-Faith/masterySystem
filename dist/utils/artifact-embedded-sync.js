/**
 * Push a world artifact tree node (name, img, system) to all embedded actor copies
 * that reference the same evolution root + node id (matches artifact-evolution onUpgrade).
 */
import { getWorldArtifactItemsInFolder, resolveWorldItemByNodeId } from './artifact-actor-tree.js';
import { buildArtifactNodeIdMap, findRootItem } from './artifact-tree-lineage.js';
/**
 * Updates every embedded Item on actors where evolutionRootItemId matches the tree root
 * and evolutionNodeId matches this world item's node.
 * @returns Number of embedded documents updated.
 */
export async function pushWorldArtifactNodeToEmbeddedActors(worldItem) {
    if (worldItem.type !== 'artifact')
        return 0;
    const wid = worldItem.id;
    const fresh = game.items?.get(wid) || worldItem;
    const folderId = fresh.folder?.id;
    const nodeId = fresh.getFlag('mastery-system', 'nodeId');
    if (!folderId || !nodeId)
        return 0;
    const folderItems = getWorldArtifactItemsInFolder(folderId);
    const nodeIdMap = buildArtifactNodeIdMap(folderItems);
    const root = findRootItem(fresh, nodeIdMap);
    const rootId = root.id;
    const actors = game.actors;
    if (!actors)
        return 0;
    let total = 0;
    for (const actor of actors) {
        const batch = [];
        const items = actor.items;
        const list = Array.isArray(items) ? items : Array.from(items.values());
        for (const emb of list) {
            if (emb.type !== 'artifact')
                continue;
            if (emb.getFlag?.('mastery-system', 'evolutionRootItemId') !== rootId)
                continue;
            if (emb.getFlag?.('mastery-system', 'evolutionNodeId') !== nodeId)
                continue;
            const fi = fresh;
            batch.push({
                _id: emb.id,
                name: fi.name,
                img: fi.img,
                system: foundry.utils.duplicate(fi.system || {})
            });
        }
        if (batch.length > 0) {
            await actor.updateEmbeddedDocuments('Item', batch);
            total += batch.length;
        }
    }
    return total;
}
/**
 * Full GM resync: push the up-to-date world tree onto EVERY embedded copy that
 * belongs to this artifact's tree, on ALL actors — regardless of which
 * evolution level the actor sits on. Each embedded item is refreshed from the
 * world node matching its own `evolutionNodeId`, so an actor on Level 5 gets
 * the current Level-5 node, an actor on Level 1 gets the current Level-1 node.
 *
 * Actor-specific flags (`artifactActivated`, `equipment`, `evolutionNodeId`,
 * `evolutionRootItemId`) are preserved — only `name`/`img`/`system` are synced.
 *
 * @param worldItem Any node of the tree (the true root is resolved internally).
 * @returns Counts of affected actors and updated embedded items.
 */
export async function resyncArtifactTreeToAllActors(worldItem) {
    if (!worldItem || worldItem.type !== 'artifact')
        return { actors: 0, items: 0 };
    const wid = worldItem.id;
    const fresh = game.items?.get(wid) || worldItem;
    const folderId = fresh.folder?.id;
    if (!folderId)
        return { actors: 0, items: 0 };
    const folderItems = getWorldArtifactItemsInFolder(folderId);
    const nodeIdMap = buildArtifactNodeIdMap(folderItems);
    const root = findRootItem(fresh, nodeIdMap);
    const rootId = root.id;
    const actors = game.actors;
    if (!actors)
        return { actors: 0, items: 0 };
    let itemCount = 0;
    let actorCount = 0;
    for (const actor of actors) {
        const items = actor.items;
        const list = Array.isArray(items) ? items : Array.from(items.values());
        const batch = [];
        for (const emb of list) {
            if (emb.type !== 'artifact')
                continue;
            if (emb.getFlag?.('mastery-system', 'evolutionRootItemId') !== rootId)
                continue;
            const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId');
            if (!nodeId)
                continue;
            const worldNode = resolveWorldItemByNodeId(nodeId, folderItems);
            if (!worldNode)
                continue;
            const fi = worldNode;
            batch.push({
                _id: emb.id,
                name: fi.name,
                img: fi.img,
                system: foundry.utils.duplicate(fi.system || {}),
            });
        }
        if (batch.length > 0) {
            await actor.updateEmbeddedDocuments('Item', batch);
            itemCount += batch.length;
            actorCount += 1;
        }
    }
    return { actors: actorCount, items: itemCount };
}
//# sourceMappingURL=artifact-embedded-sync.js.map