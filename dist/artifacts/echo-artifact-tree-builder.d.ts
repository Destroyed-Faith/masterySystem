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
import type { ArtifactBaseValueType } from '../types/item.js';
import type { EchoArtifactDefinition } from '../utils/echo-artifacts.js';
/**
 * Content version of the generated trees. Bump this whenever the generator's
 * output (base values, powers, slot/profile, etc.) changes so the world seeder
 * can detect stale library copies and refresh them in place.
 */
/** Bumped 2026-10-25: re-queue seed-57 embeds so Breath Melee AoE content pushes (was stamped without combat-usable type). */
export declare const ECHO_ARTIFACT_SEED_VERSION = 58;
/** A single Base Value slot on an echo artifact, with an exact per-level value. */
interface BaseValueSpec {
    slot: 'a' | 'b' | 'c';
    type: ArtifactBaseValueType;
    label: string;
    /** Artifact level at which this slot unlocks (a=1, b=4, c=7 per spec). */
    unlock: number;
    /** Exact resolved value at the given artifact level. */
    valueAt: (level: number) => number | string;
    note?: string;
    /** Light / Medium / Heavy — `valueAt` returns artifact bonus only; mundane base added at runtime. */
    armorWeightClass?: 'light' | 'medium' | 'heavy';
    /** @deprecated Printed per-level Evade on the Armor row — Evade is now its own slot-A Base Value. */
    evadeModifierAt?: (level: number) => number;
    /** Printed per-level Initiative drawback override. */
    initiativeModifierAt?: (level: number) => number;
}
/**
 * Per-echo-artifact Base Value tables. The numbers are the system's canonical
 * baselines (see `artifact-base-derive.ts` / Artefacts.md). Echo body armor
 * stores the artifact bonus only; mundane Light/Medium/Heavy base is added at runtime.
 * Every Artifact Body Armor also stores Final Evade as a second slot-A Base Value.
 */
/** Exported for alignment tests / audits — exact per-level Base Value tables. */
export declare const BASE_VALUE_TABLES: Record<string, BaseValueSpec[]>;
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
export {};
//# sourceMappingURL=echo-artifact-tree-builder.d.ts.map