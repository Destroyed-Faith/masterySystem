/**
 * Crane Mastery Tree Powers
 */
export const CRANE_POWERS = [
    {
        name: 'Flurry of Strikes',
        tree: 'Crane',
        powerType: 'active',
        description: 'A seamless barrage of rapid blows, each flowing into the next.',
        levels: [
            { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 2 Unarmed Attacks, each Weapon DMG + 1d8', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' } },
            { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 2 Unarmed Attacks, each Weapon DMG + 2d8', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 3 Unarmed Attacks, each Weapon DMG + 2d8', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' } },
            { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Make 3 Unarmed Attacks, each Weapon DMG + 3d8', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' } }
        ]
    },
    {
        name: 'Redirect Momentum',
        tree: 'Crane',
        powerType: 'reaction',
        description: 'Flow with the strike and turn force back upon its source.',
        levels: [
            { level: 1, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Attempt to Grapple the attacker with +1d8 to your Might roll.', cost: { reaction: true } },
            { level: 2, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Attempt to Grapple with +2d8 to your Might roll.', cost: { reaction: true } },
            { level: 3, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Attempt to Grapple with +3d8; on success, the target is Prone(1).', cost: { reaction: true } },
            { level: 4, type: 'Reaction', range: 'Self', duration: 'Instant', effect: 'Attempt to Grapple with +4d8; on success, the target is Prone(1).', cost: { reaction: true } }
        ]
    },
    {
        name: 'Pillar of Might',
        tree: 'Crane',
        powerType: 'buff',
        description: 'Power floods your frame with each measured breath.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +1 Might.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +2 Might.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +3 Might.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +4 Might.', cost: { action: true } }
        ]
    },
    {
        name: 'Pillar of Agility',
        tree: 'Crane',
        powerType: 'buff',
        description: 'Stillness becomes speed; intent becomes motion.',
        levels: [
            { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +1 Agility.', cost: { action: true } },
            { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +2 Agility.', cost: { action: true } },
            { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +3 Agility.', cost: { action: true } },
            { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank rounds', effect: 'Gain +4 Agility.', cost: { action: true } }
        ]
    },
    {
        name: 'Pillar of Might',
        tree: 'Crane',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Power through mastery of form.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may reroll one failed Body Save per round.' },
            { level: 2, type: 'Passive', effect: 'Gain +1 Might and you may reroll one failed Body Save per round.' },
            { level: 3, type: 'Passive', effect: 'Gain +1 Might and you may reroll two failed Body Saves per round.' },
            { level: 4, type: 'Passive', effect: 'Gain +2 Might and you may reroll two failed Body Saves per round.' }
        ]
    },
    {
        name: 'Pillar of Agility',
        tree: 'Crane',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'Motion refined into instinct.',
        levels: [
            { level: 1, type: 'Passive', effect: 'You may reroll one failed Evade roll per round.' },
            { level: 2, type: 'Passive', effect: 'Gain +1 Agility and you may reroll one failed Evade roll per round.' },
            { level: 3, type: 'Passive', effect: 'Gain +1 Agility and you may reroll two failed Evade rolls per round.' },
            { level: 4, type: 'Passive', effect: 'Gain +2 Agility and you may reroll two failed Evade rolls per round.' }
        ]
    },
    {
        name: 'Deflection',
        tree: 'Crane',
        powerType: 'passive',
        passiveCategory: 'utility',
        description: 'You turn strikes aside with effortless precision.',
        levels: [
            { level: 1, type: 'Passive', effect: '+4 Evade.' },
            { level: 2, type: 'Passive', effect: '+8 Evade.' },
            { level: 3, type: 'Passive', effect: '+12 Evade.' },
            { level: 4, type: 'Passive', effect: '+12 Evade; when unarmed, reduce ranged damage you take by 25%.' }
        ]
    },
    {
        name: 'Danger Sense',
        tree: 'Crane',
        powerType: 'passive',
        passiveCategory: 'roll',
        description: 'You feel intent before motion; instinct warns you of every strike.',
        levels: [
            { level: 1, type: 'Passive', effect: 'Gain +1d8 on Perception rolls to detect danger and +2 Initiative.' },
            { level: 2, type: 'Passive', effect: 'Gain +2d8 on Perception rolls and +4 Initiative.' },
            { level: 3, type: 'Passive', effect: 'Gain +3d8 on Perception rolls, +4 Initiative, and +2 Evade.' },
            { level: 4, type: 'Passive', effect: 'Gain +4d8 on Perception rolls, +2 Initiative, and +2 Evade. You are immune to being surprised.' }
        ]
    }
];
//# sourceMappingURL=crane.js.map