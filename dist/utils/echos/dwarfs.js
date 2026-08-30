export const DWARFS_ECHO = {
    key: 'dwarfs',
    name: 'Dwarfs',
    tagline: 'Stone does not kneel. Neither do we.',
    theme: 'Last bastions of a broken war \u2014 incorruptible, stubborn, and built to hold the line when everything else falls.',
    summary: 'A dying, proud people hated by the powers of Hell. Their flesh resists demonic marks; their souls do not open willingly. Guardians of old crafts, buried names, and weapons fit to wound Hell.',
    creatureType: 'Humanoid',
    size: 'medium',
    speed: 8,
    coreTraits: [],
    deck: [
        {
            id: 'unbreakable-terms',
            name: 'Unbreakable Terms',
            trigger: 'Refuse the corner \u2014 draw the line, make it costly, rally the room, or invoke the old rules.',
            options: [
                {
                    id: 'draw-the-line',
                    label: 'I \u2014 Draw the Line',
                    skill: 'negotiation',
                    description: 'You set a boundary that cannot be \u201cmisunderstood\u201d and force the other side to answer it.'
                },
                {
                    id: 'make-it-costly',
                    label: 'II \u2014 Make It Costly',
                    skill: 'intimidation',
                    description: 'You remind them what refusal will cost. Not loudly. Clearly.'
                },
                {
                    id: 'rally-the-room',
                    label: 'III \u2014 Rally the Room',
                    skill: 'leadership',
                    description: 'You rally your comrades, lock in their resolve, and turn doubt into a united stance.'
                },
                {
                    id: 'old-rules-apply',
                    label: 'IV \u2014 The Old Rules Apply',
                    skill: 'etiquette',
                    description: 'You invoke rank, rite, and precedent. The room remembers how to behave.'
                }
            ]
        },
        {
            id: 'grudge-ledger',
            name: 'Grudge Ledger',
            trigger: 'Hunt the one who broke faith \u2014 find the crack, ask the alley, put it in words, or trap them with truth.',
            options: [
                {
                    id: 'find-the-crack',
                    label: 'I \u2014 Find the Crack',
                    skill: 'investigation',
                    description: 'You pick at details until the weak point shows. A name, a pattern, a mistake.'
                },
                {
                    id: 'ask-the-right-alley',
                    label: 'II \u2014 Ask the Right Alley',
                    skill: 'streetwise',
                    description: 'You know where rumors are born and who sells truth for cheap.'
                },
                {
                    id: 'put-it-in-words',
                    label: 'III \u2014 Put It in Words',
                    skill: 'persuasion',
                    description: 'You turn anger into a case that others can follow.'
                },
                {
                    id: 'set-a-trap-with-truth',
                    label: 'IV \u2014 Set a Trap with Truth',
                    skill: 'deception',
                    description: 'You bait them with what they want and watch them walk into it.'
                }
            ]
        },
        {
            id: 'stone-remembers',
            name: 'Stone Remembers',
            trigger: 'Read what the stone still holds \u2014 ancestral tales, structure, forge-work, or the rune under the dust.',
            options: [
                {
                    id: 'ancestral-tales',
                    label: 'I \u2014 Ancestral Tales',
                    skill: 'lore',
                    description: 'You recognize names, symbols, and patterns that most have forgotten.'
                },
                {
                    id: 'see-the-structure',
                    label: 'II \u2014 See the Structure',
                    skill: 'engineering',
                    description: 'You read weight, stress, and design. You know what holds and what will fail.'
                },
                {
                    id: 'hands-of-the-forge',
                    label: 'III \u2014 Hands of the Forge',
                    skill: 'crafting',
                    description: 'You judge materials and work. You can repair, reinforce, or reshape what is there.'
                },
                {
                    id: 'rune-under-the-dust',
                    label: 'IV \u2014 Rune Under the Dust',
                    skill: 'occultism',
                    description: 'You sense the hidden layer. Wards, bindings, curses, old divine traces.'
                }
            ]
        },
        {
            id: 'anchor-stance',
            name: 'Anchor Stance',
            trigger: 'Hold when pressure hits \u2014 plant your feet, become the wall, quiet footing, or never lose your center.',
            options: [
                {
                    id: 'plant-your-feet',
                    label: 'I \u2014 Plant Your Feet',
                    skill: 'athletics',
                    description: 'You brace, push back, and stay where you are meant to be.'
                },
                {
                    id: 'part-of-the-wall',
                    label: 'II \u2014 Become Part of the Wall',
                    skill: 'concealment',
                    description: 'You go still and unreadable. Hard to notice, harder to move.'
                },
                {
                    id: 'quiet-footing',
                    label: 'III \u2014 Quiet Footing',
                    skill: 'stealth',
                    description: 'You reposition without giving them a clean angle on you.'
                },
                {
                    id: 'never-off-balance',
                    label: 'IV \u2014 Never Off Balance',
                    skill: 'acrobatics',
                    description: 'You keep control of your center. You do not get thrown, tripped, or panicked.'
                }
            ]
        }
    ]
};
//# sourceMappingURL=dwarfs.js.map