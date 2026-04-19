/**
 * Forgemaster Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const FORGEMASTER_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Thunder Fists',
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
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Unarmed strikes deal +2d8 Damage and inflict Shock(1)', dice: '2d8' },
                specials: [{ key: 'shock', rank: 1 }]
            },
            '2': {

                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Unarmed strikes deal +4d8 Damage and inflict Shock(1)', dice: '4d8' },
                specials: [{ key: 'shock', rank: 1 }]
            },
            '3': {

                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Unarmed strikes deal +6d8 Damage and inflict Shock(1)', dice: '6d8' },
                specials: [{ key: 'shock', rank: 1 }]
            },
            '4': {

                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Unarmed strikes deal +8d8 Damage and inflict Shock(1)', dice: '8d8' },
                specials: [{ key: 'shock', rank: 1 }]
            }
        }
    },
    {
        name: 'Defensive Field',
        category: 'reaction',
        tags: [],
        rank: 1,
        trigger: 'When struck',
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
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain 10 temporary HP'},
                specials: [],
                trigger: 'When struck'
            },
            '2': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain 20 temporary HP'},
                specials: [],
                trigger: 'When struck'
            },
            '3': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain 30 temporary HP'},
                specials: [],
                trigger: 'When struck'
            },
            '4': {

                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain 40 temporary HP'},
                specials: [],
                trigger: 'When struck'
            }
        }
    },
    {
        name: 'Arcane Surge',
        category: 'active',
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

                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Weapon deals +1d8 Arcane Damage', dice: '1d8' },
                specials: [{ key: 'push', rank: 1 }]
            },
            '2': {

                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Weapon deals +2d8 Arcane Damage', dice: '2d8' },
                specials: [{ key: 'push', rank: 2 }]
            },
            '3': {

                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: 'Weapon deals +3d8 Arcane Damage', dice: '3d8' },
                specials: [{ key: 'push', rank: 2 }]
            },
            '4': {

                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: 'Up to 2 Weapons deal +4d8 Arcane Damage', dice: '4d8' },
                specials: [{ key: 'push', rank: 2 }]
            }
        }
    },
    {
        name: 'Lightning Launcher',
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
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'line', lengthM: 2, widthM: 1 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Ranged attacks deal +2d8 Damage', dice: '2d8' },
                specials: []
            },
            '2': {

                type: 'buff',
                range: { kind: 'distance', m: 15 },
                aoe: { shape: 'line', lengthM: 3, widthM: 1 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Ranged attacks deal +4d8 Damage', dice: '4d8' },
                specials: []
            },
            '3': {

                type: 'buff',
                range: { kind: 'distance', m: 18 },
                aoe: { shape: 'line', lengthM: 3, widthM: 1 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Ranged attacks deal +6d8 Damage', dice: '6d8' },
                specials: []
            },
            '4': {

                type: 'buff',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'line', lengthM: 4, widthM: 1 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Ranged attacks deal +8d8 Damage', dice: '8d8' },
                specials: []
            }
        }
    },
    {
        name: 'Guardian Model',
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
                effect: { text: 'Gain +3 Armor while wearing medium or heavy armor'},
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Armor while wearing medium or heavy armor'},
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor while wearing medium or heavy armor'},
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +10 Armor while wearing medium or heavy armor'},
                specials: []
            }
        }
    },
    {
        name: 'Infiltrator Model',
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
                effect: { text: 'Gain +3 Evade and +1 Armor'},
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Evade, +1 Armor, and +2m movement'},
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Evade, +1 Armor, and +3m movement'},
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +10 Evade, +1 Armor, and +4m movement'},
                specials: []
            }
        }
    }
];
