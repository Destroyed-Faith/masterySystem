/**
 * Grim Hunter Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const GRIM_HUNTER_POWERS = [
    {
        name: 'Hunter\'s Slash',
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
                specials: [{ key: 'Crit', value: 1, raiseCost: 1, note: 'if target is Marked' }]
            },
            '2': {
                lvl: 2,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Crit', value: 1, raiseCost: 1, note: 'if target is Marked' }]
            },
            '3': {
                lvl: 3,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Crit', value: 1, raiseCost: 1, note: 'if target is Marked' }]
            },
            '4': {
                lvl: 4,
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Crit', value: 1, raiseCost: 1, note: 'if target is Marked' }]
            }
        }
    },
    {
        name: 'Mark the Prey',
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
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Mark', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Mark', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Mark', value: 3, raiseCost: 3 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Mark', value: 4, raiseCost: 4 }]
            }
        }
    },
    {
        name: 'Flash Bomb',
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
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'masteryRankRounds', rounds: 1, note: 'MR Rounds + 1' },
                effect: { text: '—' },
                specials: [{ key: 'Blinded', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRankRounds', rounds: 2, note: 'MR Rounds + 2' },
                effect: { text: '—' },
                specials: [{ key: 'Blinded', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRankRounds', rounds: 4, note: 'MR Rounds + 4' },
                effect: { text: '—' },
                specials: [{ key: 'Blinded', value: 4, raiseCost: 4 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRankRounds', rounds: 5, note: 'MR Rounds + 5' },
                effect: { text: '—' },
                specials: [{ key: 'Blinded', value: 5, raiseCost: 5 }]
            }
        }
    },
    {
        name: 'Relentless Weapons',
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
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '1d8 damage (+1d8 if target < 5m)', dice: '1d8' },
                specials: [{ key: 'Penetration', value: 1, raiseCost: 1 }]
            },
            '2': {
                lvl: 2,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '2d8 damage (+1d8 if target < 5m)', dice: '2d8' },
                specials: [{ key: 'Penetration', value: 2, raiseCost: 2 }]
            },
            '3': {
                lvl: 3,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '3d8 damage (+2d8 if target < 5m)', dice: '3d8' },
                specials: [{ key: 'Penetration', value: 3, raiseCost: 3 }]
            },
            '4': {
                lvl: 4,
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: '4d8 damage (+2d8 if target < 5m)', dice: '4d8' },
                specials: [{ key: 'Penetration', value: 4, raiseCost: 4 }]
            }
        }
    },
    {
        name: 'Predictable Movement',
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
                aoe: { shape: 'aura', radiusM: 4 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Against Marked enemies\' attacks: gain +2 Armor and +4 Evade', flat: 2 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 8 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Against Marked enemies\' attacks: gain +4 Armor and +6 Evade', flat: 4 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 12 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Against Marked enemies\' attacks: gain +6 Armor and +8 Evade', flat: 6 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'aura', radiusM: 16 },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Against Marked enemies\' attacks: gain +8 Armor and +12 Evade', flat: 8 },
                specials: []
            }
        }
    },
    {
        name: 'Quickdraw',
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
                effect: { text: 'Gain +4 Initiative. If you act first in a round, your first attack this turn gains Extra Attack(1, 0.25) — one extra strike at ¼ Attack Pool', flat: 4 },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool', flat: 8 },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +12 Initiative. If you act first, your first attack this turn gains Extra Attack(2, 0.5) — one extra strike at ½ Attack Pool', flat: 12 },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +16 Initiative. If you act first, your first attack this turn gains Extra Attack(3, 0.75) — one extra strike at ¾ Attack Pool', flat: 16 },
                specials: []
            }
        }
    },
    {
        name: 'Sneak Attack',
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
                effect: { text: 'If the target is Distracted (Flanked, Blinded, Marked, or Disoriented), your attacks this round gain +1d8 damage and Crit(1)', dice: '1d8' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +2d8 damage and Crit(1)', dice: '2d8' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +3d8 damage and Crit(2)', dice: '3d8' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but +3d8 damage and Crit(2)', dice: '3d8' },
                specials: []
            }
        }
    },
    {
        name: 'Bloodhound',
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
                effect: { text: 'You gain +1 Attack Die against Marked targets' },
                specials: []
            },
            '2': {
                lvl: 2,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You gain +2 Attack Dice against Marked targets' },
                specials: []
            },
            '3': {
                lvl: 3,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You gain +4 Attack Dice against Marked targets' },
                specials: []
            },
            '4': {
                lvl: 4,
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You gain +5 Attack Dice against Marked targets' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=grim-hunter.js.map