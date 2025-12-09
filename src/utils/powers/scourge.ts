/**
 * Scourge Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const SCOURGE_POWERS: PowerDefinition[] = [
    {
        name: 'Blood Offering',
        tree: 'Scourge',
        powerType: 'utility',
        description: 'You open your palm; your blood becomes light that mends the wounded.',
        levels: [
            { level: 1, type: 'Utility', range: '8m', aoe: 'Radius 4m', duration: 'Instant', effect: 'Allies in AoE heal 1d8; you take 1d8 damage', cost: { action: true } },
            { level: 2, type: 'Utility', range: '12m', aoe: 'Radius 6m', duration: 'Instant', effect: 'Allies in AoE heal 2d8; you take 2d8 damage', cost: { action: true } },
            { level: 3, type: 'Utility', range: '16m', aoe: 'Radius 8m', duration: 'Instant', effect: 'Allies in AoE heal 3d8; you take 3d8 damage', cost: { action: true } },
            { level: 4, type: 'Utility', range: '20m', aoe: 'Radius 10m', duration: 'Instant', effect: 'Allies in AoE heal 4d8; you take 4d8 damage', cost: { action: true } }
        ]
    },
    {
        name: 'Scourging Light',
        tree: 'Scourge',
        powerType: 'buff',
        description: 'Radiant pain scours your flesh; your allies strike with fervor.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +1 Attack Die; you take 1d8 damage', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +2 Attack Dice; you take 2d8 damage', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 8m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +3 Attack Dice; you take 3d8 damage', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 10m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +4 Attack Dice; you take 4d8 damage', cost: { action: true } }
        ]
    },
    {
        name: 'Penance Lash',
        tree: 'Scourge',
        powerType: 'active',
        description: 'A ring of retributive light lashes outward, cutting foe and penitent alike.',
        levels: [
            { level: 1, type: 'Burst', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Enemies in AoE take 2d8 damage; you take 1d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'radiant' } },
            { level: 2, type: 'Burst', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: 'Enemies in AoE take 3d8 damage; you take 2d8 damage', special: 'Bleeding(2)', cost: { action: true }, roll: { damage: '3d8', damageType: 'radiant' } },
            { level: 3, type: 'Burst', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: 'Enemies in AoE take 4d8 damage; you take 2d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '4d8', damageType: 'radiant' } },
            { level: 4, type: 'Burst', range: 'Self', aoe: 'Radius 10m', duration: 'Instant', effect: 'Enemies in AoE take 5d8 damage; you take 3d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '5d8', damageType: 'radiant' } }
        ]
    },
    {
        name: 'Martyr\'s Resilience',
        tree: 'Scourge',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Your pain hardens into will, your wounds knit the instant you accept them.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Whenever you damage yourself with a Scourge ability, gain +3 Armor until the start of your next turn.' },
            { level: 2, type: 'Passive', effect: 'As above, and also gain Regeneration(3).' },
            { level: 3, type: 'Passive', effect: 'As above, with +6 Armor and Regeneration(4).' },
            { level: 4, type: 'Passive', effect: 'As above, with +7 Armor and Regeneration(5).' }
        ]
    },
    {
        name: 'Aura of Atonement',
        tree: 'Scourge',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your suffering radiates outward, scourging the unworthy.',
        levels: [
            { level: 1, type: 'Passive', effect: 'When you lose HP from your own abilities, enemies within 2m take 1d8 damage.' },
            { level: 2, type: 'Passive', effect: 'When you lose HP from your own abilities, enemies within 4m take 2d8 damage.' },
            { level: 3, type: 'Passive', effect: 'When you lose HP from your own abilities, enemies within 8m take 2d8 damage.' },
            { level: 4, type: 'Passive', effect: 'When you lose HP from your own abilities, enemies within 10m take 2d8 damage.' }
        ]
    },
    {
        name: 'Blood for Blood',
        tree: 'Scourge',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Your sacrifice becomes your allies\' strength.',
        levels: [
            { level: 1, type: 'Passive', effect: 'When you lose HP from your own abilities, allies within 2m heal 1d8 HP.' },
            { level: 2, type: 'Passive', effect: 'When you lose HP from your own abilities, allies within 4m heal 2d8 HP.' },
            { level: 3, type: 'Passive', effect: 'When you lose HP from your own abilities, allies within 6m heal 2d8 HP.' },
            { level: 4, type: 'Passive', effect: 'When you lose HP from your own abilities, allies within 8m heal 3d8 HP.' }
        ]
    }
];

