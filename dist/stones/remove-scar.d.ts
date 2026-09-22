/**
 * Remove Scar — Daily-Reset-scoped cumulative Seal payment.
 *
 * Each unresolved Tier Seals 1 / 2 / 4 / 8 Vitality Stones (T2=3, T3=7, T4=15).
 * A Tier already resolved since the last Safe Haven Rest is not paid or
 * resolved again. Artifact Support pre-fills its printed Tier; every lower
 * unresolved Tier stays payable. Colorless Stones cannot pay this cost.
 * Stones become Sealed (not Exhausted / Burned). Each newly resolved Tier
 * recovers 1 Scarred Health Bar.
 */
import { type AttributeKey } from '../combat/action-economy.js';
export declare const REMOVE_SCAR_POWER_ID = "vitality.removeScar";
export declare const REMOVE_SCAR_RESOLVED_FLAG = "removeScarResolvedMaxTier";
/** Per-tier Seal cost: T1=1, T2=2, T3=4, T4=8. */
export declare const REMOVE_SCAR_TIER_SEAL_COST: readonly [0, 1, 2, 4, 8];
export interface RemoveScarPayment {
    unpaidTiers: number[];
    sealCost: number;
    barsRecovered: number;
    newResolvedMax: number;
}
export declare function getRemoveScarResolvedMaxTier(actor: any): number;
export declare function setRemoveScarResolvedMaxTier(actor: any, tier: number): Promise<void>;
export declare function clearRemoveScarResolvedTiers(actor: any): Promise<void>;
/**
 * Unpaid Tiers in 1..target that are not already resolved and not the
 * Support-prefilled Tier. Support still counts as newly resolved for bars.
 */
export declare function computeRemoveScarPayment(resolvedMax: number, targetTier: number, supportPrefillTier?: number): RemoveScarPayment;
/** Next activation target: Support pulls in all lower unpaid Tiers; otherwise the next unresolved Tier. */
export declare function inferRemoveScarTargetTier(resolvedMax: number, supportPrefillTier?: number): number;
export declare function countScarredHealthBars(actor: any): number;
/** Restore up to `count` most-recent Scarred bars. Returns the actor update payload. */
export declare function buildRecoverScarredBarUpdates(actor: any, count: number): Record<string, unknown>;
export declare function recoverScarredBars(actor: any, count: number): Promise<number>;
export declare function sealVitalityStones(actor: any, amount: number): Promise<boolean>;
export declare function titanScarsArtifactLevel(actor: any): number;
export declare function titanScarsAllowsTouchRemoveScar(actor: any): boolean;
/** AL9+ Titan Scars: self or one touched willing creature. Tests / no Dialog stay on self. */
export declare function resolveRemoveScarHealTarget(caster: any): Promise<any>;
export declare function applyRemoveScarEffect(actor: any, targetTier: number, healTarget?: any): Promise<RemoveScarPayment>;
export declare function payAndApplyRemoveScar(actor: any, opts?: {
    colorlessSpent?: number;
    supportPrefillTier?: number;
    healTarget?: any;
    skipTargetPrompt?: boolean;
    /** When set, activate this Tier instead of inferring the next / Support target. */
    targetTier?: number;
}): Promise<boolean>;
/** Attribute this power may spend. Colorless is never legal. */
export declare function removeScarSpendableAttributes(): AttributeKey[];
//# sourceMappingURL=remove-scar.d.ts.map