export const UNBOUND_ECHO = {
    key: 'unbound',
    name: 'Unbound',
    tagline: 'The Wyld does not name us. It uses us.',
    theme: 'Living answers without a stable self. You survive by adapting, masking, and turning pressure into motion.',
    summary: 'The world\u2019s reaction when something is forced to become what it was never meant to be. Beasts, Witches, and Banes \u2014 not one people, one response. Not gentle, not evil \u2014 corrective, instinctive, made to oppose what does not belong.',
    creatureType: 'Manifestation',
    size: 'medium',
    speed: 8,
    coreTraits: [
        {
            id: 'the-response-takes-over',
            name: 'The Response Takes Over',
            effect: 'When an Unbound is pushed too far, the response may take over. The Beast becomes the shape that hunts. The Witch becomes the curse that speaks through flesh. The Bane becomes the weapon that can no longer stop hunting. Powerful, useful, and never fully theirs.',
            flavor: 'Echo Burden',
            usage: 'passive',
        },
    ],
    subChoiceLabel: 'Unbound Response',
    subChoices: [
        {
            key: 'beast',
            name: 'Beast',
            trait: {
                id: 'beast-response',
                name: 'Beast',
                effect: 'The body\'s response. Predator Crown occupies the Head Slot. Choose a Predator Shape and one Predator Stone path (Might, Wits, or Intellect).',
                flavor: 'Fang, horn, claw, feather, hunger.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-root',
            name: 'Root Witch',
            trait: {
                id: 'root-witch',
                name: 'Root Staff',
                effect: 'Rootbinding is Ranged Attack + Slow. Covenant Overdrive uses Active Buff: Special Increase + Slow. Witch Staff occupies both hands.',
                flavor: 'Buried wood, grave roots, old circles.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-ruin',
            name: 'Ruin Witch',
            trait: {
                id: 'ruin-witch',
                name: 'Ruin Staff',
                effect: 'Ruinous Word is Ranged Attack + Hex. Covenant Overdrive uses Active Buff: Special Increase + Hex. Witch Staff occupies both hands.',
                flavor: 'Blackened wood, ash, erased names.',
                usage: 'passive',
            },
        },
        {
            key: 'witch-blight',
            name: 'Blight Witch',
            trait: {
                id: 'blight-witch',
                name: 'Blight Staff',
                effect: 'Blightcall is Ranged Attack + Corrode. Covenant Overdrive uses Active Buff: Special Increase + Corrode. Witch Staff occupies both hands.',
                flavor: 'Fungus, rust, living decay.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-alchemist',
            name: 'Bane Alchemist',
            trait: {
                id: 'bane-alchemist',
                name: 'Alchemist Coat',
                effect: 'Medium Armor. Red Potion is Active Buff: Damage. Black Potion is Active Buff: Critical. Alchemist Stone supports Vitality Ability: Extend Active Buff.',
                flavor: 'Preparation, not transformation.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-greenwarden',
            name: 'Bane Greenwarden',
            trait: {
                id: 'bane-greenwarden',
                name: 'Green Warden Mantle',
                effect: 'Medium Armor. Thorns is Active Buff: Thorns. Warden\'s Guard is Reaction: Ally Armor. Green Warden Stone supports Resolve Ability: Special Reduction.',
                flavor: 'Bark, thorn, patient violence.',
                usage: 'passive',
            },
        },
        {
            key: 'bane-relic-hunter',
            name: 'Bane Relic Hunter',
            trait: {
                id: 'bane-relic-hunter',
                name: "Hunter's Scourge",
                effect: 'Two-handed chain-whip. Exorcism Lash is Melee Attack + Exorcism. Snap Chain is Artifact Reaction: Damage + Pull. Whirling Scourge is Melee AoE Attack + Exorcism.',
                flavor: 'Pull the monster close.',
                usage: 'passive',
            },
        },
    ],
    deck: [
        {
            id: 'hunger-shapes-the-path',
            name: 'Hunger Shapes the Path',
            trigger: 'Take what the world withholds \u2014 follow the trace, read the land, find the pattern, or make do and move.',
            options: [
                {
                    id: 'follow-the-trace',
                    label: 'I \u2014 Follow the Trace',
                    skill: 'tracking',
                    description: 'You find the freshest sign and keep it in your hands.'
                },
                {
                    id: 'read-the-land',
                    label: 'II \u2014 Read the Land',
                    skill: 'navigation',
                    description: 'You choose the route that the world least wants you to take.'
                },
                {
                    id: 'find-the-pattern',
                    label: 'III \u2014 Find the Pattern',
                    skill: 'investigation',
                    description: 'You notice the repeating detail that reveals where the truth is hiding.'
                },
                {
                    id: 'make-do-and-move',
                    label: 'IV \u2014 Make Do and Move',
                    skill: 'survival',
                    description: 'You improvise shelter, leverage, or a way through with what is available.'
                }
            ]
        },
        {
            id: 'wear-the-world',
            name: 'Wear the World',
            trigger: 'Vanish before the scene swallows you \u2014 become still, move unseen, slip the gap, or take what you need.',
            options: [
                {
                    id: 'become-still',
                    label: 'I \u2014 Become Still',
                    skill: 'concealment',
                    description: 'You pick the perfect place to be forgotten.'
                },
                {
                    id: 'move-unseen',
                    label: 'II \u2014 Move Unseen',
                    skill: 'stealth',
                    description: 'You cross attention without giving it a handle.'
                },
                {
                    id: 'slip-the-gap',
                    label: 'III \u2014 Slip the Gap',
                    skill: 'acrobatics',
                    description: 'You pass where bodies should not pass.'
                },
                {
                    id: 'take-what-you-need',
                    label: 'IV \u2014 Take What You Need',
                    skill: 'sleightOfHand',
                    description: 'You steal seconds, objects, or small truths without starting a fight.'
                }
            ]
        },
        {
            id: 'the-room-is-territory',
            name: 'The Room Is Territory',
            trigger: 'Someone yields first \u2014 show teeth, set the pace, know the undercurrent, or claim the right.',
            options: [
                {
                    id: 'show-teeth',
                    label: 'I \u2014 Show Teeth',
                    skill: 'intimidation',
                    description: 'You make consequences feel close and real.'
                },
                {
                    id: 'set-the-pace',
                    label: 'II \u2014 Set the Pace',
                    skill: 'leadership',
                    description: 'You force order onto chaos so people follow a sequence you control.'
                },
                {
                    id: 'know-the-undercurrent',
                    label: 'III \u2014 Know the Undercurrent',
                    skill: 'streetwise',
                    description: 'You spot who truly runs this space and what they fear losing.'
                },
                {
                    id: 'claim-the-right',
                    label: 'IV \u2014 Claim the Right',
                    skill: 'etiquette',
                    description: 'You use rule, rank, and ritual to corner them into behaving.'
                }
            ]
        },
        {
            id: 'speak-like-a-mask',
            name: 'Speak Like a Mask',
            trigger: 'Steer perception to survive the next minute \u2014 sell the role, give a story, turn them gently, or touch the real fear.',
            options: [
                {
                    id: 'make-it-believable',
                    label: 'I \u2014 Make It Believable',
                    skill: 'performance',
                    description: 'You sell a role so well that doubt feels rude.'
                },
                {
                    id: 'give-them-a-story',
                    label: 'II \u2014 Give Them a Story',
                    skill: 'deception',
                    description: 'You provide the version they can accept while you keep the truth.'
                },
                {
                    id: 'turn-them-gently',
                    label: 'III \u2014 Turn Them Gently',
                    skill: 'persuasion',
                    description: 'You guide them to the choice that keeps you alive.'
                },
                {
                    id: 'touch-the-real-fear',
                    label: 'IV \u2014 Touch the Real Fear',
                    skill: 'empathy',
                    description: 'You find what they actually feel, then speak to that instead of their words.'
                }
            ]
        }
    ]
};
//# sourceMappingURL=unbound.js.map