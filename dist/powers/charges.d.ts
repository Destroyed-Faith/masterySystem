/**
 * Charged Powers & Mastery Charges System
 *
 * Rules:
 * - Mastery Charges = Mastery Rank per day
 * - Refresh at dawn or after long rest
 * - Powers with (Charged) tag consume 1 Charge
 * - Max 1 Charged Power per round
 * - Can burn 1 Stone out of combat → +2 temporary Charges (until dawn)
 */
/**
 * Get current charges for an actor
 */
export declare function getCharges(actor: any): {
    current: number;
    maximum: number;
    temporary: number;
};
/**
 * Spend a Mastery Charge
 *
 * @param actor - The actor spending the charge
 * @param powerName - Name of the power being activated
 * @returns True if charge was spent successfully
 */
export declare function spendCharge(actor: any, powerName?: string): Promise<boolean>;
/**
 * Restore all Mastery Charges (long rest or dawn)
 */
export declare function restoreCharges(actor: any): Promise<void>;
/**
 * Burn a Stone to gain +2 temporary Charges (out of combat only)
 * The Stone is lost until dawn
 *
 * @param actor - The actor burning a stone
 * @returns True if successful
 */
export declare function burnStoneForCharges(actor: any): Promise<boolean>;
/**
 * Check if actor can use a Charged Power this round
 * Tracks if they've already used one this round
 */
export declare function canUseChargedPowerThisRound(actor: any): boolean;
/**
 * Mark that a Charged Power was used this round
 */
export declare function markChargedPowerUsed(actor: any): Promise<void>;
/**
 * Reset Charged Power usage at start of new round
 */
export declare function resetChargedPowerFlag(actor: any): Promise<void>;
/**
 * Activate a Charged Power
 * Validates charges available and round limit
 *
 * @param actor - The actor activating the power
 * @param power - The power item
 * @returns True if successfully activated
 */
export declare function activateChargedPower(actor: any, power: any): Promise<boolean>;
/**
 * Check if a power is Charged
 */
export declare function isChargedPower(power: any): boolean;
/**
 * Get total available charges (current + temporary)
 */
export declare function getTotalCharges(actor: any): number;
//# sourceMappingURL=charges.d.ts.map