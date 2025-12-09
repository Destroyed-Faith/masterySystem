/**
 * Curseweaver Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const CURSEWEAVER_POWERS: PowerDefinition[] = [
    {
        name: 'Hexbolt',
        tree: 'Curseweaver',
        powerType: 'active',
        description: 'A crackling bolt lances out, carrying a whisper of ruin.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '1d8 damage', special: 'Curse(1)', cost: { action: true }, roll: { damage: '1d8', damageType: 'necrotic' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 damage', special: 'Curse(1)', cost: { action: true }, roll: { damage: '3d8', damageType: 'necrotic' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 damage', special: 'Curse(2)', cost: { action: true }, roll: { damage: '4d8', damageType: 'necrotic' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '6d8 damage', special: 'Curse(2)', cost: { action: true }, roll: { damage: '6d8', damageType: 'necrotic' } }
        ]
    },
    {
        name: 'Web of Malice',
        tree: 'Curseweaver',
        powerType: 'active',
        description: 'You fling a net of ill fate that saps strength and brands the doomed.',
        levels: [
            { level: 1, type: 'Active', range: '8m', aoe: 'Radius 2m', duration: '1 round', effect: 'Enemies suffer −1 Attack Die', cost: { action: true } },
            { level: 2, type: 'Active', range: '12m', aoe: 'Radius 4m', duration: '1 round', effect: 'Enemies suffer −2 Attack Dice, −1 Save Die', special: 'Mark(1)', cost: { action: true } },
            { level: 3, type: 'Active', range: '16m', aoe: 'Radius 6m', duration: '1 round', effect: 'Enemies suffer −2 Attack Dice, −1 Save Die', special: 'Mark(2)', cost: { action: true } },
            { level: 4, type: 'Active', range: '20m', aoe: 'Radius 8m', duration: '1 round', effect: 'Enemies suffer −3 Attack Dice, −1 Save Die', special: 'Mark(2)', cost: { action: true } }
        ]
    },
    {
        name: 'Curseweaver',
        tree: 'Curseweaver',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Every curse you spread tightens your killing grasp.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You deal +1d8 damage per Cursed enemy (max +1d8).' },
            { level: 2, type: 'Passive', effect: 'You deal +1d8 damage per Cursed enemy (max +2d8).' },
            { level: 3, type: 'Passive', effect: 'You deal +2d8 damage per Cursed enemy (max +4d8).' },
            { level: 4, type: 'Passive', effect: 'You deal +2d8 damage per Cursed enemy (max +6d8).' }
        ]
    },
    {
        name: 'Dance of Shadows',
        tree: 'Curseweaver',
        powerType: 'buff',
        description: 'You slip between shadows and strike from the seam of night.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Teleport 4m (shadow → shadow); gain Advantage and +1d8 damage on your next attack.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Teleport 6m; gain Advantage and +3d8 damage on your next attack.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Teleport 8m; gain Advantage and +5d8 damage on your next attack.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Instant', effect: 'Teleport 10m; gain Advantage and +7d8 damage on your next attack.', cost: { action: true } }
        ]
    },
    {
        name: 'Dark Omen',
        tree: 'Curseweaver',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Portents gather around you; the first strike is yours, unseen.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Initiative and +2 Concealment while at least 1 enemy is Cursed.' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Initiative and +4 Concealment while at least 1 enemy is Cursed.' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Initiative and +6 Concealment while at least 2 enemies are Cursed or Marked.' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Initiative and +8 Concealment while at least 3 enemies are Cursed or Marked.' }
        ]
    }
];

