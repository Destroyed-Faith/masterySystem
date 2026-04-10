/**
 * Push a world artifact tree node (name, img, system) to all embedded actor copies
 * that reference the same evolution root + node id (matches artifact-evolution onUpgrade).
 */
import { getWorldArtifactItemsInFolder } from './artifact-actor-tree.js';
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
//# sourceMappingURL=artifact-embedded-sync.js.map