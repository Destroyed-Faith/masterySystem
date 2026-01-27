/**
 * Alchemist Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const ALCHEMIST_POWERS = [
    {
        name: 'Alchemical Bomb',
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
                aoe: { shape: 'radius', m: 1 },
                duration: { kind: 'instant' },
                effect: { text: '2d8 damage', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', m: 3 },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            }
        }
    },
    {
        name: 'Acid Flask',
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
                effect: { text: '2d8 damage', dice: '2d8' },
                specials: [{ key: 'Corrode', rank: 1 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'Corrode', rank: 2 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Corrode', rank: 3 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Corrode', rank: 4 }]
            }
        }
    },
    {
        name: 'Healing Elixir',
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
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 2d8 HP', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 3d8 HP and grant Regeneration(1) for 2 rounds', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 4d8 HP and grant Regeneration(2) for 2 rounds', dice: '4d8' },
                specials: []
            },
            '4': {
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 5d8 HP and grant Regeneration(3) for 3 rounds', dice: '5d8' },
                specials: []
            }
        }
    },
    {
        name: 'Transmutation',
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
                effect: { text: 'Target gains +2 to one attribute' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target gains +3 to one attribute' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target gains +4 to one attribute and +2 Armor' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Target gains +5 to one attribute and +4 Armor' },
                specials: []
            }
        }
    },
    {
        name: 'Volatile Mixture',
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
                effect: { text: 'Alchemical attacks deal +1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Alchemical attacks deal +2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Alchemical attacks deal +3d8 damage and ignore 2 Armor', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Alchemical attacks deal +4d8 damage and ignore 4 Armor', dice: '4d8' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=alchemist.js.map