/**
 * Weapons configuration for Mastery System (Players Guide table).
 * Single source for catalog matching, migrations, and item info UI.
 */
import { normalizeWeaponNameKey } from './item-icons.js';
/**
 * Canonical weapon table — align item.system with this for stock weapons.
 */
export const WEAPONS = [
    {
        name: 'Unarmed',
        weaponDamage: '1',
        hands: 1,
        innateAbilities: [],
        special: '—',
        description: 'Basic unarmed strikes using fists, feet, or natural weapons.'
    },
    {
        name: 'Dagger',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse', 'Light', 'Thrown (4/8/16m)'],
        special: 'Penetration(4)',
        description: 'A small blade for close work and throwing.'
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
        description: 'An elegant thrusting sword for precise strikes.'
    },
    {
        name: 'Longsword',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Versatile'],
        special: 'Expose(2)',
        description: 'A versatile blade, one- or two-handed.'
    },
    {
        name: 'Battleaxe',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Versatile'],
        special: 'Brutal Impact(3), Corrode(2)',
        description: 'A heavy axe that rewards two-handed use.'
    },
    {
        name: 'Warhammer',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: [],
        special: 'Push(2), Slow(2)',
        description: 'A heavy hammer for impact and control.'
    },
    {
        name: 'Flail',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: [],
        special: 'Prone(1), Disrupt(2)',
        description: 'A chained head that unbalances foes.'
    },
    {
        name: 'Spear',
        weaponDamage: '2d8',
        hands: 1,
        innateAbilities: ['Reach (+1 m)', 'Set'],
        special: 'Push(1)',
        description: 'Reach and reward for holding position.'
    },
    {
        name: 'Glaive',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Reach (+2 m)', 'Heavy'],
        special: 'Brutal Impact(4)',
        description: 'A long polearm with a curved blade.'
    },
    {
        name: 'Greataxe',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Heavy'],
        special: 'Brutal Impact(4), Corrode(2)',
        description: 'A massive two-handed axe.'
    },
    {
        name: 'Greatsword',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Heavy', 'Balanced'],
        special: 'Precision(2)',
        description: 'A huge blade with manageable heft.'
    },
    {
        name: 'Maul',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Heavy'],
        special: 'Brutal Impact(3), Push(2)',
        description: 'A crushing two-handed hammer.'
    },
    {
        name: 'Halberd',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Reach (+2 m)', 'Heavy'],
        special: 'Mark(2)',
        description: 'Axe, spear point, and hook in one polearm.'
    },
    {
        name: 'Handaxe',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Light', 'Thrown (4/8/16m)'],
        special: '—',
        description: 'A light axe for melee or throwing.'
    },
    {
        name: 'Shortbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged (8/16/32m)', 'Light'],
        special: 'Expose(4)',
        description: 'A compact bow for mobility.'
    },
    {
        name: 'Longbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged (8/16/32m)', 'Set'],
        special: 'Penetration(2), Expose(4)',
        description: 'A powerful bow that rewards a planted shot.'
    },
    {
        name: 'Light Crossbow',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Ranged (8/16/32m)', 'Load'],
        special: 'Penetration(4), Precision(2)',
        description: 'A lighter crossbow; must be loaded between shots.'
    },
    {
        name: 'Heavy Crossbow',
        weaponDamage: '4d8',
        hands: 2,
        innateAbilities: ['Ranged (8/16/32m)', 'Load'],
        special: 'Penetration(4), Precision(4)',
        description: 'A devastating crossbow; slow to reload.'
    },
    {
        name: 'Whip',
        weaponDamage: '1d8',
        hands: 1,
        innateAbilities: ['Finesse', 'Reach (+1 m)'],
        special: '',
        description: 'Flexible reach and control.'
    },
    {
        name: 'Quarterstaff',
        weaponDamage: '2d8',
        hands: 2,
        innateAbilities: ['Defensive'],
        special: 'Expose(1)',
        description: 'A staff suited to defense when used two-handed.'
    },
    {
        name: 'Wand',
        weaponDamage: '1',
        hands: 1,
        innateAbilities: ['Spell Focus (+2d8)'],
        special: '—',
        description: 'Focuses spell damage.'
    },
    {
        name: 'Runestaff',
        weaponDamage: '1d8',
        hands: 2,
        innateAbilities: ['Spell Focus (+4d8)'],
        special: '—',
        description: 'A two-handed spell focus.'
    }
];
/** Exact-match descriptions for innate lines (and common variants). */
export const WEAPON_PROPERTIES = {
    Finesse: 'Attack Roll uses Agility (for To-Hit only, not for damage).',
    Light: 'Usable in off-hand (required for Full Dual-Wield).',
    Versatile: 'When wielded two-handed, gain +2d8 weapon damage (you lose your shield / off-hand).',
    'Reach (+1 m)': 'Your melee reach is 2 m by default; this increases it. Measured from the attacker’s token center.',
    'Reach (+2 m)': 'Your melee reach is 2 m by default; this increases it. Measured from the attacker’s token center.',
    Heavy: 'You get –10 to your Initiative roll.',
    Balanced: 'If a weapon has Heavy + Balanced, reduce the Heavy penalty to –5 Initiative.',
    Ranged: 'Ranged weapon; cover and range are handled separately.',
    'Ranged (8/16/32m)': 'Ranged weapon; typical range bands 8 / 16 / 32 m (cover and range rules apply).',
    Set: 'If you did not move this round: gain +1d8 weapon damage.',
    'Thrown (4/8/16m)': 'You may make a ranged attack by throwing the weapon up to the listed increments (retrieve afterward unless a rule says otherwise).',
    Load: 'After you fire, the weapon is Unloaded. To fire again you must Reload (1 Action) and you need one free hand to do so.',
    Defensive: 'While wielding this weapon two-handed, add your Mastery (max +6) to your Evade.',
    'Spell Focus (+2d8)': 'When you deal damage with a Power that has the Spell tag, add +2d8 bonus damage dice.',
    'Spell Focus (+4d8)': 'When you deal damage with a Power that has the Spell tag, add +4d8 bonus damage dice.'
};
const SORTED_PROPERTY_KEYS = Object.keys(WEAPON_PROPERTIES).sort((a, b) => b.length - a.length);
/**
 * Best-effort explanation for one innate ability line on an item.
 */
