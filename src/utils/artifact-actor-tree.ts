/**
 * Folder artifact tree helpers for actor evolution UI (labels, children).
 */

import type { LineageItemLike } from './artifact-tree-lineage.js';
import { buildArtifactNodeIdMap } from './artifact-tree-lineage.js';

export interface ArtifactNodeMeta {
  nodeId: string;
  itemId: string;
  parentIds: string[];
  childIds: string[];
  level: number;
}

export function getWorldArtifactItemsInFolder(folderId: string | null | undefined): Item[] {
  if (!folderId) return [];
  return (
    (game as any).items?.filter((it: any) => it.folder?.id === folderId && it.type === 'artifact') || []
  );
}

export function collectArtifactNodeMeta(items: Item[]): Map<string, ArtifactNodeMeta> {
  const m = new Map<string, ArtifactNodeMeta>();
  for (const it of items) {
    const nodeId = (it as any).getFlag('mastery-system', 'nodeId');
    if (typeof nodeId !== 'string' || !nodeId) continue;
    m.set(nodeId, {
      nodeId,
      itemId: (it as any).id,
      parentIds: ((it as any).getFlag('mastery-system', 'parentIds') as string[]) || [],
      childIds: ((it as any).getFlag('mastery-system', 'childIds') as string[]) || [],
      level: (it.system as any)?.level ?? 1
    });
  }
  return m;
}

function calculateDepthFromMeta(nodeId: string, metaMap: Map<string, ArtifactNodeMeta>, visited: Set<string> = new Set()): number {
  if (visited.has(nodeId)) return 1;
  visited.add(nodeId);
  const node = metaMap.get(nodeId);
  if (!node || node.parentIds.length === 0) return 1;
  let maxD = 0;
  for (const pid of node.parentIds) {
    maxD = Math.max(maxD, calculateDepthFromMeta(pid, metaMap, new Set(visited)));
  }
  return maxD + 1;
}

/** Same naming as Artifact Builder: Level 1, Level 2-1, … */
export function buildArtifactDisplayLabels(metaMap: Map<string, ArtifactNodeMeta>): Map<string, string> {
  const labels = new Map<string, string>();
  if (metaMap.size === 0) return labels;

  const depthMap = new Map<number, ArtifactNodeMeta[]>();
  for (const node of metaMap.values()) {
    const depth = calculateDepthFromMeta(node.nodeId, metaMap) - 1;
    if (!depthMap.has(depth)) depthMap.set(depth, []);
    depthMap.get(depth)!.push(node);
  }

  const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    const levelNodes = depthMap.get(depth) || [];
    const items = levelNodes
      .map((n) => ({ n, it: (game as any).items?.get(n.itemId) }))
      .sort((a, b) => (a.it?.name || '').localeCompare(b.it?.name || ''));
    items.forEach(({ n }, index) => {
      const label = depth === 0 ? 'Level 1' : `Level ${depth + 1}-${index + 1}`;
      labels.set(n.nodeId, label);
    });
  }
  return labels;
}

export function getChildWorldItemsForNode(parentNodeId: string, folderItems: Item[]): Item[] {
  const meta = collectArtifactNodeMeta(folderItems);
  const parent = meta.get(parentNodeId);
  if (!parent) return [];
  const out: Item[] = [];
  for (const cid of parent.childIds) {
    const childMeta = meta.get(cid);
    if (!childMeta) continue;
    const it = (game as any).items?.get(childMeta.itemId);
    if (it) out.push(it);
  }
  return out;
}

export function findRootWorldArtifactInFolder(folderId: string): Item | undefined {
  const items = getWorldArtifactItemsInFolder(folderId);
  return items.find(
    (it: any) =>
      it.getFlag?.('mastery-system', 'isRoot') === true ||
      (typeof it.name === 'string' && it.name.includes('Level 1-1'))
  );
}

export function resolveWorldItemByNodeId(nodeId: string, folderItems: Item[]): Item | undefined {
  const it = folderItems.find((i: any) => i.getFlag('mastery-system', 'nodeId') === nodeId);
  return it;
}

export function toLineageItems(folderItems: Item[]): LineageItemLike[] {
  return folderItems as unknown as LineageItemLike[];
}

export { buildArtifactNodeIdMap };
