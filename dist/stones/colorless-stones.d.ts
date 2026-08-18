/**
 * Temporary Colorless Stones — Initiative Exchange and Absorption.
 *
 * Initiative Exchange: convert remaining Initiative into Temporary Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They may pay any part of
 * an unlocked Stone Ability's normal cost. When spent they disappear (they
 * are never Exhausted, burned, sealed, or bound) and leftover stones vanish
 * at the end of combat.
 */
export declare const COLORLESS_STONE_ATTR = "colorless";
export declare const COLORLESS_GEM_STYLE: {
    fill: string;
    stroke: string;
};
export declare function getMasteryRank(actor: any): number;
/** Initiative spent to buy one Temporary Colorless Stone. */
export declare function colorlessStoneInitiativeCost(masteryRank: number): number;
export declare function getTempColorlessStones(actor: any): number;
export declare function setTempColorlessStones(actor: any, count: number): Promise<void>;
export declare function addTempColorlessStones(actor: any, amount: number): Promise<number>;
export declare function spendTempColorlessStones(actor: any, amount: number): Promise<boolean>;
export declare function clearTempColorlessStones(actor: any): Promise<void>;
export declare function isInitiativeBoostUsedThisCombat(combatant: any): boolean;
export declare function markInitiativeBoostUsedThisCombat(combatant: any): Promise<void>;
/** Initiative Boost tier scale: 1 / 2 / 4 / 8 × Mastery Rank (then keep doubling). */
export declare function initiativeBoostAmount(tier: number, masteryRank: number): number;
export declare function maxConvertibleColorlessStones(initiative: number, masteryRank: number): number;
export declare function convertInitiativeToColorlessPreview(initiative: number, stones: number, masteryRank: number): {
    stones: number;
    initiativeCost: number;
    remainingInitiative: number;
};
export declare function convertInitiativeToColorlessStones(actor: any, combatant: any, stones: number): Promise<{
    stones: number;
    remainingInitiative: number;
} | null>;
export declare function clearColorlessStonesForCombat(combat: any): Promise<void>;
//# sourceMappingURL=colorless-stones.d.ts.map