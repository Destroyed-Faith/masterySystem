/**
 * Split Tempest — Ranged Shock Pressure / Precision Follow-Up
 *
 * A ranged pressure Spell List that uses Shock to strip tempo from enemies, then
 * turns that instability into Expose and accurate follow-up spell hits.
 *
 * 8 Spells: 6 Active Spells + 2 Movement Spells.
 * Main Special: Shock • Secondary Special: Expose
 */

import type { SpellDefinition } from './types.js';

export const SPLIT_TEMPEST_SPELLS: SpellDefinition[] = [
    // ─── Active Spells ──────────────────────────────────────────────────────
    {
        name: 'Storm Needle',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'A thin lance of lightning snaps from your hand and leaves the target trembling with stolen momentum.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(3)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(4)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(5)',
                cost: { action: true },
                roll: { damage: '1d8' }
            }
        ]
    },
    {
        name: 'Forked Current',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'Lightning forks outward in branching lines, hunting several bodies before the first scream is done.',
        levels: [
            {
                level: 1,
                type: 'Ranged (Spell)',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'One ray deals 1d8 damage.',
                special: 'Shock(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged (Spell, Charged)',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Two rays deal 1d8 damage each.',
                special: 'Shock(2), Autofire(1)',
                cost: { action: true, charged: true },
                roll: { damage: '1d8' }
            },
            {
                level: 3,
                type: 'Ranged (Spell, Charged)',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Three rays deal 1d8 damage each.',
                special: 'Shock(2), Autofire(2)',
                cost: { action: true, charged: true },
                roll: { damage: '1d8' }
            },
            {
                level: 4,
                type: 'Ranged (Spell, Charged)',
                range: '24 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Three rays deal 1d8 damage each.',
                special: 'Shock(3), Autofire(2)',
                cost: { action: true, charged: true },
                roll: { damage: '1d8' }
            }
        ]
    },
    {
        name: 'Thunderclap Sigil',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'You stamp a rune of pressure into the air, and the next heartbeat becomes a burst of sound and white-blue force.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(1)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: 'Radius 4 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: 'Radius 6 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Shock(3)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: 'Radius 8 m',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Shock(3)',
                cost: { action: true },
                roll: { damage: '2d8' }
            }
        ]
    },
    {
        name: 'Split the Stance',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'The charge does not hit hardest where it burns. It hits hardest where it makes the body open wrong.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Expose(2) if target is Shocked',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Expose(3) if target is Shocked',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Expose(4) if target is Shocked',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Expose(5) if target is Shocked',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Storm Through',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'Once the target is rattled, the next bolt goes exactly where it should not be allowed to go.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Expose(1) if target is Shocked',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Expose(1) if target is Shocked',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage',
                special: 'Expose(2) if target is Shocked',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage',
                special: 'Expose(2) if target is Shocked',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'White Noise',
        school: 'Split Tempest',
        spellType: 'active',
        description: 'For one impossible moment, the world becomes only light and impact.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'MR Rounds + 2',
                effect: '—',
                special: 'Blinded(2)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'MR Rounds + 4',
                effect: '—',
                special: 'Blinded(4)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'MR Rounds + 6',
                effect: '—',
                special: 'Blinded(6)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'MR Rounds + 8',
                effect: '—',
                special: 'Blinded(8)',
                cost: { action: true }
            }
        ]
    },

    // ─── Movement Spells ────────────────────────────────────────────────────
    {
        name: 'Arc Flit',
        school: 'Split Tempest',
        spellType: 'movement',
        description: 'You skip sideways along a charge path no one else can see.',
        levels: [
            {
                level: 1,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 4 m.',
                cost: { movement: true }
            },
            {
                level: 2,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 8 m.',
                cost: { movement: true }
            },
            {
                level: 3,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 12 m.',
                cost: { movement: true }
            },
            {
                level: 4,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'Teleport up to 15 m.',
                cost: { movement: true }
            }
        ]
    },
    {
        name: 'Aftershock Slip',
        school: 'Split Tempest',
        spellType: 'movement',
        description: 'You are already moving before the thunder catches up to what you just did.',
        levels: [
            {
                level: 1,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 4 m.',
                cost: { movement: true }
            },
            {
                level: 2,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 8 m.',
                cost: { movement: true }
            },
            {
                level: 3,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 12 m.',
                cost: { movement: true }
            },
            {
                level: 4,
                type: 'Movement',
                range: 'Self',
                aoe: '—',
                duration: 'Instant',
                effect: 'After casting a Spell, teleport up to 15 m.',
                cost: { movement: true }
            }
        ]
    }
];
