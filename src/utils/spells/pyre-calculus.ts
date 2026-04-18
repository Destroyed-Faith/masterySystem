/**
 * Pyre Calculus — Burn Pressure / Frontline Firecasting
 *
 * A close- to mid-range fire Spell List. Applies Ignite, escalates it
 * efficiently, and supports a caster who intends to stay in the fight long
 * enough for burning pressure to become structural advantage.
 *
 * 8 Spells: 6 Active Spells + 2 Movement Spells.
 * Main Special: Ignite • Secondary Axis: Armor-Support / Self-Fortification
 */

import type { SpellDefinition } from './types.js';

export const PYRE_CALCULUS_SPELLS: SpellDefinition[] = [
    // ─── Active Spells ──────────────────────────────────────────────────────
    {
        name: 'Ember Lance',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'A disciplined bolt of fire that exists mostly to make the next moment worse.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Ignite(2)',
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
                special: 'Ignite(3)',
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
                special: 'Ignite(4)',
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
                special: 'Ignite(4)',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'Flame Fan',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'The scholar’s answer to crowding is elegant, circular, and cruel.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: 'Radius 2 m',
                duration: 'Instant',
                effect: '1d8 damage',
                special: 'Ignite(1)',
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
                special: 'Ignite(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: 'Radius 6 m',
                duration: 'Instant',
                effect: '2d8 damage',
                special: 'Ignite(2)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: 'Radius 8 m',
                duration: 'Instant',
                effect: '3d8 damage',
                special: 'Ignite(3)',
                cost: { action: true },
                roll: { damage: '3d8' }
            }
        ]
    },
    {
        name: 'Furnace Mark',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'You do not merely light the target. You assign it to the fire.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Ignite(3)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Ignite(4)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Ignite(5)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '—',
                special: 'Ignite(6)',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Bastion Flare',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'You cast through your own warding heat, and it hardens around you on the way out.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 1d8 damage and gain +2 Armor until the start of your next turn.',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 2d8 damage and gain +4 Armor until the start of your next turn.',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 3d8 damage and gain +6 Armor until the start of your next turn.',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: 'Deal 4d8 damage and gain +8 Armor until the start of your next turn.',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },
    {
        name: 'Crown of Cinders',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'For a moment the target sees only light, then only consequences.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'MR Rounds + 1',
                effect: '—',
                special: 'Blinded(1), Ignite(1)',
                cost: { action: true }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'MR Rounds + 2',
                effect: '—',
                special: 'Blinded(2), Ignite(1)',
                cost: { action: true }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'MR Rounds + 3',
                effect: '—',
                special: 'Blinded(3), Ignite(2)',
                cost: { action: true }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'MR Rounds + 4',
                effect: '—',
                special: 'Blinded(4), Ignite(2)',
                cost: { action: true }
            }
        ]
    },
    {
        name: 'Siege Flame',
        school: 'Pyre Calculus',
        spellType: 'active',
        description: 'Against a burning target, the spell stops asking armor for permission.',
        levels: [
            {
                level: 1,
                type: 'Ranged',
                range: '8 m',
                aoe: '—',
                duration: 'Instant',
                effect: '1d8 damage vs. Ignited target',
                special: 'Penetration(2)',
                cost: { action: true },
                roll: { damage: '1d8' }
            },
            {
                level: 2,
                type: 'Ranged',
                range: '12 m',
                aoe: '—',
                duration: 'Instant',
                effect: '2d8 damage vs. Ignited target',
                special: 'Penetration(4)',
                cost: { action: true },
                roll: { damage: '2d8' }
            },
            {
                level: 3,
                type: 'Ranged',
                range: '16 m',
                aoe: '—',
                duration: 'Instant',
                effect: '3d8 damage vs. Ignited target',
                special: 'Penetration(6)',
                cost: { action: true },
                roll: { damage: '3d8' }
            },
            {
                level: 4,
                type: 'Ranged',
                range: '20 m',
                aoe: '—',
                duration: 'Instant',
                effect: '4d8 damage vs. Ignited target',
                special: 'Penetration(8)',
                cost: { action: true },
                roll: { damage: '4d8' }
            }
        ]
    },

    // ─── Movement Spells ────────────────────────────────────────────────────
    {
        name: 'Ash Fold',
        school: 'Pyre Calculus',
        spellType: 'movement',
        description: 'You step sideways through your own smoke trail.',
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
        name: 'Backdraft Step',
        school: 'Pyre Calculus',
        spellType: 'movement',
        description: 'The spell goes first. You leave immediately after it.',
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
