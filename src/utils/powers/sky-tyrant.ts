/**
 * Sky Tyrant Mastery Tree Powers
 *
 * Theme:  Dragon / Aerial Bruiser-Tank
 * Role:   Bruiser / Tank / Space Control
 * Pillars: Flight • Split Natural Attacks • DR Commitment
 * Requirement: Dragon form, draconic mutation, or natural weapon build.
 * Gated to actors with the "dragonborn" Echo.
 *
 * Playstyle
 * ---------
 * Sky Tyrant plays as a heavy flying predator that commits to a short, brutal
 * rotation: armor up → DR online → flight engage → claws → reaction spike.
 *
 * Contents (7 powers): 2 Actives, 2 Passives, 1 Active Buff, 1 Reaction,
 * 1 Movement. This is a tighter, focused tree rather than the larger format
 * of Warden Dragon / Raptor Dragon.
 *
 * Sanctioned DR subsystem: `Damage Reduction` (passive), `Unyielding Shell`
 * (active buff) and `Unyielding Intercept` (reaction) are the three exclusive
 * DR lines and all live in this tree. Aggregator gating in
 * `src/utils/power-mechanics.ts` requires the passive to be active for the
 * buff/reaction to contribute DR%.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const SKY_TYRANT_POWERS: NewArtifactPowerData[] = [
    // ─── Active ─────────────────────────────────────────────────────────────
    {
        name: 'Rending Claws',
        fluff: 'A dragon does not need finesse to shred something twice in the same heartbeat.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 claw strikes. Split your Attack Pool evenly between them. Add +3d8 bonus damage, divided across the 2 strikes.', dice: '3d8' },
                specials: [],
                mechanics: { splitAttack: true, damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 claw strikes. Split your Attack Pool evenly between them. Add +6d8 bonus damage, divided across the 2 strikes.', dice: '6d8' },
                specials: [],
                mechanics: { splitAttack: true, damageRider: { flat: '+6d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 claw strikes. Split your Attack Pool evenly between them. Add +9d8 bonus damage, divided across the 2 strikes.', dice: '9d8' },
                specials: [],
                mechanics: { splitAttack: true, damageRider: { flat: '+9d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Make 2 claw strikes. Split your Attack Pool evenly between them. Add +12d8 bonus damage, divided across the 2 strikes.', dice: '12d8' },
                specials: [],
                mechanics: { splitAttack: true, damageRider: { flat: '+12d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Tail Sweep',
        fluff: 'One full-body sweep clears the space around you and reminds everyone how much ground a dragon truly occupies.',
        category: 'active',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'might' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack.' },
                specials: [{ key: 'push', rank: 4 }]
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack.' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }]
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack.' },
                specials: [{ key: 'push', rank: 8 }, { key: 'prone', rank: 1 }]
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'instant' },
                effect: { text: 'Tail Attack + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'push', rank: 12 }, { key: 'prone', rank: 1 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Scales',
        fluff: 'Thick overlapping scales turn your body into a living cuirass.',
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
        // Canonical sanctioned Damage Reduction passive. Exclusive DR axis.
        name: 'Damage Reduction',
        fluff: 'Your body does not merely endure impact — it turns force aside through sheer draconic mass.',
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
                effect: { text: 'No effect yet — rank up to unlock DR.' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'No effect yet — rank up to unlock DR.' },
                specials: []
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain 10% Damage Reduction (applied after Armor).' },
                specials: [],
                mechanics: { damageReductionPct: 10, applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Gain 10% Damage Reduction (applied after Armor).' },
                specials: [],
                mechanics: { damageReductionPct: 10, applyWhen: 'passive-slotted-active' }
            }
        }
    },

    // ─── Active Buff ────────────────────────────────────────────────────────
    {
        // Sanctioned DR buff — only contributes when the `Damage Reduction`
        // passive is also active (aggregator gating).
        name: 'Unyielding Shell',
        fluff: 'Your scales lock shut and the full shell of the beast closes around your heart.',
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
                duration: { kind: 'masteryRounds' },
                effect: { text: 'No effect yet — rank up to unlock the DR window.' },
                specials: []
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'No effect yet — rank up to unlock the DR window.' },
                specials: []
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'No effect yet — rank up to unlock the DR window.' },
                specials: []
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'If you currently have DR from a Passive, increase that DR by +10% for the duration, up to a maximum of 20% total DR.' },
                specials: [],
                mechanics: {
                    damageReductionPct: 10,
                    applyWhen: 'activeBuff-active',
                    duration: 'masteryRankRounds'
                }
            }
        }
    },

    // ─── Reaction ───────────────────────────────────────────────────────────
    {
        // Sanctioned DR reaction — only contributes when the `Damage Reduction`
        // passive is also active. One-shot against the triggering hit.
        name: 'Unyielding Intercept',
        fluff: 'With a violent twist of wing, neck, or plated shoulder, you catch the blow on the hardest part of your body.',
        category: 'reaction',
        tags: [],
        rank: 1,
        requiresEcho: ['dragonborn'],
        cost: { action: 'reaction', stones: 0 },
        roll: { kind: 'none' },
        trigger: 'When you are hit by an attack',
        levels: {
            '1': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'No effect yet — rank up to unlock the DR spike.' },
                specials: []
            },
            '2': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'No effect yet — rank up to unlock the DR spike.' },
                specials: []
            },
            '3': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'No effect yet — rank up to unlock the DR spike.' },
                specials: []
            },
            '4': {
                type: 'reaction',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'If you currently have DR from a Passive, increase that DR by +10% against the triggering attack, up to a maximum of 30% total DR.' },
                specials: [],
                mechanics: {
                    damageReductionPct: 10,
                    applyWhen: 'reaction-once-per-round',
                    duration: 'instant',
                    usageLimit: { per: 'round', max: 1 }
                }
            }
        }
    },

    // ─── Movement ───────────────────────────────────────────────────────────
    {
        name: 'Take Flight',
        fluff: 'With one crushing beat of your wings, the ground stops being relevant.',
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
                effect: { text: 'Fly up to 6 m. This movement ignores ground terrain and may move freely in three dimensions.' },
                specials: [],
                mechanics: { movementBonus: 6, ignoreTerrain: true, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Fly up to 12 m. This movement ignores ground terrain and may move freely in three dimensions.' },
                specials: [],
                mechanics: { movementBonus: 12, ignoreTerrain: true, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Fly up to 18 m. This movement ignores ground terrain and may move freely in three dimensions.' },
                specials: [],
                mechanics: { movementBonus: 18, ignoreTerrain: true, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'movement',
                range: { kind: 'self' },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Fly up to 24 m. This movement ignores ground terrain and may move freely in three dimensions.' },
                specials: [],
                mechanics: { movementBonus: 24, ignoreTerrain: true, applyWhen: 'attack-rider' }
            }
        }
    }
];
