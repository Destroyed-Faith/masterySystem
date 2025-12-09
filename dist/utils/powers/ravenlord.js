/**
 * Ravenlord Mastery Tree Powers
 */
export const RAVENLORD_POWERS = [
    {
        name: 'Murder of Crows',
        tree: 'Ravenlord',
        powerType: 'active',
        description: 'You summon a swirling flock of spectral ravens to harry your foe.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: '1 round', effect: '2d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: '12m', duration: '1 round', effect: '3d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '3d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: '16m', duration: '1 round', effect: '4d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '4d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: '20m', duration: '1 round', effect: '5d8 damage', special: 'Blinded(1)', cost: { action: true }, roll: { damage: '5d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Shadow of the Old Forest',
        tree: 'Ravenlord',
        powerType: 'active',
        description: 'You call down mist and the hush of the primeval woods.',
        levels: [
            { level: 1, type: 'Active', range: '8m', aoe: 'Radius 3m', duration: '2 rounds', effect: 'Enemies suffer −2 Evade', special: 'Frightened(2)', cost: { action: true } },
            { level: 2, type: 'Active', range: '12m', aoe: 'Radius 4m', duration: '2 rounds', effect: 'Enemies suffer −4 Evade', special: 'Frightened(2)', cost: { action: true } },
            { level: 3, type: 'Active', range: '16m', aoe: 'Radius 5m', duration: '2 rounds', effect: 'Enemies suffer −4 Evade, −1 Save', special: 'Frightened(2)', cost: { action: true } },
            { level: 4, type: 'Active', range: '20m', aoe: 'Radius 6m', duration: '2 rounds', effect: 'Enemies suffer −6 Evade, −2 Saves', special: 'Frightened(3)', cost: { action: true } }
        ]
    },
    {
        name: 'Withering Word',
        tree: 'Ravenlord',
        powerType: 'active',
        description: 'You speak a forbidden word that gnaws at mind and spirit.',
        levels: [
            { level: 1, type: 'Active', range: '8m', duration: 'Instant', effect: '2d8 damage', special: 'Soulburn(1)', cost: { action: true }, roll: { damage: '2d8', damageType: 'psychic' } },
            { level: 2, type: 'Active', range: '12m', duration: 'Instant', effect: '3d8 damage', special: 'Soulburn(1)', cost: { action: true }, roll: { damage: '3d8', damageType: 'psychic' } },
            { level: 3, type: 'Active', range: '16m', duration: 'Instant', effect: '4d8 damage', special: 'Soulburn(2)', cost: { action: true }, roll: { damage: '4d8', damageType: 'psychic' } },
            { level: 4, type: 'Active', range: '20m', duration: 'Instant', effect: '5d8 damage', special: 'Soulburn(2)', cost: { action: true }, roll: { damage: '5d8', damageType: 'psychic' } }
        ]
    },
    {
        name: 'Raven Messenger',
        tree: 'Ravenlord',
        powerType: 'utility',
        description: 'You send forth a raven bearing whispers of command.',
        levels: [
            { level: 1, type: 'Utility', range: '8m', duration: '1 round', effect: 'One ally gains +2 Initiative and +1 Attack Die.', cost: { action: true } },
            { level: 2, type: 'Utility', range: '12m', duration: '1 round', effect: 'One ally gains +2 Initiative and +3 Attack Dice.', cost: { action: true } },
            { level: 3, type: 'Utility', range: '16m', duration: '1 round', effect: 'One ally gains +4 Initiative, +4 Attack Dice, and Crit(1).', cost: { action: true } },
            { level: 4, type: 'Utility', range: '20m', duration: '1 round', effect: 'One ally gains +4 Initiative, Advantage, and Crit(2).', cost: { action: true } }
        ]
    },
    {
        name: 'Eyes of the Raven',
        tree: 'Ravenlord',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your vision extends through your feathered servants.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Initiative and +2 Perception. You may summon a Raven Familiar (1 HP, Speed 10 m, Fly, Perception +4). It can scout but cannot attack.' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Initiative and +4 Perception. The Familiar may use Help once per round (grant Advantage to an ally\'s Perception or Attack vs. a Marked enemy within 4 m).' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Initiative and +6 Perception. The Familiar may apply Mark(1) once per encounter as a free action to an enemy within 8 m.' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Initiative and +8 Perception; you cannot be Surprised. The Familiar may use Help twice per round, and you may see/hear through it for 1 round per Mastery Rank.' }
        ]
    },
    {
        name: 'Old Pact',
        tree: 'Ravenlord',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'Your presence awakens the land to heal those bound by your contract.',
        levels: [
            { level: 1, type: 'Passive', effect: 'At the end of your turn, all allies within 4 m heal 1d8 HP.' },
            { level: 2, type: 'Passive', effect: 'At the end of your turn, all allies within 6 m heal 2d8 HP.' },
            { level: 3, type: 'Passive', effect: 'At the end of your turn, all allies within 8 m heal 3d8 HP.' },
            { level: 4, type: 'Passive', effect: 'At the end of your turn, all allies within 10 m heal 3d8 HP, and ignore 1 Wound Penalty until your next turn.' }
        ]
    },
    {
        name: 'Runes of the Forgotten Pact',
        tree: 'Ravenlord',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Your spells are etched with ancient glyphs of binding power.',
        levels: [
            { level: 1, type: 'Passive', effect: 'All your Spells gain +1 Free Raise.' },
            { level: 2, type: 'Passive', effect: 'When a Spell hits, it deals +1d8 Psychic Damage.' },
            { level: 3, type: 'Passive', effect: 'Your Spells ignore 2 Armor.' },
            { level: 4, type: 'Passive', effect: 'When you cast a Spell, all allies within 4 m heal 1d8 HP.' }
        ]
    },
    {
        name: 'Lord of Shadows',
        tree: 'Ravenlord',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'Your aura chills the heart of the battlefield, eroding courage and will.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Enemies within 4 m suffer −1 die on all Mind/Spirit Saves.' },
            { level: 2, type: 'Passive', effect: 'Enemies within 6 m suffer −2 dice on all Mind/Spirit Saves.' },
            { level: 3, type: 'Passive', effect: 'Enemies within 8 m suffer −3 dice on all Mind/Spirit Saves.' },
            { level: 4, type: 'Passive', effect: 'Enemies within 10 m suffer −4 dice on all Mind/Spirit Saves.' }
        ]
    }
];
//# sourceMappingURL=ravenlord.js.map