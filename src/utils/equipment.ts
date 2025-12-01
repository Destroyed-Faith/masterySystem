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

export const BASE_ARMOR: ArmorDefinition[] = [
  {
    name: 'Light Armor',
    type: 'light',
    armorValue: 4,
    skillPenalty: '—',
    description: 'Light armor provides basic protection without restricting movement. Common examples include leather armor, padded cloth, or light chainmail.'
  },
  {
    name: 'Medium Armor',
    type: 'medium',
    armorValue: 8,
    skillPenalty: 'Stealth Pool −2, Evade −2',
    description: 'Medium armor offers better protection but restricts movement slightly. Common examples include chainmail, scale mail, or reinforced leather.'
  },
  {
    name: 'Heavy Armor',
    type: 'heavy',
    armorValue: 12,
    skillPenalty: 'Athletics, Acrobatics, Stealth Pool −4, Evade −4',
    description: 'Heavy armor provides maximum protection but significantly restricts movement. Common examples include plate mail, full plate, or heavy chainmail.'
  }
];

export const BASE_WEAPONS: WeaponDefinition[] = [
  // One-Handed Melee Weapons
  {
    name: 'Dagger',
    weaponType: 'melee',
    damage: '1d8',
    hands: 1,
    innateAbilities: ['Finesse', 'Light'],
    special: 'Penetration(4)',
    description: 'A small, easily concealed blade perfect for close-quarters combat and throwing.'
  },
  {
    name: 'Short Sword',
    weaponType: 'melee',
    damage: '1d8',
    hands: 1,
    innateAbilities: ['Finesse', 'Light'],
    special: 'Expose(2)',
    description: 'A compact blade balanced for speed and precision.'
  },
  {
    name: 'Rapier',
    weaponType: 'melee',
    damage: '1d8',
    hands: 1,
    innateAbilities: ['Finesse'],
    special: 'Precision(1)',
    description: 'An elegant thrusting sword designed for precise strikes.'
  },
  {
    name: 'Longsword',
    weaponType: 'melee',
    damage: '2d8',
    hands: 1,
    innateAbilities: ['Versatile'],
    special: 'Expose(2)',
    description: 'A versatile blade that can be wielded one-handed or two-handed.'
  },
  {
    name: 'Battleaxe',
    weaponType: 'melee',
    damage: '2d8',
    hands: 1,
    innateAbilities: ['Brutal'],
    special: 'Corrode(2)',
    description: 'A heavy axe designed for combat, capable of breaking through armor.'
  },
  {
    name: 'Warhammer',
    weaponType: 'melee',
    damage: '2d8',
    hands: 1,
    innateAbilities: ['Push(2)'],
    special: 'Freeze(2)',
    description: 'A heavy hammer that can knock enemies back and freeze them in place.'
  },
  {
    name: 'Flail',
    weaponType: 'melee',
    damage: '2d8',
    hands: 1,
    innateAbilities: ['Entangle'],
    special: 'Shock(2)',
    description: 'A chain weapon that can entangle enemies and deliver shocking blows.'
  },
  {
    name: 'Spear',
    weaponType: 'melee',
    damage: '2d8',
    hands: 1,
    innateAbilities: ['Reach (2 m)'],
    special: 'Reckless Strike',
    description: 'A long polearm that extends your reach and allows for powerful charges.'
  },
  {
    name: 'Handaxe',
    weaponType: 'melee',
    damage: '1d8',
    hands: 1,
    innateAbilities: ['Light', 'Thrown (4 m)'],
    special: 'Reckless Strike',
    description: 'A small axe that can be thrown or used in melee combat.'
  },
  {
    name: 'Whip',
    weaponType: 'melee',
    damage: '1d8',
    hands: 1,
    innateAbilities: ['Finesse', 'Reach (2 m)'],
    special: 'Entangle(2)',
    description: 'A flexible weapon that can entangle enemies from a distance.'
  },
  
  // Two-Handed Melee Weapons
  {
    name: 'Glaive',
    weaponType: 'melee',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Reach (3 m)', 'Heavy'],
    special: 'Brutal Impact(2)',
    description: 'A long polearm with a curved blade, extending your reach significantly.'
  },
  {
    name: 'Greataxe',
    weaponType: 'melee',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Heavy', 'Brutal'],
    special: 'Brutal Impact(3)',
    description: 'A massive two-handed axe that delivers devastating blows.'
  },
  {
    name: 'Greatsword',
    weaponType: 'melee',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Heavy', 'Balanced'],
    special: 'Precision(2)',
    description: 'A massive two-handed sword that balances power and precision.'
  },
  {
    name: 'Maul',
    weaponType: 'melee',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Heavy', 'Brutal'],
    special: 'Corrode(3)',
    description: 'A massive two-handed hammer that can shatter armor and weapons.'
  },
  {
    name: 'Halberd',
    weaponType: 'melee',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Reach (3 m)', 'Heavy'],
    special: 'Mark(2)',
    description: 'A versatile polearm combining an axe blade, spear point, and hook.'
  },
  {
    name: 'Quarterstaff',
    weaponType: 'melee',
    damage: '2d8',
    hands: 2,
    innateAbilities: ['Defensive', 'Versatile'],
    special: 'Expose(1)',
    description: 'A defensive staff that grants Evade bonuses while wielded.'
  },
  
  // Ranged Weapons
  {
    name: 'Shortbow',
    weaponType: 'ranged',
    damage: '2d8',
    hands: 2,
    innateAbilities: ['Ranged', 'Light'],
    special: 'Expose(1)',
    description: 'A compact bow designed for mobility and quick shots.'
  },
  {
    name: 'Longbow',
    weaponType: 'ranged',
    damage: '2d8',
    hands: 2,
    innateAbilities: ['Ranged', 'Set'],
    special: 'Penetration(3)',
    description: 'A powerful bow that deals extra damage when set and not moving.'
  },
  {
    name: 'Light Crossbow',
    weaponType: 'ranged',
    damage: '2d8',
    hands: 2,
    innateAbilities: ['Ranged', 'Load', 'Precise'],
    special: 'Precision(1)',
    description: 'A lighter crossbow that requires loading but offers precision.'
  },
  {
    name: 'Heavy Crossbow',
    weaponType: 'ranged',
    damage: '3d8',
    hands: 2,
    innateAbilities: ['Ranged', 'Load', 'Brutal'],
    special: 'Brutal Impact(2)',
    description: 'A powerful crossbow that deals devastating damage but requires loading.'
  }
];

/**
 * Get all base armor
 */
export function getAllArmor(): ArmorDefinition[] {
  return BASE_ARMOR;
}

/**
 * Get all base weapons
 */
export function getAllWeapons(): WeaponDefinition[] {
  return BASE_WEAPONS;
}

/**
 * Get weapons by type
 */
export function getWeaponsByType(type: 'melee' | 'ranged'): WeaponDefinition[] {
  return BASE_WEAPONS.filter(w => w.weaponType === type);
}

/**
 * Get armor by type
 */
export function getArmorByType(type: 'light' | 'medium' | 'heavy'): ArmorDefinition[] {
  return BASE_ARMOR.filter(a => a.type === type);
}

