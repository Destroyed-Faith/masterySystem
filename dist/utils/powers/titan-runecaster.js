/**
 * Titan Runecaster (Forged) Mastery Tree Powers
 */
export const TITAN_RUNECASTER_POWERS = [
    {
        name: 'Ember Rune',
        tree: 'Titan Runecaster',
        powerType: 'buff',
        description: 'The rune of the deep forge burns upon your chest — molten light flowing through your veins.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damaging effect deals +2d8.', special: 'Ignite(1)', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damaging effect deals +4d8.', special: 'Ignite(1)', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damaging effect deals +6d8.', special: 'Ignite(2)', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damaging effect deals +8d8.', special: 'Ignite(2)', cost: { action: true } }
        ]
    },
    {
        name: 'Tempest Rune',
        tree: 'Titan Runecaster',
        powerType: 'buff',
        description: 'The spiraling rune crackles with the living wrath of the storm.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damage roll gains +2d8.', special: 'Shock(1)', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damage roll gains +3d8.', special: 'Shock(2)', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damage roll gains +4d8.', special: 'Shock(2)', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Next damage roll gains +5d8.', special: 'Shock(3)', cost: { action: true } }
        ]
    },
    {
        name: 'Glacier Rune',
        tree: 'Titan Runecaster',
        powerType: 'buff',
        description: 'Cold light ripples across your form — stillness made manifest.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Repeat an AoE effect next round at ½ damage.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Repeat an AoE effect next round at ½ damage.', special: 'Freeze(2)', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Repeat an AoE effect next round at ½ damage.', special: 'Freeze(4)', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Repeat an AoE effect next round at ½ damage.', special: 'Freeze(6)', cost: { action: true } }
        ]
    },
    {
        name: 'Stoneheart Rune',
        tree: 'Titan Runecaster',
        powerType: 'buff',
        description: 'The rune carved into your chest pulses with the rhythm of mountains.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +1 Armor and 2d8 Temporary HP.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +2 Armor and 3d8 Temporary HP.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +3 Armor and 4d8 Temporary HP.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +4 Armor and 5d8 Temporary HP.', cost: { action: true } }
        ]
    },
    {
        name: 'Rift Rune',
        tree: 'Titan Runecaster',
        powerType: 'buff',
        description: 'A flowing rune of cloud and storm lets you twist distance and destiny.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'When hit, you may Teleport 4m away; if out of reach, the attack misses.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'When hit, Teleport 8m away; if out of reach, the attack misses.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'When hit, Teleport 12m away; if out of reach, the attack misses.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'When hit, Teleport 16m away; if out of reach, the attack misses.', cost: { action: true } }
        ]
    },
    {
        name: 'Titanic Resilience',
        tree: 'Titan Runecaster',
        powerType: 'passive',
        passiveCategory: 'save',
        description: 'The runes harden into truth — the Titan endures all storms.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Once per round, if you fail a Save, you may reroll it.' },
            { level: 2, type: 'Passive', effect: 'Twice per round, if you fail a Save, you may reroll it.' },
            { level: 3, type: 'Passive', effect: 'Thrice per round, if you fail a Save, you may reroll it.' },
            { level: 4, type: 'Passive', effect: 'Up to four times per round, if you fail a Save, you may reroll it.' }
        ]
    }
];
//# sourceMappingURL=titan-runecaster.js.map