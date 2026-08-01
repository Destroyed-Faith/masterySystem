/**
 * Summons V2 — universal Summon Bond rules (Players Guide / agent.md v0.9.8).
 *
 * Tokens = Bound Stones × 8 (first stone included).
 * One Movement Mode (8–16 m). Bond- vs Body-scoped upgrades.
 * No Familiar / Companion / Host chassis.
 */
export type SummonMovementMode = 'walking' | 'flying' | 'swimming' | 'climbing';
export type SharedSenseGroup = 'sight' | 'hearing' | 'tasteSmell' | 'touchPressure';
export declare const SUMMON_MOVEMENT_MODES: {
    value: SummonMovementMode;
    label: string;
}[];
export declare const SHARED_SENSE_GROUPS: {
    value: SharedSenseGroup;
    label: string;
}[];
/** Approved Summon Skills only (PG). */
export declare const SUMMON_SKILL_IDS: readonly ["perception", "investigation", "tracking", "survival", "navigation", "weatherSense", "stealth", "concealment", "athletics", "acrobatics"];
export type SummonSkillId = (typeof SUMMON_SKILL_IDS)[number];
export declare const BASE_SUMMON: {
    readonly hp: 10;
    readonly armor: 0;
    readonly evade: 4;
    readonly attackDice: 2;
    readonly damageDice: 1;
    readonly movementM: 8;
    readonly summonAttacks: 1;
};
export declare const SUMMON_CAPS: {
    readonly maxMovementM: 16;
    readonly maxSummonAttacks: 3;
    readonly maxSpecialValue: 4;
    readonly tokensPerStone: 8;
    readonly extraBodyTokenCost: 2;
    readonly sharedSenseTokenCost: 2;
    readonly skillDiceTokenCost: 1;
    readonly skillDicePerPurchase: 2;
    readonly extraAttackTokenCost: 8;
    readonly specialAccessTokenCost: 4;
    readonly specialValueTokenCost: 2;
    readonly hpTokenCost: 1;
    readonly hpGain: 20;
    readonly armorTokenCost: 2;
    readonly armorGain: 4;
    readonly evadeTokenCost: 2;
    readonly evadeGain: 4;
    readonly attackTokenCost: 2;
    readonly attackDiceGain: 2;
    readonly damageTokenCost: 2;
    readonly damageDiceGain: 1;
    readonly movementTokenCost: 1;
    readonly movementGainM: 2;
};
export type SummonBodyUpgradeSpend = {
    hpPurchases: number;
    armorPurchases: number;
    evadePurchases: number;
    sharedSenses: SharedSenseGroup[];
    /** Canonical powers: token cost already computed. */
    powerTokenCosts: number[];
};
export type SummonBondUpgradeSpend = {
    attackPurchases: number;
    damagePurchases: number;
    movementPurchases: number;
    extraAttackPurchases: number;
    specialAccess: boolean;
    specialValuePurchases: number;
    skillDicePurchases: number;
    /** Number of additional bodies beyond the first (each costs 2 tokens for the body slot). */
    additionalBodies: number;
    bodies: SummonBodyUpgradeSpend[];
};
export declare function summonTokensFromStones(boundStoneCount: number, bonusTokens?: number): number;
/** Selected skill slots by Bound Stones (bonus tokens do not increase this). */
export declare function summonSkillSlots(boundStoneCount: number): number;
/** Max Power Level by owner Mastery Rank. */
export declare function maxSummonPowerLevel(ownerMasteryRank: number): number;
/** Power Token Cost = ceil(PP / 10). */
export declare function powerTokenCostFromPp(pp: number): number;
/** Standard reference costs when PP is not available. */
export declare function standardPowerTokenCost(powerType: 'active' | 'passive' | 'reaction' | 'activeBuff' | 'movement', powerLevel: number, movementPp?: number): number;
export declare function legacyMovementTypeToMode(raw: string | undefined): SummonMovementMode;
export type ComputedSummonBody = {
    hp: number;
    armor: number;
    evade: number;
    sharedSenses: SharedSenseGroup[];
    powerTokensSpent: number;
};
export type ComputedSummonBond = {
    attackDice: number;
    damageDice: number;
    movementM: number;
    summonAttacks: number;
    specialValue: number;
    hasSpecialAccess: boolean;
    skillDiceTotal: number;
    bodyCount: number;
    bodies: ComputedSummonBody[];
    tokensSpent: number;
    tokensAvailable: number;
    tokensRemaining: number;
    errors: string[];
    warnings: string[];
};
export declare function computeSummonBond(opts: {
    boundStoneCount: number;
    bonusTokens?: number;
    movementMode: SummonMovementMode;
    spend: SummonBondUpgradeSpend;
}): ComputedSummonBond;
/** Default empty spend for a freshly created bond (tokens unspent). */
export declare function emptyBondSpend(bodyCount?: number): SummonBondUpgradeSpend;
//# sourceMappingURL=summon-bond-rules.d.ts.map