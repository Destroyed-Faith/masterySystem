/**
 * Raptor Dragon Mastery Tree Powers
 *
 * Theme: A relentless draconic hunter that isolates targets, strips their defenses
 * with corrosive pressure, and tears them apart through speed, angle, and repeated strikes.
 * Role: Skirmisher / Dive Hunter / Pick Pressure
 * Primary Attribute: Agility
 * Primary Specials: Mark, Corrode • Secondary: Pull, Penetration
 *
 * Tree Bonus (Natural Weapons): Your natural attacks (Claws / Bite / Tail) count as melee
 * weapons. They deal 1d8 damage for every 2 Raptor Dragon powers learned, up to 4d8.
 *
 * Requirement: You must be in Dragon form to use these powers. While in form you
 * cannot use weapons, armor, or shields; you rely on natural weapons, wings, momentum,
 * and predatory instinct from this tree. Gated to actors with the "dragonborn" Echo.
 *
 * 18 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const RAPTOR_DRAGON_POWERS: NewArtifactPowerData[] = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Skyhook Snatch',
        fluff: 'Distance stops mattering when your claws decide otherwise.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 2d8 damage. The target must pass a Body Save or be pulled toward you.', dice: '2d8' },
                specials: [{ key: 'Pull', rank: 2 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 3d8 damage. The target must pass a Body Save or be pulled toward you.', dice: '3d8' },
                specials: [{ key: 'Pull', rank: 4 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 5d8 damage. The target must pass a Body Save or be pulled toward you.', dice: '5d8' },
                specials: [{ key: 'Pull', rank: 6 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 10 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack + 6d8 damage. The target must pass a Body Save or be pulled toward you.', dice: '6d8' },
                specials: [{ key: 'Pull', rank: 8 }]
            }
        }
    },
    {
        name: 'Rending Chain',
        fluff: 'One opening is never enough. The next strike is already looking for the seam behind it.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Corrode', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Corrode', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'Corrode', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Claw Attack dealing damage + 4d8 damage.', dice: '4d8' },
                specials: [{ key: 'Corrode', rank: 4 }]
            }
        }
    },
    {
        name: 'Execute',
        fluff: 'The kill strike is never wasted on something that still deserves a fair fight.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 2d8 damage. Against a target with Mark or Corrode, this attack gains Penetration(1).', dice: '2d8' },
                specials: [{ key: 'Penetration', rank: 1, note: 'if target has Mark or Corrode' }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 3d8 damage. Against a target with Mark or Corrode, this attack gains Penetration(2).', dice: '3d8' },
                specials: [{ key: 'Penetration', rank: 2, note: 'if target has Mark or Corrode' }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 4d8 damage. Against a target with Mark or Corrode, this attack gains Penetration(3).', dice: '4d8' },
                specials: [{ key: 'Penetration', rank: 3, note: 'if target has Mark or Corrode' }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Natural Attack + 5d8 damage. Against a target with Mark or Corrode, this attack gains Penetration(4).', dice: '5d8' },
                specials: [{ key: 'Penetration', rank: 4, note: 'if target has Mark or Corrode' }]
            }
        }
    },
    {
        name: 'Dive Rend',
        fluff: 'Altitude turns into violence the moment you commit.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you moved at least 4 m before this attack, deal damage + 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you moved at least 4 m before this attack, deal damage + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you moved at least 4 m before this attack, deal damage + 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you moved at least 4 m before this attack, deal damage + 4d8 damage.', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Blood Scent',
        fluff: "Once you've cut them, distance becomes a bookkeeping problem.",
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You always know the direction of the nearest creature within 20 m that has Mark or Corrode from you.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You always know the direction of the nearest creature within 40 m that has Mark or Corrode from you.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You always know the direction of the nearest creature within 40 m that has Mark or Corrode from you. Your Opportunity Attacks against such creatures gain +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'You always know the direction of the nearest creature within 40 m that has Mark or Corrode from you. Your Opportunity Attacks against such creatures gain +2d8 damage.', dice: '2d8' },
                specials: []
            }
        }
    },
    {
        name: 'Corrosive Talons',
        fluff: 'Every cut leaves something behind that the next cut can exploit.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a creature with a natural attack, apply Corrode(1).' },
                specials: [{ key: 'Corrode', rank: 1 }]
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a creature with a natural attack, apply Corrode(2).' },
                specials: [{ key: 'Corrode', rank: 2 }]
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a creature with a natural attack, apply Corrode(3).' },
                specials: [{ key: 'Corrode', rank: 3 }]
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a creature with a natural attack, apply Corrode(4).' },
                specials: [{ key: 'Corrode', rank: 4 }]
            }
        }
    },
    {
        name: 'Aerial Predator',
        fluff: 'The right angle is worth more than raw force.',
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you moved at least 4 m this turn or are currently flying, gain +2 Pool on your next attack this turn.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you moved at least 4 m this turn or are currently flying, gain +4 Pool on your next attack this turn.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you moved at least 4 m this turn or are currently flying, gain +6 Pool on your next attack this turn.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you moved at least 4 m this turn or are currently flying, gain +8 Pool on your next attack this turn.' },
                specials: []
            }
        }
    },
    {
        name: 'Marked for the Kill',
        fluff: "Once you've chosen the prey, the rest of the body catches up to the decision.",
        category: 'passive',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'none', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a target with Mark from you, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a target with Mark from you, add +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a target with Mark from you, add +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a target with Mark from you, add +6d8 damage.', dice: '6d8' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Bite',
        fluff: 'Too close is not safety. It is selection.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are hit by a melee attack.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 1d8.', dice: '1d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 2d8.', dice: '2d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 2d8.', dice: '2d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make a Bite dealing damage + 3d8.', dice: '3d8' },
                trigger: 'When you are hit by a melee attack.',
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: 'Predatory Turn',
        fluff: 'The moment prey turns to run is often the cleanest moment to kill it.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When a creature with Mark from you leaves your adjacency.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may follow it up to 2 m, then make a natural attack dealing +1d8 damage.', dice: '1d8' },
                trigger: 'When a creature with Mark from you leaves your adjacency.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may follow it up to 4 m, then make a natural attack dealing +2d8 damage.', dice: '2d8' },
                trigger: 'When a creature with Mark from you leaves your adjacency.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may follow it up to 6 m, then make a natural attack dealing +3d8 damage.', dice: '3d8' },
                trigger: 'When a creature with Mark from you leaves your adjacency.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'You may follow it up to 8 m, then make a natural attack dealing +4d8 damage.', dice: '4d8' },
                trigger: 'When a creature with Mark from you leaves your adjacency.',
                specials: []
            }
        }
    },
    {
        name: 'Wing Slip',
        fluff: 'A flick of wing and angle is the difference between reprisal and absence.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are targeted by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 2 m and gain +2 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 4 m and gain +4 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 6 m and gain +6 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 1 },
                effect: { text: 'Reposition up to 8 m and gain +8 Evade until the end of the round.' },
                trigger: 'When you are targeted by an attack.',
                specials: []
            }
        }
    },
    {
        name: 'Cruel Timing',
        fluff: 'The right opening is not an opportunity. It is a debt the prey now owes you.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        trigger: 'Once per round, when a target with Mark from you takes damage from any source.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase the target\'s pressure immediately.' },
                trigger: 'Once per round, when a target with Mark from you takes damage from any source.',
                specials: [{ key: 'Corrode', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase the target\'s pressure immediately.' },
                trigger: 'Once per round, when a target with Mark from you takes damage from any source.',
                specials: [{ key: 'Corrode', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase the target\'s pressure immediately.' },
                trigger: 'Once per round, when a target with Mark from you takes damage from any source.',
                specials: [{ key: 'Corrode', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase the target\'s pressure immediately.' },
                trigger: 'Once per round, when a target with Mark from you takes damage from any source.',
                specials: [{ key: 'Corrode', rank: 4 }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Take Flight',
        fluff: 'The ground stops being part of the problem.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 6 m. While flying, gain +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 10 m. While flying, gain +4 Evade.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 14 m. While flying, gain +6 Evade.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Gain Flight 18 m. While flying, gain +8 Evade.' },
                specials: []
            }
        }
    },
    {
        name: "Hunter's Focus",
        fluff: 'Every instinct narrows to one target and one correct outcome.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Choose one creature you can perceive. Gain +2 Attack Dice on attacks against it.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Choose one creature you can perceive. Gain +4 Attack Dice on attacks against it.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Choose one creature you can perceive. Gain +6 Attack Dice on attacks against it.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Choose one creature you can perceive. Gain +8 Attack Dice on attacks against it.' },
                specials: []
            }
        }
    },
    {
        name: 'Acid Bloodlust',
        fluff: 'The prey stops bleeding first. Then it starts dissolving.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Once per round, the first time you hit with a natural attack, also apply Corrode(1).' },
                specials: [{ key: 'Corrode', rank: 1 }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Once per round, the first time you hit with a natural attack, also apply Corrode(2).' },
                specials: [{ key: 'Corrode', rank: 2 }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Once per round, the first time you hit with a natural attack, also apply Corrode(3).' },
                specials: [{ key: 'Corrode', rank: 3 }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Once per round, the first time you hit with a natural attack, also apply Corrode(4).' },
                specials: [{ key: 'Corrode', rank: 4 }]
            }
        }
    },
    {
        name: "Raptor's Tempo",
        fluff: 'Speed is not a stat. It is the shape your violence takes.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Each round, the first time you move at least 4 m, your next attack that round deals +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Each round, the first time you move at least 4 m, your next attack that round deals +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Each round, the first time you move at least 4 m, your next attack that round deals +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRankRounds' },
                effect: { text: 'Each round, the first time you move at least 4 m, your next attack that round deals +6d8 damage.', dice: '6d8' },
                specials: []
            }
        }
    },

    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Flyby',
        fluff: 'A pass that leaves only wind, pain, and a bad decision behind.',
        category: 'movement',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 3 m as Flight Movement. Your next attack this round deals +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 6 m as Flight Movement. Your next attack this round deals +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 9 m as Flight Movement. Your next attack this round deals +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 12 m as Flight Movement. Your next attack this round deals +4d8 damage.', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Dive Drop',
        fluff: 'You vanish from the line for one heartbeat and return as a falling verdict.',
        category: 'movement',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'movement', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 4 m toward a creature below or beside you, then your next attack this turn deals +1d8 damage.', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 1 }]
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 8 m toward a creature below or beside you, then your next attack this turn deals +2d8 damage.', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 12 m toward a creature below or beside you, then your next attack this turn deals +3d8 damage.', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'single', targets: 1 },
                duration: { kind: 'instant' },
                effect: { text: 'If you are flying, move up to 16 m toward a creature below or beside you, then your next attack this turn deals +4d8 damage.', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    }
];
