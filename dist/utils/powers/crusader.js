/**
 * Crusader Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const CRUSADER_POWERS = [
    {
        name: 'Overhead Blow',
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
                specials: [{ key: 'Push', value: 2, raiseCost: 2 }]
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Push', value: 4, raiseCost: 4 }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Push', value: 8, raiseCost: 8 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +6d8', dice: '6d8' },
                specials: [{ key: 'Push', value: 16, raiseCost: 16 }]
            }
        }
    },
    {
        name: 'Smiting Arc',
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
                range: { kind: 'distance', m: 2 },
                aoe: { shape: 'cone', lengthM: 2, angleDeg: 90 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Smite', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'cone', lengthM: 4, angleDeg: 90 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Smite', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'cone', lengthM: 6, angleDeg: 90 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Smite', value: 2, raiseCost: 2 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'cone', lengthM: 8, angleDeg: 90 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Smite', value: 2, raiseCost: 2 }]
            }
        }
    },
    {
        name: 'Smashing Blow',
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
                specials: [{ key: 'Prone', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Prone', value: 1, raiseCost: 1 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Prone', value: 2, raiseCost: 2 }]
            }
        }
    },
    {
        name: 'Shield Crush',
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
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8; gain +2 Armor vs that enemy until your next turn', dice: '1d8' },
                specials: [{ key: 'Stunned', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8; gain +2 Armor vs that enemy until your next turn', dice: '1d8' },
                specials: [{ key: 'Stunned', value: 1, raiseCost: 1 }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8; gain +2 Armor vs that enemy until your next turn', dice: '1d8' },
                specials: [{ key: 'Stunned', value: 2, raiseCost: 2 }]
            }
        }
    },
    {
        name: 'Inspiring Cry',
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
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Heal allies for 1d8 HP', dice: '1d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Heal allies for 2d8 HP', dice: '2d8' },
                specials: [{ key: 'Cleanse', value: 1, raiseCost: 1 }]
            },
            '3': {
                lvl: 3,
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Heal allies for 2d8 HP', dice: '2d8' },
                specials: [{ key: 'Cleanse', value: 1, raiseCost: 1 }]
            },
            '4': {
                lvl: 4,
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'instant' },
                effect: { text: 'Heal allies for 2d8 HP', dice: '2d8' },
                specials: [{ key: 'Cleanse', value: 1, raiseCost: 1 }]
            }
        }
    },
    {
        name: 'Unbreakable Vow',
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
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +4 Armor', flat: 4 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +6 Armor and become Immovable', flat: 6 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +8 Armor and become Immovable', flat: 8 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain +10 Armor and become Immovable', flat: 10 },
                specials: []
            }
        }
    },
    {
        name: 'Bolster',
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
                effect: { text: 'You and allies within 2m gain +1 Evade and +1 Save Die', flat: 1 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 4m gain +3 Evade and +1 Save Die', flat: 3 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 6m gain +3 Evade and +2 Save Dice', flat: 3 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and allies within 8m gain +5 Evade and +2 Save Dice', flat: 5 },
                specials: []
            }
        }
    },
    {
        name: 'Hold the Line',
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
                effect: { text: 'You and one ally within 2m gain +1 Armor', flat: 1 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and one ally within 4m gain +2 Armor', flat: 2 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and one ally within 6m gain +4 Armor', flat: 4 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You and one ally within 8m gain +6 Armor', flat: 6 },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=crusader.js.map