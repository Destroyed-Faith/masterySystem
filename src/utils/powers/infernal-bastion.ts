/**
 * Infernal Bastion Mastery Tree Powers
 *
 * Theme: A war caster who uses fire as both offense and armor. Apply and escalate
 * Ignite, then turn the existence of those flames into defensive power, sustain,
 * and hard-to-break presence in the middle of the battlefield.
 * Tree Type: Spell (caster framework — no damage Actives; damage comes from the
 *            Pyre Calculus Spell List).
 * Role: Frontline Spellcaster / Burn Tank
 * Primary Special: Ignite • Secondary Axis: Armor
 *
 * Tree Bonus: Once per round, when you apply or increase Ignite, gain +1 Armor
 * until the start of your next turn.
 *
 * 12 Powers: 4 Passives, 4 Reactions, 4 Active Buffs.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const INFERNAL_BASTION_POWERS: NewArtifactPowerData[] = [
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Arcane Combustion',
        fluff: 'Your flames always find more fuel.',
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
                effect: { text: 'Spells with the Ignite Special gain +1 Attack Die.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special gain +2 Attack Dice.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special gain +3 Attack Dice.' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Spells with the Ignite Special gain +4 Attack Dice.' },
                specials: []
            }
        }
    },
    {
        name: 'Flameguard',
        fluff: 'The fire clings to you like a living shield.',
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
                effect: { text: 'While any enemy suffers from Ignite from you, gain +2 Armor.' },
                specials: [],
                mechanics: {armor:2,applyWhen:'passive-slotted-active'}
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +4 Armor.' },
                specials: [],
                mechanics: {armor:4,applyWhen:'passive-slotted-active'}
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +6 Armor.' },
                specials: [],
                mechanics: {armor:6,applyWhen:'passive-slotted-active'}
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'While any enemy suffers from Ignite from you, gain +8 Armor.' },
                specials: [],
                mechanics: {armor:8,applyWhen:'passive-slotted-active'}
            }
        }
    },
    {
        name: 'Ember Focus',
        fluff: 'Precision over raw fury. Then both.',
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
                effect: { text: 'Once per round, the first time you damage an Ignited target with a Spell, add +1d8 damage.', dice: '1d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+1d8'},condition:'targetIgnited',applyWhen:'passive-slotted-active'}
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage an Ignited target with a Spell, add +2d8 damage.', dice: '2d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+2d8'},condition:'targetIgnited',applyWhen:'passive-slotted-active'}
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage an Ignited target with a Spell, add +3d8 damage.', dice: '3d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+3d8'},condition:'targetIgnited',applyWhen:'passive-slotted-active'}
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Once per round, the first time you damage an Ignited target with a Spell, add +4d8 damage.', dice: '4d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+4d8'},condition:'targetIgnited',applyWhen:'passive-slotted-active'}
            }
        }
    },
    {
        name: 'Phoenix Mantle',
        fluff: 'Burn, and be rebuilt between the heartbeats.',
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
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 1d8 HP.', dice: '1d8' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 2d8 HP.', dice: '2d8' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 3d8 HP.', dice: '3d8' },
                specials: []
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'End of your turn: if any enemy suffers from Ignite from you, heal 4d8 HP.', dice: '4d8' },
                specials: []
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Sear Ward',
        fluff: 'A spellcaster’s answer to violence is to make the impact land into a furnace wall.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are hit by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +2 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: [],
                mechanics: {armor:2,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +4 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: [],
                mechanics: {armor:4,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +6 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: [],
                mechanics: {armor:6,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Armor against that attack.' },
                trigger: 'You are hit by an attack.',
                specials: [],
                mechanics: {armor:8,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            }
        }
    },
    {
        name: 'Backdraft',
        fluff: 'Touching your guard just means joining your fire.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'A creature hits you with an attack from within range.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with an attack from within 4 m.',
                specials: [{ key: 'ignite', rank: 1 }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with an attack from within 4 m.',
                specials: [{ key: 'ignite', rank: 2 }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with an attack from within 6 m.',
                specials: [{ key: 'ignite', rank: 3 }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'The attacker catches fire.' },
                trigger: 'A creature hits you with an attack from within 8 m.',
                specials: [{ key: 'ignite', rank: 4 }]
            }
        }
    },
    {
        name: 'Cinder Shell',
        fluff: 'The safest place is often inside your own heat haze.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'You are targeted by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 2 m and gain +2 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: [],
                mechanics: {armor:2,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 4 m and gain +4 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: [],
                mechanics: {armor:4,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 6 m and gain +6 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: [],
                mechanics: {armor:6,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Move up to 8 m and gain +8 Armor against that attack.' },
                trigger: 'You are targeted by an attack.',
                specials: [],
                mechanics: {armor:8,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            }
        }
    },
    {
        name: 'Feed the Core',
        fluff: 'Every successful burn teaches the ward how to harden.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'An enemy suffers damage from Ignite from you.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +2 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: [],
                mechanics: {armor:2,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +4 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: [],
                mechanics: {armor:4,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +6 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: [],
                mechanics: {armor:6,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'untilNextTurn' },
                effect: { text: 'Gain +8 Armor until the start of your next turn.' },
                trigger: 'An enemy suffers damage from Ignite from you.',
                specials: [],
                mechanics: {armor:8,applyWhen:'reaction-once-per-round',usageLimit:{per:'round',max:1}}
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Combustion Surge',
        fluff: 'You superheat the matrix of your next spell.',
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
                effect: { text: 'Your next Spell with Ignite deals +2d8 damage.', dice: '2d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+2d8'},applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spell with Ignite deals +4d8 damage.', dice: '4d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+4d8'},applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spell with Ignite deals +6d8 damage.', dice: '6d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+6d8'},applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your next Spell with Ignite deals +8d8 damage.', dice: '8d8' },
                specials: [],
                mechanics: {damageRider:{flat:'+8d8'},applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            }
        }
    },
    {
        name: 'Inferno Core',
        fluff: 'Your blaze swells nearby embers into a roaring inferno.',
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
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +1.' },
                specials: [{ key: 'ignite', rank: 1, note: 'aura tick, already-burning only' }]
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 6 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +2.' },
                specials: [{ key: 'ignite', rank: 2, note: 'aura tick, already-burning only' }]
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 8 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +3.' },
                specials: [{ key: 'ignite', rank: 3, note: 'aura tick, already-burning only' }]
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 10 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the end of your turn, each enemy in the aura that already has Ignite ≥ 1 increases its Ignite by +4.' },
                specials: [{ key: 'ignite', rank: 4, note: 'aura tick, already-burning only' }]
            }
        }
    },
    {
        name: 'Flameplate',
        fluff: 'The fire clinging to your body stops being heat and starts being structure.',
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
                effect: { text: 'Gain +3 Armor.' },
                specials: [],
                mechanics: {armor:3,applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +5 Armor.' },
                specials: [],
                mechanics: {armor:5,applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +7 Armor.' },
                specials: [],
                mechanics: {armor:7,applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +9 Armor.' },
                specials: [],
                mechanics: {armor:9,applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            }
        }
    },
    {
        name: 'Phoenix Core',
        fluff: 'Once the battlefield is burning, every cast starts rebuilding you.',
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
                effect: { text: 'The first time each round you damage an Ignited target with a Spell, gain +2 Armor and deal +1d8 damage.', dice: '1d8' },
                specials: [],
                mechanics: {armor:2,damageRider:{flat:'+1d8'},condition:'targetIgnited',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you damage an Ignited target with a Spell, gain +3 Armor and deal +2d8 damage.', dice: '2d8' },
                specials: [],
                mechanics: {armor:3,damageRider:{flat:'+2d8'},condition:'targetIgnited',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you damage an Ignited target with a Spell, gain +4 Armor and deal +3d8 damage.', dice: '3d8' },
                specials: [],
                mechanics: {armor:4,damageRider:{flat:'+3d8'},condition:'targetIgnited',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'The first time each round you damage an Ignited target with a Spell, gain +5 Armor and deal +4d8 damage.', dice: '4d8' },
                specials: [],
                mechanics: {armor:5,damageRider:{flat:'+4d8'},condition:'targetIgnited',applyWhen:'activeBuff-active',duration:'masteryRankRounds'}
            }
        }
    }
];
