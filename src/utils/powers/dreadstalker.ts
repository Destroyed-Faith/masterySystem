/**
 * Dreadstalker Mastery Tree Powers
 *
 * Theme: A relentless single-target predator who marks prey, wins the tempo war,
 * and converts narrow openings into lethal finishing pressure.
 * Role: Pure Damage / Skirmisher Assassin
 * Primary Special: Mark
 * Secondary Special: Crit
 *
 * 14 Powers: 4 Actives, 4 Passives, 4 Reactions, 4 Active Buffs, 2 Movement.
 * Utilities have been removed from the system and are not included.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const DREADSTALKER_POWERS: NewArtifactPowerData[] = [
    // ─── Actives ────────────────────────────────────────────────────────────
    {
        name: 'Mark the Prey',
        fluff: 'You brand a foe for death and make the whole fight bend around that choice.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'ranged',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +1d8', dice: '1d8' },
                specials: [{ key: 'Mark', rank: 2 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8', dice: '2d8' },
                specials: [{ key: 'Mark', rank: 3 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8', dice: '3d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8', dice: '4d8' },
                specials: [{ key: 'Mark', rank: 4 }]
            }
        }
    },
    {
        name: "Hunter's Slash",
        fluff: 'A fast blade stroke aimed exactly where the mark says the body will fail.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 damage', dice: '2d8' },
                specials: [{ key: 'Crit', rank: 1, note: 'if target is Marked' }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 damage', dice: '3d8' },
                specials: [{ key: 'Crit', rank: 1, note: 'if target is Marked' }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 damage', dice: '4d8' },
                specials: [{ key: 'Crit', rank: 2, note: 'if target is Marked' }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8 damage', dice: '5d8' },
                specials: [{ key: 'Crit', rank: 2, note: 'if target is Marked' }]
            }
        }
    },
    {
        name: 'Flash Bomb',
        fluff: 'A burst of white fire and powder that steals sight long enough for the kill.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'masteryRankRounds', rounds: 1, note: 'MR + 1' },
                effect: { text: 'Blinding flash' },
                specials: [{ key: 'Blinded', rank: 1 }]
            },
            '2': {
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRankRounds', rounds: 2, note: 'MR + 2' },
                effect: { text: 'Blinding flash' },
                specials: [{ key: 'Blinded', rank: 2 }]
            },
            '3': {
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRankRounds', rounds: 3, note: 'MR + 3' },
                effect: { text: 'Blinding flash' },
                specials: [{ key: 'Blinded', rank: 3 }]
            },
            '4': {
                type: 'ranged',
                range: { kind: 'distance', m: 6, note: 'thrown' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRankRounds', rounds: 4, note: 'MR + 4' },
                effect: { text: 'Blinding flash' },
                specials: [{ key: 'Blinded', rank: 4 }]
            }
        }
    },
    {
        name: 'Death Sentence',
        fluff: 'Once the prey is fixed, this strike is no longer an attack — it is the verdict.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +2d8 vs. Marked target', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +3d8 vs. Marked target', dice: '3d8' },
                specials: [{ key: 'Crit', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +4d8 vs. Marked target', dice: '4d8' },
                specials: [{ key: 'Crit', rank: 2 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'touch' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG +5d8 vs. Marked target', dice: '5d8' },
                specials: [{ key: 'Crit', rank: 3 }]
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Quickdraw',
        fluff: 'Your hand is already moving while everyone else is still deciding to fight.',
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
    {
        name: 'Bloodhound',
        fluff: 'Once the scent is fixed, the prey stops being hard to hit.',
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
                effect: { text: 'Gain +1 Attack Die against Marked targets.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Attack Dice against Marked targets.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Attack Dice against Marked targets.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Attack Dice against Marked targets.' },
                specials: []
            }
        }
    },
    {
        name: 'Sneak Attack',
        fluff: 'A moment of ruthless precision whenever the prey loses its footing or its sight.',
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
                effect: { text: 'If the target is Marked or Blinded, your attacks against it gain +1d8 damage and Crit(1).', dice: '1d8' },
                specials: [{ key: 'Crit', rank: 1, note: 'if target is Marked or Blinded' }]
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If the target is Marked or Blinded, your attacks against it gain +2d8 damage and Crit(1).', dice: '2d8' },
                specials: [{ key: 'Crit', rank: 1, note: 'if target is Marked or Blinded' }]
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If the target is Marked or Blinded, your attacks against it gain +3d8 damage and Crit(2).', dice: '3d8' },
                specials: [{ key: 'Crit', rank: 2, note: 'if target is Marked or Blinded' }]
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If the target is Marked or Blinded, your attacks against it gain +3d8 damage and Crit(2).', dice: '3d8' },
                specials: [{ key: 'Crit', rank: 2, note: 'if target is Marked or Blinded' }]
            }
        }
    },
    {
        name: 'First Blood',
        fluff: 'If you strike before the prey settles, the wound is always worse.',
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
                effect: { text: 'If you act before a target in the round, your first attack against it that round gains +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you act before a target in the round, your first attack against it that round gains +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you act before a target in the round, your first attack against it that round gains +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'If you act before a target in the round, your first attack against it that round gains +4d8 damage.', dice: '4d8' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Punish the Turn',
        fluff: 'When your marked prey turns its attention elsewhere, you cut into the mistake immediately.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target within range attacks someone other than you.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; on hit, deal +1d8 damage.', dice: '1d8' },
                trigger: 'A Marked target within range attacks someone other than you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; on hit, deal +2d8 damage.', dice: '2d8' },
                trigger: 'A Marked target within range attacks someone other than you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; on hit, deal +3d8 damage.', dice: '3d8' },
                trigger: 'A Marked target within range attacks someone other than you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; on hit, deal +4d8 damage.', dice: '4d8' },
                trigger: 'A Marked target within range attacks someone other than you.',
                specials: []
            }
        }
    },
    {
        name: "Opportunist's Lunge",
        fluff: 'The prey moves, and that motion becomes the opening.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target within range moves.',
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; that attack gains Crit(1).' },
                trigger: 'A Marked target within range moves.',
                specials: [{ key: 'Crit', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; that attack gains Crit(1) and +1 Attack Die.' },
                trigger: 'A Marked target within range moves.',
                specials: [{ key: 'Crit', rank: 1 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; that attack gains Crit(2).' },
                trigger: 'A Marked target within range moves.',
                specials: [{ key: 'Crit', rank: 2 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make one attack; that attack gains Crit(3).' },
                trigger: 'A Marked target within range moves.',
                specials: [{ key: 'Crit', rank: 3 }]
            }
        }
    },
    {
        name: 'Slip the Counter',
        fluff: 'You deny the prey the clean answer it thought it had.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target attacks you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Armor and +2 Evade against that attack.' },
                trigger: 'A Marked target attacks you.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Armor and +4 Evade against that attack.' },
                trigger: 'A Marked target attacks you.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 Armor and +6 Evade against that attack.' },
                trigger: 'A Marked target attacks you.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Armor and +8 Evade against that attack.' },
                trigger: 'A Marked target attacks you.',
                specials: []
            }
        }
    },
    {
        name: 'Finish the Opening',
        fluff: 'When the prey fails to land the blow, you claim the next beat of the fight.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target misses you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next attack against that target before end of your next turn gains +1d8 damage and Crit(1).', dice: '1d8' },
                trigger: 'A Marked target misses you.',
                specials: [{ key: 'Crit', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next attack gains +2d8 damage and Crit(1).', dice: '2d8' },
                trigger: 'A Marked target misses you.',
                specials: [{ key: 'Crit', rank: 1 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next attack gains +3d8 damage and Crit(2).', dice: '3d8' },
                trigger: 'A Marked target misses you.',
                specials: [{ key: 'Crit', rank: 2 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next attack gains +4d8 damage and Crit(2).', dice: '4d8' },
                trigger: 'A Marked target misses you.',
                specials: [{ key: 'Crit', rank: 2 }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Predictable Movement',
        fluff: 'You read your quarry’s tells and are simply not where they swing.',
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
                effect: { text: 'Against attacks from Marked enemies, gain +2 Armor and +4 Evade.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Against attacks from Marked enemies, gain +4 Armor and +6 Evade.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Against attacks from Marked enemies, gain +6 Armor and +8 Evade.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Against attacks from Marked enemies, gain +8 Armor and +12 Evade.' },
                specials: []
            }
        }
    },
    {
        name: 'Killing Rhythm',
        fluff: 'Once the pattern starts, each strike lands deeper than the last.',
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
                effect: { text: 'The first time each round you hit a Marked target, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target, add +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target, add +6d8 damage.', dice: '6d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target, add +8d8 damage.', dice: '8d8' },
                specials: []
            }
        }
    },
    {
        name: 'Cold Start',
        fluff: 'You empty every distraction from your body and start moving at kill-speed.',
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
                effect: { text: 'Gain +4 Initiative and +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8 Initiative and +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +12 Initiative and +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +16 Initiative and +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Dead Sprint',
        fluff: 'Every stride shortens the distance between choice and execution.',
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
                effect: { text: '+4 m Movement. If you move ≥4 m before attacking a Marked target, that attack gains Crit(1).' },
                specials: [{ key: 'Crit', rank: 1, note: 'if you moved ≥4 m before attack' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: '+6 m Movement. If you move ≥4 m before attacking a Marked target, that attack gains Crit(1).' },
                specials: [{ key: 'Crit', rank: 1, note: 'if you moved ≥4 m before attack' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: '+8 m Movement. If you move ≥4 m before attacking a Marked target, that attack gains Crit(2).' },
                specials: [{ key: 'Crit', rank: 2, note: 'if you moved ≥4 m before attack' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: '+10 m Movement. If you move ≥4 m before attacking a Marked target, that attack gains Crit(3).' },
                specials: [{ key: 'Crit', rank: 3, note: 'if you moved ≥4 m before attack' }]
            }
        }
    },

    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Predator Step',
        fluff: 'One measured burst carries you directly into the prey’s unsafe space.',
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
                effect: { text: 'Move up to 6 m. If you end adjacent to a Marked target, your next attack this turn gains +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 10 m. If you end adjacent to a Marked target, your next attack this turn gains +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 14 m. If you end adjacent to a Marked target, your next attack this turn gains +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 18 m. If you end adjacent to a Marked target, your next attack this turn gains +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Fade Through',
        fluff: 'You are already gone before the prey understands what reached it.',
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
