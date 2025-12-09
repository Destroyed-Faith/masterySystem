/**
 * Dragon Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const DRAGON_POWERS: PowerDefinition[] = [
    {
        name: 'Claws',
        tree: 'Dragon',
        powerType: 'active',
        description: 'You unleash rapid rakes, each strike a flash of scale and sinew.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 1 Extra Attack(0.5) with half your Attack Dice, dealing Claw DMG + 1d8 and Bleed(1).', special: 'Bleed(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 1 Extra Attack(0.5) with half your Attack Dice, dealing Claw DMG + 2d8 and Bleed(2).', special: 'Bleed(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 2 Extra Attacks(each 0.5) with half your Attack Dice, each dealing Claw DMG + 2d8 and Bleed(2).', special: 'Bleed(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 2 Extra Attacks(each 0.5) with half your Attack Dice, each dealing Claw DMG + 3d8 and Bleed(3).', special: 'Bleed(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Bite',
        tree: 'Dragon',
        powerType: 'reaction',
        description: 'A brutal snap of draconic jaws.',
        levels: [
            { level: 1, type: 'Reaction', range: 'Melee', duration: 'Instant', effect: 'Bite, −4 Attack Dice, + 2d8', special: 'Mark(1)', cost: { reaction: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Reaction', range: 'Melee', duration: 'Instant', effect: 'Bite, −3 Attack Dice, + 3d8', special: 'Mark(1)', cost: { reaction: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Reaction', range: 'Melee', duration: 'Instant', effect: 'Bite, −2 Attack Dice, + 4d8', special: 'Mark(2)', cost: { reaction: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Reaction', range: 'Melee', duration: 'Instant', effect: 'Bite, + 5d8', special: 'Mark(2)', cost: { reaction: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Tail Strike',
        tree: 'Dragon',
        powerType: 'active',
        description: 'A sweeping strike that crushes and scatters foes.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', aoe: '2m', duration: 'Instant', effect: 'Tail Attack + 2d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', aoe: '3m', duration: 'Instant', effect: 'Tail Attack + 3d8 damage', special: 'Knockback(2), Prone(1)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', aoe: '4m', duration: 'Instant', effect: 'Tail Attack + 4d8 damage', special: 'Knockback(4), Prone(2)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', aoe: '5m', duration: 'Instant', effect: 'Tail Attack + 5d8 damage', special: 'Knockback(6), Prone(2)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Dragon Roar',
        tree: 'Dragon',
        powerType: 'buff',
        description: 'The dragon\'s roar emboldens allies and terrifies enemies.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: '6m', duration: '1 round', effect: 'Up to 2 allies gain Advantage on their next Attack.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: '8m', duration: '1 round', effect: 'Up to 3 allies gain Advantage; you gain +1 Attack Die.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: '10m', duration: '1 round', effect: 'Up to 3 allies gain Advantage; you gain +2 Attack Dice.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: '12m', duration: '1 round', effect: 'Up to 4 allies gain Advantage; you gain +3 Attack Dice.', cost: { action: true } }
        ]
    },
    {
        name: 'Breath Attack',
        tree: 'Dragon',
        powerType: 'active',
        description: 'The iconic elemental exhalation of draconic power.',
        levels: [
            { level: 1, type: 'Active', range: '6m', aoe: '60° Cone', duration: 'Instant', effect: '2d8 elemental damage', cost: { action: true }, roll: { damage: '2d8', damageType: 'elemental' } },
            { level: 2, type: 'Active', range: '8m', aoe: '60° Cone', duration: 'Instant', effect: '4d8 elemental damage', cost: { action: true }, roll: { damage: '4d8', damageType: 'elemental' } },
            { level: 3, type: 'Active', range: '10m', aoe: '60° Cone', duration: 'Instant', effect: '6d8 elemental damage', cost: { action: true }, roll: { damage: '6d8', damageType: 'elemental' } },
            { level: 4, type: 'Active', range: '12m', aoe: '60° Cone', duration: 'Instant', effect: '8d8 elemental damage', cost: { action: true }, roll: { damage: '8d8', damageType: 'elemental' } }
        ]
    },
    {
        name: 'Flyby',
        tree: 'Dragon',
        powerType: 'movement',
        description: 'A deadly charge fueled by flight.',
        levels: [
            { level: 1, type: 'Movement', range: '4m', duration: 'Instant', effect: 'Move 4 m; your next attack deals +1d8 damage.', cost: { movement: true } },
            { level: 2, type: 'Movement', range: '8m', duration: 'Instant', effect: 'Move 8 m; your next attack deals +2d8 damage.', cost: { movement: true } },
            { level: 3, type: 'Movement', range: '12m', duration: 'Instant', effect: 'Move 12 m; your next attack deals +3d8 damage.', cost: { movement: true } },
            { level: 4, type: 'Movement', range: '16m', duration: 'Instant', effect: 'Move 16 m; your next attack deals +4d8 damage.', cost: { movement: true } }
        ]
    },
    {
        name: 'Wingbeat',
        tree: 'Dragon',
        powerType: 'movement',
        description: 'A mighty beat of wings scatters enemies.',
        levels: [
            { level: 1, type: 'Movement', range: 'Self', aoe: '4m', duration: 'Instant', effect: 'Ascend 8 m upward.', special: 'Knockback(2)', cost: { movement: true } },
            { level: 2, type: 'Movement', range: 'Self', aoe: '6m', duration: 'Instant', effect: 'Ascend 12 m upward.', special: 'Knockback(4)', cost: { movement: true } },
            { level: 3, type: 'Movement', range: 'Self', aoe: '8m', duration: 'Instant', effect: 'Ascend 16 m upward.', special: 'Knockback(6)', cost: { movement: true } },
            { level: 4, type: 'Movement', range: 'Self', aoe: '10m', duration: 'Instant', effect: 'Ascend 20 m upward.', special: 'Knockback(8)', cost: { movement: true } }
        ]
    },
    {
        name: 'Dragon Scales',
        tree: 'Dragon',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'Your scales deflect blades and mend wounds.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Armor and 2 Temp HP each round (non-stacking; refreshes).' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Armor and 4 Temp HP each round (non-stacking; refreshes).' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Armor and 6 Temp HP each round; also Regenerate 1d8 HP each round.' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Armor and 8 Temp HP each round; also Regenerate 2d8 HP each round.' }
        ]
    },
    {
        name: 'Draconic Presence',
        tree: 'Dragon',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'Your mere presence instills terror in lesser beings.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Enemies within 4 m become Frightened(1) at the start of each round (Save negates).' },
            { level: 2, type: 'Passive', effect: 'Enemies within 6 m become Frightened(2) at the start of each round (Save negates).' },
            { level: 3, type: 'Passive', effect: 'Enemies within 8 m become Frightened(3) at the start of each round (Save negates).' },
            { level: 4, type: 'Passive', effect: 'Enemies within 10 m become Frightened(3) at the start of each round (Save negates).' }
        ]
    }
];

