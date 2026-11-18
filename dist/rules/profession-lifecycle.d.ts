/**
 * Profession remove / respec / refund policy.
 *
 * Free starting Professions are never cashed out for XP.
 * Rank-2 undo (remove or replace) is GM-led while no XP is invested.
 * Once XP is invested into a starting slot, that choice is locked.
 * XP-learned Professions may still be removed for a refund of invested XP.
 */
import { type SpecializationRecord } from './specializations.js';
export interface ProfessionLifecycleActorContext {
    /** False while character creation is still open. */
    creationComplete: boolean;
    isGM: boolean;
    /** World setting: players may Rank-2-respec starting slots with no invested XP. */
    playerRespecEnabled?: boolean;
}
export interface ProfessionDeletePlan {
    ok: boolean;
    error?: string;
    /** XP to refund (never includes the free Rank-2 starting base). */
    refund: number;
    /** Why this delete is allowed (for confirm copy / tests). */
    mode?: 'creation-reselect' | 'learned-refund' | 'gm-grant-clear' | 'gm-rank2-clear';
    spec?: SpecializationRecord;
}
export interface ProfessionRespecEligibility {
    ok: boolean;
    error?: string;
    /** Player self-service (requires world setting). */
    playerAllowed: boolean;
    /** GM Rank-2 undo / replace. */
    gmAllowed: boolean;
    spec?: SpecializationRecord;
}
/** True when this row is still an uninvested Rank-2 (or lower) free starting Profession. */
export declare function isUninvestedStartingProfession(spec: SpecializationRecord): boolean;
/** True when a starting Profession has taken XP (or risen past free Rank 2). */
export declare function isLockedStartingProfession(spec: SpecializationRecord): boolean;
/**
 * Stamp missing startingSlot flags, then plan a delete under lifecycle rules.
 */
export declare function planProfessionDelete(specs: SpecializationRecord[], specId: string, ctx: ProfessionLifecycleActorContext): ProfessionDeletePlan;
/**
 * Who may replace a Profession in place (no XP change).
 * GM: uninvested Rank-2 starting slots always.
 * Player: same, only when Allow Profession Respec (Beta) is on.
 */
export declare function planProfessionRespecEligibility(specs: SpecializationRecord[], specId: string, ctx: ProfessionLifecycleActorContext): ProfessionRespecEligibility;
/** Sheet helper: whether the delete control should render. */
export declare function canShowProfessionDelete(specs: SpecializationRecord[], specId: string, ctx: ProfessionLifecycleActorContext): boolean;
/** Sheet helper: whether the respec control should render. */
export declare function canShowProfessionRespec(specs: SpecializationRecord[], specId: string, ctx: ProfessionLifecycleActorContext): boolean;
//# sourceMappingURL=profession-lifecycle.d.ts.map