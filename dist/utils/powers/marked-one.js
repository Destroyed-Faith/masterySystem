/**
 * Marked One Mastery Tree Powers
 */
export const MARKED_ONE_POWERS = [
    {
        name: 'Cursed Lance',
        tree: 'Marked One',
        powerType: 'active',
        description: 'A needle of pact-light drives the brand deep into the soul.',
        levels: [
            { level: 1, type: 'Active', range: '12m', duration: 'Instant', effect: '+1d8 damage', special: 'Hex(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'necrotic' } },
            { level: 2, type: 'Active', range: '16m', duration: 'Instant', effect: '+2d8 damage', special: 'Hex(3)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'necrotic' } },
            { level: 3, type: 'Active', range: '20m', duration: 'Instant', effect: '+2d8 damage', special: 'Hex(4)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'necrotic' } },
            { level: 4, type: 'Active', range: '24m', duration: 'Instant', effect: '+2d8 damage', special: 'Hex(5)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'necrotic' } }
        ]
    },
    {
        name: 'Pact Brand',
        tree: 'Marked One',
        powerType: 'passive',
        passiveCategory: 'damage',
        description: 'Your brand scours deeper where Hex has taken root.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Once per round, the first time you damage a Hexed target, add +2d8 damage.' },
            { level: 2, type: 'Passive', effect: 'As above, add +3d8 damage.' },
            { level: 3, type: 'Passive', effect: 'As above, add +4d8 damage.' },
            { level: 4, type: 'Passive', effect: 'As above, add +6d8 damage.' }
        ]
    },
    {
        name: 'Abyssal Ward',
        tree: 'Marked One',
        powerType: 'passive',
        passiveCategory: 'save',
        description: 'Shields of whispers and warding sigils surround your spirit.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +3 dice on Spirit Saves.' },
            { level: 2, type: 'Passive', effect: 'Gain +6 dice on Spirit Saves.' },
            { level: 3, type: 'Passive', effect: 'Gain +9 dice on Spirit Saves.' },
            { level: 4, type: 'Passive', effect: 'Gain +12 dice on Spirit Saves.' }
        ]
    },
    {
        name: 'Dark Armor',
        tree: 'Marked One',
        powerType: 'passive',
        passiveCategory: 'armor',
        description: 'A veil of cursed plate interposes between you and ruin.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +2 Armor and 1d8 Temporary HP at the start of combat.' },
            { level: 2, type: 'Passive', effect: 'Gain +4 Armor and 1d8 Temporary HP at the start of combat.' },
            { level: 3, type: 'Passive', effect: 'Gain +6 Armor and 2d8 Temporary HP at the start of combat.' },
            { level: 4, type: 'Passive', effect: 'Gain +8 Armor and 2d8 Temporary HP at the start of combat.' }
        ]
    },
    {
        name: 'Feast of Anguish',
        tree: 'Marked One',
        powerType: 'passive',
        passiveCategory: 'healing',
        description: 'The pact feeds you when the brand burns bright.',
        levels: [
            { level: 1, type: 'Passive', effect: 'End of your turn: if you applied or increased Hex on any target this round, heal 1d8 HP.' },
            { level: 2, type: 'Passive', effect: 'As above, heal 2d8 HP.' },
            { level: 3, type: 'Passive', effect: 'As above, heal 3d8 HP.' },
            { level: 4, type: 'Passive', effect: 'As above, heal 4d8 HP.' }
        ]
    },
    {
        name: 'Devil\'s Bargain',
        tree: 'Marked One',
        powerType: 'buff',
        description: 'You trade sanity for immediacy.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your next Spell deals +2d8 damage. Once per round.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your next Spell deals +4d8 damage. Once per round.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your next Spell deals +6d8 damage. Once per round.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your next Spell deals +8d8 damage. Once per round.', cost: { action: true } }
        ]
    },
    {
        name: 'Pact Overload',
        tree: 'Marked One',
        powerType: 'buff',
        description: 'Your spells pierce through defenses of the cursed.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your Spells gain Penetration(4) vs. Hexed targets.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your Spells gain Penetration(8) vs. Hexed targets.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your Spells gain Penetration(12) vs. Hexed targets.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Your Spells gain Penetration(16) vs. Hexed targets.', cost: { action: true } }
        ]
    }
];
//# sourceMappingURL=marked-one.js.map