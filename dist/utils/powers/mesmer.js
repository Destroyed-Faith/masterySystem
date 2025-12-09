/**
 * Mesmer Mastery Tree Powers
 */
export const MESMER_POWERS = [
    {
        name: 'Mental Shackles',
        tree: 'Mesmer',
        powerType: 'active',
        description: 'You bind the enemy\'s mind in invisible chains that crush thought and motion.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '+1d8 damage', cost: { action: true }, roll: { damage: '+1d8', damageType: 'psychic' } },
            { level: 2, type: 'Active', range: '8m', duration: 'Instant', effect: '+1d8 damage', special: 'Stunned(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'psychic' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '+1d8 damage', special: 'Stunned(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'psychic' } },
            { level: 4, type: 'Active', range: '24m', duration: 'Instant', effect: '+2d8 damage', special: 'Stunned(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'psychic' } }
        ]
    },
    {
        name: 'Nightmare Pulse',
        tree: 'Mesmer',
        powerType: 'active',
        description: 'You unleash a psychic wave that forces foes to face their own terror.',
        levels: [
            { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: '—', special: 'Frightened(1)', cost: { action: true } },
            { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: '+1d8 damage', special: 'Frightened(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'psychic' } },
            { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: '+1d8 damage', special: 'Frightened(3)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'psychic' } },
            { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: '+2d8 damage', special: 'Frightened(4)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'psychic' } }
        ]
    },
    {
        name: 'Psychic Strike',
        tree: 'Mesmer',
        powerType: 'active',
        description: 'A lance of psionic pain that keeps tearing the mind apart.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: '2 Rounds', effect: '1d8 damage / round', cost: { action: true }, roll: { damage: '1d8', damageType: 'psychic' } },
            { level: 2, type: 'Active', range: '12m', duration: '2 Rounds', effect: '2d8 damage / round', cost: { action: true }, roll: { damage: '2d8', damageType: 'psychic' } },
            { level: 3, type: 'Active', range: '16m', duration: '3 Rounds', effect: '2d8 damage / round', cost: { action: true }, roll: { damage: '2d8', damageType: 'psychic' } },
            { level: 4, type: 'Active', range: '20m', duration: '3 Rounds', effect: '3d8 damage / round', cost: { action: true }, roll: { damage: '3d8', damageType: 'psychic' } }
        ]
    },
    {
        name: 'Mesmer Step',
        tree: 'Mesmer',
        powerType: 'movement',
        description: 'You fold reality, stepping through a shimmer of thought.',
        levels: [
            { level: 1, type: 'Movement', range: '8m', duration: 'Instant', effect: 'Teleport up to 8 m (ignores AoO)', cost: { movement: true } },
            { level: 2, type: 'Movement', range: '16m', duration: 'Instant', effect: 'Teleport up to 16 m (ignores AoO)', cost: { movement: true } },
            { level: 3, type: 'Movement', range: '24m', duration: 'Instant', effect: 'Teleport up to 24 m (ignores AoO)', cost: { movement: true } },
            { level: 4, type: 'Movement', range: '32m', duration: 'Instant', effect: 'Teleport up to 32 m (ignores AoO)', cost: { movement: true } }
        ]
    },
    {
        name: 'Psychic Blindspot',
        tree: 'Mesmer',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Once you\'ve pierced a mind, nearby foes struggle to focus.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Enemies within 2m suffer Disoriented(2).' },
            { level: 2, type: 'Passive', effect: 'Enemies within 4m suffer Disoriented(3).' },
            { level: 3, type: 'Passive', effect: 'Enemies within 6m suffer Disoriented(4).' },
            { level: 4, type: 'Passive', effect: 'Enemies within 8m suffer Disoriented(6).' }
        ]
    }
];
//# sourceMappingURL=mesmer.js.map