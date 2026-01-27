/**
 * Battlemage Mastery Tree Powers
 *
 * Migrated to new structure (v0.4.18+)
 */
export const BATTLEMAGE_POWERS = [
    {
        name: 'Arcane Combustion',
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
                effect: { text: 'All Spells with the Ignite Special gain +2 automatic Raises' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'All Spells with the Ignite Special gain +3 automatic Raises' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'All Spells with the Ignite Special gain +4 automatic Raises' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'All Spells with the Ignite Special gain +6 automatic Raises' },
                specials: []
            }
        }
    },
    {
        name: 'Flameguard',
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
                effect: { text: 'While you have Ignite on yourself, gain +3 Armor' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite, gain +5 Armor' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite, gain +7 Armor' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite, gain +11 Armor' },
                specials: []
            }
        }
    },
    {
        name: 'Elemental Focus',
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
                effect: { text: 'Spells with the Ignite Special: +2 Pool to the Spell Roll' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special: +4 Pool to the Spell Roll' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special: +6 Pool to the Spell Roll' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special: +8 Pool to the Spell Roll' },
                specials: []
            }
        }
    },
    {
        name: 'Combustion Surge',
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
                effect: { text: 'Your next Spells with the Ignite Special deals +2d8 damage', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spells with the Ignite Special deals +4d8 damage', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spells with the Ignite Special deals +6d8 damage', dice: '6d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spells with the Ignite Special deals +8d8 damage', dice: '8d8' },
                specials: []
            }
        }
    },
    {
        name: 'Inferno Core',
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
                effect: { text: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +1' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +2' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +3' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', m: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +4' },
                specials: []
            }
        }
    },
    {
        name: 'Flamewave',
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
                effect: { text: 'Once per round, when you cast a Spell, also apply Ignite(1) to all affected enemies by the spell' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when you cast a Spell, also apply Ignite(2) to all affected enemies by the spell' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when you cast a Spell, also apply Ignite(4) to all affected enemies by the spell' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, when you cast a Spell, also apply Ignite(5) to all affected enemies by the spell' },
                specials: []
            }
        }
    },
    {
        name: 'Phoenix Mantle',
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
                effect: { text: 'While you have Ignite ≥ 4, gain Regeneration(1) and +2 Armor' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite ≥ 4, gain Regeneration(3) and +3 Armor' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite ≥ 4, gain Regeneration(5) and +4 Armor' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While you have Ignite ≥ 4, gain Regeneration(7) and +5 Armor' },
                specials: []
            }
        }
    },
    {
        name: 'Immolation Strike',
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
                effect: { text: 'Make a weapon attack. On hit, deal +1d8 damage and apply Ignite(1)', dice: '1d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a weapon attack. On hit, deal +2d8 damage and apply Ignite(1)', dice: '2d8' },
                specials: [{ key: 'Ignite', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a weapon attack. On hit, deal +3d8 damage and apply Ignite(2)', dice: '3d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a weapon attack. On hit, deal +4d8 damage and apply Ignite(2)', dice: '4d8' },
                specials: [{ key: 'Ignite', rank: 2 }]
            }
        }
    }
];
//# sourceMappingURL=battlemage.js.map