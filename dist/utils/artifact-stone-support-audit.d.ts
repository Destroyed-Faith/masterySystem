/**
 * Audit Artifact / Echo-Artifact Stone Power Supports against blank-T1 ramps.
 *
 * Support must never activate the first effective tier. Tables that begin
 * support at that tier (Elorian Focus / Ringchain Kept from Sight, and any
 * matching General Artifact) are flagged for a manual Level Progression
 * review — this file does not invent replacement values.
 */
export interface BlankT1SupportFollowUp {
    artifactKey: string;
    artifactName: string;
    stonePowerId: string;
    unlockLevel: number;
    firstPrefillTier: number;
    firstEffectiveTier: number;
    reason: string;
}
export declare function auditBlankT1StonePowerSupports(): BlankT1SupportFollowUp[];
//# sourceMappingURL=artifact-stone-support-audit.d.ts.map