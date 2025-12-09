/**
 * Frostmonger Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const FROSTMONGER_POWERS: PowerDefinition[] = [
    {
        name: 'Ice Lance',
        tree: 'Frostmonger',
        powerType: 'active',
        description: 'You conjure a spear of solid ice and hurl it with lethal intent.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 damage', special: 'Freeze(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'cold' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 damage', special: 'Freeze(3)', cost: { action: true }, roll: { damage: '3d8', damageType: 'cold' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 damage', special: 'Freeze(4)', cost: { action: true }, roll: { damage: '4d8', damageType: 'cold' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '5d8 damage', special: 'Freeze(5)', cost: { action: true }, roll: { damage: '5d8', damageType: 'cold' } }
        ]
    },
    {
        name: 'Winter\'s Grasp',
        tree: 'Frostmonger',
        powerType: 'active',
        description: 'Frost chains rise from the ground, freezing and rooting your foe where they stand.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '1d8 damage', special: 'Freeze(2), Entangle(2)', cost: { action: true }, roll: { damage: '1d8', damageType: 'cold' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '1d8 damage', special: 'Freeze(3), Entangle(3)', cost: { action: true }, roll: { damage: '1d8', damageType: 'cold' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '1d8 damage', special: 'Freeze(4), Entangle(4)', cost: { action: true }, roll: { damage: '1d8', damageType: 'cold' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '1d8 damage', special: 'Freeze(5), Entangle(5)', cost: { action: true }, roll: { damage: '1d8', damageType: 'cold' } }
        ]
    },
    {
        name: 'Avalanche',
        tree: 'Frostmonger',
        powerType: 'buff',
        description: 'You call down crushing ice, priming your next freezing spell.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Next Freeze Spell deals +3d8 damage', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Next Freeze Spell deals +5d8 damage', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Next Freeze Spell deals +7d8 damage', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Next Freeze Spell deals +9d8 damage', cost: { action: true } }
        ]
    },
    {
        name: 'Heart of Ice',
        tree: 'Frostmonger',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'Your body becomes as cold and hard as ice itself.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Armor (×2 vs. Fire).' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Armor (×2 vs. Fire).' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Armor (×2 vs. Fire).' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Armor (×2 vs. Fire) and become immune to Burn/Ignite.' }
        ]
    },
    {
        name: 'Cold-Blooded',
        tree: 'Frostmonger',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You strike with precision against frozen targets.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Against Frozen targets, gain +2 Attack Dice.' },
            { level: 2, type: 'Passive', effect: 'Against Frozen targets, gain +4 Attack Dice.' },
            { level: 3, type: 'Passive', effect: 'Against Frozen targets, gain +6 Attack Dice and Crit(1).' },
            { level: 4, type: 'Passive', effect: 'Against Frozen targets, gain +8 Attack Dice and Crit(2).' }
        ]
    },
    {
        name: 'Aura of Winter',
        tree: 'Frostmonger',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'The cold radiates from you, sapping the strength of nearby enemies.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Enemies within 2m suffer −1 Attack Die.' },
            { level: 2, type: 'Passive', effect: 'Enemies within 4m suffer −2 Attack Dice.' },
            { level: 3, type: 'Passive', effect: 'Enemies within 6m suffer −2 Attack Dice and −1 Save Pool.' },
            { level: 4, type: 'Passive', effect: 'Enemies within 8m suffer −3 Attack Dice and −1 Save Pool.' }
        ]
    }
];

