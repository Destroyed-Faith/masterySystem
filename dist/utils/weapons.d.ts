/**
 * Weapons configuration for Mastery System (Players Guide table).
 * Single source for catalog matching, migrations, and item info UI.
 */
export interface WeaponDefinition {
    name: string;
    weaponDamage: string;
    hands: 1 | 2;
    innateAbilities: string[];
    /** Combat specials (often bought with Raises in combat). */
    special: string;
    description?: string;
    price?: number;
}
/**
 * Canonical weapon table — align item.system with this for stock weapons.
 */
export declare const WEAPONS: WeaponDefinition[];
/** Exact-match descriptions for innate lines (and common variants). */
export declare const WEAPON_PROPERTIES: Record<string, string>;
/**
 * Best-effort explanation for one innate ability line on an item.
 */
export declare function describeInnateAbility(ability: string): string;
export declare function getAllWeapons(): WeaponDefinition[];
export declare function getWeaponsByHands(hands: 1 | 2): WeaponDefinition[];
export declare function getWeaponsByType(type: 'melee' | 'ranged'): WeaponDefinition[];
export declare function masteryWeaponCatalogKey(name: string): string;
export declare function getWeapon(name: string): WeaponDefinition | undefined;
export declare function matchesMasteryWeaponCatalog(name: string): boolean;
export declare function getWeaponsWithProperty(property: string): WeaponDefinition[];
//# sourceMappingURL=weapons.d.ts.map