/**
 * Siren Mastery Tree Powers
 */
export const SIREN_POWERS = [
    {
        name: 'Enchanting Verse',
        tree: 'Siren',
        powerType: 'buff',
        description: 'Your song unsettles minds and frays resistance.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank rounds', effect: 'Enemies suffer −2 dice on Mind Saves', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank rounds', effect: 'Enemies suffer −3 dice on Mind Saves', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 8m', duration: 'Mastery Rank rounds', effect: 'Enemies suffer −4 dice on Mind Saves', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 10m', duration: 'Mastery Rank rounds', effect: 'Enemies suffer −6 dice on Mind Saves', cost: { action: true } }
        ]
    },
    {
        name: 'Irresistible Performance',
        tree: 'Siren',
        powerType: 'active',
        description: 'Your art entrances the foe; blades lower, hearts sway.',
        levels: [
            { level: 1, type: 'Burst', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank rounds', effect: '—', special: 'Charmed(1)', cost: { action: true } },
            { level: 2, type: 'Burst', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank rounds', effect: '—', special: 'Charmed(4)', cost: { action: true } },
            { level: 3, type: 'Burst', range: 'Self', aoe: 'Radius 8m', duration: 'Mastery Rank rounds', effect: '—', special: 'Charmed(6)', cost: { action: true } },
            { level: 4, type: 'Burst', range: 'Self', aoe: 'Radius 10m', duration: 'Mastery Rank rounds', effect: '—', special: 'Charmed(9)', cost: { action: true } }
        ]
    },
    {
        name: 'Echo of Fate',
        tree: 'Siren',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You pluck at destiny\'s thread to grant second chances.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Once per round, 1 ally within 6m may reroll 1 die.' },
            { level: 2, type: 'Passive', effect: 'Once per round, up to 2 allies may reroll 1 die each.' },
            { level: 3, type: 'Passive', effect: 'Once per round, 1 ally rerolls 2 dice, or 2 allies reroll 1 die each.' },
            { level: 4, type: 'Passive', effect: 'Once per round, up to 2 allies reroll 1 die each, or 1 ally rerolls 2 dice.' }
        ]
    },
    {
        name: 'Dancer\'s Grace',
        tree: 'Siren',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'Your steps weave through danger like water around stone.',
        levels: [
            { level: 1, type: 'Passive', effect: '+4 Evade.' },
            { level: 2, type: 'Passive', effect: '+6 Evade, +2m movement.' },
            { level: 3, type: 'Passive', effect: '+10 Evade, +2m movement.' },
            { level: 4, type: 'Passive', effect: '+12 Evade, +4m movement.' }
        ]
    },
    {
        name: 'Melody of Resilience',
        tree: 'Siren',
        powerType: 'buff',
        description: 'Your melody steels hearts against despair and doubt.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 3m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +1 die on all Saves.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +2 dice on all Saves.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 5m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +3 dice on all Saves.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank rounds', effect: 'Allies in AoE gain +4 dice on all Saves.', cost: { action: true } }
        ]
    },
    {
        name: 'Harmony of Resolve',
        tree: 'Siren',
        powerType: 'reaction',
        description: 'When an ally falters, your voice lifts them back to the rhythm of battle.',
        levels: [
            { level: 1, type: 'Reaction', range: '6m', duration: 'Instant', effect: 'One ally gains +1d8 to their next roll and heals 1d8 HP.', cost: { reaction: true } },
            { level: 2, type: 'Reaction', range: '8m', duration: 'Instant', effect: 'One ally gains +2d8 to their next roll and heals 1d8 HP.', cost: { reaction: true } },
            { level: 3, type: 'Reaction', range: '10m', duration: 'Instant', effect: 'One ally gains +2d8 to their next roll and heals 2d8 HP.', cost: { reaction: true } },
            { level: 4, type: 'Reaction', range: '10m', duration: 'Instant', effect: 'Up to 2 allies each gain +2d8 to their next roll and heal 2d8 HP.', cost: { reaction: true } }
        ]
    }
];
//# sourceMappingURL=siren.js.map