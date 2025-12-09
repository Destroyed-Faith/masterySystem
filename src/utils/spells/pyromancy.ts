/**
 * Pyromancy — School of Flame Spells
 */

import type { SpellDefinition } from './types.js';

export const PYROMANCY_SPELLS: SpellDefinition[] = [
    {
        name: 'Firebolt',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A bolt of fire that ignites targets and explodes in a small radius.',
        raises: ['Ignite +1 (for two Raises)', 'Range +4m', 'Radius +1m'],
        levels: [
            { level: 1, type: 'Ranged', range: '8m', aoe: 'Radius 2m', duration: 'Instant', effect: '1d8 Fire damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 2, type: 'Ranged', range: '12m', aoe: 'Radius 2m', duration: 'Instant', effect: '2d8 Fire damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } },
            { level: 3, type: 'Ranged', range: '16m', aoe: 'Radius 2m', duration: 'Instant', effect: '3d8 Fire damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '3d8', damageType: 'fire' } },
            { level: 4, type: 'Ranged', range: '20m', aoe: 'Radius 2m', duration: 'Instant', effect: '4d8 Fire damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '4d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Flame Weapon',
        school: 'Pyromancy',
        spellType: 'buff',
        description: 'Your weapon erupts in disciplined flame, its edge shimmering with heat.',
        raises: ['Ignite +1 (for two Raises)', 'Rounds +1 (for two Raises)'],
        levels: [
            { level: 1, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +1d8 damage', special: 'Ignite(1)', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +2d8 damage', special: 'Ignite(1)', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +3d8 damage', special: 'Ignite(2)', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Touch', duration: 'Mastery Rank Rounds', effect: 'Weapon deals +4d8 damage', special: 'Ignite(2)', cost: { action: true } }
        ]
    },
    {
        name: 'Firewall',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A wall of fire that damages those crossing it.',
        raises: ['Ignite +1 (for two Raises)', 'Length +2m', 'Width +1m', 'Rounds +1'],
        levels: [
            { level: 1, type: 'Ranged', range: '8m', aoe: '2×2×2m', duration: '1 rd', effect: 'Crossing takes 1d8 damage', special: 'Ignite(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 2, type: 'Ranged', range: '8m', aoe: '4×2×2m', duration: '1 rd', effect: 'Crossing takes 1d8 damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 3, type: 'Ranged', range: '16m', aoe: '6×2×4m', duration: '1 rd', effect: 'Crossing takes 2d8 damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } },
            { level: 4, type: 'Ranged', range: '16m', aoe: '8×2×3m', duration: '1 rd', effect: 'Crossing takes 3d8 damage', special: 'Ignite(3)', cost: { action: true }, roll: { damage: '3d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Blazing Burst',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'A cone of fire that blinds and ignites enemies.',
        raises: ['Blinded +1 (for two raises)', 'Ignite +1', 'Cone length +2m', 'Range +4m'],
        levels: [
            { level: 1, type: 'Ranged', range: '8m', aoe: 'Cone 90°, length 2m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 2, type: 'Ranged', range: '12m', aoe: 'Cone 90°, length 4m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 3, type: 'Ranged', range: '16m', aoe: 'Cone 90°, length 6m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1), Ignite(2)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 4, type: 'Ranged', range: '20m', aoe: 'Cone 90°, length 8m', duration: 'Instant', effect: '1d8 damage', special: 'Blinded(1), Ignite(3)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Scorching Ray',
        school: 'Pyromancy',
        spellType: 'active',
        description: 'One or more rays of fire that can target multiple enemies.',
        raises: ['Ignite +1 (per Ray)', 'Range +4m (per Ray)'],
        levels: [
            { level: 1, type: 'Ranged', range: '12m', duration: 'Instant', effect: 'One ray (Autofire 0) with 1d8 Damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 2, type: 'Ranged', range: '20m', duration: 'Instant', effect: 'Two rays (Autofire 1) with 1d8 Damage', special: 'Ignite(2)', cost: { action: true }, roll: { damage: '1d8', damageType: 'fire' } },
            { level: 3, type: 'Ranged', range: '12m', duration: 'Instant', effect: 'Two rays (Autofire 1) with 2d8 Damage', special: 'Ignite(4)', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } },
            { level: 4, type: 'Ranged', range: '12m', duration: 'Instant', effect: 'Three rays (Autofire 2) with 2d8 Damage', special: 'Ignite(4)', cost: { action: true }, roll: { damage: '2d8', damageType: 'fire' } }
        ]
    },
    {
        name: 'Blazing Speed',
        school: 'Pyromancy',
        spellType: 'buff',
        description: 'Flames surge through your body, pushing you to impossible speed.',
        raises: ['Damage (+1d8)', 'Ignite(+1)', 'Movement (+2m)'],
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+4m Movement, +1 Attack Die', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+6m Movement, +2 Attack Dice', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+8m Movement, +2 Attack Dice, +1 Keep', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: '+10m Movement, +3 Attack Dice, +1 Keep', cost: { action: true } }
        ]
    }
];

