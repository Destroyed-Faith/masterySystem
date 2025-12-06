/**
 * Utilities Duration & Limit System for Mastery System
 *
 * Rules from rulebook (Lines 4705-4733):
 *
 * Utilities:
 * - Cost: 1 Attack Action
 * - Roll: Usually none, effect applies automatically
 * - Duration: Instant to 2-n rounds, then may be reactivated
 * - LIMIT: You cannot have the same Utility effect active twice
 *
 * This enforces the "same utility cannot be active twice" rule
 */
/**
 * Active utility tracking
 */
export interface ActiveUtility {
    id: string;
    utilityItemId: string;
    utilityName: string;
    startRound: number;
    duration: number;
    endsOnRound: number;
    targetId?: string;
}
/**
 * Get active utilities for an actor
 */
export declare function getActiveUtilities(actor: any): ActiveUtility[];
/**
 * Check if a utility is already active
 */
export declare function isUtilityActive(actor: any, utilityItemId: string): boolean;
/**
 * Activate a utility
 * Enforces the "cannot have same utility active twice" rule
 *
 * @param actor - The actor using the utility
 * @param utilityItem - The utility item
 * @param targetActor - Optional target actor
 * @returns Success status
 */
export declare function activateUtility(actor: any, utilityItem: any, targetActor?: any): Promise<boolean>;
/**
 * Decrement utility durations at the start of each round
 * Removes expired utilities
 */
export declare function decrementUtilityDurations(actor: any): Promise<void>;
/**
 * Remove a specific utility (for manual cancellation)
 */
export declare function removeUtility(actor: any, utilityId: string): Promise<void>;
/**
 * Get utility status summary
 */
export declare function getUtilityStatusSummary(actor: any): string[];
//# sourceMappingURL=utilities.d.ts.map