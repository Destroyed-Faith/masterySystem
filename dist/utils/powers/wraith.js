/**
 * Wraith Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const WRAITH_POWERS = [
    {
        name: 'Wraith Form',
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
                effect: { text: 'Become Desolidified; move through walls and creatures; ignore the first attack that hits you' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'As above; ignore 2 attacks' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'As above; ignore 3 attacks' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'As above; ignore 4 attacks' },
                specials: []
            }
        }
    },
    {
        name: 'Wraith\'s Chill',
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
                effect: { text: 'While Desolidified, enemies in Radius 2m suffer Freeze(2) at the start of their turn' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Desolidified, enemies in Radius 2m suffer Freeze(3) at the start of their turn' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Desolidified, enemies in Radius 2m suffer Freeze(4) at the start of their turn' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 3 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Desolidified, enemies in Radius 3m suffer Freeze(4) at the start of their turn' },
                specials: []
            }
        }
    },
    {
        name: 'Soul Chill',
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
                specials: [{ key: 'Freeze', rank: 1 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'Freeze', rank: 2 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Freeze', rank: 3 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Freeze', rank: 4 }]
            }
        }
    },
    {
        name: 'Terror\'s Grasp',
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
                aoe: { shape: 'radius', m: 1, note: 'Adjacent' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Adjacent enemies suffer Frightened(1) while they remain adjacent' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within Radius 2m suffer Frightened(2)' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within Radius 4m suffer Frightened(4)' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within Radius 6m suffer Frightened(6)' },
                specials: []
            }
        }
    },
    {
        name: 'Echo of the Grave',
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
                effect: { text: 'Whenever an enemy dies, regain 2d8 HP', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Whenever an enemy dies, regain 3d8 HP', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Whenever an enemy dies, regain 5d8 HP', dice: '5d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Whenever an enemy dies, regain 6d8 HP', dice: '6d8' },
                specials: []
            }
        }
    },
    {
        name: 'Dread Aura',
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
                effect: { text: 'Enemies within 2m suffer −1 die on all Mind/Spirit Saves' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4m suffer −2 dice on all Mind/Spirit Saves' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6m suffer −2 dice on all Mind/Spirit Saves' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8m suffer −3 dice on all Mind/Spirit Saves' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=wraith.js.map