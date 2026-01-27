/**
 * Siren Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const SIREN_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Enchanting Verse',
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
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Enemies suffer −2 dice on Mind Saves' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Enemies suffer −3 dice on Mind Saves' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Enemies suffer −4 dice on Mind Saves' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Enemies suffer −6 dice on Mind Saves' },
                specials: []
            }
        }
    },
    {
        name: 'Irresistible Performance',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'attack',
            stones: 0
        },
        roll: {
            kind: 'check',
            attribute: 'intellect',
            vs: 'save:mind'
        },
        levels: {
            '1': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: '—' },
                specials: [{ key: 'Charmed', rank: 1 }]
            },
            '2': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: '—' },
                specials: [{ key: 'Charmed', rank: 4 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: '—' },
                specials: [{ key: 'Charmed', rank: 6 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: '—' },
                specials: [{ key: 'Charmed', rank: 9 }]
            }
        }
    },
    {
        name: 'Echo of Fate',
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
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, 1 ally within 6m may reroll 1 die' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, up to 2 allies may reroll 1 die each' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, 1 ally rerolls 2 dice, or 2 allies reroll 1 die each' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, up to 2 allies reroll 1 die each, or 1 ally rerolls 2 dice' },
                specials: []
            }
        }
    },
    {
        name: 'Dancer\'s Grace',
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
                effect: { text: '+4 Evade'},
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: '+6 Evade, +2m movement'},
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: '+10 Evade, +2m movement'},
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: '+12 Evade, +4m movement'},
                specials: []
            }
        }
    },
    {
        name: 'Melody of Resilience',
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
                aoe: { shape: 'radius', m: 3 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +1 die on all Saves' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +2 dice on all Saves' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 5 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +3 dice on all Saves' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +4 dice on all Saves' },
                specials: []
            }
        }
    },
    {
        name: 'Harmony of Resolve',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When an ally within range would fail a roll or take damage',
        cost: {
            action: 'reaction',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {

                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'One ally gains +1d8 to their next roll and heals 1d8 HP', dice: '1d8' },
                specials: [],
                trigger: 'When an ally within 6m would fail a roll or take damage'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'One ally gains +2d8 to their next roll and heals 1d8 HP', dice: '2d8' },
                specials: [],
                trigger: 'When an ally within 8m would fail a roll or take damage'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'One ally gains +2d8 to their next roll and heals 2d8 HP', dice: '2d8' },
                specials: [],
                trigger: 'When an ally within 10m would fail a roll or take damage'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Up to 2 allies each gain +2d8 to their next roll and heal 2d8 HP', dice: '2d8' },
                specials: [],
                trigger: 'When an ally within 10m would fail a roll or take damage'
            }
        }
    }
];
