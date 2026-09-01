/**
 * Audit Artifact / Echo-Artifact Stone Power Supports against T2-start
 * abilities (Tier 1 does not exist).
 *
 * Support must never activate Tier 2 for these abilities. Tables that begin
 * support at T2 (Elorian Focus / Ringchain Kept from Sight, and any matching
 * General Artifact) are flagged for a manual Level Progression review —
 * this file does not invent replacement values.
 */
export interface Tier2StartSupportFollowUp {
    artifactKey: string;
    artifactName: string;
    stonePowerId: string;
    unlockLevel: number;
    firstPrefillTier: number;
    firstEffectiveTier: number;
    reason: string;
}
/** @deprecated Use Tier2StartSupportFollowUp — T1 is not a blank placeholder. */
export type BlankT1SupportFollowUp = Tier2StartSupportFollowUp;
export declare function auditTier2StartStonePowerSupports(): Tier2StartSupportFollowUp[];
/** @deprecated Use auditTier2StartStonePowerSupports */
export declare const auditBlankT1StonePowerSupports: typeof auditTier2StartStonePowerSupports;
//# sourceMappingURL=artifact-stone-support-audit.d.ts.map