/**
 * Mesmer Mastery Tree Powers
 * 
 * Migrated to new structure (v0.4.18+)
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const MESMER_POWERS: NewArtifactPowerData[] = [
    {
        name: 'Mental Shackles',
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
                effect: { text: '+1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '+1d8 damage', dice: '1d8' },
                specials: [{ key: 'stunned', rank: 1 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '+1d8 damage', dice: '1d8' },
                specials: [{ key: 'stunned', rank: 1 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 24 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '+2d8 damage', dice: '2d8' },
                specials: [{ key: 'stunned', rank: 2 }]
            }
        }
    },
    {
        name: 'Nightmare Pulse',
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
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: '—' },
                specials: [{ key: 'frightened', rank: 1 }]
            },
            '2': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: '+1d8 damage', dice: '1d8' },
                specials: [{ key: 'frightened', rank: 2 }]
            },
            '3': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: '+1d8 damage', dice: '1d8' },
                specials: [{ key: 'frightened', rank: 3 }]
            },
            '4': {

                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: '+2d8 damage', dice: '2d8' },
                specials: [{ key: 'frightened', rank: 4 }]
            }
        }
    },
    {
        name: 'Psychic Strike',
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
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: '1d8 damage / round', dice: '1d8' },
                specials: []
            },
            '2': {

                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 2 },
                effect: { text: '2d8 damage / round', dice: '2d8' },
                specials: []
            },
            '3': {

                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: '2d8 damage / round', dice: '2d8' },
                specials: []
            },
            '4': {

                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 3 },
                effect: { text: '3d8 damage / round', dice: '3d8' },
                specials: []
            }
        }
    },
    {
        name: 'Mesmer Step',
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
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport up to 8m (ignores AoO)' },
                specials: []
            },
            '2': {

                type: 'movement',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport up to 16m (ignores AoO)' },
                specials: []
            },
            '3': {

                type: 'movement',
                range: { kind: 'distance', m: 24 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport up to 24m (ignores AoO)' },
                specials: []
            },
            '4': {

                type: 'movement',
                range: { kind: 'distance', m: 32 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Teleport up to 32m (ignores AoO)' },
                specials: []
            }
        }
    },
    {
        name: 'Psychic Blindspot',
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
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2m suffer Disoriented(2)' },
                specials: []
            },
            '2': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4m suffer Disoriented(3)' },
                specials: []
            },
            '3': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6m suffer Disoriented(4)' },
                specials: []
            },
            '4': {

                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8m suffer Disoriented(6)' },
                specials: []
            }
        }
    }
];
