export const UNBOUND_ECHO = {
    key: 'unbound',
    name: 'Unbound',
    tagline: 'The Wyld does not name us. It uses us.',
    theme: 'Living answers without a stable self. You survive by adapting, masking, and turning pressure into motion.',
    summary: 'The world\u2019s reaction when something is forced to become what it was never meant to be. Shapeshifters, witches, druids, oathbreakers of civilization. Not gentle, not evil \u2014 corrective, instinctive, made to oppose what does not belong.',
    creatureType: 'Manifestation',
    size: 'medium',
    speed: 12,
    coreTraits: [],
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