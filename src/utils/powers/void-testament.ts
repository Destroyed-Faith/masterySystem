/**
 * Void Testament Mastery Tree Powers
 *
 * Theme: A focused execution caster. Apply Hex to a priority target, then use
 * wardbreaking pressure, spell accuracy, and pact-fueled buffs to drive decisive
 * spells through armor, wards, and resistance.
 * Tree Type: Spell (caster framework — no damage Actives; damage comes from
 *            Pact Breach Spell List).
 * Role: Pure Damage / Wardbreaker Caster
 * Primary Special: Hex • Secondary Special: Penetration
 *
 * Tree Bonus (documented for GM / players — not a separate power entry):
 *   "The first time each round you hit a Hexed target with a Spell, add +1d8 damage."
 *
 * 12 Powers: 4 Passives, 4 Reactions, 4 Active Buffs.
 * Powers themselves are not Spell-tagged; they support Spell-tagged powers.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const VOID_TESTAMENT_POWERS: NewArtifactPowerData[] = [
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Abyss Index',
        fluff: 'Every Hexed name in your mind is already sorted under "open for collection."',
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
                effect: { text: 'Your Spells gain +1d8 damage against Hexed targets.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +2d8 damage against Hexed targets.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +3d8 damage against Hexed targets.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +4d8 damage against Hexed targets.', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Breach Doctrine',
        fluff: 'Once the pact has hold of a soul, your magic stops respecting its defenses.',
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
                effect: { text: 'Your Spells gain Penetration(2) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 2, note: 'vs. Hexed target' }]
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain Penetration(4) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 4, note: 'vs. Hexed target' }]
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain Penetration(6) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 6, note: 'vs. Hexed target' }]
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain Penetration(8) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 8, note: 'vs. Hexed target' }]
            }
        }
    },
    {
        name: 'Black Seal',
        fluff: 'The first binding always lands hardest because the target still thinks it has options.',
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
                effect: { text: 'The first time each combat you cast a Spell that applies Hex, that spell gains +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Hex, that spell gains +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Hex, that spell gains +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Hex, that spell gains +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Feast of the Crack',
        fluff: 'When the pact bites deeper, some of the scream comes back to you as life.',
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
                effect: { text: 'End of your turn: if you applied or increased Hex this round, heal 1d8 HP.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if you applied or increased Hex this round, heal 2d8 HP.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if you applied or increased Hex this round, heal 3d8 HP.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if you applied or increased Hex this round, heal 4d8 HP.', dice: '4d8' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Tighten the Pact',
        fluff: 'When the pact starts to slip, you pull it tighter.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target within range suffers damage from one of your Spells.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the pact on that target.' },
                trigger: 'A Hexed target within range suffers damage from one of your Spells.',
                specials: [{ key: 'Hex', rank: 1, note: '+1 to existing stack' }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the pact on that target.' },
                trigger: 'A Hexed target within range suffers damage from one of your Spells.',
                specials: [{ key: 'Hex', rank: 2, note: '+2 to existing stack' }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the pact on that target.' },
                trigger: 'A Hexed target within range suffers damage from one of your Spells.',
                specials: [{ key: 'Hex', rank: 3, note: '+3 to existing stack' }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the pact on that target.' },
                trigger: 'A Hexed target within range suffers damage from one of your Spells.',
                specials: [{ key: 'Hex', rank: 4, note: '+4 to existing stack' }]
            }
        }
    },
    {
        name: 'Break the Ward',
        fluff: 'Resistance is useful only because it shows you exactly where the wall is weakest.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target succeeds on a Save against one of your Spells.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains +1 Attack Die.' },
                trigger: 'A Hexed target succeeds on a Save against one of your Spells.',
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains +2 Attack Dice.' },
                trigger: 'A Hexed target succeeds on a Save against one of your Spells.',
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains +3 Attack Dice.' },
                trigger: 'A Hexed target succeeds on a Save against one of your Spells.',
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains +4 Attack Dice.' },
                trigger: 'A Hexed target succeeds on a Save against one of your Spells.',
                specials: []
            }
        }
    },
    {
        name: 'Abyssal Answer',
        fluff: 'The pact does not like being interrupted.',
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
        name: 'Read the Fault',
        fluff: 'Movement reveals seams. Seams invite entry.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Hexed target moves more than 4 m in a turn.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains Penetration(2).' },
                trigger: 'A Hexed target moves more than 4 m in a turn.',
                specials: [{ key: 'Penetration', rank: 2 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains Penetration(4).' },
                trigger: 'A Hexed target moves more than 4 m in a turn.',
                specials: [{ key: 'Penetration', rank: 4 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains Penetration(6).' },
                trigger: 'A Hexed target moves more than 4 m in a turn.',
                specials: [{ key: 'Penetration', rank: 6 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of your next turn gains Penetration(8).' },
                trigger: 'A Hexed target moves more than 4 m in a turn.',
                specials: [{ key: 'Penetration', rank: 8 }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: "Devil's Ledger",
        fluff: 'Once the pact is open, every line item costs blood.',
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
                effect: { text: 'The first Spell you cast each round gains +2d8 damage.', dice: '2d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first Spell you cast each round gains +4d8 damage.', dice: '4d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first Spell you cast each round gains +6d8 damage.', dice: '6d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first Spell you cast each round gains +8d8 damage.', dice: '8d8' },
                specials: []
            }
        }
    },
    {
        name: 'Breach Mandate',
        fluff: 'When the breach is authorized, nothing closed stays closed for long.',
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
                effect: { text: 'Your Spells gain Penetration(4) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 4, note: 'vs. Hexed target' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain Penetration(8) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 8, note: 'vs. Hexed target' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain Penetration(12) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 12, note: 'vs. Hexed target' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain Penetration(16) against Hexed targets.' },
                specials: [{ key: 'Penetration', rank: 16, note: 'vs. Hexed target' }]
            }
        }
    },
    {
        name: 'Dark Vesting',
        fluff: 'The pact wraps you in a coat of black weight and reluctant survival.',
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
                effect: { text: 'Gain +2 Armor and 1d8 Temporary HP.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +4 Armor and 2d8 Temporary HP.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +6 Armor and 3d8 Temporary HP.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +8 Armor and 4d8 Temporary HP.', dice: '4d8' },
                specials: []
            }
        }
    },
    {
        name: 'Open the Gate',
        fluff: 'For a few moments, every Hexed target feels closer to falling apart.',
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
                effect: { text: 'Your Spells gain +2 Attack Dice against Hexed targets.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +4 Attack Dice against Hexed targets.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +6 Attack Dice against Hexed targets.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +8 Attack Dice against Hexed targets.' },
                specials: []
            }
        }
    }
];
