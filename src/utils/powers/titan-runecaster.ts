/**
 * Titan Runecaster (Forged) Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const TITAN_RUNECASTER_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Ember Rune',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damaging effect deals +2d8', dice: '2d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damaging effect deals +4d8', dice: '4d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damaging effect deals +6d8', dice: '6d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damaging effect deals +8d8', dice: '8d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            }
        }
    },
    {
        name: 'Tempest Rune',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damage roll gains +2d8', dice: '2d8' },
                specials: [{ key: 'Shock', rank: 1 }]
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damage roll gains +3d8', dice: '3d8' },
                specials: [{ key: 'Shock', rank: 2 }]
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damage roll gains +4d8', dice: '4d8' },
                specials: [{ key: 'Shock', rank: 2 }]
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Next damage roll gains +5d8', dice: '5d8' },
                specials: [{ key: 'Shock', rank: 3 }]
            }
        }
    },
    {
        name: 'Glacier Rune',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Repeat an AoE effect next round at ½ damage' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Repeat an AoE effect next round at ½ damage' },
                specials: [{ key: 'Freeze', rank: 2 }]
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Repeat an AoE effect next round at ½ damage' },
                specials: [{ key: 'Freeze', rank: 4 }]
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Repeat an AoE effect next round at ½ damage' },
                specials: [{ key: 'Freeze', rank: 6 }]
            }
        }
    },
    {
        name: 'Stoneheart Rune',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +1 Armor and 2d8 Temporary HP'},
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +2 Armor and 3d8 Temporary HP'},
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +3 Armor and 4d8 Temporary HP'},
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +4 Armor and 5d8 Temporary HP'},
                specials: []
            }
        }
    },
    {
        name: 'Rift Rune',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When hit, you may Teleport 4m away; if out of reach, the attack misses' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When hit, Teleport 8m away; if out of reach, the attack misses' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When hit, Teleport 12m away; if out of reach, the attack misses' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When hit, Teleport 16m away; if out of reach, the attack misses' },
                specials: []
            }
        }
    },
    {
        name: 'Titanic Resilience',
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
                effect: { text: 'Once per round, if you fail a Save, you may reroll it' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Twice per round, if you fail a Save, you may reroll it' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Thrice per round, if you fail a Save, you may reroll it' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Up to four times per round, if you fail a Save, you may reroll it' },
                specials: []
            }
        }
    }
];
