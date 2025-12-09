/**
 * Forgemaster Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const FORGEMASTER_POWERS: PowerDefinition[] = [
    {
        name: 'Thunder Fists',
        tree: 'Forgemaster',
        powerType: 'buff',
        description: 'Your armor\'s gauntlets hum with stored resonance, discharging power on every strike.',
        levels: [
            { level: 1, type: 'Buff', range: 'Melee', duration: 'Mastery Rank rounds', effect: 'Unarmed strikes deal +2d8 Damage and inflict Shock(1).', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Melee', duration: 'Mastery Rank rounds', effect: 'Unarmed strikes deal +4d8 Damage and inflict Shock(1).', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Melee', duration: 'Mastery Rank rounds', effect: 'Unarmed strikes deal +6d8 Damage and inflict Shock(1).', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Melee', duration: 'Mastery Rank rounds', effect: 'Unarmed strikes deal +8d8 Damage and inflict Shock(1).', cost: { action: true } }
        ]
    },
    {
        name: 'Defensive Field',
        tree: 'Forgemaster',
        powerType: 'reaction',
        description: 'When struck, your armor projects a field of force to absorb the impact.',
        levels: [
            { level: 1, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Gain 10 temporary HP.', cost: { reaction: true } },
            { level: 2, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Gain 20 temporary HP.', cost: { reaction: true } },
            { level: 3, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Gain 30 temporary HP.', cost: { reaction: true } },
            { level: 4, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Gain 40 temporary HP.', cost: { reaction: true } }
        ]
    },
    {
        name: 'Arcane Surge',
        tree: 'Forgemaster',
        powerType: 'utility',
        description: 'The hum of power through tempered steel — brief, blinding, beautiful.',
        levels: [
            { level: 1, type: 'Utility', range: 'Touch', duration: '2 rounds', effect: 'Weapon deals +1d8 Arcane Damage.', special: 'Push(1)', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Touch', duration: '2 rounds', effect: 'Weapon deals +2d8 Arcane Damage.', special: 'Push(2)', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Touch', duration: '3 rounds', effect: 'Weapon deals +3d8 Arcane Damage.', special: 'Push(2)', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Touch', duration: '3 rounds', effect: 'Up to 2 Weapons deal +4d8 Arcane Damage.', special: 'Push(2)', cost: { action: true } }
        ]
    },
    {
        name: 'Lightning Launcher',
        tree: 'Forgemaster',
        powerType: 'buff',
        description: 'Your armor channels energy into a gem-core weapon that fires arcs of lightning.',
        levels: [
            { level: 1, type: 'Buff', range: '12m', aoe: 'Line 2m', duration: 'Mastery Rank rounds', effect: 'Ranged attacks deal +2d8 Damage.', cost: { action: true } },
            { level: 2, type: 'Buff', range: '15m', aoe: 'Line 3m', duration: 'Mastery Rank rounds', effect: 'Ranged attacks deal +4d8 Damage.', cost: { action: true } },
            { level: 3, type: 'Buff', range: '18m', aoe: 'Line 3m', duration: 'Mastery Rank rounds', effect: 'Ranged attacks deal +6d8 Damage.', cost: { action: true } },
            { level: 4, type: 'Buff', range: '20m', aoe: 'Line 4m', duration: 'Mastery Rank rounds', effect: 'Ranged attacks deal +8d8 Damage.', cost: { action: true } }
        ]
    },
    {
        name: 'Guardian Model',
        tree: 'Forgemaster',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'Be the anvil. Let the world break upon you.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +3 Armor while wearing medium or heavy armor.' },
            { level: 2, type: 'Passive', effect: 'Gain +5 Armor while wearing medium or heavy armor.' },
            { level: 3, type: 'Passive', effect: 'Gain +8 Armor while wearing medium or heavy armor.' },
            { level: 4, type: 'Passive', effect: 'Gain +10 Armor while wearing medium or heavy armor.' }
        ]
    },
    {
        name: 'Infiltrator Model',
        tree: 'Forgemaster',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'They can\'t hit what they can\'t follow.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +3 Evade and +1 Armor.' },
            { level: 2, type: 'Passive', effect: 'Gain +5 Evade, +1 Armor, and +2m movement.' },
            { level: 3, type: 'Passive', effect: 'Gain +8 Evade, +1 Armor, and +3m movement.' },
            { level: 4, type: 'Passive', effect: 'Gain +10 Evade, +1 Armor, and +4m movement.' }
        ]
    }
];

