/**
 * Pact Breach — Single-Target Wardbreaker Magic
 *
 * A surgical warlock-style spell list: apply Hex to one or more targets, then
 * use a pact blast as the signature pressure tool while short teleportation
 * and repeated single-target spells keep the caster online.
 *
 * 5 Spells: 4 Active Spells + 1 Movement Spell.
 * Main Special: Hex • Secondary Special: Autofire
 */

import type { SpellDefinition } from './types.js';

export const PACT_BREACH_SPELLS: SpellDefinition[] = [
    // ─── Active Spells ──────────────────────────────────────────────────────
    {
        name: 'Blight Brand',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'A black brand blooms over the target and spreads the pact through nearby souls.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: 'Brand the area; each enemy inside gains Hex(1).',
                special: 'Hex(1)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: 'Brand the area; each enemy inside gains Hex(1).',
                special: 'Hex(1)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: 'Brand the area; each enemy inside gains Hex(2).',
                special: 'Hex(2)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: 'Radius 3 m',
                duration: 'Instant',
                effect: 'Brand the area; each enemy inside gains Hex(2).',
                special: 'Hex(2)',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Eldritch Sunder',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'The pact does not fire in a single line. It tears into two separate bolts and lets both find the weakness.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Make 2 spell strikes. Split your Attack Pool evenly between them. Add +3d8 bonus damage, divided across the 2 strikes.',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Make 2 spell strikes. Split your Attack Pool evenly between them. Add +6d8 bonus damage, divided across the 2 strikes.',
                cost: { action: true },
                roll: { damage: '6d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Make 2 spell strikes. Split your Attack Pool evenly between them. Add +8d8 bonus damage, divided across the 2 strikes.',
                cost: { action: true },
                roll: { damage: '8d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Make 2 spell strikes. Split your Attack Pool evenly between them. Add +11d8 bonus damage, divided across the 2 strikes.',
                cost: { action: true },
                roll: { damage: '11d8' }
            }
        ]
    },
    {
        name: 'Void Collection',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'Once the pact is open, the abyss begins collecting what it is owed.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '3d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+3d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '5d8 damage vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '5d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+5d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '8d8 damage vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '8d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+8d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: '10d8 damage vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '10d8' },
                mechanics: { damageRider: { vsCondition: 'hexed', vsConditionDamage: '+10d8' }, condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },
    {
        name: 'Soul Tithe',
        school: 'Pact Breach',
        spellType: 'active',
        description: 'What the pact tears free from them, it lets you keep for a while.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 1d8 damage and self heal 1d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '1d8', healing: '1d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 2d8 damage and self heal 2d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '2d8', healing: '2d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 3d8 damage and self heal 3d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '3d8', healing: '3d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 4d8 damage and self heal 4d8 HP vs. Hexed target.',
                cost: { action: true },
                roll: { damage: '4d8', healing: '4d8' },
                mechanics: { condition: 'targetHexed', applyWhen: 'attack-rider' }
            }
        ]
    },

    // ─── Movement Spells ────────────────────────────────────────────────────
    {
        name: 'Rift Skive',
        school: 'Pact Breach',
        spellType: 'movement',
        description: 'A short wound opens in the dark behind the pact, and you step through it with one nearby ally before it closes.',
        levels: [
            {
                level: 1,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 2 m. You may bring 1 willing ally within 2 m with you.',
                cost: { movement: true }
            },
            {
                level: 2,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 6 m. You may bring 1 willing ally within 2 m with you.',
                cost: { movement: true }
            },
            {
                level: 3,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 10 m. You may bring 1 willing ally within 2 m with you.',
                cost: { movement: true }
            },
            {
                level: 4,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 14 m. You may bring 1 willing ally within 2 m with you.',
                cost: { movement: true }
            }
        ]
    }
];
