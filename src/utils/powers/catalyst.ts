/**
 * Catalyst Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const CATALYST_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Mutagenic Strike',
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
                lvl: 1,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Poison', value: 1, raiseCost: 1 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Poison', value: 2, raiseCost: 2 }]
            }
        }
    },
    {
        name: 'Reactive Serum',
        category: 'activeBuff',
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
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +2 to Attack rolls', flat: 2 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +3 to Attack rolls and +2d8 damage', dice: '2d8', flat: 3 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +4 to Attack rolls and +3d8 damage', dice: '3d8', flat: 4 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +5 to Attack rolls and +4d8 damage', dice: '4d8', flat: 5 },
                specials: []
            }
        }
    },
    {
        name: 'Toxin Cloud',
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
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies in area suffer Poison(1)' },
                specials: [{ key: 'Poison', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: 'Enemies in area suffer Poison(2)' },
                specials: [{ key: 'Poison', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: 'Enemies in area suffer Poison(3)' },
                specials: [{ key: 'Poison', value: 3, raiseCost: 3 }]
            },
            '4': {
                lvl: 4,
                type: 'utility',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: 'Enemies in area suffer Poison(4)' },
                specials: [{ key: 'Poison', value: 4, raiseCost: 4 }]
            }
        }
    },
    {
        name: 'Adaptive Mutation',
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
                effect: { text: 'Gain Regeneration(1) when you take damage' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain Regeneration(2) when you take damage' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain Regeneration(3) when you take damage and +1 Armor', flat: 1 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain Regeneration(4) when you take damage and +2 Armor', flat: 2 },
                specials: []
            }
        }
    }
];
