/**
 * Rules for linking / upgrading artifact evolution items on actors (Mastery Rank gates, costs).
 */
export declare const ARTIFACT_LINK_STONE_COST = 1;
export declare const ARTIFACT_UPGRADE_STONE_COST = 1;
export declare const ARTIFACT_UPGRADE_XP_COST = 8;
export declare const ARTIFACT_ULTIMATE_XP_COST = 40;
export declare const ARTIFACT_MAX_SYSTEM_LEVEL = 8;
/** Max artifact system.level the actor may reach: (MR - 1) * 2, capped at 8. MR 1 => 0 (no link / no upgrades). */
export declare function getMaxArtifactSystemLevelForMasteryRank(masteryRank: number): number;
export declare function canArtifactLink(masteryRank: number): boolean;
export declare function canUnlockArtifactUltimate(masteryRank: number): boolean;
export interface ArtifactActorProgress {
    nodeId: string;
    linked: boolean;
    ultimateUnlocked?: boolean;
}
/** Read progress from root item flag (supports legacy number = old “level” only). */
export declare function readActorArtifactProgress(flagVal: unknown, rootNodeId: string): ArtifactActorProgress;
export declare function serializeActorArtifactProgress(p: ArtifactActorProgress): Record<string, unknown>;
//# sourceMappingURL=artifact-actor-rules.d.ts.map