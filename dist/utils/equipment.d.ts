/**
 * Equipment configuration for Mastery System
 * Base weapons and armor from the Players Guide
 */
export interface ArmorDefinition {
    name: string;
    type: 'light' | 'medium' | 'heavy';
    armorValue: number;
    evadeModifier: number;
    /** Initiative roll modifier; null = no penalty (—). */
    initiativeModifier: number | null;
    skillPenalty: string;
    description: string;
}
export interface ShieldDefinition {
    name: string;
    type: 'parry' | 'medium' | 'tower';
    shieldValue: number;
    evadeBonus: number;
    initiativeModifier: number | null;
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
export declare const BASE_SHIELDS: ShieldDefinition[];
/** Normalize item.system.type for shields (legacy `light` = parry). */
export declare function normalizeShieldTypeKey(raw: string | undefined): 'parry' | 'medium' | 'tower' | null;
export declare function getArmorDefinitionForType(type: string | undefined): ArmorDefinition | null;
export declare function getShieldDefinitionForType(type: string | undefined): ShieldDefinition | null;
/** Derived from `weapons.ts` catalog (single source of truth). */
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
/**
 * Get all base shields
 */
export declare function getAllShields(): ShieldDefinition[];
/**
 * Get shield by type
 */
export declare function getShieldByType(type: 'parry' | 'medium' | 'tower'): ShieldDefinition[];
//# sourceMappingURL=equipment.d.ts.map