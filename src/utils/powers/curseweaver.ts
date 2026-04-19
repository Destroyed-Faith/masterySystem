/**
 * Curseweaver Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const CURSEWEAVER_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Hexbolt',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'intellect'
        },
        levels: {
            '1': {

                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '1d8 damage', dice: '1d8' },
                specials: [{ key: 'curse', rank: 1 }]
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'curse', rank: 1 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'curse', rank: 2 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '6d8 damage', dice: '6d8' },
                specials: [{ key: 'curse', rank: 2 }]
            }
        }
    },
    {
        name: 'Web of Malice',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer −1 Attack Die' },
                specials: []
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer −2 Attack Dice, −1 Save Die' },
                specials: [{ key: 'mark', rank: 1 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer −2 Attack Dice, −1 Save Die' },
                specials: [{ key: 'mark', rank: 2 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer −3 Attack Dice, −1 Save Die' },
                specials: [{ key: 'mark', rank: 2 }]
            }
        }
    },
    {
        name: 'Curseweaver',
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
                effect: { text: 'You deal +1d8 damage per Cursed enemy (max +1d8)', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You deal +1d8 damage per Cursed enemy (max +2d8)', dice: '1d8' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You deal +2d8 damage per Cursed enemy (max +4d8)', dice: '2d8' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You deal +2d8 damage per Cursed enemy (max +6d8)', dice: '2d8' },
                specials: []
            }
        }
    },
    {
        name: 'Dance of Shadows',
        category: 'activeBuff',
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

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport 4m (shadow → shadow); gain Advantage and +1d8 damage on your next attack', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport 6m; gain Advantage and +3d8 damage on your next attack', dice: '3d8' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport 8m; gain Advantage and +5d8 damage on your next attack', dice: '5d8' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport 10m; gain Advantage and +7d8 damage on your next attack', dice: '7d8' },
                specials: []
            }
        }
    },
    {
        name: 'Dark Omen',
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
                effect: { text: 'Gain +2 Initiative and +2 Concealment while at least 1 enemy is Cursed'},
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Initiative and +4 Concealment while at least 1 enemy is Cursed'},
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Initiative and +6 Concealment while at least 2 enemies are Cursed or Marked'},
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Initiative and +8 Concealment while at least 3 enemies are Cursed or Marked'},
                specials: []
            }
        }
    }
];
