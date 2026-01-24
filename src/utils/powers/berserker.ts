/**
 * Berserker of the Blood Moon Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const BERSERKER_POWERS: PowerDefinition[] = [
    {
        name: 'Rending Strike',
        tree: 'Berserker of the Blood Moon',
        powerType: 'active',
        description: 'A vicious swing that tears flesh and armor, best used to stack high Bleeding on a single priority target and fuel your blood-based passives.',
        levels: [
            { level: 1, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Bleeding(5)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Leaping Cleave',
        tree: 'Berserker of the Blood Moon',
        powerType: 'active',
        description: 'Leap into the fray and cut down foes in a brutal arc, best used to dive into clustered enemies and spread Bleeding across multiple targets at once.',
        levels: [
            { level: 1, type: 'Melee', range: 'Self', aoe: 'Radius 1 m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Melee', range: 'Self', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Melee', range: 'Self', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Melee', range: 'Self', aoe: 'Radius 6 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Reckless Attack',
        tree: 'Berserker of the Blood Moon',
        powerType: 'active',
        description: 'You throw caution aside and swing with brutal abandon, best used when a massive damage spike can finish a key foe or turn the fight in your favor. After resolving this attack, until the start of your next turn, attacks against you have Advantage.',
        levels: [
            { level: 1, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Until the start of your next turn, attacks against you have Advantage', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 2, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', special: 'Until the start of your next turn, attacks against you have Advantage', cost: { action: true }, roll: { damage: '+6d8', damageType: 'physical' } },
            { level: 3, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 8d8 damage', special: 'Until the start of your next turn, attacks against you have Advantage', cost: { action: true }, roll: { damage: '+8d8', damageType: 'physical' } },
            { level: 4, type: 'Melee', range: '0 m', duration: 'Instant', effect: 'Weapon DMG + 10d8 damage', special: 'Until the start of your next turn, attacks against you have Advantage', cost: { action: true }, roll: { damage: '+10d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Rage of the Blood Moon',
        tree: 'Berserker of the Blood Moon',
        powerType: 'buff',
        description: 'You let your own blood feed the fury, best used at the start of drawn-out melees where you can afford to trade your own HP for overwhelming damage every round.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +3d8 damage, suffer Bleeding(1) (self) per Attack', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +6d8 damage, suffer Bleeding(2) (self) per Attack', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +8d8 damage, suffer Bleeding(3) (self) per Attack', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +10d8 damage, suffer Bleeding(4) (self) per Attack', cost: { action: true } }
        ]
    },
    {
        name: 'Brutal Howl',
        tree: 'Berserker of the Blood Moon',
        powerType: 'utility',
        description: 'A primal scream that shakes enemy resolve, best used to blunt incoming damage from groups or to break the will of weaker foes before you close in.',
        levels: [
            { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2 m', duration: '1 Round', effect: 'Enemies in radius suffer -1 Attack Die until your next turn', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4 m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', special: 'Frightened(1)', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6 m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8 m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true } }
        ]
    },
    {
        name: 'Bloodlust',
        tree: 'Berserker of the Blood Moon',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'The scent of blood drives you deeper into frenzy, best used when you stay close to already Bleeding enemies so every swing benefits from the extra damage.',
        levels: [
            { level: 1, type: 'Passive', effect: 'While any enemy within 2 m is Bleeding, your attacks gain +3d8 damage.' },
            { level: 2, type: 'Passive', effect: 'While any enemy within 4 m is Bleeding, your attacks gain +4d8 damage.' },
            { level: 3, type: 'Passive', effect: 'While any enemy within 6 m is Bleeding, your attacks gain +5d8 damage.' },
            { level: 4, type: 'Passive', effect: 'While any enemy within 8 m is Bleeding, your attacks gain +6d8 damage.' }
        ]
    },
    {
        name: 'Blood Feast',
        tree: 'Berserker of the Blood Moon',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Your wounds knit as enemy blood spatters the ground, best used when you remain in the thick of bleeding foes so your regeneration can keep pace with the punishment you take.',
        levels: [
            { level: 1, type: 'Passive', effect: 'While any enemy or you within 2 m is Bleeding, gain Regeneration(5).' },
            { level: 2, type: 'Passive', effect: 'While any enemy or you within 4 m is Bleeding, gain Regeneration(6).' },
            { level: 3, type: 'Passive', effect: 'While any enemy or you within 6 m is Bleeding, gain Regeneration(7).' },
            { level: 4, type: 'Passive', effect: 'While any enemy or you within 8 m is Bleeding, gain Regeneration(8).' }
        ]
    }
];

