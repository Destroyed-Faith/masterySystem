/**
 * Echo Artifact Library seeding (GM, idempotent).
 *
 * Materialises every Echo Artifact as a full Artifact-Builder *tree* in the
 * world: a parent folder "Echo Artifacts" with one sub-folder per artifact,
 * each holding ten linked `artifact` node items (Level 1 → Level 10). These
 * are the canonical, always-present world copies that character creation hands
 * out (the actor's embedded item points back here via `evolutionRootItemId`)
 * and that players evolve along the tree.
 *
 * The trees are produced by the pure generator in
 * `../artifacts/echo-artifact-tree-builder.ts`, so the world library and the
 * shipped compendium pack are byte-for-byte the same content.
 *
 * Idempotency: an artifact is only created if no world item already carries its
 * `flags.mastery-system.echoArtifactKey`. Existing trees are never touched, so
 * per-actor progress stored on the root (`actorLevels`) is preserved.
 */
export declare const ECHO_ARTIFACT_LIBRARY_FOLDER_NAME = "Echo Artifacts";
export declare const GENERAL_ARTIFACT_LIBRARY_FOLDER_NAME = "General Artifacts";
/** Find a seeded Echo-Artifact node item by its catalog key + node flag. */
export declare function findEchoArtifactWorldItem(echoArtifactKey: string, predicate?: (item: any) => boolean): any;
/** Resolve the Level-1 *root* world item for an Echo Artifact (the tree entry point). */
export declare function findEchoArtifactRootInWorld(echoArtifactKey: string): any;
/**
 * Seed the Echo Artifact library. GM-only and idempotent.
 * @returns number of node items created across all artifacts.
 */
export declare function seedArtifactLibrary(options?: {
    force?: boolean;
}): Promise<number>;
/**
 * GM-triggered hard refresh of the whole Echo Artifact library. Re-runs the
 * seeder in upgrade mode (force = true) so every existing tree is rebuilt in
 * place from the current generator output and pushed to embedded actor copies —
 * a guaranteed manual fix when auto-detection (seedVersion) is somehow bypassed.
 */
export declare function forceRefreshEchoArtifactLibrary(): Promise<number>;
/**
 * Grant the *root* of an Echo Artifact Builder-Tree to an actor as an embedded
 * artifact item, wired to the world tree for evolution (mirrors the GM "Give
 * Artifact" flow in `artifact-awakening.ts`).
 *
 * The embedded item carries `evolutionRootItemId` / `evolutionNodeId` so the
 * Artifact Evolution dialog can walk the tree, and the world root records this
 * actor's progress in `actorLevels` (echo artifacts start inactive until activated).
 *
 * @returns the created embedded item, or `null` if the world library has not
 *          been seeded yet (caller should fall back to a single-item grant).
 */
export declare function grantEchoArtifactTreeToActor(actor: Actor, echoArtifactKey: string): Promise<any | null>;
//# sourceMappingURL=seed-artifact-library.d.ts.map