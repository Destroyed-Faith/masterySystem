/**
 * Juggernaut Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const JUGGERNAUT_POWERS: PowerDefinition[] = [
    {
        name: 'Iron Slam',
        tree: 'Juggernaut',
        powerType: 'active',
        description: 'A piledriver smash that sends bodies flying, best used to punt foes off objectives or drive them back through their own ranks.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Push(8)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(8), Prone(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Push(12), Prone(1)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Earthshaker Stomp',
        tree: 'Juggernaut',
        powerType: 'active',
        description: 'You quake the ground so nearby foes buckle and fall, best used when you are surrounded or want to stop a charge in place.',
        levels: [
            { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG (no bonus dice)', special: 'Prone(1)', cost: { action: true } },
            { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Trample',
        tree: 'Juggernaut',
        powerType: 'movement',
        description: 'You surge forward as living siege anything in your path is crushed, best used to cross the battlefield, clip multiple enemies and trigger your movement-based passives. Replaces your Movement this round; does not provoke Reactions.',
        levels: [
            { level: 1, type: 'Movement', aoe: 'Line 4m', duration: 'Instant', effect: 'Creatures you pass through take 1d8 damage (once per creature)', cost: { movement: true }, roll: { damage: '1d8', damageType: 'physical' } },
            { level: 2, type: 'Movement', aoe: 'Line 8m', duration: 'Instant', effect: 'Creatures you pass through take 1d8 damage (once per creature)', cost: { movement: true }, roll: { damage: '1d8', damageType: 'physical' } },
            { level: 3, type: 'Movement', aoe: 'Line 12m', duration: 'Instant', effect: 'Creatures you pass through take 2d8 damage (once per creature)', cost: { movement: true }, roll: { damage: '2d8', damageType: 'physical' } },
            { level: 4, type: 'Movement', aoe: 'Line 16m', duration: 'Instant', effect: 'Creatures you pass through take 2d8 damage (once per creature)', cost: { movement: true }, roll: { damage: '2d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Juggernaut Shockline',
        tree: 'Juggernaut',
        powerType: 'active',
        description: 'A rending shockwave tears a straight path through the battle line, best used to soften clustered enemies or carve a corridor for your allies.',
        levels: [
            { level: 1, type: 'Active', range: 'Self', aoe: 'Line 6m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Self', aoe: 'Line 10m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Self', aoe: 'Line 12m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Self', aoe: 'Line 14m', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', cost: { action: true }, roll: { damage: '+6d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Momentum',
        tree: 'Juggernaut',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your strikes hit harder once you\'ve built speed, best used when you chain long advances into heavy attacks every round.',
        levels: [
            { level: 1, type: 'Passive', effect: 'If you move ≥ 6 m in a straight line and end in an attack this turn, your attacks gain +1d8 damage this turn.' },
            { level: 2, type: 'Passive', effect: 'As above, but +2d8 damage.' },
            { level: 3, type: 'Passive', effect: 'As above, but +3d8 damage.' },
            { level: 4, type: 'Passive', effect: 'As above, but +4d8 damage.' }
        ]
    },
    {
        name: 'Immovable Object',
        tree: 'Juggernaut',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'Once you commit, nothing throws you off balance, best used when you expect heavy control effects as you crash through enemy lines.',
        levels: [
            { level: 1, type: 'Passive', effect: 'If you move ≥ 6 m in a straight line and end in an attack, you are immune to Prone until your next turn and heal 1d8 at the start of your next turn.' },
            { level: 2, type: 'Passive', effect: 'As above, but also immune to Push until your next turn (still heal 1d8).' },
            { level: 3, type: 'Passive', effect: 'As above, but also immune to Entangled; heal 2d8 at the start of your next turn.' },
            { level: 4, type: 'Passive', effect: 'As above, but also immune to Stunned; heal 2d8 at the start of your next turn.' }
        ]
    }
];

