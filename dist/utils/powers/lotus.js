/**
 * Lotus Mastery Tree Powers
 */
export const LOTUS_POWERS = [
    {
        name: 'Tranquil Mind',
        tree: 'Lotus',
        powerType: 'utility',
        description: 'You still your thoughts; ki gathers where violence does not.',
        levels: [
            { level: 1, type: 'Utility', range: 'Self', duration: 'Mastery Rank rounds', effect: 'At the end of each of your turns in which you dealt no damage, heal 1d8 and gain up to +1 Free Raise for your next roll (expires at end of your next turn).', cost: { action: true } },
            { level: 2, type: 'Utility', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but heal 2d8 and gain up to +2 Free Raises.', cost: { action: true } },
            { level: 3, type: 'Utility', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but heal 3d8 and gain up to +3 Free Raises.', cost: { action: true } },
            { level: 4, type: 'Utility', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but heal 4d8 and gain up to +4 Free Raises.', cost: { action: true } }
        ]
    },
    {
        name: 'Ki Resonance',
        tree: 'Lotus',
        powerType: 'buff',
        description: 'Your spirit hums in tune with the world; every motion resonates.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Your Spells and Unarmed Attacks gain +1 Free Raise.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but +2 Free Raises.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but +3 Free Raises.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'As above, but +4 Free Raises.', cost: { action: true } }
        ]
    },
    {
        name: 'Pillar of Resolve',
        tree: 'Lotus',
        powerType: 'buff',
        description: 'Root the heart; storms pass and leave you unmoved.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +1 Resolve.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +2 Resolve.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +3 Resolve.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +4 Resolve.', cost: { action: true } }
        ]
    },
    {
        name: 'Pillar of Intelligence',
        tree: 'Lotus',
        powerType: 'buff',
        description: 'Clarity without doubt; thought without hesitation.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +1 Intelligence.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +2 Intelligence.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +3 Intelligence.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +4 Intelligence.', cost: { action: true } }
        ]
    },
    {
        name: 'Still Mind',
        tree: 'Lotus',
        powerType: 'passive',
        passiveCategory: 'save',
        description: 'Water does not break; neither does your focus.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +1d8 on all Mind or Stress Saves.' },
            { level: 2, type: 'Passive', effect: 'Gain +2d8 on all Mind or Stress Saves.' },
            { level: 3, type: 'Passive', effect: 'Gain +3d8 on all Mind or Stress Saves.' },
            { level: 4, type: 'Passive', effect: 'Gain +4d8 on all Mind or Stress Saves.' }
        ]
    },
    {
        name: 'Pillar of Resolve',
        tree: 'Lotus',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Unbroken will, unshaken heart.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may reroll one failed Stress or Fear Save per round.' },
            { level: 2, type: 'Passive', effect: 'Gain +1 Resolve and you may reroll one failed Stress or Fear Save per round.' },
            { level: 3, type: 'Passive', effect: 'Gain +1 Resolve and you may reroll two failed Stress or Fear Saves per round.' },
            { level: 4, type: 'Passive', effect: 'Gain +2 Resolve and you may reroll two failed Stress or Fear Saves per round.' }
        ]
    },
    {
        name: 'Pillar of Intelligence',
        tree: 'Lotus',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Perception sharpens to a blade\'s edge.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may reroll one failed Mind or Skill roll per round.' },
            { level: 2, type: 'Passive', effect: 'Gain +1 Intelligence and you may reroll one failed Mind or Skill roll per round.' },
            { level: 3, type: 'Passive', effect: 'Gain +1 Intelligence and you may reroll two failed Mind or Skill rolls per round.' },
            { level: 4, type: 'Passive', effect: 'Gain +2 Intelligence and you may reroll two failed Mind or Skill rolls per round.' }
        ]
    }
];
//# sourceMappingURL=lotus.js.map