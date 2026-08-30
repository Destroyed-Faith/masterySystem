export const HALFLINGS_ECHO = {
    key: 'halflings',
    name: 'Halflings',
    tagline: 'The hearth is not a place. It is whoever still shares the last crust.',
    theme: 'Hunted remnants of ordinary joy \u2014 fugitives who survive through kinship, hidden paths, quick hands, and the refusal to let Hell turn hunger into identity.',
    summary: 'The hearthfolk of Tyhra: nearly extinct survivors whose warmth, memory, and soul-rich blood are prized as demonic delicacies. Most live on the run; others survive in locked cellars and feast-prisons, waiting to be served.',
    creatureType: 'Humanoid',
    size: 'small',
    speed: 8,
    coreTraits: [],
    deck: [
        {
            id: 'hearth-ties',
            name: 'Hearth Ties',
            trigger: 'Strangers must trust one another, or a scattered group must act as one.',
            options: [
                {
                    id: 'share-the-last-crumb',
                    label: 'I \u2014 Share the Last Crumb',
                    skill: 'persuasion',
                    description: 'You offer food, shelter, truth, or vulnerability and make cooperation safer than suspicion.',
                },
                {
                    id: 'fair-trade',
                    label: 'II \u2014 Fair Trade',
                    skill: 'negotiation',
                    description: 'You set terms both sides can accept and make breaking them costlier than keeping them.',
                },
                {
                    id: 'read-the-empty-bowl',
                    label: 'III \u2014 Read the Empty Bowl',
                    skill: 'empathy',
                    description: 'You recognize the hunger beneath anger or pride and speak to what they fear losing.',
                },
                {
                    id: 'keep-the-fire-together',
                    label: 'IV \u2014 Keep the Fire Together',
                    skill: 'leadership',
                    description: 'You give everyone one task and one reason. Panic becomes a plan.',
                },
            ],
        },
        {
            id: 'too-small-to-keep',
            name: 'Too Small to Keep',
            trigger: 'A larger enemy, cage, crowd, or collapsing route tries to contain you.',
            options: [
                {
                    id: 'through-the-gap',
                    label: 'I \u2014 Through the Gap',
                    skill: 'acrobatics',
                    description: 'You fold, climb, and slip through an opening never meant to be a path.',
                },
                {
                    id: 'not-worth-seeing',
                    label: 'II \u2014 Not Worth Seeing',
                    skill: 'concealment',
                    description: 'You become part of clutter, shadow, furniture, or crowd until attention moves on.',
                },
                {
                    id: 'move-with-the-noise',
                    label: 'III \u2014 Move with the Noise',
                    skill: 'stealth',
                    description: "You cross the dangerous space inside noise, footsteps, or another creature's distraction.",
                },
                {
                    id: 'key-in-the-palm',
                    label: 'IV \u2014 Key in the Palm',
                    skill: 'sleightOfHand',
                    description: 'A latch opens, a key changes hands, or a chain quietly loosens.',
                },
            ],
        },
        {
            id: 'cellar-born-lessons',
            name: 'Cellar-Born Lessons',
            trigger: 'You face captivity, scarcity, guarded stores, kitchens, or hidden passages.',
            options: [
                {
                    id: 'count-the-guards',
                    label: 'I \u2014 Count the Guards',
                    skill: 'investigation',
                    description: 'You map routines, keys, blind moments, and the mistake repeated each day.',
                },
                {
                    id: 'know-who-takes-bribes',
                    label: 'II \u2014 Know Who Takes Bribes',
                    skill: 'streetwise',
                    description: 'You identify who can be moved without alerting the whole structure.',
                },
                {
                    id: 'live-on-less',
                    label: 'III \u2014 Live on Less',
                    skill: 'survival',
                    description: 'You stretch crumbs, water, warmth, and time far beyond expectation.',
                },
                {
                    id: 'keep-them-breathing',
                    label: 'IV \u2014 Keep Them Breathing',
                    skill: 'medicine',
                    description: 'You stabilize someone with almost nothing until escape is possible.',
                },
            ],
        },
        {
            id: 'the-hunger-hunts',
            name: 'The Hunger Hunts',
            trigger: 'Demons or their servants track, corner, or select someone for consumption.',
            options: [
                {
                    id: 'smell-them-first',
                    label: 'I \u2014 Smell Them First',
                    skill: 'perception',
                    description: 'You notice the appetite first: changed breath, a fixed stare, sudden silence.',
                },
                {
                    id: 'read-the-old-feasts',
                    label: 'II \u2014 Read the Old Feasts',
                    skill: 'lore',
                    description: "You recall a demon's tastes, feast rites, and the taboo that may interrupt them.",
                },
                {
                    id: 'spoil-the-course',
                    label: 'III \u2014 Spoil the Course',
                    skill: 'alchemy',
                    description: 'You spoil food, scent, blood, or preparation so the hunters hesitate.',
                },
                {
                    id: 'follow-the-cart-back',
                    label: 'IV \u2014 Follow the Cart Back',
                    skill: 'tracking',
                    description: 'You read wheel ruts, kitchen waste, chains, and supply routes to find the missing.',
                },
            ],
        },
    ],
};
//# sourceMappingURL=halflings.js.map