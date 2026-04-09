/**
 * Propagate merged artifact profile + powers from a parent item to all descendants in the same folder.
 * Used by Artifact Builder and Node Editor after saves.
 */
/**
 * Recursively merge parent → children (direct childIds only per step); weapon damage/range follow the parent; innates/specials/powers merge as in lineage helpers.
 */
export declare function syncArtifactInheritedFromParent(parentItem: Item): Promise<void>;
//# sourceMappingURL=artifact-folder-sync.d.ts.map