export function describeInnateAbility(ability) {
    const trimmed = (ability || '').trim();
    if (!trimmed)
        return '';
    if (WEAPON_PROPERTIES[trimmed])
        return WEAPON_PROPERTIES[trimmed];
    const lower = trimmed.toLowerCase();
    for (const key of SORTED_PROPERTY_KEYS) {
        if (lower.startsWith(key.toLowerCase()))
            return WEAPON_PROPERTIES[key];
    }
    if (lower.startsWith('ranged'))
        return WEAPON_PROPERTIES.Ranged;
    if (lower.startsWith('thrown'))
        return WEAPON_PROPERTIES['Thrown (4/8/16m)'];
    if (lower.startsWith('reach'))
        return WEAPON_PROPERTIES['Reach (+1 m)'];
    if (lower.startsWith('spell focus')) {
        if (trimmed.includes('+4'))
            return WEAPON_PROPERTIES['Spell Focus (+4d8)'];
        return WEAPON_PROPERTIES['Spell Focus (+2d8)'];
    }
    return '';
}
export function getAllWeapons() {
    return WEAPONS;
}
export function getWeaponsByHands(hands) {
    return WEAPONS.filter((w) => w.hands === hands);
}
export function getWeaponsByType(type) {
    if (type === 'ranged') {
        return WEAPONS.filter((w) => w.innateAbilities.some((a) => /^ranged/i.test(a.trim())));
    }
    return WEAPONS.filter((w) => !w.innateAbilities.some((a) => /^ranged/i.test(a.trim())));
}
export function masteryWeaponCatalogKey(name) {
    return normalizeWeaponNameKey(name).replace(/\s/g, '');
}
export function getWeapon(name) {
    const key = masteryWeaponCatalogKey(name);
    return WEAPONS.find((w) => masteryWeaponCatalogKey(w.name) === key);
}
export function matchesMasteryWeaponCatalog(name) {
    const key = masteryWeaponCatalogKey(name);
    return WEAPONS.some((w) => masteryWeaponCatalogKey(w.name) === key);
}
export function getWeaponsWithProperty(property) {
    const p = property.toLowerCase();
    return WEAPONS.filter((w) => w.innateAbilities.some((ability) => ability.toLowerCase().includes(p)));
}
//# sourceMappingURL=weapons.js.map