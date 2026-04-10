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
export async function pushWorldArtifactNodeToEmbeddedActors(worldItem: Item): Promise<number> {
  if (worldItem.type !== 'artifact') return 0;

  const wid = (worldItem as any).id as string;
  const fresh = ((game as any).items?.get(wid) as Item | undefined) || worldItem;
  const folderId = (fresh as any).folder?.id;
  const nodeId = (fresh as any).getFlag('mastery-system', 'nodeId') as string | undefined;
  if (!folderId || !nodeId) return 0;

  const folderItems = getWorldArtifactItemsInFolder(folderId);
  const nodeIdMap = buildArtifactNodeIdMap(folderItems as any);
  const root = findRootItem(fresh as any, nodeIdMap);
  const rootId = root.id;

  const actors = (game as any).actors;
  if (!actors) return 0;

  let total = 0;
  for (const actor of actors) {
    const batch: any[] = [];
    const items = (actor as any).items;
    const list: any[] = Array.isArray(items) ? items : Array.from(items.values());
    for (const emb of list) {
      if (emb.type !== 'artifact') continue;
      if (emb.getFlag?.('mastery-system', 'evolutionRootItemId') !== rootId) continue;
      if (emb.getFlag?.('mastery-system', 'evolutionNodeId') !== nodeId) continue;
      const fi = fresh as any;
      batch.push({
        _id: emb.id,
        name: fi.name,
        img: fi.img,
        system: foundry.utils.duplicate((fi.system as any) || {})
      });
    }
    if (batch.length > 0) {
      await (actor as any).updateEmbeddedDocuments('Item', batch);
      total += batch.length;
    }
  }
  return total;
}
