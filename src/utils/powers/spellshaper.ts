/**
 * Spellshaper Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const SPELLSHAPER_POWERS: PowerDefinition[] = [
    {
        name: 'Empowered Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your spells strike with increased force.',
        levels: [
            { level: 1, type: 'Passive', effect: 'All your Spells deal +1d8 damage.' },
            { level: 2, type: 'Passive', effect: 'All your Spells deal +2d8 damage.' },
            { level: 3, type: 'Passive', effect: 'All your Spells deal +3d8 damage.' },
            { level: 4, type: 'Passive', effect: 'All your Spells deal +4d8 damage.' }
        ]
    },
    {
        name: 'Extended Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your spells linger longer in the world.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Your Spells with duration last +1 Round longer.' },
            { level: 2, type: 'Passive', effect: 'Your Spells with duration last +2 Rounds longer.' },
            { level: 3, type: 'Passive', effect: 'Your Spells with duration last +3 Rounds longer.' },
            { level: 4, type: 'Passive', effect: 'Your Spells with duration last +4 Rounds longer.' }
        ]
    },
    {
        name: 'Widened Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your spells cover a wider area.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Increase Spell AoE Radius by +2m, or grant +1m if the Spell has none.' },
            { level: 2, type: 'Passive', effect: 'Increase Spell AoE Radius by +4m, or grant +2m if the Spell has none.' },
            { level: 3, type: 'Passive', effect: 'Increase Spell AoE Radius by +6m, or grant +3m if the Spell has none.' },
            { level: 4, type: 'Passive', effect: 'Increase Spell AoE Radius by +8m, or grant +4m if the Spell has none.' }
        ]
    },
    {
        name: 'Quickened Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You can cast spells with blinding speed, at a cost.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may cast a Spell as a Reaction, suffering 1 Stress.' },
            { level: 2, type: 'Passive', effect: 'You may cast a Spell as a Reaction, suffering 2 Stress.' },
            { level: 3, type: 'Passive', effect: 'You may cast a Spell as a Reaction, suffering 3 Stress.' },
            { level: 4, type: 'Passive', effect: 'You may cast a Spell as a Reaction, suffering 4 Stress.' }
        ]
    },
    {
        name: 'Twinned Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'You can duplicate your spells onto multiple targets.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may duplicate a single-target Spell onto a second target. Costs 4 Stress.' },
            { level: 2, type: 'Passive', effect: 'Duplicate onto a second target. Costs 3 Stress, or 0 if the target is Hexed or Entangled.' },
            { level: 3, type: 'Passive', effect: 'Duplicate onto a second target. Costs 2 Stress, or 0 if the target is Hexed, Entangled, or Cursed.' },
            { level: 4, type: 'Passive', effect: 'Duplicate onto a second target. Costs 1 Stress, or 0 if the target is Hexed, Entangled, Cursed, or Tormented.' }
        ]
    },
    {
        name: 'Distant Spell',
        tree: 'Spellshaper',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your spells reach further than normal.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Increase Spell Range by +8m.' },
            { level: 2, type: 'Passive', effect: 'Increase Spell Range by +16m.' },
            { level: 3, type: 'Passive', effect: 'Increase Spell Range by +24m.' },
            { level: 4, type: 'Passive', effect: 'Increase Spell Range by +32m.' }
        ]
    }
];

