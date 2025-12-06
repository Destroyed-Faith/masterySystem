/**
 * Equipment Penalties System for Mastery System
 *
 * Rules from rulebook (Lines 5078-5093):
 *
 * Armor Penalties:
 * - Light Armor: No penalty
 * - Medium Armor: Stealth -2 dice, Evade -2
 * - Heavy Armor: Athletics/Acrobatics/Stealth -4 dice, Evade -4
 *
 * Shield Penalties:
 * - Parry Shield (+1 AR, +4 Evade): No penalty
 * - Medium Shield (+2 AR): Evade -4
 * - Tower Shield (+4 AR): Evade -8
 */
/**
 * Armor types and their penalties
 */
export declare enum ArmorType {
    LIGHT = "light",
    MEDIUM = "medium",
    HEAVY = "heavy",
    NONE = "none"
}
/**
 * Shield types and their bonuses/penalties
 */
export declare enum ShieldType {
    NONE = "none",
    PARRY = "parry",// +1 AR, +4 Evade
    MEDIUM = "medium",// +2 AR, -4 Evade
    TOWER = "tower"
}
/**
 * Equipment penalty data
 */
export interface EquipmentPenalties {
    athletics: number;
    acrobatics: number;
    stealth: number;
    evade: number;
    fromArmor: boolean;
    fromShield: boolean;
}
/**
 * Get armor penalties based on armor type
 */
export declare function getArmorPenalties(armorType: ArmorType): EquipmentPenalties;
/**
 * Get shield penalties based on shield type
 */
export declare function getShieldPenalties(shieldType: ShieldType): {
    evade: number;
    evadeBonus: number;
    armorBonus: number;
};
/**
 * Calculate total equipment penalties for an actor
 */
export declare function calculateEquipmentPenalties(actor: any): EquipmentPenalties;
/**
 * Apply equipment penalties to a skill roll
 * Returns the modified dice pool
 *
 * @param actor - The actor
 * @param skill - Skill being rolled
 * @param baseDice - Base dice pool
 * @returns Modified dice pool after penalties
 */
export declare function applySkillPenalties(actor: any, skill: string, baseDice: number): number;
/**
 * Get equipment penalty summary for display
 */
export declare function getEquipmentPenaltySummary(actor: any): string[];
/**
 * Get equipment bonuses from shield
 */
export declare function getShieldBonuses(shieldType: ShieldType): {
    armor: number;
    evade: number;
};
//# sourceMappingURL=equipment.d.ts.map