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
 * 6 Powers: 3 Actives, 1 Passive, 1 Reaction, 1 Active Buff.
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
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'hex', rank: 2 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'hex', rank: 3 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'hex', rank: 4 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'hex', rank: 5 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            }
        }
    },
    {
        name: 'Spellbait',
        fluff: 'You make the target commit to you, which is exactly what your caster wanted.',
        category: 'active',
        tags: [],
        rank: 1,
        cost: { action: 'attack', stones: 0 },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: {
            '1': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 1d8 damage.', dice: '1d8' },
                specials: [{ key: 'mark', rank: 2 }],
                mechanics: { damageRider: { flat: '+1d8' }, applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 2d8 damage.', dice: '2d8' },
                specials: [{ key: 'mark', rank: 3 }],
                mechanics: { damageRider: { flat: '+2d8' }, applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 3d8 damage.', dice: '3d8' },
                specials: [{ key: 'mark', rank: 4 }],
                mechanics: { damageRider: { flat: '+3d8' }, applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 5d8 damage.', dice: '5d8' },
                specials: [{ key: 'mark', rank: 4 }],
                mechanics: { damageRider: { flat: '+5d8' }, applyWhen: 'attack-rider' }
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
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 3d8 damage vs. Hexed target.', dice: '3d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+3d8', vsCondition: 'hexed', vsConditionDamage: '+3d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            '2': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 5d8 damage vs. Hexed target.', dice: '5d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+5d8', vsCondition: 'hexed', vsConditionDamage: '+5d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            '3': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 8d8 damage vs. Hexed target.', dice: '8d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+8d8', vsCondition: 'hexed', vsConditionDamage: '+8d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            '4': {
                type: 'melee',
                range: { kind: 'distance', m: 0 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Weapon DMG + 10d8 damage vs. Hexed target.', dice: '10d8' },
                specials: [],
                mechanics: { damageRider: { flat: '+10d8', vsCondition: 'hexed', vsConditionDamage: '+10d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        }
    },

    // ─── Passives ───────────────────────────────────────────────────────────
    {
        name: 'Withering Aura',
        fluff: 'The pact does not stay in the wound. It hangs in the air around you.',
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
                effect: { text: '—' },
                specials: []
            },
            '2': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2 m of you gain Hex(1).' },
                specials: [{ key: 'hex', rank: 1, note: 'enemies within 2 m' }],
                mechanics: { applyWhen: 'passive-slotted-active' }
            },
            '3': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 2 m of you gain Hex(2).' },
                specials: [{ key: 'hex', rank: 2, note: 'enemies within 2 m' }],
                mechanics: { applyWhen: 'passive-slotted-active' }
            },
            '4': {
                type: 'passive',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
                effect: { text: 'Enemies within 3 m of you gain Hex(2).' },
                specials: [{ key: 'hex', rank: 2, note: 'enemies within 3 m' }],
                mechanics: { applyWhen: 'passive-slotted-active' }
            }
        }
    },

    // ─── Reactions ──────────────────────────────────────────────────────────
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
                specials: [{ key: 'hex', rank: 2, note: '+1 step on existing stack' }]
            },
            '2': {
                type: 'reaction',
                range: { kind: 'distance', m: 4 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'hex', rank: 2, note: '+1 step on existing stack' }]
            },
            '3': {
                type: 'reaction',
                range: { kind: 'distance', m: 6 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'hex', rank: 4, note: '+2 steps on existing stack' }]
            },
            '4': {
                type: 'reaction',
                range: { kind: 'distance', m: 8 },
                aoe: { shape: 'none' },
                duration: { kind: 'instant' },
                effect: { text: 'Deepen the curse on that target.' },
                trigger: 'A Hexed target moves more than 4 m.',
                specials: [{ key: 'hex', rank: 4, note: '+2 steps on existing stack' }]
            }
        }
    },

    // ─── Active Buffs ───────────────────────────────────────────────────────
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
                aoe: { shape: 'radius', radiusM: 2 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Hexed targets within 2 m gain Hex(+1).' },
                specials: [{ key: 'hex', rank: 2, note: 'escalate Hexed within 2 m' }],
                mechanics: { applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '2': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Hexed targets within 3 m gain Hex(+1).' },
                specials: [{ key: 'hex', rank: 2, note: 'escalate Hexed within 3 m' }],
                mechanics: { applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '3': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 3 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Hexed targets within 3 m gain Hex(+1).' },
                specials: [{ key: 'hex', rank: 2, note: 'escalate Hexed within 3 m' }],
                mechanics: { applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            },
            '4': {
                type: 'buff',
                range: { kind: 'self' },
                aoe: { shape: 'radius', radiusM: 4 },
                duration: { kind: 'masteryRounds' },
                effect: { text: 'Hexed targets within 4 m gain Hex(+1).' },
                specials: [{ key: 'hex', rank: 2, note: 'escalate Hexed within 4 m' }],
                mechanics: { applyWhen: 'activeBuff-active', duration: 'masteryRankRounds' }
            }
        }
    }
];
