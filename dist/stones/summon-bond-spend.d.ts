/**
 * Controlled spend helpers for the Summon Bond Ritual UI.
 * Purchase counts are never taken from free-text number fields.
 */
import { type SummonBondUpgradeSpend, type SummonMovementMode } from './summon-bond-rules.js';
export type BondSpendField = 'attackPurchases' | 'damagePurchases' | 'movementPurchases' | 'extraAttackPurchases' | 'skillDicePurchases' | 'additionalBodies' | 'specialValuePurchases';
export type BodySpendField = 'hpPurchases' | 'armorPurchases' | 'evadePurchases';
export type SpendClampContext = {
    boundStoneCount: number;
    bonusTokens: number;
    movementMode: SummonMovementMode | string;
    selectedSkills?: string[];
    ownerSkillRatings?: Record<string, number>;
    ownerMasteryRank?: number;
    /** Detected Artifact Summon Stone bonus cap (multiple of 4). */
    maxBonusTokens?: number;
    skillDiceAlloc?: Record<string, number>;
};
/** parseInt-safe: NaN, negative, Infinity, and non-numeric values become 0. */
export declare function safePurchaseInt(raw: unknown, max?: number): number;
export declare function isAbsurdPurchaseRaw(raw: unknown, max?: number): boolean;
/** Artifact bonus is always a non-negative multiple of 4, capped. */
export declare function sanitizeBonusTokens(raw: unknown, maxBonus?: number): number;
export declare function isIllegalBonusTokens(raw: unknown, maxBonus: number, boundStoneCount: number): boolean;
export declare function cloneSpend(spend: SummonBondUpgradeSpend): SummonBondUpgradeSpend;
export declare function sanitizeSpendNumbers(spend: SummonBondUpgradeSpend): SummonBondUpgradeSpend;
export declare function maxAffordablePurchases(remainingTokens: number, costPer: number, hardCap: number): number;
/** Max Skill Dice purchases from remaining tokens and selected-skill owner ratings. */
export declare function skillDicePurchaseCap(selectedSkills: string[], ratings: Record<string, number> | undefined, remainingIfSkillPurchasesZero: number, ownerMasteryRank?: number): number;
export declare function ruleMaxForBondField(field: BondSpendField, ctx: SpendClampContext): number;
export declare function applyBondFieldDelta(spend: SummonBondUpgradeSpend, field: BondSpendField, delta: number, ctx: SpendClampContext): SummonBondUpgradeSpend | null;
export declare function applyBodyFieldDelta(spend: SummonBondUpgradeSpend, bodyIndex: number, field: BodySpendField, delta: number, ctx: SpendClampContext): SummonBondUpgradeSpend | null;
export declare function applySkillDiceAllocDelta(alloc: Record<string, number>, skill: string, delta: number, ownerRating: number, purchasedTotal: number): Record<string, number> | null;
export declare function applyBonusTokenDelta(currentBonus: number, deltaStones: number, maxBonus: number, boundStoneCount: number): number | null;
export type IllegalSpendReport = {
    illegal: boolean;
    reasons: string[];
    absurd: boolean;
    overBudget: boolean;
};
export declare function inspectBondSpend(spend: SummonBondUpgradeSpend, ctx: SpendClampContext): IllegalSpendReport;
/** Reset numeric purchases to 0. Keeps Special Access flag and first-body identity data. */
export declare function resetIllegalPurchases(spend: SummonBondUpgradeSpend): SummonBondUpgradeSpend;
export type StepperView = {
    field: string;
    value: number;
    cost: number;
    effect: string;
    canMinus: boolean;
    canPlus: boolean;
    bodyIndex?: number;
};
export declare function bondStepperView(spend: SummonBondUpgradeSpend, field: BondSpendField, ctx: SpendClampContext, effect: string): StepperView;
export declare function bodyStepperView(spend: SummonBondUpgradeSpend, bodyIndex: number, field: BodySpendField, ctx: SpendClampContext, effect: string): StepperView;
/**
 * Count Artifact Summon Stones on the owner (equipped/owned artifact items).
 * Looks at explicit numeric fields and names matching "Summon Stone".
 */
export declare function countArtifactSummonStones(actor: any): number;
export declare function maxAssignableArtifactBonusTokens(actor: any, bondId: string, otherBonds: Array<{
    id: string;
    bonusTokens?: number;
}>): number;
//# sourceMappingURL=summon-bond-spend.d.ts.map