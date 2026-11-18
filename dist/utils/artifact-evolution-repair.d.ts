/**
 * Artifact evolution diagnose / sync / XP repair helpers.
 *
 * Fixes desync between embedded `system.level` and the world tree node
 * behind `evolutionNodeId`, and lets GMs refund invested XP safely.
 */
/** World tree node for an embedded artifact, if linked. */
export declare function resolveEmbeddedArtifactWorldNode(emb: any): any | null;
/**
 * Effective evolution level: prefer the world node's `system.level`,
 * then the embedded item level.
 */
export declare function resolveEffectiveArtifactLevel(emb: any): number;
/** Ensure copied system data carries the world node's level fields. */
export declare function normalizeArtifactSystemLevel(system: Record<string, unknown>, worldLevel: number): Record<string, unknown>;
export interface ArtifactEvolutionDiagnosis {
    ok: boolean;
    name: string;
    embedLevel: number;
    worldLevel: number | null;
    effectiveLevel: number;
    desync: boolean;
    evolutionRootItemId: string;
    evolutionNodeId: string;
    worldNodeResolved: boolean;
    childCount: number;
    linked: boolean;
    bindingKind: string;
    echoLocked: boolean;
    upgradeBlockedReason: string;
    notes: string[];
    summary: string;
}
/** Read-only diagnose of embed vs world evolution state. */
export declare function diagnoseArtifactEvolution(actor: any, emb: any): ArtifactEvolutionDiagnosis;
/**
 * History spends for this artifact that raised level above the live effective level
 * (XP paid, evolution/data no longer reflects it).
 */
export declare function listOrphanArtifactHistorySpends(actor: any, emb: any): Array<{
    from: number;
    to: number;
    amount: number;
    note: string;
    key: string;
}>;
export declare function planOrphanArtifactRefundXp(actor: any, emb: any): number;
/** Credit XP for orphan artifact spends without changing the tree node. */
export declare function refundOrphanArtifactSpends(actor: any, emb: any): Promise<{
    ok: boolean;
    refunded: number;
    error?: string;
}>;
/**
 * Reset evolution to Level 1 and refund XP.
 * If live evolution is still > 1: tree downgrade (banded refund).
 * If already at L1 but history still shows spends: orphan refund only.
 */
export declare function resetArtifactToLevel1WithRefund(actor: any, emb: any): Promise<{
    ok: boolean;
    refunded: number;
    error?: string;
}>;
/**
 * Sync embed from world node and force level fields to match the world node.
 */
export declare function syncEmbeddedArtifactFromWorldNodeNormalized(emb: any, actor: any): Promise<boolean>;
/**
 * Delete a non-echo artifact after refunding invested + orphan XP.
 */
export declare function deleteArtifactWithXpRefund(actor: any, emb: any): Promise<{
    ok: boolean;
    refunded: number;
    error?: string;
}>;
//# sourceMappingURL=artifact-evolution-repair.d.ts.map