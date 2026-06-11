export const ELVES_ECHO = {
    key: 'elves',
    name: 'Elves',
    tagline: 'We were not made for this world \u2014 and yet we are still here.',
    theme: 'Lingering light of a lost world \u2014 outsiders between realms, carrying memories, dreams and beauty that no longer belong here.',
    summary: 'Children of the Otherworld, Eloria. Stranded when the Four Stone Gates were sealed. Demonic marks catch like thorns in them, never fully sinking \u2014 but that resistance is its own private war.',
    creatureType: 'Humanoid',
    size: 'medium',
    speed: 10,
    coreTraits: [],
    // Elemental Lineage is chosen via the Elven Stride Echo Artifact picker (four
    // separate items: Fire / Earth / Water / Air), not as a racial sub-choice.
    deck: [
        {
            id: 'mask-of-the-fair',
            name: 'Mask of the Fair',
            trigger: 'You must navigate a social space where belonging is weapon and danger is etiquette.',
            options: [
                {
                    id: 'speak-their-rules',
                    label: 'I \u2014 Speak Their Rules',
                    skill: 'etiquette',
                    description: 'You act like you belong and make it costly to question you.'
                },
                {
                    id: 'soften-the-truth',
                    label: 'II \u2014 Soften the Truth',
                    skill: 'deception',
                    description: 'You bend the story just enough to pass without breaking it.'
                },
                {
                    id: 'capture-the-room',
                    label: 'III \u2014 Capture the Room',
                    skill: 'performance',
                    description: 'You choose tone and timing. People follow your rhythm instead of their doubts.'
                },
                {
                    id: 'turn-them-gently',
                    label: 'IV \u2014 Turn Them Gently',
                    skill: 'persuasion',
                    description: 'You guide their thinking without force and make them feel it was their idea.'
                }
            ]
        },
        {
            id: 'twilight-read',
            name: 'Twilight Read',
            trigger: 'A person, place, or conversation feels layered and you try to read what is really going on.',
            options: [
                {
                    id: 'follow-the-thread',
                    label: 'I \u2014 Follow the Thread',
                    skill: 'investigation',
                    description: 'You connect details into motive, pattern, and opportunity.'
                },
                {
                    id: 'hear-the-heartbeat',
                    label: 'II \u2014 Hear the Heartbeat',
                    skill: 'empathy',
                    description: 'You sense what they hide behind poise, fear, or pride.'
                },
                {
                    id: 'frame-the-deal',
                    label: 'III \u2014 Frame the Deal',
                    skill: 'negotiation',
                    description: 'You set terms and leverage that reveal what they truly value.'
                },
                {
                    id: 'draw-them-close',
                    label: 'IV \u2014 Draw Them Close',
                    skill: 'seduction',
                    description: 'You pull attention into intimacy and turn desire into access.'
                }
            ]
        },
        {
            id: 'echo-of-ages',
            name: 'Echo of Ages',
            trigger: 'You encounter an ancient name, symbol, melody, artifact, or spell pattern that feels older than this era.',
            options: [
                {
                    id: 'remember-the-old-story',
                    label: 'I \u2014 Remember the Old Story',
                    skill: 'lore',
                    description: 'You recall fragments of history, courts, and forbidden names that still carry weight.'
                },
                {
                    id: 'read-the-hidden-layer',
                    label: 'II \u2014 Read the Hidden Layer',
                    skill: 'occultism',
                    description: 'You recognize wards, bindings, and the invisible rules beneath the surface.'
                },
                {
                    id: 'body-memory',
                    label: 'III \u2014 Body Memory',
                    skill: 'medicine',
                    description: 'You notice what age did to flesh and bone. Old wounds, old rituals, old methods.'
                },
                {
                    id: 'trace-the-way-it-moved',
                    label: 'IV \u2014 Trace the Way It Moved',
                    skill: 'navigation',
                    description: 'You read routes, patterns, and the geometry of places as if the world still followed Eloria\u2019s design.'
                }
            ]
        },
        {
            id: 'unseen-grace',
            name: 'Unseen Grace',
            trigger: 'You move or act in a tense space while trying to stay subtle, elegant, and hard to pin down.',
            options: [
                {
                    id: 'never-lose-your-center',
                    label: 'I \u2014 Never Lose Your Center',
                    skill: 'acrobatics',
                    description: 'You keep control through pressure. Balance, timing, and calm motion carry you through.'
                },
                {
                    id: 'step-between-attention',
                    label: 'II \u2014 Step Between Attention',
                    skill: 'stealth',
                    description: 'You move when eyes blink and noise rises. You pass without becoming a target.'
                },
                {
                    id: 'become-part-of-the-scene',
                    label: 'III \u2014 Become Part of the Scene',
                    skill: 'concealment',
                    description: 'You choose the angle and the cover that makes you simply not worth noticing.'
                },
                {
                    id: 'light-touch-clean-result',
                    label: 'IV \u2014 Light Touch, Clean Result',
                    skill: 'sleightOfHand',
                    description: 'You take, plant, swap, or free something small without breaking the flow of the moment.'
                }
            ]
        }
    ]
};
//# sourceMappingURL=elves.js.map