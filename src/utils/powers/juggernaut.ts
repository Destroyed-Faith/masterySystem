/**
 * Juggernaut Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const JUGGERNAUT_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Iron Slam',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'push', rank: 2 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'push', rank: 8 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'push', rank: 12 }, { key: 'prone', rank: 1 }]
            }
        }
    },
    {
        name: 'Earthshaker Stomp',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG (no bonus dice)' },
                specials: [{ key: 'prone', rank: 1 }]
            },
            '2': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'prone', rank: 1 }]
            },
            '3': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'prone', rank: 1 }]
            },
            '4': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'prone', rank: 1 }]
            }
        }
    },
    {
        name: 'Trample',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: {
            action: 'movement',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 4, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Creatures you pass through take 1d8 damage (once per creature)', dice: '1d8'},
                specials: []
            },
            '2': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 8, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Creatures you pass through take 1d8 damage (once per creature)', dice: '1d8'},
                specials: []
            },
            '3': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 12, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Creatures you pass through take 2d8 damage (once per creature)', dice: '2d8'},
                specials: []
            },
            '4': {

                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 16, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Creatures you pass through take 2d8 damage (once per creature)', dice: '2d8'},
                specials: []
            }
        }
    },
    {
        name: 'Juggernaut Shockline',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 6, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 10, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: []
            },
            '3': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 12, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: []
            },
            '4': {

                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'line', lengthM: 14, widthM: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +6d8', dice: '6d8' },
                specials: []
            }
        }
    },
    {
        name: 'Momentum',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you move ≥6m in a straight line and end in an attack this turn, your attacks gain +1d8 damage this turn', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +3d8 damage', dice: '3d8' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +4d8 damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Immovable Object',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you move ≥6m in a straight line and end in an attack, you are immune to Prone until your next turn and heal 1d8 at the start of your next turn', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but also immune to Push until your next turn (still heal 1d8)', dice: '1d8' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but also immune to Entangled; heal 2d8 at the start of your next turn', dice: '2d8' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but also immune to Stunned; heal 2d8 at the start of your next turn', dice: '2d8' },
                specials: []
            }
        }
    }
];
