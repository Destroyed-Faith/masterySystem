/**
 * Weapons configuration for Mastery System
 * All weapons from the Players Guide
 *
 * This file is designed to be easily extensible - add new weapons here
 */
/**
 * All available weapons in the Mastery System
 * Organized by category for easy reference
 */
export const WEAPONS = [
    // Unarmed
    {
        name: 'Unarmed',
        weaponDamage: '1',
        hands: 1,
        innateAbilities: [],
        special: '—',
        description: 'Basic unarmed strikes using fists, feet, or natural weapons.'
    },
    // One-Handed Melee Weapons
    {
        name: 'Dagger',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse', 'Light'],
        special: 'Penetration(4)',
        description: 'A small, easily concealed blade perfect for close-quarters combat and throwing.'
    },
    {
        name: 'Short Sword',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse', 'Light'],
        special: 'Expose(2)',
        description: 'A compact blade balanced for speed and precision.'
    },
    {
        name: 'Rapier',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse'],
        special: 'Precision(1)',
        description: 'An elegant thrusting sword designed for precise strikes.'
    },
    {
        name: 'Longsword',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Versatile'],
        special: 'Expose(2)',
        description: 'A versatile blade that can be wielded one-handed or two-handed.'
    },
    {
        name: 'Battleaxe',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Brutal'],
        special: 'Corrode(2)',
        description: 'A heavy axe designed for combat, capable of breaking through armor.'
    },
    {
        name: 'Warhammer',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Push(2)'],
        special: 'Freeze(2)',
        description: 'A heavy hammer that can knock enemies back and freeze them in place.'
    },
    {
        name: 'Flail',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Entangle'],
        special: 'Shock(2)',
        description: 'A chain weapon that can entangle enemies and deliver shocking blows.'
    },
    {
        name: 'Spear',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Reach (2 m)'],
        special: 'Reckless Strike',
        description: 'A long polearm that extends your reach and allows for powerful charges.'
    },
    {
        name: 'Handaxe',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Light', 'Thrown (4 m)'],
        special: 'Reckless Strike',
        description: 'A small axe that can be thrown or used in melee combat.'
    },
    {
        name: 'Whip',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse', 'Reach (2 m)'],
        special: 'Entangle(2)',
        description: 'A flexible weapon that can entangle enemies from a distance.'
    },
    // Two-Handed Melee Weapons
    {
        name: 'Glaive',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Reach (3 m)', 'Heavy'],
        special: 'Brutal Impact(2)',
        description: 'A long polearm with a curved blade, extending your reach significantly.'
    },
    {
        name: 'Greataxe',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Heavy', 'Brutal'],
        special: 'Brutal Impact(3)',
        description: 'A massive two-handed axe that delivers devastating blows.'
    },
    {
        name: 'Greatsword',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Heavy', 'Balanced'],
        special: 'Precision(2)',
        description: 'A massive two-handed sword that balances power and precision.'
    },
    {
        name: 'Maul',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Heavy', 'Brutal'],
        special: 'Corrode(3)',
        description: 'A massive two-handed hammer that can shatter armor and weapons.'
    },
    {
        name: 'Halberd',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Reach (3 m)', 'Heavy'],
        special: 'Mark(2)',
        description: 'A versatile polearm combining an axe blade, spear point, and hook.'
    },
    {
        name: 'Quarterstaff',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Defensive', 'Versatile'],
        special: 'Expose(1)',
        description: 'A defensive staff that grants Evade bonuses while wielded.'
    },
    // Ranged Weapons
    {
        name: 'Shortbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged', 'Light'],
        special: 'Expose(1)',
        description: 'A compact bow designed for mobility and quick shots.'
    },
    {
        name: 'Longbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged', 'Set'],
        special: 'Penetration(3)',
        description: 'A powerful bow that deals extra damage when set and not moving.'
    },
    {
        name: 'Light Crossbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged', 'Load', 'Precise'],
        special: 'Precision(1)',
        description: 'A lighter crossbow that requires loading but offers precision.'
    },
    {
        name: 'Heavy Crossbow',
        weaponDamage: '3d8',
        hands: 2,
        innateAbilities: ['Ranged', 'Load', 'Brutal'],
        special: 'Brutal Impact(2)',
        description: 'A powerful crossbow that deals devastating damage but requires loading.'
    }
];
/**
 * Weapon Properties Reference
 * These are the innate abilities that weapons can have
 */
export const WEAPON_PROPERTIES = {
    'Finesse': 'Attack Roll uses Agility (for To-Hit only, not for damage).',
    'Light': 'Usable in off-hand / two-weapon style.',
    'Versatile': 'When wielded two-handed, gain +1d6 weapon damage (you lose your shield).',
    'Brutal': 'You may reroll 1s on your weapon damage dice once per attack.',
    'Precise': 'Reroll 1d8 per attack after seeing the dice.',
    'Reach (2 m)': 'Melee reach of 2 meters.',
    'Reach (3 m)': 'Melee reach of 3 meters.',
    'Heavy': 'You get –10 to your Initiative roll.',
    'Ranged': 'Ranged weapon; cover and range are handled separately.',
    'Set': 'If you did not move this round: gain +1d8 weapon damage.',
    'Defensive': 'While using a quarterstaff, you gain your Mastery (max +6) to your Evade.',
    'Load': 'Requires loading before each shot (takes 1 Attack Action).',
    'Balanced': 'Well-balanced weapon that offers stability and control.',
    'Thrown (4 m)': 'Can be thrown up to 4 meters.',
    'Entangle': 'Can entangle enemies, restricting their movement.',
    'Push(2)': 'Can push enemies back 2 meters on hit.'
};
/**
 * Get all available weapons
 */
export function getAllWeapons() {
    return WEAPONS;
}
/**
 * Get weapons by hands requirement
 */
export function getWeaponsByHands(hands) {
    return WEAPONS.filter(w => w.hands === hands);
}
/**
 * Get weapons by type (melee/ranged)
 * Note: This is inferred from the presence of "Ranged" in innateAbilities
 */
export function getWeaponsByType(type) {
    if (type === 'ranged') {
        return WEAPONS.filter(w => w.innateAbilities.includes('Ranged'));
    }
    return WEAPONS.filter(w => !w.innateAbilities.includes('Ranged'));
}
/**
 * Get a weapon by name
 */
export function getWeapon(name) {
    return WEAPONS.find(w => w.name.toLowerCase() === name.toLowerCase());
}
/**
 * Get weapons that have a specific property
 */
export function getWeaponsWithProperty(property) {
    return WEAPONS.filter(w => w.innateAbilities.some(ability => ability.toLowerCase().includes(property.toLowerCase())));
}
//# sourceMappingURL=weapons.js.map