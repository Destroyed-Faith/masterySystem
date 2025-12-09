/**
 * Wraith Mastery Tree Powers
 */

import type { PowerDefinition } from './types.js';

export const WRAITH_POWERS: PowerDefinition[] = [
    {
        name: 'Wraith Form',
        tree: 'Wraith',
        powerType: 'buff',
        description: 'You dissolve into mist and shadow, beyond reach of mortal steel.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'MR Rounds', effect: 'Become Desolidified; move through walls and creatures; ignore the first attack that hits you.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'MR Rounds', effect: 'As above; ignore 2 attacks.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'MR Rounds', effect: 'As above; ignore 3 attacks.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'MR Rounds', effect: 'As above; ignore 4 attacks.', cost: { action: true } }
        ]
    },
    {
        name: 'Wraith\'s Chill',
        tree: 'Wraith',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Frost bleeds from your spectral presence, numbing limbs wherever you pass.',
        levels: [
            { level: 1, type: 'Passive', effect: 'While Desolidified, enemies in Radius 2m suffer Freeze(2) at the start of their turn.' },
            { level: 2, type: 'Passive', effect: 'While Desolidified, enemies in Radius 2m suffer Freeze(3) at the start of their turn.' },
            { level: 3, type: 'Passive', effect: 'While Desolidified, enemies in Radius 2m suffer Freeze(4) at the start of their turn.' },
            { level: 4, type: 'Passive', effect: 'While Desolidified, enemies in Radius 3m suffer Freeze(4) at the start of their turn.' }
        ]
    },
    {
        name: 'Soul Chill',
        tree: 'Wraith',
        powerType: 'active',
        description: 'A shard of ghostly frost pierces flesh and spirit alike.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 damage', special: 'Freeze(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'cold' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 damage', special: 'Freeze(2)', cost: { action: true }, roll: { damage: '3d8', damageType: 'cold' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 damage', special: 'Freeze(3)', cost: { action: true }, roll: { damage: '4d8', damageType: 'cold' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '5d8 damage', special: 'Freeze(4)', cost: { action: true }, roll: { damage: '5d8', damageType: 'cold' } }
        ]
    },
    {
        name: 'Terror\'s Grasp',
        tree: 'Wraith',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'A constant whisper of death saps the courage of all who stand near.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Adjacent enemies suffer Frightened(1) while they remain adjacent.' },
            { level: 2, type: 'Passive', effect: 'Enemies within Radius 2m suffer Frightened(2).' },
            { level: 3, type: 'Passive', effect: 'Enemies within Radius 4m suffer Frightened(4).' },
            { level: 4, type: 'Passive', effect: 'Enemies within Radius 6m suffer Frightened(6).' }
        ]
    },
    {
        name: 'Echo of the Grave',
        tree: 'Wraith',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'The slain feed your fading essence, knitting your form with ghostlight.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Whenever an enemy dies, regain 2d8 HP.' },
            { level: 2, type: 'Passive', effect: 'Whenever an enemy dies, regain 3d8 HP.' },
            { level: 3, type: 'Passive', effect: 'Whenever an enemy dies, regain 5d8 HP.' },
            { level: 4, type: 'Passive', effect: 'Whenever an enemy dies, regain 6d8 HP.' }
        ]
    },
    {
        name: 'Dread Aura',
        tree: 'Wraith',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your presence erodes enemy resolve, making them falter in the face of death.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Enemies within 2m suffer −1 die on all Mind/Spirit Saves.' },
            { level: 2, type: 'Passive', effect: 'Enemies within 4m suffer −2 dice on all Mind/Spirit Saves.' },
            { level: 3, type: 'Passive', effect: 'Enemies within 6m suffer −2 dice on all Mind/Spirit Saves.' },
            { level: 4, type: 'Passive', effect: 'Enemies within 8m suffer −3 dice on all Mind/Spirit Saves.' }
        ]
    }
];

