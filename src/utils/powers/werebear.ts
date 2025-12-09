/**
 * Werebear Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const WEREBEAR_POWERS: PowerDefinition[] = [
    {
        name: 'Maul',
        tree: 'Werebear',
        powerType: 'active',
        description: 'A single swing that shakes the earth.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage; self −2 Initiative (next round)', special: 'Push(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage; self −4 Initiative (next round)', special: 'Push(1)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage; self −6 Initiative, −2 Evade', special: 'Push(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage; self −8 Initiative, −4 Evade', special: 'Push(1)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Earthshaker Roar',
        tree: 'Werebear',
        powerType: 'utility',
        description: 'Your roar mends bone and spirit alike.',
        levels: [
            { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: 'Allies heal 1d8 HP and Cleanse(1)', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 3m', duration: 'Instant', effect: 'Allies heal 2d8 HP and Cleanse(1)', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Allies heal 3d8 HP and Cleanse(1)', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 5m', duration: 'Instant', effect: 'Allies heal 4d8 HP and Cleanse(2)', cost: { action: true } }
        ]
    },
    {
        name: 'Living Fortress',
        tree: 'Werebear',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'You are the wall.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +6 Armor; suffer −1 Initiative.' },
            { level: 2, type: 'Passive', effect: 'Gain +12 Armor; suffer −2 Initiative.' },
            { level: 3, type: 'Passive', effect: 'Gain +18 Armor; suffer −3 Initiative.' },
            { level: 4, type: 'Passive', effect: 'Gain +24 Armor; suffer −4 Initiative.' }
        ]
    },
    {
        name: 'Regeneration',
        tree: 'Werebear',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'The bear\'s wounds close before the blood can fall.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Heal 1d8 HP each round.' },
            { level: 2, type: 'Passive', effect: 'Heal 2d8 HP each round.' },
            { level: 3, type: 'Passive', effect: 'Heal 3d8 HP each round.' },
            { level: 4, type: 'Passive', effect: 'Heal 4d8 HP each round.' }
        ]
    },
    {
        name: 'Rage Unleashed',
        tree: 'Werebear',
        powerType: 'buff',
        description: 'You give up defense for unstoppable might.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Attacks deal +2d8 damage', special: 'Self: −2 Armor, −2 Evade', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Attacks deal +3d8 damage', special: 'Self: −3 Armor, −3 Evade', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Attacks deal +4d8 damage', special: 'Self: −4 Armor, −4 Evade', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Attacks deal +5d8 damage', special: 'Self: −5 Armor, −5 Evade', cost: { action: true } }
        ]
    },
    {
        name: 'Earthen Grasp',
        tree: 'Werebear',
        powerType: 'active',
        description: 'Stone and root rise at your command.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangle(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangle(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangle(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Entangle(3)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } }
        ]
    }
];

