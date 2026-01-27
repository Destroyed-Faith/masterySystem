/**
 * Sanctifier Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const SANCTIFIER_POWERS = [
    {
        name: 'Smite Evil',
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
                specials: [{ key: 'Smite', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Smite', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Smite', value: 2, raiseCost: 2 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Smite', value: 3, raiseCost: 3 }]
            }
        }
    },
    {
        name: 'Radiant Burst',
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
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: '2d8 damage to enemies', dice: '2d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage to enemies', dice: '3d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage to enemies', dice: '4d8' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: '5d8 damage to enemies', dice: '5d8' },
                specials: []
            }
        }
    },
    {
        name: 'Lay on Hands',
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
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 2d8 HP', dice: '2d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 3d8 HP', dice: '3d8' },
                specials: [{ key: 'Cleanse', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 4d8 HP', dice: '4d8' },
                specials: [{ key: 'Cleanse', value: 2, raiseCost: 2 }]
            },
            '4': {
                lvl: 4,
                type: 'utility',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Heal target for 5d8 HP', dice: '5d8' },
                specials: [{ key: 'Cleanse', value: 3, raiseCost: 3 }]
            }
        }
    },
    {
        name: 'Divine Shield',
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
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target gains +3 Armor', flat: 3 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target gains +5 Armor', flat: 5 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target gains +7 Armor and Resistance to Necrotic', flat: 7 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Target gains +10 Armor and Resistance to Necrotic', flat: 10 },
                specials: []
            }
        }
    },
    {
        name: 'Aura of Purity',
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
                effect: { text: 'Allies within 2m gain Regeneration(1)' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Allies within 4m gain Regeneration(2)' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Allies within 6m gain Regeneration(3) and +1 to Saves' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Allies within 8m gain Regeneration(4) and +2 to Saves' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=sanctifier.js.map