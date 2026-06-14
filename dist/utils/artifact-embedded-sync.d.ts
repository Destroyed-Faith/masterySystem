/**
 * Push a world artifact tree node (name, img, system) to all embedded actor copies
 * that reference the same evolution root + node id (matches artifact-evolution onUpgrade).
 */
/**
 * Updates every embedded Item on actors where evolutionRootItemId matches the tree root
 * and evolutionNodeId matches this world item's node.
 * @returns Number of embedded documents updated.
 */
export declare function pushWorldArtifactNodeToEmbeddedActors(worldItem: Item): Promise<number>;
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
export declare function resyncArtifactTreeToAllActors(worldItem: Item): Promise<{
    actors: number;
    items: number;
}>;
//# sourceMappingURL=artifact-embedded-sync.d.ts.map