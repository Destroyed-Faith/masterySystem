/**
 * Ravenlord Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const RAVENLORD_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Murder of Crows',
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
                lvl: 1,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '2d8 damage', dice: '2d8' },
                specials: [{ key: 'Blinded', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'Blinded', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Blinded', value: 1, raiseCost: 1 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Blinded', value: 1, raiseCost: 1 }]
            }
        }
    },
    {
        name: 'Shadow of the Old Forest',
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
                lvl: 1,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies suffer −2 Evade' },
                specials: [{ key: 'Frightened', value: 2, raiseCost: 2 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies suffer −4 Evade' },
                specials: [{ key: 'Frightened', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', radiusM: 5 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies suffer −4 Evade, −1 Save' },
                specials: [{ key: 'Frightened', value: 2, raiseCost: 2 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies suffer −6 Evade, −2 Saves' },
                specials: [{ key: 'Frightened', value: 3, raiseCost: 3 }]
            }
        }
    },
    {
        name: 'Withering Word',
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
                lvl: 1,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '2d8 damage', dice: '2d8' },
                specials: [{ key: 'Soulburn', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'Soulburn', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Soulburn', value: 2, raiseCost: 2 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Soulburn', value: 2, raiseCost: 2 }]
            }
        }
    },
    {
        name: 'Raven Messenger',
        category: 'utility',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'utility',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'One ally gains +2 Initiative and +1 Attack Die', flat: 2 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'One ally gains +2 Initiative and +3 Attack Dice', flat: 2 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'One ally gains +4 Initiative, +4 Attack Dice, and Crit(1)', flat: 4 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'utility',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'One ally gains +4 Initiative, Advantage, and Crit(2)', flat: 4 },
                specials: []
            }
        }
    },
    {
        name: 'Eyes of the Raven',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Initiative and +2 Perception. You may summon a Raven Familiar (1 HP, Speed 10m, Fly, Perception +4). It can scout but cannot attack', flat: 2 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Initiative and +4 Perception. The Familiar may use Help once per round (grant Advantage to an ally\'s Perception or Attack vs. a Marked enemy within 4m)', flat: 4 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Initiative and +6 Perception. The Familiar may apply Mark(1) once per encounter as a free action to an enemy within 8m', flat: 6 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Initiative and +8 Perception; you cannot be Surprised. The Familiar may use Help twice per round, and you may see/hear through it for 1 round per Mastery Rank', flat: 8 },
                specials: []
            }
        }
    },
    {
        name: 'Old Pact',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the end of your turn, all allies within 4m heal 1d8 HP', dice: '1d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the end of your turn, all allies within 6m heal 2d8 HP', dice: '2d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the end of your turn, all allies within 8m heal 3d8 HP', dice: '3d8' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 10 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the end of your turn, all allies within 10m heal 3d8 HP, and ignore 1 Wound Penalty until your next turn', dice: '3d8' },
                specials: []
            }
        }
    },
    {
        name: 'Runes of the Forgotten Pact',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'All your Spells gain +1 Free Raise' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When a Spell hits, it deals +1d8 Psychic Damage', dice: '1d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells ignore 2 Armor' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you cast a Spell, all allies within 4m heal 1d8 HP', dice: '1d8' },
                specials: []
            }
        }
    },
    {
        name: 'Lord of Shadows',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: {
            action: 'utility',
            stones: 0
        },
        roll: {
            kind: 'none'
        },
        levels: {
            '1': {
                lvl: 1,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4m suffer −1 die on all Mind/Spirit Saves' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6m suffer −2 dice on all Mind/Spirit Saves' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8m suffer −3 dice on all Mind/Spirit Saves' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 10 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 10m suffer −4 dice on all Mind/Spirit Saves' },
                specials: []
            }
        }
    }
];
