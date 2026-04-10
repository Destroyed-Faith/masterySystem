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
//# sourceMappingURL=artifact-embedded-sync.d.ts.map