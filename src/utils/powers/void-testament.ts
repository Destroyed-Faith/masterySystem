/**
 * Void Testament Mastery Tree Powers
 *
 * Theme: A focused pact-caster. Brand a priority target with Hex, layer
 * shadow protection, and turn the pact into repeated spell pressure.
 * Tree Type: Spell (caster framework — no damage Actives in the tree itself;
 *            damage Actives live on the Pact Breach Spell List).
 * Role: Pure Damage / Wardbreaker Caster
 * Primary Special: Hex • Secondary Special: Autofire
 *
 * 7 Powers: 3 Passives, 1 Reaction, 3 Active Buffs.
 * Powers themselves are not Spell-tagged; they support Spell-tagged powers.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const VOID_TESTAMENT_POWERS: NewArtifactPowerData[] = [
    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Shadow Armor',
        fluff: 'The pact hardens around you like layered black lacquer.',
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
                effect: { text: 'Gain +3 Armor.' },
                specials: [],
                mechanics: { armor: 3, applyWhen: 'passive-slotted-active' }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +5 Armor.' },
                specials: [],
                mechanics: { armor: 5, applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +8 Armor.' },
                specials: [],
                mechanics: { armor: 8, applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain +10 Armor.' },
                specials: [],
                mechanics: { armor: 10, applyWhen: 'passive-slotted-active' }
            }
        }
    },
    {
        name: 'Pact Shroud',
        fluff: 'A reserve shell of pact-force settles over you before the first spell is spoken.',
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
                effect: { text: 'At the start of combat, gain 10 Temporary HP.' },
                specials: [],
                mechanics: { applyWhen: 'passive-slotted-active', triggers: { combatStart: { tempHP: '10' } } }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the start of combat, gain 20 Temporary HP.' },
                specials: [],
                mechanics: { applyWhen: 'passive-slotted-active', triggers: { combatStart: { tempHP: '20' } } }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the start of combat, gain 30 Temporary HP.' },
                specials: [],
                mechanics: { applyWhen: 'passive-slotted-active', triggers: { combatStart: { tempHP: '30' } } }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'At the start of combat, gain 40 Temporary HP.' },
                specials: [],
                mechanics: { applyWhen: 'passive-slotted-active', triggers: { combatStart: { tempHP: '40' } } }
            }
        }
    },
    {
        name: 'Pact Brand',
        fluff: 'Once the target is Hexed, every spell starts collecting more than it first promised.',
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
                effect: { text: 'Your Spells deal +1d8 damage against Hexed targets.', dice: '1d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+1d8', vsCondition: 'hexed', vsConditionDamage: '+1d8' }, condition: 'targetHexed', applyWhen: 'passive-slotted-active' }
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells deal +2d8 damage against Hexed targets.', dice: '2d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+2d8', vsCondition: 'hexed', vsConditionDamage: '+2d8' }, condition: 'targetHexed', applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells deal +4d8 damage against Hexed targets.', dice: '4d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+4d8', vsCondition: 'hexed', vsConditionDamage: '+4d8' }, condition: 'targetHexed', applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Your Spells deal +5d8 damage against Hexed targets.', dice: '5d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+5d8', vsCondition: 'hexed', vsConditionDamage: '+5d8' }, condition: 'targetHexed', applyWhen: 'passive-slotted-active' }
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
    {
        name: 'Abyssal Answer',
        fluff: 'The pact hardens just long enough to turn the blow aside.',
        category: 'reaction',
        tags: [],
        rank: 1,
        cost: { action: 'reaction', stones: 0 },
        trigger: 'When you are hit by an attack.',
        roll: { kind: 'none' },
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +3 Armor against the triggering attack.' },
                trigger: 'When you are hit by an attack.',
                specials: [],
                mechanics: { armor: 3, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +5 Armor against the triggering attack.' },
                trigger: 'When you are hit by an attack.',
                specials: [],
                mechanics: { armor: 5, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +8 Armor against the triggering attack.' },
                trigger: 'When you are hit by an attack.',
                specials: [],
                mechanics: { armor: 8, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Gain +10 Armor against the triggering attack.' },
                trigger: 'When you are hit by an attack.',
                specials: [],
                mechanics: { armor: 10, applyWhen: 'reaction-once-per-round', usageLimit: { per: 'round', max: 1 } }
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
    {
        name: 'Dark Vesting',
        fluff: 'The pact closes over you in layers of black ward and reserve force.',
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
                effect: { text: 'Gain +2 Armor and 7 Temporary HP.' },
                specials: [],
                mechanics: { armor: 2, tempHP: '7', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +3 Armor and 12 Temporary HP.' },
                specials: [],
                mechanics: { armor: 3, tempHP: '12', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +4 Armor and 17 Temporary HP.' },
                specials: [],
                mechanics: { armor: 4, tempHP: '17', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Gain +5 Armor and 23 Temporary HP.' },
                specials: [],
                mechanics: { armor: 5, tempHP: '23', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Feast of the Crack',
        fluff: 'Every round the pact takes a little less from you than it gives back.',
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
                effect: { text: 'At the start of your turn, heal 10 HP.' },
                specials: [],
                mechanics: { regen: 10, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the start of your turn, heal 17 HP.' },
                specials: [],
                mechanics: { regen: 17, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the start of your turn, heal 25 HP.' },
                specials: [],
                mechanics: { regen: 25, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'At the start of your turn, heal 32 HP.' },
                specials: [],
                mechanics: { regen: 32, applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    },
    {
        name: 'Open the Ledger',
        fluff: 'Once the account is open, every cast costs the target more.',
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
                effect: { text: 'Your Spells gain +2d8 damage against Hexed targets.', dice: '2d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+2d8', vsCondition: 'hexed', vsConditionDamage: '+2d8' }, condition: 'targetHexed', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +4d8 damage against Hexed targets.', dice: '4d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+4d8', vsCondition: 'hexed', vsConditionDamage: '+4d8' }, condition: 'targetHexed', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +6d8 damage against Hexed targets.', dice: '6d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+6d8', vsCondition: 'hexed', vsConditionDamage: '+6d8' }, condition: 'targetHexed', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Your Spells gain +8d8 damage against Hexed targets.', dice: '8d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+8d8', vsCondition: 'hexed', vsConditionDamage: '+8d8' }, condition: 'targetHexed', applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    }
];
