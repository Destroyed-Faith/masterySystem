/**
 * Rules for linking / upgrading artifact evolution items on actors (Mastery Rank gates, costs).
 *
 * Source: Players Guide 9773–9913.
 */
export declare const ARTIFACT_LINK_STONE_COST = 1;
export declare const ARTIFACT_UPGRADE_STONE_COST = 1;
export declare const ARTIFACT_UPGRADE_XP_COST = 8;
export declare const ARTIFACT_ULTIMATE_XP_COST = 40;
export declare const ARTIFACT_MAX_SYSTEM_LEVEL = 8;
/**
 * Bind-Stone schedule per Players Guide 9939: 1 Stone at Lv 1, +1 at Lv 4,
 * +1 at Lv 8 → 1 / 2 / 3 stones depending on the artifact's awakened tier.
 */
export declare function getArtifactBindStonesForLevel(level: number): number;
/**
 * Players Guide 9819–9830: total simultaneous Artifact bonds an actor may
 * sustain.  `Artifact Capacity = Mastery Rank × 2`.
 */
export declare function getArtifactCapacityForMasteryRank(masteryRank: number): number;
/** Max artifact system.level the actor may reach: (MR - 1) * 2, capped at 8. MR 1 => 0 (no link / no upgrades). */
export declare function getMaxArtifactSystemLevelForMasteryRank(masteryRank: number): number;
/**
 * Taint escalation stages (Players Guide 9876–9912).
 *
 *   • Stage 0 — Harmony   (in tune; powers continue to unlock)
 *   • Stage 1 — Irritation (sustained neglect; the artifact "goes silent")
 *   • Stage 2 — Fracture   (active disobedience; one ability blocked)
 *   • Stage 3 — Wrath      (mockery / cleansing; psychic damage, nightmares,
 *                           disadvantage on checks)
 *   • Stage 4 — Collapse   (permanent disobedience; artifact breaks for
 *                           this bearer)
 */
export type TaintStage = 0 | 1 | 2 | 3 | 4;
export interface TaintStageDefinition {
    stage: TaintStage;
    name: string;
    trigger: string;
    effect: string;
}
export declare const TAINT_STAGES: readonly TaintStageDefinition[];
export declare function getTaintStage(stage: number): TaintStageDefinition;
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