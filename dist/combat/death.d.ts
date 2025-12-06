/**
 * Death & Dying System for Mastery System
 *
 * Rules from rulebook (Lines 5153-5167):
 *
 * When Incapacitated:
 * - Make a Death Save at the start of each turn
 * - Roll: Vitality k Mastery Rank vs TN 20
 * - Success: Mark a success
 * - Failure: Mark a Death Mark
 * - 3 successes: Stabilized (no more saves needed)
 * - 3 Death Marks: Character dies
 * - Taking damage while incapacitated: 1 automatic Death Mark
 * - Critical hit while incapacitated: 2 Death Marks
 * - Healing: Removes 1 Death Mark per 3 points healed
 */
/**
 * Death Save state tracking
 */
export interface DeathSaveData {
    successes: number;
    deathMarks: number;
    stabilized: boolean;
    dead: boolean;
}
/**
 * Get current death save data for actor
 */
export declare function getDeathSaveData(actor: any): DeathSaveData;
/**
 * Check if actor is incapacitated (last health level has damage)
 */
export declare function isIncapacitated(actor: any): boolean;
/**
 * Initialize death save tracking when incapacitated
 */
export declare function initializeDeathSaves(actor: any): Promise<void>;
/**
 * Perform a Death Save roll
 *
 * @param actor - The incapacitated actor
 * @returns The roll result
 */
export declare function performDeathSave(actor: any): Promise<{
    success: boolean;
    total: number;
}>;
/**
 * Add a Death Mark when taking damage while incapacitated
 *
 * @param actor - The incapacitated actor
 * @param isCritical - Whether this was a critical hit (2 marks)
 */
export declare function addDeathMark(actor: any, isCritical?: boolean): Promise<void>;
/**
 * Remove Death Marks through healing
 * 1 Death Mark removed per 3 points healed
 */
export declare function removeDeathMarksFromHealing(actor: any, healingAmount: number): Promise<void>;
/**
 * Reset death saves (when healed above incapacitated)
 */
export declare function resetDeathSaves(actor: any): Promise<void>;
//# sourceMappingURL=death.d.ts.map