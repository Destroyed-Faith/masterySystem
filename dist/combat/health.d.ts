/**
 * Health Levels System for Mastery System
 *
 * Rules:
 * - Each Health Level has Vitality × 2 boxes
 * - Characters have multiple Health Levels
 * - Taking damage fills boxes, which impose wound penalties
 * - Wound penalties: -1 die per damaged Health Level
 */
export interface HealthLevel {
    name: string;
    boxes: number;
    damageBoxes: number;
    penalty: number;
    scarred: boolean;
}
export interface HealthLevelsData {
    levels: HealthLevel[];
    totalBoxes: number;
    damagedBoxes: number;
    currentPenalty: number;
}
/**
 * Initialize health levels for an actor based on Vitality
 *
 * Standard Health Levels:
 * - Healthy (no penalty)
 * - Bruised (-1 die)
 * - Hurt (-2 dice)
 * - Injured (-3 dice)
 * - Wounded (-4 dice)
 * - Mauled (-5 dice)
 * - Crippled (-6 dice)
 * - Incapacitated (down)
 */
export declare function initializeHealthLevels(vitality: number): HealthLevel[];
/**
 * Get current health status for an actor
 */
export declare function getHealthLevelsData(actor: any): HealthLevelsData;
/**
 * Apply damage to health levels
 * Fills boxes from top to bottom
 * Marks level as scarred when completely filled
 *
 * @param actor - The actor taking damage
 * @param damage - Amount of damage
 * @returns Updated health levels
 */
export declare function applyDamageToHealthLevels(actor: any, damage: number): Promise<HealthLevelsData>;
/**
 * Heal damage from health levels
 * Clears boxes from the CURRENT active level only (per rules)
 * Cannot heal scarred levels
 *
 * @param actor - The actor being healed
 * @param healing - Amount of healing
 * @returns Updated health levels
 */
export declare function healHealthLevels(actor: any, healing: number): Promise<HealthLevelsData>;
/**
 * Long rest healing - removes scarring and heals all levels
 */
export declare function longRestHeal(actor: any): Promise<void>;
/**
 * Get wound penalty for rolls
 * Used when rolling dice - subtract this many dice from the pool
 *
 * @param actor - The actor
 * @returns Number of dice to subtract
 */
export declare function getWoundPenalty(actor: any): number;
/**
 * Check if actor is incapacitated
 */
export declare function isIncapacitated(actor: any): boolean;
/**
 * Get current health level name
 * Returns the name of the highest damaged level
 */
export declare function getCurrentHealthLevelName(actor: any): string;
/**
 * Fully heal an actor (clear all damage)
 */
export declare function fullHeal(actor: any): Promise<void>;
//# sourceMappingURL=health.d.ts.map