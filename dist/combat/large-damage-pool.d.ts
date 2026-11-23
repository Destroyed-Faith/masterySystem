/**
 * Large Damage Pools (Core v0.9.9.6, Damage Roll).
 *
 * If 40 or more Damage Dice remain after Damage Negation, the roller may count
 * each die as 5 instead of rolling. Maximization still counts each die as 8.
 * A damage floor above 5 (Mark, Brutal Impact) counts each die at that floor.
 */
export declare const LARGE_DAMAGE_POOL_MIN_DICE = 40;
export declare const LARGE_DAMAGE_POOL_DIE_VALUE = 5;
/** True when the remaining pool (after Damage Negation) may be counted instead of rolled. */
export declare function isLargeDamagePool(remainingDice: number, opts?: {
    maximized?: boolean;
}): boolean;
/** Replace every d8 term with its counted value (5 per die); flat parts stay. */
export declare function countLargeDamagePoolFormula(formula: string): string;
/**
 * Roll-shaped stand-in for `n` counted dice, so Mark / Brutal Impact floors
 * (which read die results) raise each counted 5 to the floor value.
 */
export declare function countedPoolFloorSource(n: number): {
    terms: Array<{
        faces: number;
        results: Array<{
            result: number;
            active: boolean;
        }>;
    }>;
};
/** Value one counted die contributes after floors (Maximization wins with 8). */
export declare function largeDamagePoolDieValue(opts?: {
    maximized?: boolean;
    floor?: number;
}): number;
//# sourceMappingURL=large-damage-pool.d.ts.map