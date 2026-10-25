/**
 * Artifact Safe Haven Rest / Combat use ledgers.
 *
 * Used by Moonlight Judgment (Limited uses), Moonlight Shadow (ceil(MR/2)),
 * Dragon Head Breath (ceil(MR/2) + once per Combat), and similar Artifact Functions.
 */
export declare const ARTIFACT_REST_USES_FLAG = "artifactRestUses";
export declare const ARTIFACT_COMBAT_USES_FLAG = "artifactCombatUses";
export type ArtifactUseBucket = 'moonlightJudgment' | 'moonlightShadow' | 'dragonBreath' | string;
export declare function masteryRankOf(actor: any): number;
/** Limited Power uses per Safe Haven Rest = ceil(PL / 2). */
export declare function limitedUsesForPowerLevel(pl: number): number;
/** Moonlight Shadow / Breath Weapon rest uses = ceil(MR / 2). */
export declare function halfMasteryRankUses(masteryRank: number): number;
export declare function moonlightJudgmentMaxUses(artifactLevel: number): number;
export declare function moonlightShadowMaxUses(masteryRank: number): number;
export declare function dragonBreathRestMaxUses(masteryRank: number): number;
export declare function getArtifactRestUsesSpent(actor: any, bucket: ArtifactUseBucket): number;
export declare function getArtifactCombatUsesSpent(actor: any, bucket: ArtifactUseBucket): number;
export declare function remainingArtifactRestUses(actor: any, bucket: ArtifactUseBucket, maxUses: number): number;
export declare function canSpendArtifactRestUse(actor: any, bucket: ArtifactUseBucket, maxUses: number): boolean;
export declare function canSpendArtifactCombatUse(actor: any, bucket: ArtifactUseBucket): boolean;
export declare function spendArtifactRestUse(actor: any, bucket: ArtifactUseBucket, maxUses: number): Promise<{
    ok: true;
    spent: number;
    remaining: number;
} | {
    ok: false;
    reason: 'exhausted';
}>;
export declare function spendArtifactCombatUse(actor: any, bucket: ArtifactUseBucket): Promise<{
    ok: true;
} | {
    ok: false;
    reason: 'exhausted';
}>;
export declare function clearArtifactRestUses(actor: any): Promise<void>;
export declare function clearArtifactCombatUses(actor: any): Promise<void>;
/** Clear combat-once ledgers for every combatant on combat end/delete. */
export declare function clearArtifactCombatUsesForCombat(combat: any): Promise<void>;
/**
 * Moonlight Judgment gate: Limited uses by artifact stage (2/5/8).
 * Returns false when exhausted.
 */
export declare function assertMoonlightJudgmentAvailable(actor: any, artifactLevel: number): boolean;
export declare function spendMoonlightJudgmentUse(actor: any, artifactLevel: number): Promise<boolean>;
export declare function assertMoonlightShadowAvailable(actor: any): boolean;
export declare function spendMoonlightShadowUse(actor: any): Promise<boolean>;
/**
 * Dragon Breath: shared Damage/Ruin counter.
 * Must have remaining Safe Haven uses AND not already used this Combat.
 * Artifact Awakening must not bypass the combat-once gate.
 */
export declare function assertDragonBreathAvailable(actor: any): {
    ok: boolean;
    reason?: 'rest' | 'combat';
};
export declare function spendDragonBreathUse(actor: any): Promise<boolean>;
//# sourceMappingURL=artifact-rest-uses.d.ts.map