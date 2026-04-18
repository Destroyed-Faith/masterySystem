/**
 * Storm Veil Mastery Tree Powers
 *
 * Theme: A precision lightning caster. Apply Shock to break enemy tempo, then
 * convert that instability into Expose so later spells land harder and cleaner.
 * Tree Type: Spell (caster framework — no damage Actives; damage comes from
 *            the Split Tempest Spell List).
 * Role: Ranged Striker / Control Support
 * Primary Special: Shock • Secondary Special: Expose
 *
 * 12 Powers: 4 Passives, 4 Reactions, 4 Active Buffs.
 * Powers themselves are not Spell-tagged; they support Spell-tagged powers.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const STORM_VEIL_POWERS: NewArtifactPowerData[] = [
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Conductive Focus',
        fluff: 'Your magic follows the easiest path through a body before the body realizes it has one.',
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
                effect: { text: 'Your Spells with Shock gain +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells with Shock gain +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells with Shock gain +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells with Shock gain +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Static Reading',
        fluff: 'A body already carrying charge is easier to read and easier to hit.',
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
                effect: { text: 'Your Spells gain +1 Attack Die against Shocked targets.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +2 Attack Dice against Shocked targets.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +3 Attack Dice against Shocked targets.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +4 Attack Dice against Shocked targets.' },
                specials: []
            }
        }
    },
    {
        name: 'Grounding Field',
        fluff: 'You move as if the next strike has already been measured and stepped around.',
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
                effect: { text: 'Gain +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Evade.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +6 Evade.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Evade.' },
                specials: []
            }
        }
    },
    {
        name: 'Storm Memory',
        fluff: 'Once a target has been rattled by your storm, the next impact always lands deeper.',
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
                effect: { text: 'Once per round, the first time you damage a Shocked target with a Spell, add +1d8 damage.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Shocked target with a Spell, add +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Shocked target with a Spell, add +3d8 damage.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage a Shocked target with a Spell, add +4d8 damage.', dice: '4d8' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Ride the Flinch',
        fluff: 'The first twitch of instability is exactly where you push harder.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Shocked target within range misses an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current Shock.' },
                trigger: 'A Shocked target within range misses an attack.',
                specials: [{ key: 'Shock', rank: 1, note: '+1 to existing stack' }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current Shock.' },
                trigger: 'A Shocked target within range misses an attack.',
                specials: [{ key: 'Shock', rank: 2, note: '+2 to existing stack' }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current Shock.' },
                trigger: 'A Shocked target within range misses an attack.',
                specials: [{ key: 'Shock', rank: 3, note: '+3 to existing stack' }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current Shock.' },
                trigger: 'A Shocked target within range misses an attack.',
                specials: [{ key: 'Shock', rank: 4, note: '+4 to existing stack' }]
            }
        }
    },
    {
        name: 'Open the Line',
        fluff: 'Once the body stutters, the angle appears.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Shocked target moves more than 4 m in a turn.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn applies Expose(1) on hit.' },
                trigger: 'A Shocked target moves more than 4 m in a turn.',
                specials: [{ key: 'Expose', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn applies Expose(2) on hit.' },
                trigger: 'A Shocked target moves more than 4 m in a turn.',
                specials: [{ key: 'Expose', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn applies Expose(3) on hit.' },
                trigger: 'A Shocked target moves more than 4 m in a turn.',
                specials: [{ key: 'Expose', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn applies Expose(4) on hit.' },
                trigger: 'A Shocked target moves more than 4 m in a turn.',
                specials: [{ key: 'Expose', rank: 4 }]
            }
        }
    },
    {
        name: 'Storm Sidestep',
        fluff: 'You were never standing where the strike thought you would be.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are attacked by a creature you can perceive.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Evade and +1 Armor against that attack.' },
                trigger: 'You are attacked by a creature you can perceive.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Evade and +2 Armor against that attack.' },
                trigger: 'You are attacked by a creature you can perceive.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 Evade and +3 Armor against that attack.' },
                trigger: 'You are attacked by a creature you can perceive.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Evade and +4 Armor against that attack.' },
                trigger: 'You are attacked by a creature you can perceive.',
                specials: []
            }
        }
    },
    {
        name: 'Feedback Window',
        fluff: 'Their hesitation is the exact opening your next cast needed.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Shocked target suffers damage from one of your Spells.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn gains +1 Attack Die.' },
                trigger: 'A Shocked target suffers damage from one of your Spells.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn gains +2 Attack Dice.' },
                trigger: 'A Shocked target suffers damage from one of your Spells.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn gains +3 Attack Dice.' },
                trigger: 'A Shocked target suffers damage from one of your Spells.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before the end of your next turn gains +4 Attack Dice.' },
                trigger: 'A Shocked target suffers damage from one of your Spells.',
                specials: []
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Eye of the Storm',
        fluff: 'At the center of your storm, motion bends and every follow-up lands harder.',
        category: 'activeBuff',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +2 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +1.' },
                specials: [{ key: 'Shock', rank: 1, note: 'first Spell hit per round vs. already-Shocked' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +3 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +1.' },
                specials: [{ key: 'Shock', rank: 1, note: 'first Spell hit per round vs. already-Shocked' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +4 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +2.' },
                specials: [{ key: 'Shock', rank: 2, note: 'first Spell hit per round vs. already-Shocked' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'You and allies in the aura gain +5 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +3.' },
                specials: [{ key: 'Shock', rank: 3, note: 'first Spell hit per round vs. already-Shocked' }]
            }
        }
    },
    {
        name: 'Split Second',
        fluff: 'You cast inside the moment before the target fully recovers its balance.',
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
                effect: { text: 'Gain +4 Initiative and +1 Attack Die on Spells.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8 Initiative and +2 Attack Dice on Spells.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +12 Initiative and +3 Attack Dice on Spells.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +16 Initiative and +4 Attack Dice on Spells.' },
                specials: []
            }
        }
    },
    {
        name: 'Strip the Angle',
        fluff: 'Once the target starts to stutter, you make the weakness permanent.',
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
                effect: { text: 'The first time each round you hit a Shocked target with a Spell, apply Expose(1).' },
                specials: [{ key: 'Expose', rank: 1, note: 'first Spell hit per round vs. Shocked' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target with a Spell, apply Expose(2).' },
                specials: [{ key: 'Expose', rank: 2, note: 'first Spell hit per round vs. Shocked' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target with a Spell, apply Expose(3).' },
                specials: [{ key: 'Expose', rank: 3, note: 'first Spell hit per round vs. Shocked' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Shocked target with a Spell, apply Expose(4).' },
                specials: [{ key: 'Expose', rank: 4, note: 'first Spell hit per round vs. Shocked' }]
            }
        }
    },
    {
        name: 'Charged Shell',
        fluff: 'The charge wrapping your body makes clean strikes almost impossible.',
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
                effect: { text: 'Gain +2 Armor and +2 Evade.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +4 Armor and +4 Evade.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +6 Armor and +6 Evade.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8 Armor and +8 Evade.' },
                specials: []
            }
        }
    }
];
