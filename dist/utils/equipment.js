/**
 * Equipment configuration for Mastery System
 * Base weapons and armor from the Players Guide
 */
import { WEAPONS as WEAPON_CATALOG } from './weapons.js';
export const BASE_ARMOR = [
    {
        name: 'Light Armor',
        type: 'light',
        armorValue: 4,
        evadeModifier: 0,
        initiativeModifier: null,
        skillPenalty: '—',
        description: 'Light armor provides basic protection without restricting movement. Common examples include leather armor, padded cloth, or light chainmail.'
    },
    {
        name: 'Medium Armor',
        type: 'medium',
        armorValue: 8,
        evadeModifier: -2,
        initiativeModifier: -4,
        skillPenalty: '−1d8 to Physical Skill checks',
        description: 'Medium armor offers better protection but restricts movement slightly. Common examples include chainmail, scale mail, or reinforced leather.'
    },
    {
        name: 'Heavy Armor',
        type: 'heavy',
        armorValue: 12,
        evadeModifier: -4,
        initiativeModifier: -8,
        skillPenalty: '−2d8 to Physical Skill checks',
        description: 'Heavy armor provides maximum protection but significantly restricts movement. Common examples include plate mail, full plate, or heavy chainmail.'
    }
];
export const BASE_SHIELDS = [
    {
        name: 'Parry Shield',
        type: 'parry',
        shieldValue: 1,
        evadeBonus: 4,
        initiativeModifier: null,
        skillPenalty: '−1d8 to Physical Skill checks',
        description: 'A small, lightweight shield designed for parrying attacks. Provides a bonus to Evade while offering minimal protection.'
    },
    {
        name: 'Medium Shield',
        type: 'medium',
        shieldValue: 4,
        evadeBonus: 0,
        initiativeModifier: null,
        skillPenalty: '−2d8 to Physical Skill checks',
        description: 'A standard shield that balances protection and mobility. Offers decent defense with a penalty to Physical checks.'
    },
    {
        name: 'Tower Shield',
        type: 'tower',
        shieldValue: 8,
        evadeBonus: -4,
        initiativeModifier: -4,
        skillPenalty: '−2d8 to Physical Skill checks',
        description: 'A large, heavy shield that provides excellent protection but significantly reduces Evade and Initiative.'
    }
];
/** Normalize item.system.type for shields (legacy `light` = parry). */
export function normalizeShieldTypeKey(raw) {
    const s = (raw || '').toLowerCase().trim();
    if (!s)
        return null;
    if (s === 'parry' || s === 'light')
        return 'parry';
    if (s === 'medium')
        return 'medium';
    if (s === 'tower' || s === 'heavy')
        return 'tower';
    return null;
}
export function getArmorDefinitionForType(type) {
    const t = (type || '').toLowerCase().trim();
    if (t !== 'light' && t !== 'medium' && t !== 'heavy')
        return null;
    return BASE_ARMOR.find((a) => a.type === t) || null;
}
export function getShieldDefinitionForType(type) {
    const k = normalizeShieldTypeKey(type);
    if (!k)
        return null;
    return BASE_SHIELDS.find((s) => s.type === k) || null;
}
function catalogEntryToBaseWeapon(w) {
    const ranged = w.innateAbilities.some((a) => /^ranged/i.test(a.trim()));
    return {
        name: w.name,
        weaponType: ranged ? 'ranged' : 'melee',
        damage: w.weaponDamage,
        hands: w.hands,
        innateAbilities: [...w.innateAbilities],
        special: w.special,
        description: w.description
    };
}
/** Derived from `weapons.ts` catalog (single source of truth). */
export const BASE_WEAPONS = WEAPON_CATALOG.map(catalogEntryToBaseWeapon);
/**
 * Get all base armor
 */
export function getAllArmor() {
    return BASE_ARMOR;
}
/**
 * Get all base weapons
 */
export function getAllWeapons() {
    return BASE_WEAPONS;
}
/**
 * Get weapons by type
 */
export function getWeaponsByType(type) {
    return BASE_WEAPONS.filter(w => w.weaponType === type);
}
/**
 * Get armor by type
 */
export function getArmorByType(type) {
    return BASE_ARMOR.filter(a => a.type === type);
}
/**
 * Get all base shields
 */
export function getAllShields() {
    return BASE_SHIELDS;
}
/**
 * Get shield by type
 */
export function getShieldByType(type) {
    return BASE_SHIELDS.filter(s => s.type === type);
}
//# sourceMappingURL=equipment.js.map