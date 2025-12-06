/**
 * Roll & Keep d8 System for Mastery System
 *
 * Core dice rolling mechanic:
 * - Roll X d8 (pool = Attribute)
 * - Keep K dice (keep = Mastery Rank)
 * - 8s explode (roll again and add)
 * - Advantage: reroll 1s once
 * - Disadvantage: only highest die explodes
 * - Raises: declared before roll, each adds +4 to TN
 */
/**
 * Individual die result with explosion tracking
 */
export interface RollDieResult {
    index: number;
    rolls: number[];
    total: number;
    exploded: boolean;
    rerolled: boolean;
}
/**
 * Options for Roll&Keep d8 roll
 */
export interface RollKeepOptions {
    dice: number;
    keep: number;
    flat?: number;
    advantage?: boolean;
    disadvantage?: boolean;
    tn?: number;
    declaredRaises?: number;
    label?: string;
    flavor?: string;
}
/**
 * Result of a Roll&Keep d8 roll
 */
export interface RollKeepResult {
    allDice: RollDieResult[];
    keptDice: number[];
    droppedDice: number[];
    total: number;
    keptSum: number;
    flatBonus: number;
    tn?: number;
    baseTN?: number;
    declaredRaises: number;
    success?: boolean;
    margin?: number;
    formula: string;
    explodedCount: number;
    advantageUsed: boolean;
    disadvantageUsed: boolean;
}
/**
 * Roll & Keep d8 with exploding dice, advantage/disadvantage, and TN evaluation
 *
 * @param actor - The actor making the roll (for context)
 * @param options - Roll configuration
 * @returns Roll result with all details
 */
export declare function rollKeepD8(actor: any, options: RollKeepOptions): Promise<RollKeepResult>;
/**
 * Roll damage dice (non-exploding)
 * @param formula - Damage formula (e.g., "2d8" or "3d8+4")
 * @param bonusDice - Extra damage dice from Raises
 * @returns Object with rolls and total
 */
export declare function rollDamage(formula: string, bonusDice?: number): Promise<{
    rolls: number[];
    total: number;
    formula: string;
}>;
/**
 * Calculate how many 8s were rolled in damage (for armor penetration rule)
 * "If damage ≤ 0 after armor, still take 1 damage per 8 rolled"
 */
export declare function count8sInDamage(rolls: number[]): number;
//# sourceMappingURL=rollKeep.d.ts.map