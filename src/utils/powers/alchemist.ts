/**
 * Alchemist Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const ALCHEMIST_POWERS: PowerDefinition[] = [
    {
        name: 'Alchemical Bomb',
        tree: 'Alchemist',
        powerType: 'active',
        description: 'Hurl an explosive concoction.',
        levels: [
            { level: 1, type: 'Active', range: '8m', aoe: 'Radius 1m', duration: 'Instant', effect: '2d8 fire damage', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } },
            { level: 2, type: 'Active', range: '12m', aoe: 'Radius 2m', duration: 'Instant', effect: '3d8 fire damage', cost: { action: true }, roll: { damage: '3d8', damageType: 'fire' } },
            { level: 3, type: 'Active', range: '16m', aoe: 'Radius 2m', duration: 'Instant', effect: '4d8 fire damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '4d8', damageType: 'fire' } },
            { level: 4, type: 'Active', range: '20m', aoe: 'Radius 3m', duration: 'Instant', effect: '5d8 fire damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '5d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Acid Flask',
        tree: 'Alchemist',
        powerType: 'active',
        description: 'Throw acid that corrodes armor.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 acid damage', special: 'Corrode(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'acid' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 acid damage', special: 'Corrode(2)', cost: { action: true }, roll: { damage: '3d8', damageType: 'acid' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 acid damage', special: 'Corrode(3)', cost: { action: true }, roll: { damage: '4d8', damageType: 'acid' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '5d8 acid damage', special: 'Corrode(4)', cost: { action: true }, roll: { damage: '5d8', damageType: 'acid' } }
        ]
    },
    {
        name: 'Healing Elixir',
        tree: 'Alchemist',
        powerType: 'utility',
        description: 'A potent healing brew.',
        levels: [
            { level: 1, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 2d8 HP', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 3d8 HP and grant Regeneration(1) for 2 rounds', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 4d8 HP and grant Regeneration(2) for 2 rounds', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Touch', duration: 'Instant', effect: 'Heal target for 5d8 HP and grant Regeneration(3) for 3 rounds', cost: { action: true } }
        ]
    },
    {
        name: 'Transmutation',
        tree: 'Alchemist',
        powerType: 'buff',
        description: 'Enhance physical capabilities through alchemy.',
        levels: [
            { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +2 to one attribute', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +3 to one attribute', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +4 to one attribute and +2 Armor', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Target gains +5 to one attribute and +4 Armor', cost: { action: true } }
        ]
    },
    {
        name: 'Volatile Mixture',
        tree: 'Alchemist',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your bombs and acids deal extra damage.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Alchemical attacks deal +1d8 damage.' },
            { level: 2, type: 'Passive', effect: 'Alchemical attacks deal +2d8 damage.' },
            { level: 3, type: 'Passive', effect: 'Alchemical attacks deal +3d8 damage and ignore 2 Armor.' },
            { level: 4, type: 'Passive', effect: 'Alchemical attacks deal +4d8 damage and ignore 4 Armor.' }
        ]
    }
];

