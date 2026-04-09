/**
 * Propagate merged artifact profile + powers from a parent item to all descendants in the same folder.
 * Used by Artifact Builder and Node Editor after saves.
 */
/**
 * Recursively merge parent → children (direct childIds only per step), preserving child damage/range and extra innates/specials/powers.
 */
export declare function syncArtifactInheritedFromParent(parentItem: Item): Promise<void>;
//# sourceMappingURL=artifact-folder-sync.d.ts.map