/**
 * Werewolf Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const WEREWOLF_POWERS: PowerDefinition[] = [
    {
        name: 'Lacerate',
        tree: 'Werewolf',
        powerType: 'active',
        description: 'A vicious claw strike that tears flesh and armor.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw DMG + 1d8 damage', special: 'Bleed(1), Mark(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw DMG + 2d8 damage', special: 'Bleed(2), Mark(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw DMG + 3d8 damage', special: 'Bleed(3), Mark(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw DMG + 4d8 damage', special: 'Bleed(3), Mark(3)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Rend',
        tree: 'Werewolf',
        powerType: 'active',
        description: 'Two raking blows, one heartbeat apart.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw Attack +1d8 damage', special: 'Extra Attack(0.5)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw Attack +2d8 damage', special: 'Extra Attack(0.5)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw Attack +3d8 damage', special: 'Extra Attack(0.5)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Claw Attack +4d8 damage', special: 'Extra Attack(0.5)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Bite',
        tree: 'Werewolf',
        powerType: 'reaction',
        description: 'Your fangs find flesh before the enemy\'s weapon lands.',
        levels: [
            { level: 1, type: 'Reaction', range: 'Self / 0m', duration: 'Instant', effect: 'Make a Bite dealing +1d8 damage', special: 'Mark(1)', cost: { reaction: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Reaction', range: 'Self / 0m', duration: 'Instant', effect: 'Make a Bite dealing +2d8 damage', special: 'Mark(2)', cost: { reaction: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Reaction', range: 'Self / 0m', duration: 'Instant', effect: 'Make a Bite dealing +3d8 damage', special: 'Mark(3)', cost: { reaction: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Reaction', range: 'Self / 0m', duration: 'Instant', effect: 'Make a Bite dealing +4d8 damage', special: 'Mark(4)', cost: { reaction: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Pounce',
        tree: 'Werewolf',
        powerType: 'active',
        description: 'You leap upon your prey with unstoppable force.',
        levels: [
            { level: 1, type: 'Active', range: '4m', duration: 'Instant', effect: 'Leap, then Claw Attack + 1d8 damage', special: 'Push(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '8m', duration: 'Instant', effect: 'Leap, then Claw Attack + 2d8 damage', special: 'Push(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '12m', duration: 'Instant', effect: 'Leap, then Claw Attack + 3d8 damage', special: 'Push(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '16m', duration: 'Instant', effect: 'Leap, then Claw Attack + 4d8 damage', special: 'Push(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Savage Frenzy',
        tree: 'Werewolf',
        powerType: 'buff',
        description: 'You surrender to the beast within — every strike becomes a frenzy of claws.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain Extra Attack(1) and +1d8 damage to all attacks', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain Extra Attack(2) and +1d8 damage to all attacks', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain Extra Attack(3) and +1d8 damage to all attacks', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain Extra Attack(4) and +1d8 damage to all attacks', cost: { action: true } }
        ]
    }
];

