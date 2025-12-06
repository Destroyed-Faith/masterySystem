/**
 * Resource Management for Mastery System
 * Handles Stones, Vitality (Health), and Stress tracking
 *
 * Stones:
 * - Spent to activate powers (1, 2, 4, 8 exponential cost)
 * - Regenerate [Mastery Rank] per round
 * - Full restore after combat
 *
 * Vitality:
 * - Health bars (Vitality × 2 boxes each)
 * - Reduced by damage, not spent
 * - Can spend 1 Stone to reactivate filled bar
 *
 * Stress:
 * - Based on Resolve + Wits
 * - Gained from fear, magic, horror
 * - Triggers Mind Saves when bars fill
 */
/**
 * Spend Stones for an actor
 * @param actor - The actor spending Stones
 * @param amount - Number of Stones to spend
 * @param reason - Description of why (for chat message)
 * @returns Success boolean
 */
export declare function spendStones(actor: any, amount: number, reason?: string): Promise<boolean>;
/**
 * Regenerate Stones at end of round
 * @param actor - The actor
 * @returns New Stone count
 */
export declare function regenerateStones(actor: any): Promise<number>;
/**
 * Restore all Stones to maximum (after combat)
 * @param actor - The actor
 */
export declare function restoreAllStones(actor: any): Promise<void>;
/**
 * Apply Vitality damage to an actor
 * Uses existing health bar system
 * @param actor - The actor taking damage
 * @param amount - Amount of damage
 * @returns Success boolean
 */
export declare function applyVitalityDamage(actor: any, amount: number): Promise<boolean>;
/**
 * Heal Vitality
 * Uses existing heal method from MasteryActor
 * @param actor - The actor being healed
 * @param amount - Amount of healing
 * @returns Success boolean
 */
export declare function healVitality(actor: any, amount: number): Promise<boolean>;
/**
 * Add Stress to an actor
 * @param actor - The actor
 * @param amount - Amount of Stress to add
 * @param reason - Description of why (for chat message)
 * @returns New Stress value
 */
export declare function addStress(actor: any, amount: number, reason?: string): Promise<number>;
/**
 * Reduce Stress for an actor
 * @param actor - The actor
 * @param amount - Amount of Stress to reduce
 * @param reason - Description of why (for chat message)
 * @returns New Stress value
 */
export declare function reduceStress(actor: any, amount: number, reason?: string): Promise<number>;
/**
 * Calculate exponential Stone cost for repeated power use
 * @param usageCount - How many times this power has been used this round (1st, 2nd, 3rd...)
 * @returns Stone cost
 */
export declare function calculateStoneCost(usageCount: number): number;
/**
 * Get resource status for display
 * @param actor - The actor
 * @returns Object with resource values
 */
export declare function getResourceStatus(actor: any): {
    stones: {
        current: number;
        maximum: number;
        regeneration: number;
        spentThisRound: number;
    };
    vitality: {
        current: number;
        maximum: number;
        currentBar: number;
    };
    stress: {
        current: number;
        maximum: number;
        percentage: number;
    };
};
//# sourceMappingURL=resources.d.ts.map