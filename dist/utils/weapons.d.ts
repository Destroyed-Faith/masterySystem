/**
 * Weapons configuration for Mastery System
 * All weapons from the Players Guide
 *
 * This file is designed to be easily extensible - add new weapons here
 */
export interface WeaponDefinition {
    name: string;
    weaponDamage: string;
    hands: 1 | 2;
    innateAbilities: string[];
    special: string;
    description?: string;
}
/**
 * All available weapons in the Mastery System
 * Organized by category for easy reference
 */
export declare const WEAPONS: WeaponDefinition[];
/**
 * Weapon Properties Reference
 * These are the innate abilities that weapons can have
 */
export declare const WEAPON_PROPERTIES: Record<string, string>;
/**
 * Get all available weapons
 */
export declare function getAllWeapons(): WeaponDefinition[];
/**
 * Get weapons by hands requirement
 */
export declare function getWeaponsByHands(hands: 1 | 2): WeaponDefinition[];
/**
 * Get weapons by type (melee/ranged)
 * Note: This is inferred from the presence of "Ranged" in innateAbilities
 */
export declare function getWeaponsByType(type: 'melee' | 'ranged'): WeaponDefinition[];
/**
 * Get a weapon by name
 */
export declare function getWeapon(name: string): WeaponDefinition | undefined;
/**
 * Get weapons that have a specific property
 */
export declare function getWeaponsWithProperty(property: string): WeaponDefinition[];
//# sourceMappingURL=weapons.d.ts.map