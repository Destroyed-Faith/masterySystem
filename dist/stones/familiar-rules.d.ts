/**
 * Familiar / Summons rules: canonical progression tables (character sheet) and validation.
 */
export type MovementType = 'ground' | 'flying';
export type UpgradeCategory = 'hp' | 'armor' | 'evade' | 'attack' | 'damage' | 'movement';
/** Select options for the Familiar builder UI. */
export declare const FAMILIAR_UPGRADE_CATEGORY_OPTIONS: {
    value: UpgradeCategory;
    label: string;
}[];
export type SharedSenseGroup = 'sight' | 'hearing' | 'tasteSmell' | 'touchPressure';
export type UpgradeStoneInput = {
    id: string;
    picks: [UpgradeCategory, UpgradeCategory];
};
export type FamiliarComputationInput = {
    familiarName: string;
    movementType: MovementType;
    /** Each entry is one additional Bound Stone with exactly two distinct upgrade picks. */
    upgradeStones: UpgradeStoneInput[];
    /** Shared Sense groups (each costs one Bound Stone, no upgrade picks). */
    sharedSenses: SharedSenseGroup[];
    masteryRank: number;
};
/** Base + 8 upgrade tiers — index = number of category upgrades taken. */
export declare const FAMILIAR_HP_BY_TIER: readonly [10, 22, 34, 46, 58, 70, 82, 94, 106];
export declare const FAMILIAR_ARMOR_BY_TIER: readonly [0, 3, 6, 9, 12, 15, 18, 21, 24];
export declare const FAMILIAR_EVADE_BY_TIER: readonly [4, 8, 12, 16, 20, 24, 28, 32, 36];
/** Attack: dice count for Xd8 */
export declare const FAMILIAR_ATTACK_DICE_BY_TIER: readonly [2, 4, 6, 8, 10, 12, 14, 16, 18];
export declare const FAMILIAR_DAMAGE_DICE_BY_TIER: readonly [1, 2, 3, 4, 5, 6, 7, 8, 9];
export declare const FAMILIAR_GROUND_MOVEMENT_BY_TIER: readonly [8, 12, 16, 20, 24, 28, 32, 36, 40];
export declare const FAMILIAR_FLYING_MOVEMENT_BY_TIER: readonly [4, 6, 8, 10, 12, 14, 16, 18, 20];
export type FamiliarFinalStats = {
    hp: number;
    armor: number;
    evade: number;
    attack: string;
    damage: string;
    movementM: number;
};
export type FamiliarSize = 'Tiny' | 'Small' | 'Medium' | 'Large';
export type FamiliarResult = {
    familiarName: string;
    movementType: MovementType;
    totalBoundStones: number;
    /** Count of additional upgrade Stones (not including base). */
    upgradeStones: number;
    sharedSenseStones: number;
    sharedSenses: SharedSenseGroup[];
    hpUpgrades: number;
    armorUpgrades: number;
    evadeUpgrades: number;
    attackUpgrades: number;
    damageUpgrades: number;
    movementUpgrades: number;
    size: FamiliarSize;
    finalStats: FamiliarFinalStats;
    validationWarnings: string[];
};
/**
 * Players Guide 9701–9712 caps:
 *   • Stones per Familiar = `Mastery Rank × 4`
 *   • Total Familiars per actor = `Mastery Rank × 4`
 */
export declare function getMaxStonesPerFamiliar(masteryRank: number): number;
export declare function getMaxFamiliarCount(masteryRank: number): number;
/** Read-only reference grid for the Summons tab (9 columns: base + 8 upgrades). */
export declare function getFamiliarProgressionTableRows(): {
    label: string;
    cells: string[];
}[];
export declare function buildFamiliarResult(input: FamiliarComputationInput): FamiliarResult;
//# sourceMappingURL=familiar-rules.d.ts.map