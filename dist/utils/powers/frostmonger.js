/**
 * Frostmonger Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const FROSTMONGER_POWERS = [
    {
        name: 'Ice Lance',
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
                specials: [{ key: 'Freeze', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage', dice: '3d8' },
                specials: [{ key: 'Freeze', value: 3, raiseCost: 3 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage', dice: '4d8' },
                specials: [{ key: 'Freeze', value: 4, raiseCost: 4 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage', dice: '5d8' },
                specials: [{ key: 'Freeze', value: 5, raiseCost: 5 }]
            }
        }
    },
    {
        name: 'Winter\'s Grasp',
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
                effect: { text: '1d8 damage', dice: '1d8' },
                specials: [{ key: 'Freeze', value: 2, raiseCost: 2 }, { key: 'Entangled', value: 2, raiseCost: 2 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '1d8 damage', dice: '1d8' },
                specials: [{ key: 'Freeze', value: 3, raiseCost: 3 }, { key: 'Entangled', value: 3, raiseCost: 3 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '1d8 damage', dice: '1d8' },
                specials: [{ key: 'Freeze', value: 4, raiseCost: 4 }, { key: 'Entangled', value: 4, raiseCost: 4 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '1d8 damage', dice: '1d8' },
                specials: [{ key: 'Freeze', value: 5, raiseCost: 5 }, { key: 'Entangled', value: 5, raiseCost: 5 }]
            }
        }
    },
    {
        name: 'Avalanche',
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
                duration: { kind: 'instant' },
                effect: { text: 'Next Freeze Spell deals +3d8 damage', dice: '3d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Next Freeze Spell deals +5d8 damage', dice: '5d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Next Freeze Spell deals +7d8 damage', dice: '7d8' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Next Freeze Spell deals +9d8 damage', dice: '9d8' },
                specials: []
            }
        }
    },
    {
        name: 'Heart of Ice',
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
                effect: { text: 'Gain +2 Armor (×2 vs. Fire)', flat: 2 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Armor (×2 vs. Fire)', flat: 4 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Armor (×2 vs. Fire)', flat: 6 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor (×2 vs. Fire) and become immune to Burn/Ignite', flat: 8 },
                specials: []
            }
        }
    },
    {
        name: 'Cold-Blooded',
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
                effect: { text: 'Against Frozen targets, gain +2 Attack Dice' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against Frozen targets, gain +4 Attack Dice' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against Frozen targets, gain +6 Attack Dice and Crit(1)' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Against Frozen targets, gain +8 Attack Dice and Crit(2)' },
                specials: []
            }
        }
    },
    {
        name: 'Aura of Winter',
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
                aoe: { shape: 'aura', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2m suffer −1 Attack Die' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 4m suffer −2 Attack Dice' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 6m suffer −2 Attack Dice and −1 Save Pool' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 8m suffer −3 Attack Dice and −1 Save Pool' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=frostmonger.js.map