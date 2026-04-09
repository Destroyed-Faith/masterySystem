/**
 * Rules for linking / upgrading artifact evolution items on actors (Mastery Rank gates, costs).
 */
export const ARTIFACT_LINK_STONE_COST = 1;
export const ARTIFACT_UPGRADE_STONE_COST = 1;
export const ARTIFACT_UPGRADE_XP_COST = 8;
export const ARTIFACT_ULTIMATE_XP_COST = 40;
export const ARTIFACT_MAX_SYSTEM_LEVEL = 8;
/** Max artifact system.level the actor may reach: (MR - 1) * 2, capped at 8. MR 1 => 0 (no link / no upgrades). */
export function getMaxArtifactSystemLevelForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    if (mr <= 1)
        return 0;
    return Math.min(ARTIFACT_MAX_SYSTEM_LEVEL, (mr - 1) * 2);
}
export function canArtifactLink(masteryRank) {
    return getMaxArtifactSystemLevelForMasteryRank(masteryRank) >= 2;
}
export function canUnlockArtifactUltimate(masteryRank) {
    return Math.max(1, Math.floor(Number(masteryRank) || 1)) >= 6;
}
/** Read progress from root item flag (supports legacy number = old “level” only). */
export function readActorArtifactProgress(flagVal, rootNodeId) {
    if (flagVal && typeof flagVal === 'object' && !Array.isArray(flagVal) && typeof flagVal.nodeId === 'string') {
        const o = flagVal;
        return {
            nodeId: String(o.nodeId || rootNodeId),
            linked: Boolean(o.linked),
            ultimateUnlocked: Boolean(o.ultimateUnlocked)
        };
    }
    if (typeof flagVal === 'number' && flagVal >= 1) {
        return { nodeId: rootNodeId, linked: false, ultimateUnlocked: false };
    }
    return { nodeId: rootNodeId, linked: false, ultimateUnlocked: false };
}
export function serializeActorArtifactProgress(p) {
    const o = {
        nodeId: p.nodeId,
        linked: p.linked
    };
    if (p.ultimateUnlocked)
        o.ultimateUnlocked = true;
    return o;
}
//# sourceMappingURL=artifact-actor-rules.js.map