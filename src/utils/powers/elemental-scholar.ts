/**
 * Elemental Scholar Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const ELEMENTAL_SCHOLAR_POWERS: PowerDefinition[] = [
    {
        name: 'Way of the Fire',
        tree: 'Elemental Scholar',
        powerType: 'active',
        description: 'You ignite your strikes with disciplined flame.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'fire' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'fire' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Ignite(3)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'fire' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Ignite(4)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Way of the Air',
        tree: 'Elemental Scholar',
        powerType: 'active',
        description: 'Your strike carries the will of the storm.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Push(1), Shock(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'lightning' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2), Shock(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'lightning' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Push(2), Shock(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'lightning' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(3), Shock(2)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'lightning' } }
        ]
    },
    {
        name: 'Way of the Earth',
        tree: 'Elemental Scholar',
        powerType: 'active',
        description: 'You strike with the patience and weight of stone.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Corrode(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'acid' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Corrode(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'acid' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Corrode(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'acid' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Corrode(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'acid' } }
        ]
    },
    {
        name: 'Elemental Stone Armor',
        tree: 'Elemental Scholar',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'An unbreakable vow to endure.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Armor for each unique elemental Special active on an opponent.' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Armor for each unique elemental Special active on an opponent.' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Armor for each unique elemental Special active on an opponent.' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Armor for each unique elemental Special active on an opponent.' }
        ]
    },
    {
        name: 'Elemental Balance',
        tree: 'Elemental Scholar',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'The scholar strikes when the elements align.',
        levels: [
            { level: 1, type: 'Passive', effect: 'If any opponent has 3+ unique elemental Specials, gain Extra Attack(1) for a Level 1 Power or Spell.' },
            { level: 2, type: 'Passive', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 2 Power or Spell.' },
            { level: 3, type: 'Passive', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 3 Power or Spell.' },
            { level: 4, type: 'Passive', effect: 'If any opponent has 4+ unique elemental Specials, gain Extra Attack(1) for a Level 4 Power or Spell.' }
        ]
    },
    {
        name: 'Elemental Flow',
        tree: 'Elemental Scholar',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Balance restores what fury destroys.',
        levels: [
            { level: 1, type: 'Passive', effect: 'End of your round: if any opponent suffers from 2+ unique elemental Specials, heal 1d8 HP.' },
            { level: 2, type: 'Passive', effect: 'As above, heal 2d8 HP.' },
            { level: 3, type: 'Passive', effect: 'As above, heal 3d8 HP.' },
            { level: 4, type: 'Passive', effect: 'As above, heal 4d8 HP.' }
        ]
    }
];

