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
export async function resyncArtifactTreeToAllActors(
  worldItem: Item,
): Promise<{ actors: number; items: number }> {
  if (!worldItem || (worldItem as any).type !== 'artifact') return { actors: 0, items: 0 };

  const wid = (worldItem as any).id as string;
  const fresh = ((game as any).items?.get(wid) as Item | undefined) || worldItem;
  const folderId = (fresh as any).folder?.id;
  if (!folderId) return { actors: 0, items: 0 };

  const folderItems = getWorldArtifactItemsInFolder(folderId);
  const nodeIdMap = buildArtifactNodeIdMap(folderItems as any);
  const root = findRootItem(fresh as any, nodeIdMap);
  const rootId = (root as any).id;

  const actors = (game as any).actors;
  if (!actors) return { actors: 0, items: 0 };

  let itemCount = 0;
  let actorCount = 0;
  for (const actor of actors) {
    const items = (actor as any).items;
    const list: any[] = Array.isArray(items) ? items : Array.from(items.values());
    const batch: any[] = [];
    for (const emb of list) {
      if (emb.type !== 'artifact') continue;
      if (emb.getFlag?.('mastery-system', 'evolutionRootItemId') !== rootId) continue;
      const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId') as string | undefined;
      if (!nodeId) continue;
      const worldNode = resolveWorldItemByNodeId(nodeId, folderItems);
      if (!worldNode) continue;
      const fi = worldNode as any;
      batch.push({
        _id: emb.id,
        name: fi.name,
        img: fi.img,
        system: foundry.utils.duplicate((fi.system as any) || {}),
      });
    }
    if (batch.length > 0) {
      await (actor as any).updateEmbeddedDocuments('Item', batch);
      itemCount += batch.length;
      actorCount += 1;
    }
  }
  return { actors: actorCount, items: itemCount };
}
