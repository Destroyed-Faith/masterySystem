/**
 * Conditions / Status Effects System for Mastery System
 * Handles applying, tracking, and removing conditions like Poisoned, Bleeding, Stunned, etc.
 */
/**
 * Condition data structure
 */
export interface ConditionData {
    name: string;
    value: number;
    diminishing: boolean;
    duration: {
        type: 'rounds' | 'scene' | 'permanent';
        remaining?: number;
    };
    save: {
        type: 'body' | 'mind' | 'spirit';
        tn: number;
        frequency: 'eachRound' | 'endOfScene' | 'none';
    };
    effect: string;
    source?: string;
}
/**
 * Apply a condition to an actor
 * Creates a condition item and attaches it to the actor
 *
 * @param target - The actor to apply condition to
 * @param conditionData - Condition configuration
 * @returns The created condition item
 */
export declare function applyCondition(target: any, conditionData: ConditionData): Promise<any>;
/**
 * Remove a condition from an actor
 *
 * @param target - The actor
 * @param conditionName - Name of condition to remove
 */
export declare function removeCondition(target: any, conditionName: string): Promise<void>;
/**
 * Update conditions at start of round (decrement duration, apply effects, etc.)
 * Called by combat hooks
 *
 * @param actor - The actor whose conditions to update
 */
export declare function updateConditionsForRound(actor: any): Promise<void>;
/**
 * Get all active conditions on an actor
 *
 * @param actor - The actor
 * @returns Array of condition items
 */
export declare function getActiveConditions(actor: any): any[];
/**
 * Check if actor has a specific condition
 *
 * @param actor - The actor
 * @param conditionName - Name of condition
 * @returns True if actor has the condition
 */
export declare function hasCondition(actor: any, conditionName: string): boolean;
/**
 * Calculate save TN based on attacker's Mastery Rank
 * Formula: 12 * Mastery Rank
 * M1 = 12, M2 = 24, M3 = 36, M4 = 48, etc.
 *
 * @param masteryRank - Attacker's Mastery Rank
 * @returns Save TN
 */
export declare function calculateSaveTN(masteryRank: number): number;
//# sourceMappingURL=conditions.d.ts.map