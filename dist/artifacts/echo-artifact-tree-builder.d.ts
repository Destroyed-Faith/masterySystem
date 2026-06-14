/**
 * Echo Artifact Tree Builder (pure)
 *
 * Turns an `EchoArtifactDefinition` (see `src/utils/echo-artifacts.ts`) into a
 * full Artifact Builder *tree*: one Folder + ten linked `artifact` node items
 * (Level 1 .. Level 10), exactly the shape the Node Editor / Artifact Builder
 * produce. Nodes are linked through the stable custom `nodeId` flags
 * (`parentIds` / `childIds`), NOT document `_id`, so a generated tree survives
 * compendium import and duplication intact.
 *
 * This module is **pure**: no Foundry globals, no `game`, no DOM, no random.
 * Node ids are deterministic (`<key>-l<level>`) so repeated builds — at runtime
 * seeding and at pack-compile time (plain Node) — produce identical, stable
 * trees. That is exactly what lets the world library and the shipped pack stay
 * in sync with zero drift.
 */
import type { EchoArtifactDefinition } from '../utils/echo-artifacts.js';
/**
 * Content version of the generated trees. Bump this whenever the generator's
 * output (base values, powers, slot/profile, etc.) changes so the world seeder
 * can detect stale library copies and refresh them in place.
 */
export declare const ECHO_ARTIFACT_SEED_VERSION = 11;
/** One generated node (artifact item data minus its folder, which is set at seed time). */
export interface GeneratedArtifactNode {
    nodeId: string;
    level: number;
    isRoot: boolean;
    parentNodeId: string | null;
    childNodeId: string | null;
    /** Foundry-ready item data (folder injected by the seeder / pack writer). */
    itemData: Record<string, unknown>;
}
export interface GeneratedArtifactTree {
    echoArtifactKey: string;
    echoKey: string;
    /** Display name for the world folder / compendium folder. */
    folderName: string;
    /** The 10 nodes, ordered Level 1 → Level 10. */
    nodes: GeneratedArtifactNode[];
}
/**
 * Build the full 10-node linear tree for one Echo Artifact.
 *
 * Node naming matches the Artifact Builder convention (`<Name> - Level N-1`).
 * Each node stores only the abilities unlocked at that level (1 / 2 / 3 slots,
 * upgrading in place at L4 and L7) plus embedded powers for those rows. Base
 * Values are resolved to their exact value at each node's level.
 */
export declare function buildEchoArtifactTree(def: EchoArtifactDefinition): GeneratedArtifactTree;
/** Build trees for every Echo Artifact in the catalog. */
export declare function buildAllEchoArtifactTrees(): GeneratedArtifactTree[];
/** Build trees for every General (bound, non-Echo) Artifact in the catalog. */
export declare function buildAllGeneralArtifactTrees(): GeneratedArtifactTree[];
//# sourceMappingURL=echo-artifact-tree-builder.d.ts.map