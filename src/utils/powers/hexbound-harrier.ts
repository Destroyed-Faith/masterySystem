/**
 * Hexbound Harrier Mastery Tree Powers
 *
 * Theme: A mobile martial setup striker who applies Hex through cursed weapons,
 * keeps prey exposed and pressured, and creates perfect targets for allied
 * spellcasters.
 * Role: Skirmisher / Setup Striker / Anti-Caster Support
 * Primary Special: Hex
 * Secondary Special: Expose
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const HEXBOUND_HARRIER_POWERS: NewArtifactPowerData[] = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Witch Mark',
        fluff: 'A shallow cut is enough when the curse does the deeper work.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Hex', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Hex', rank: 3 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Hex', rank: 4 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Hex', rank: 5 }]
            }
        }
    },
    {
        name: 'Open Rib',
        fluff: 'You pry the posture apart so something worse can get in.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Expose', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Expose', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Expose', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Expose', rank: 2 }]
            }
        }
    },
    {
        name: 'Spellbait',
        fluff: "You make the target commit to you, which is exactly what your caster wanted.",
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8 damage', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: 'Hex Feint',
        fluff: 'Once the pact is already on them, even a fake becomes a real wound.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage vs. Hexed target', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage vs. Hexed target', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +6d8 damage vs. Hexed target', dice: '6d8' },
                specials: []
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +8d8 damage vs. Hexed target', dice: '8d8' },
                specials: []
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Carrion Instinct',
        fluff: 'A Hexed target simply stops looking difficult to hit.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +1 Attack Die against Hexed targets.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Attack Dice against Hexed targets.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Attack Dice against Hexed targets.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Attack Dice against Hexed targets.' },
                specials: []
            }
        }
    },
    {
        name: 'Crow Cuts',
        fluff: 'Every curse gives you one more place to cut.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Hexed target, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Hexed target, add +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Hexed target, add +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Hexed target, add +6d8 damage.', dice: '6d8' },
                specials: []
            }
        }
    },
    {
        name: 'Lean Ward',
        fluff: 'You survive just long enough to hand the prey to worse things.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Armor and 1d8 Temporary HP at the start of combat.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Armor and 1d8 Temporary HP at the start of combat.', dice: '1d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Armor and 2d8 Temporary HP at the start of combat.', dice: '2d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor and 2d8 Temporary HP at the start of combat.', dice: '2d8' },
                specials: []
            }
        }
    },
    {
        name: "Witch's Timing",
        fluff: 'You know exactly when to make the target unsafe for magic.',
        category: 'passive',
        tags: [],
        rank: 1,
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Initiative.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Initiative.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +12 Initiative.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +16 Initiative.' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Hand It Over',
        fluff: 'If the prey acts like it still belongs to itself, you remind it otherwise.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target attacks someone other than you.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +1d8 damage.', dice: '1d8' },
                trigger: 'A Hexed target attacks someone other than you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +2d8 damage.', dice: '2d8' },
                trigger: 'A Hexed target attacks someone other than you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +3d8 damage.', dice: '3d8' },
                trigger: 'A Hexed target attacks someone other than you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack against it; on hit, deal +4d8 damage.', dice: '4d8' },
                trigger: 'A Hexed target attacks someone other than you.',
                specials: []
            }
        }
    },
    {
        name: 'Drag the Sign',
        fluff: 'The curse does not stay where the prey wants it.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target moves more than 4 m.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'Hex', rank: 1, note: '+1 to existing stack' }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'Hex', rank: 2, note: '+2 to existing stack' }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'Hex', rank: 3, note: '+3 to existing stack' }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'Hex', rank: 4, note: '+4 to existing stack' }]
            }
        }
    },
    {
        name: 'Sidestep the Ritual',
        fluff: 'You keep the line open without dying in it.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target attacks you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Armor and +2 Evade against that attack.' },
                trigger: 'A Hexed target attacks you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Armor and +4 Evade against that attack.' },
                trigger: 'A Hexed target attacks you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 Armor and +6 Evade against that attack.' },
                trigger: 'A Hexed target attacks you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Armor and +8 Evade against that attack.' },
                trigger: 'A Hexed target attacks you.',
                specials: []
            }
        }
    },
    {
        name: 'Spell Window',
        fluff: 'You do not take the kill. You create the instant when taking it becomes trivial.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target misses you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'The next Spell that hits that target before the end of the next turn gains +1d8 damage.', dice: '1d8' },
                trigger: 'A Hexed target misses you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'The next Spell that hits that target before the end of the next turn gains +2d8 damage.', dice: '2d8' },
                trigger: 'A Hexed target misses you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'The next Spell that hits that target before the end of the next turn gains +3d8 damage.', dice: '3d8' },
                trigger: 'A Hexed target misses you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'The next Spell that hits that target before the end of the next turn gains +4d8 damage.', dice: '4d8' },
                trigger: 'A Hexed target misses you.',
                specials: []
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Black Pace',
        fluff: 'You accelerate just enough to make one enemy regrettably available.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +4 m Movement and +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +6 m Movement and +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8 m Movement and +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +10 m Movement and +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Hex Drive',
        fluff: 'The curse starts to spread faster once you decide it should.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its current Hex by 1.' },
                specials: [{ key: 'Hex', rank: 1, note: 'first hit per round' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its current Hex by 2.' },
                specials: [{ key: 'Hex', rank: 2, note: 'first hit per round' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its current Hex by 3.' },
                specials: [{ key: 'Hex', rank: 3, note: 'first hit per round' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, increase its current Hex by 4.' },
                specials: [{ key: 'Hex', rank: 4, note: 'first hit per round' }]
            }
        }
    },
    {
        name: 'Open Them Up',
        fluff: 'The more you pressure the prey, the more obvious its mistakes become.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, apply Expose(1).' },
                specials: [{ key: 'Expose', rank: 1, note: 'first hit per round' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, apply Expose(2).' },
                specials: [{ key: 'Expose', rank: 2, note: 'first hit per round' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, apply Expose(3).' },
                specials: [{ key: 'Expose', rank: 3, note: 'first hit per round' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a target, apply Expose(4).' },
                specials: [{ key: 'Expose', rank: 4, note: 'first hit per round' }]
            }
        }
    },
    {
        name: 'Pay the Crow',
        fluff: 'Once the prey is chosen, every strike starts collecting its fee.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Hexed target, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Hexed target, add +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Hexed target, add +6d8 damage.', dice: '6d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Hexed target, add +8d8 damage.', dice: '8d8' },
                specials: []
            }
        }
    },

    // ─── Movement Powers ────────────────────────────────────────────────────
    {
        name: 'Witchstep',
        fluff: 'You move like you already know where the target will be weakest.',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m. If you end adjacent to a target, your next attack this turn gains +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. If you end adjacent to a target, your next attack this turn gains +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 14 m. If you end adjacent to a target, your next attack this turn gains +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 18 m. If you end adjacent to a target, your next attack this turn gains +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Black Leave',
        fluff: 'You are already gone before the curse realizes it has changed hands.',
        category: 'movement',
        tags: [],
        rank: 1,
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 6 m.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 10 m.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 14 m.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'After you make an attack, move up to 18 m.' },
                specials: []
            }
        }
    }
];
