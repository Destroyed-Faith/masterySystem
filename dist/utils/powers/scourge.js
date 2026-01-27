/**
 * Scourge Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const SCOURGE_POWERS = [
    {
        name: 'Blood Offering',
        category: 'utility',
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
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE heal 1d8; you take 1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE heal 2d8; you take 2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE heal 3d8; you take 3d8 damage', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'utility',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'instant' },
                effect: { text: 'Allies in AoE heal 4d8; you take 4d8 damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Scourging Light',
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
                effect: { text: 'Allies in AoE gain +1 Attack Die; you take 1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +2 Attack Dice; you take 2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +3 Attack Dice; you take 3d8 damage', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Allies in AoE gain +4 Attack Dice; you take 4d8 damage', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Penance Lash',
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
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 2d8 damage; you take 1d8 damage', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 1 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 3d8 damage; you take 2d8 damage', dice: '3d8' },
                specials: [{ key: 'Bleeding', rank: 2 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 4d8 damage; you take 2d8 damage', dice: '4d8' },
                specials: [{ key: 'Bleeding', rank: 3 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'instant' },
                effect: { text: 'Enemies in AoE take 5d8 damage; you take 3d8 damage', dice: '5d8' },
                specials: [{ key: 'Bleeding', rank: 4 }]
            }
        }
    },
    {
        name: 'Martyr\'s Resilience',
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
                effect: { text: 'Whenever you damage yourself with a Scourge ability, gain +3 Armor until the start of your next turn' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, and also gain Regeneration(3)' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, with +6 Armor and Regeneration(4)' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, with +7 Armor and Regeneration(5)' },
                specials: []
            }
        }
    },
    {
        name: 'Aura of Atonement',
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
                effect: { text: 'When you lose HP from your own abilities, enemies within 2m take 1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, enemies within 4m take 2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, enemies within 8m take 2d8 damage', dice: '2d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, enemies within 10m take 2d8 damage', dice: '2d8' },
                specials: []
            }
        }
    },
    {
        name: 'Blood for Blood',
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
                effect: { text: 'When you lose HP from your own abilities, allies within 2m heal 1d8 HP', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, allies within 4m heal 2d8 HP', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, allies within 6m heal 2d8 HP', dice: '2d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'When you lose HP from your own abilities, allies within 8m heal 3d8 HP', dice: '3d8' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=scourge.js.map