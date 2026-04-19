/**
 * Wild Stalker Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const WILD_STALKER_POWERS = [
    {
        name: 'Shackles',
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
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'entangled', rank: 2 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'entangled', rank: 3 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 24 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'entangled', rank: 4 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 32 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'entangled', rank: 5 }, { key: 'prone', rank: 1 }]
            }
        }
    },
    {
        name: 'Verdant Shackles',
        category: 'active',
        tags: [],
        rank: 1,
        cost: {
            action: 'none',
            stones: 0
        },
        roll: {
            kind: 'attack',
            attribute: 'might'
        },
        levels: {
            '1': {
                type: 'utility',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Weapon DMG' },
                specials: [{ key: 'entangled', rank: 1 }]
            },
            '2': {
                type: 'utility',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'radius', m: 3 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'entangled', rank: 2 }]
            },
            '3': {
                type: 'utility',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'entangled', rank: 3 }]
            },
            '4': {
                type: 'utility',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'entangled', rank: 4 }]
            }
        }
    },
    {
        name: 'Panic in Their Eyes',
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
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'frightened', rank: 2, note: 'if target is Entangled' }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'frightened', rank: 3, note: 'if Entangled' }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'frightened', rank: 4, note: 'if Entangled' }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'frightened', rank: 5, note: 'if Entangled' }]
            }
        }
    },
    {
        name: 'Predator\'s Gaze',
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
                effect: { text: 'vs Frightened: −4 Evade + +1d8 damage', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'vs Frightened: −6 Evade + +2d8 damage', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'vs Frightened: −8 Evade + +3d8 damage + Crit(1)', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'vs Frightened: −10 Evade + +4d8 damage + Crit(2)', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Bullseye',
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
                type: 'ranged',
                range: { kind: 'distance', m: 0, note: 'Weapon range' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'penetration', rank: 1, note: 'if target is Entangled or Frightened' }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 0, note: 'Weapon range' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'penetration', rank: 2, note: 'if Entangled or Frightened' }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 0, note: 'Weapon range' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'penetration', rank: 3, note: 'if Entangled or Frightened' }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 0, note: 'Weapon range' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'penetration', rank: 4, note: 'if Entangled or Frightened' }]
            }
        }
    },
    {
        name: 'Green Hell',
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
                effect: { text: 'End of your turn: if you were Hidden and you dealt damage or applied Entangle, one affected enemy becomes Frightened(2)' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, plus Expose(1)' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but Frightened(4) and Expose(4)' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'As above, but Frightened(5) and Expose(6)' },
                specials: []
            }
        }
    },
    {
        name: 'Camouflage',
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
                effect: { text: 'While Hidden, gain +4 Evade' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Hidden, gain +8 Evade' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Hidden, gain +13 Evade' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While Hidden, gain +17 Evade' },
                specials: []
            }
        }
    },
    {
        name: 'Not Here!',
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
                effect: { text: 'Gain +3 Concealment and +4 Initiative' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Concealment and +8 Initiative' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +9 Concealment and +12 Initiative' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +12 Concealment and +16 Initiative' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=wild-stalker.js.map