/**
 * Artifact Safe Haven Rest / Combat use ledgers.
 *
 * Moonlight Judgment Limited uses now share the global Limited charge
 * (`limited-charge.ts`). Moonlight Shadow (ceil(MR/2)), Dragon Head Breath
 * (ceil(MR/2) + once per Combat), and similar Artifact Functions still use
 * these ledgers.
 */
export declare const ARTIFACT_REST_USES_FLAG = "artifactRestUses";
export declare const ARTIFACT_COMBAT_USES_FLAG = "artifactCombatUses";
export type ArtifactUseBucket = 'moonlightJudgment' | 'moonlightShadow' | 'dragonBreath' | string;
export declare function masteryRankOf(actor: any): number;
/**
 * @deprecated Batch 5 C07 — Limited is one global charge per Safe Haven Rest
 * (see `limited-charge.ts`). Kept for callers; always returns 1.
 */
export declare function limitedUsesForPowerLevel(_pl: number): number;
/** Moonlight Shadow / Breath Weapon rest uses = ceil(MR / 2). */
export declare function halfMasteryRankUses(masteryRank: number): number;
/**
 * @deprecated Batch 5 C07 — Moonlight Judgment shares the global Limited charge.
 * Always 1 use (ignores artifact stage). Prefer `limitedChargeRemaining`.
 */
export declare function moonlightJudgmentMaxUses(_artifactLevel?: number): number;
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
 * Moonlight Judgment gate — delegates to the global Limited charge (C07).
 */
export declare function assertMoonlightJudgmentAvailable(actor: any, _artifactLevel?: number): boolean;
export declare function spendMoonlightJudgmentUse(actor: any, _artifactLevel?: number): Promise<boolean>;
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