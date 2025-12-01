/**
 * Equipment configuration for Mastery System
 * Base weapons and armor from the Players Guide
 */
export interface ArmorDefinition {
    name: string;
    type: 'light' | 'medium' | 'heavy';
    armorValue: number;
    skillPenalty: string;
    description: string;
}
export interface WeaponDefinition {
    name: string;
    weaponType: 'melee' | 'ranged';
    damage: string;
    hands: number;
    innateAbilities: string[];
    special: string;
    description?: string;
}
export declare const BASE_ARMOR: ArmorDefinition[];
export declare const BASE_WEAPONS: WeaponDefinition[];
/**
 * Get all base armor
 */
export declare function getAllArmor(): ArmorDefinition[];
/**
 * Get all base weapons
 */
export declare function getAllWeapons(): WeaponDefinition[];
/**
 * Get weapons by type
 */
export declare function getWeaponsByType(type: 'melee' | 'ranged'): WeaponDefinition[];
/**
 * Get armor by type
 */
export declare function getArmorByType(type: 'light' | 'medium' | 'heavy'): ArmorDefinition[];
//# sourceMappingURL=equipment.d.ts.map