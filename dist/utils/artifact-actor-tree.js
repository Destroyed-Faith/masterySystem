/**
 * Folder artifact tree helpers for actor evolution UI (labels, children).
 */
import { buildArtifactNodeIdMap } from './artifact-tree-lineage.js';
export function getWorldArtifactItemsInFolder(folderId) {
    if (!folderId)
        return [];
    return (game.items?.filter((it) => it.folder?.id === folderId && it.type === 'artifact') || []);
}
export function collectArtifactNodeMeta(items) {
    const m = new Map();
    for (const it of items) {
        const nodeId = it.getFlag('mastery-system', 'nodeId');
        if (typeof nodeId !== 'string' || !nodeId)
            continue;
        m.set(nodeId, {
            nodeId,
            itemId: it.id,
            parentIds: it.getFlag('mastery-system', 'parentIds') || [],
            childIds: it.getFlag('mastery-system', 'childIds') || [],
            level: it.system?.level ?? 1
        });
    }
    return m;
}
function calculateDepthFromMeta(nodeId, metaMap, visited = new Set()) {
    if (visited.has(nodeId))
        return 1;
    visited.add(nodeId);
    const node = metaMap.get(nodeId);
    if (!node || node.parentIds.length === 0)
        return 1;
    let maxD = 0;
    for (const pid of node.parentIds) {
        maxD = Math.max(maxD, calculateDepthFromMeta(pid, metaMap, new Set(visited)));
    }
    return maxD + 1;
}
/** Same naming as Artifact Builder: Level 1, Level 2-1, … */
export function buildArtifactDisplayLabels(metaMap) {
    const labels = new Map();
    if (metaMap.size === 0)
        return labels;
    const depthMap = new Map();
    for (const node of metaMap.values()) {
        const depth = calculateDepthFromMeta(node.nodeId, metaMap) - 1;
        if (!depthMap.has(depth))
            depthMap.set(depth, []);
        depthMap.get(depth).push(node);
    }
    const sortedDepths = Array.from(depthMap.keys()).sort((a, b) => a - b);
    for (const depth of sortedDepths) {
        const levelNodes = depthMap.get(depth) || [];
        const items = levelNodes
            .map((n) => ({ n, it: game.items?.get(n.itemId) }))
            .sort((a, b) => (a.it?.name || '').localeCompare(b.it?.name || ''));
        items.forEach(({ n }, index) => {
            const label = depth === 0 ? 'Level 1' : `Level ${depth + 1}-${index + 1}`;
            labels.set(n.nodeId, label);
        });
    }
    return labels;
}
export function getChildWorldItemsForNode(parentNodeId, folderItems) {
    const meta = collectArtifactNodeMeta(folderItems);
    const parent = meta.get(parentNodeId);
    if (!parent)
        return [];
    const out = [];
    for (const cid of parent.childIds) {
        const childMeta = meta.get(cid);
        if (!childMeta)
            continue;
        const it = game.items?.get(childMeta.itemId);
        if (it)
            out.push(it);
    }
    return out;
}
export function findRootWorldArtifactInFolder(folderId) {
    const items = getWorldArtifactItemsInFolder(folderId);
    return items.find((it) => it.getFlag?.('mastery-system', 'isRoot') === true ||
        (typeof it.name === 'string' && it.name.includes('Level 1-1')));
}
export function resolveWorldItemByNodeId(nodeId, folderItems) {
    const it = folderItems.find((i) => i.getFlag('mastery-system', 'nodeId') === nodeId);
    return it;
}
export function toLineageItems(folderItems) {
    return folderItems;
}
export { buildArtifactNodeIdMap };
//# sourceMappingURL=artifact-actor-tree.js.map