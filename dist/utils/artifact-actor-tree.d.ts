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
export declare function getWorldArtifactItemsInFolder(folderId: string | null | undefined): Item[];
export declare function collectArtifactNodeMeta(items: Item[]): Map<string, ArtifactNodeMeta>;
/** Same naming as Artifact Builder: Level 1, Level 2-1, … */
export declare function buildArtifactDisplayLabels(metaMap: Map<string, ArtifactNodeMeta>): Map<string, string>;
export declare function getChildWorldItemsForNode(parentNodeId: string, folderItems: Item[]): Item[];
export declare function findRootWorldArtifactInFolder(folderId: string): Item | undefined;
export declare function resolveWorldItemByNodeId(nodeId: string, folderItems: Item[]): Item | undefined;
export declare function toLineageItems(folderItems: Item[]): LineageItemLike[];
export { buildArtifactNodeIdMap };
//# sourceMappingURL=artifact-actor-tree.d.ts.map