/**
 * Berserker of the Blood Moon Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const BERSERKER_POWERS = [
    {
        name: 'Rending Strike',
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
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Bleeding', rank: 3 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Bleeding', rank: 4 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8', dice: '5d8' },
                specials: [{ key: 'Bleeding', rank: 5 }]
            }
        }
    },
    {
        name: 'Leaping Cleave',
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
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Bleeding', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Bleeding', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Bleeding', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Bleeding', rank: 4 }]
            }
        }
    },
    {
        name: 'Reckless Attack',
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
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Advantage', note: 'Until the start of your next turn, attacks against you have Advantage' }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +6d8', dice: '6d8' },
                specials: [{ key: 'Advantage', note: 'Until the start of your next turn, attacks against you have Advantage' }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +8d8', dice: '8d8' },
                specials: [{ key: 'Advantage', note: 'Until the start of your next turn, attacks against you have Advantage' }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +10d8', dice: '10d8' },
                specials: [{ key: 'Advantage', note: 'Until the start of your next turn, attacks against you have Advantage' }]
            }
        }
    },
    {
        name: 'Rage of the Blood Moon',
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
                effect: { text: 'Gain +3d8 damage, suffer Bleeding(1) (self) per Attack', dice: '3d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +6d8 damage, suffer Bleeding(2) (self) per Attack', dice: '6d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8d8 damage, suffer Bleeding(3) (self) per Attack', dice: '8d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +10d8 damage, suffer Bleeding(4) (self) per Attack', dice: '10d8' },
                specials: []
            }
        }
    },
    {
        name: 'Brutal Howl',
        category: 'active',
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
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 2 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies in radius suffer -1 Attack Die until your next turn' },
                specials: []
            },
            '2': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer -1 Attack Die until your next turn' },
                specials: [{ key: 'Frightened', rank: 1 }]
            },
            '3': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer -2 Attack Dice until your next turn' },
                specials: [{ key: 'Frightened', rank: 1 }]
            },
            '4': {
                type: 'utility',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Enemies suffer -2 Attack Dice until your next turn' },
                specials: [{ key: 'Frightened', rank: 1 }]
            }
        }
    },
    {
        name: 'Bloodlust',
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
                effect: { text: 'While any enemy within 2 m is Bleeding, your attacks gain +3d8 damage', dice: '3d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy within 4 m is Bleeding, your attacks gain +4d8 damage', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy within 6 m is Bleeding, your attacks gain +5d8 damage', dice: '5d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy within 8 m is Bleeding, your attacks gain +6d8 damage', dice: '6d8' },
                specials: []
            }
        }
    },
    {
        name: 'Blood Feast',
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
                effect: { text: 'While any enemy or you within 2 m is Bleeding, gain Regeneration(5)' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 4 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy or you within 4 m is Bleeding, gain Regeneration(6)' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy or you within 6 m is Bleeding, gain Regeneration(7)' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy or you within 8 m is Bleeding, gain Regeneration(8)' },
                specials: []
            }
        }
    }
];
//# sourceMappingURL=berserker.js.map