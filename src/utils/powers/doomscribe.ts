/**
 * Doomscribe Mastery Tree Powers
 *
 * Theme: A single-target execution caster. Mark prey, apply concentrated spell
 * pressure, convert it into clean crit-supported kill windows.
 * Tree Type: Spell (caster framework — no damage Actives; the damage comes from
 *            the Black Writ Spell List).
 * Role: Pure Damage / Execution Caster
 * Primary Special: Mark • Secondary Special: Crit
 *
 * 12 Powers: 4 Passives, 4 Reactions, 4 Active Buffs.
 * Powers themselves are not Spell-tagged; they support Spell-tagged powers.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const DOOMSCRIBE_POWERS: NewArtifactPowerData[] = [
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Death Ledger',
        fluff: 'Every marked target is already entered into your private record of endings.',
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
                effect: { text: 'Your Spells gain +1d8 damage against Marked targets.', dice: '1d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+1d8',vsCondition:'marked',vsConditionDamage:'+1d8'},condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +2d8 damage against Marked targets.', dice: '2d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+2d8',vsCondition:'marked',vsConditionDamage:'+2d8'},condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +3d8 damage against Marked targets.', dice: '3d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+3d8',vsCondition:'marked',vsConditionDamage:'+3d8'},condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells gain +4d8 damage against Marked targets.', dice: '4d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+4d8',vsCondition:'marked',vsConditionDamage:'+4d8'},condition:'targetMarked',applyWhen:'passive-slotted-active'}
            }
        }
    },
    {
        name: 'Cruel Geometry',
        fluff: 'Once prey is marked, its weaknesses align into exact magical killing lines.',
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
                effect: { text: 'Once per round, the first time you hit a Marked target with a Spell, that hit gains Crit(1).' },
                specials: [{ key: 'crit', rank: 1, note: 'once per round, first Spell hit vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a Marked target with a Spell, that hit gains Crit(2).' },
                specials: [{ key: 'crit', rank: 2, note: 'once per round, first Spell hit vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a Marked target with a Spell, that hit gains Crit(3).' },
                specials: [{ key: 'crit', rank: 3, note: 'once per round, first Spell hit vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you hit a Marked target with a Spell, that hit gains Crit(4).' },
                specials: [{ key: 'crit', rank: 4, note: 'once per round, first Spell hit vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            }
        }
    },
    {
        name: 'First Seal',
        fluff: 'Your first binding of the fight lands with unnerving certainty.',
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
                effect: { text: 'The first time each combat you cast a Spell that applies Mark, that spell gains +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Mark, that spell gains +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Mark, that spell gains +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'The first time each combat you cast a Spell that applies Mark, that spell gains +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Execution Logic',
        fluff: 'Once the target is prepared, your magic stops wasting force on uncertainty.',
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
                effect: { text: 'Gain +1 Attack Die on Spells against Marked targets.' },
                specials: [],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +2 Attack Dice on Spells against Marked targets.' },
                specials: [],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +3 Attack Dice on Spells against Marked targets.' },
                specials: [],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +4 Attack Dice on Spells against Marked targets.' },
                specials: [],
                mechanics: {condition:'targetMarked',applyWhen:'passive-slotted-active'}
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Seal the Misstep',
        fluff: 'When marked prey misplays, the sentence tightens.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target within range attacks someone other than you or moves away from you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current mark-pressure by 1.' },
                trigger: 'A Marked target within range attacks someone other than you or moves away from you.',
                specials: [{ key: 'mark', rank: 1, note: '+1 to existing stack' }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 12 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current mark-pressure by 2.' },
                trigger: 'A Marked target within range attacks someone other than you or moves away from you.',
                specials: [{ key: 'mark', rank: 2, note: '+2 to existing stack' }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 16 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current mark-pressure by 3.' },
                trigger: 'A Marked target within range attacks someone other than you or moves away from you.',
                specials: [{ key: 'mark', rank: 3, note: '+3 to existing stack' }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 20 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Increase its current mark-pressure by 4.' },
                trigger: 'A Marked target within range attacks someone other than you or moves away from you.',
                specials: [{ key: 'mark', rank: 4, note: '+4 to existing stack' }]
            }
        }
    },
    {
        name: 'Hold the Pattern',
        fluff: 'You stabilize the lethal structure just before it breaks.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are hit while a Marked target is within your perception.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +1 Save Die and +1 Armor against that effect.' },
                trigger: 'You are hit while a Marked target is within your perception.',
                specials: [],
                mechanics: {armor:1,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Save Dice and +2 Armor against that effect.' },
                trigger: 'You are hit while a Marked target is within your perception.',
                specials: [],
                mechanics: {armor:2,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +3 Save Dice and +3 Armor against that effect.' },
                trigger: 'You are hit while a Marked target is within your perception.',
                specials: [],
                mechanics: {armor:3,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Save Dice and +4 Armor against that effect.' },
                trigger: 'You are hit while a Marked target is within your perception.',
                specials: [],
                mechanics: {armor:4,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            }
        }
    },
    {
        name: 'Punitive Echo',
        fluff: 'Their failure keeps ringing until you cash it in.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target fails a Save or misses an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of next turn gains +1d8 damage.', dice: '1d8' },
                trigger: 'A Marked target fails a Save or misses an attack.',
                specials: [],
                mechanics: {damageRider:{flat:'+1d8'},applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains +2d8 damage.', dice: '2d8' },
                trigger: 'A Marked target fails a Save or misses an attack.',
                specials: [],
                mechanics: {damageRider:{flat:'+2d8'},applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains +3d8 damage.', dice: '3d8' },
                trigger: 'A Marked target fails a Save or misses an attack.',
                specials: [],
                mechanics: {damageRider:{flat:'+3d8'},applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains +4d8 damage.', dice: '4d8' },
                trigger: 'A Marked target fails a Save or misses an attack.',
                specials: [],
                mechanics: {damageRider:{flat:'+4d8'},applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            }
        }
    },
    {
        name: 'Read the Collapse',
        fluff: 'The instant prey slips, you are already inside the next break.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A Marked target suffers damage from one of your Spells.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell against that target before end of next turn gains Crit(1).' },
                trigger: 'A Marked target suffers damage from one of your Spells.',
                specials: [{ key: 'crit', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains Crit(2).' },
                trigger: 'A Marked target suffers damage from one of your Spells.',
                specials: [{ key: 'crit', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains Crit(3).' },
                trigger: 'A Marked target suffers damage from one of your Spells.',
                specials: [{ key: 'crit', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Your next Spell gains Crit(4).' },
                trigger: 'A Marked target suffers damage from one of your Spells.',
                specials: [{ key: 'crit', rank: 4 }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Final Notation',
        fluff: 'You reduce the whole battlefield down to one finalized target.',
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
                effect: { text: 'Choose one creature you can perceive; your Spells gain +2 Attack Dice against it.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +4 Attack Dice against the chosen creature.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +6 Attack Dice against the chosen creature.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +8 Attack Dice against the chosen creature.' },
                specials: []
            }
        }
    },
    {
        name: 'Predicted Ruin',
        fluff: "You drag the target's end forward until it becomes easier to hit than avoid.",
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
                effect: { text: 'The first time each round you hit a Marked target with a Spell, that hit gains Crit(1).' },
                specials: [{ key: 'crit', rank: 1, note: 'first Spell hit per round vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target with a Spell, that hit gains Crit(2).' },
                specials: [{ key: 'crit', rank: 2, note: 'first Spell hit per round vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target with a Spell, that hit gains Crit(3).' },
                specials: [{ key: 'crit', rank: 3, note: 'first Spell hit per round vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you hit a Marked target with a Spell, that hit gains Crit(4).' },
                specials: [{ key: 'crit', rank: 4, note: 'first Spell hit per round vs. Marked' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            }
        }
    },
    {
        name: 'Cold Sequence',
        fluff: 'Your casting sheds hesitation and becomes a pure sequence of lethal decisions.',
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
        name: 'No Escape Clause',
        fluff: 'Retreat becomes part of the sentence.',
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
                effect: { text: 'When a Marked target moves more than 4 m in a turn, increase its mark-pressure by 1.' },
                specials: [{ key: 'mark', rank: 1, note: 'trigger: target moves >4 m' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When a Marked target moves more than 4 m in a turn, increase its mark-pressure by 2.' },
                specials: [{ key: 'mark', rank: 2, note: 'trigger: target moves >4 m' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When a Marked target moves more than 4 m in a turn, increase its mark-pressure by 3.' },
                specials: [{ key: 'mark', rank: 3, note: 'trigger: target moves >4 m' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'When a Marked target moves more than 4 m in a turn, increase its mark-pressure by 4.' },
                specials: [{ key: 'mark', rank: 4, note: 'trigger: target moves >4 m' }],
                mechanics: {condition:'targetMarked',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            }
        }
    }
];
