export const HUMANS_ECHO = {
    key: 'humans',
    name: 'Humans',
    tagline: 'Every human is a question the world hasn\u2019t answered yet.',
    theme: 'Masters of bad options \u2014 they survive by making deals, adapting fast and paying the price later.',
    summary: 'The most widespread people of the shattered world. Adaptable, resilient, painfully easy to use. Bearers of demonic marks, keepers of small fires in dark places.',
    creatureType: 'Humanoid',
    size: 'medium',
    speed: 10,
    coreTraits: [
        {
            id: 'bad-options',
            name: 'Bad Options',
            effect: 'Mastery Rank per Safe Haven Rest: after you roll a Skill check, you may reroll a die. Multiple uses on the same roll are allowed up to your daily uses. A die can\u2019t be rerolled twice.',
            flavor: 'Humans don\u2019t find good choices. They survive the bad ones.',
            usage: 'mr-per-rest'
        },
        {
            id: 'jack-of-all-trades',
            name: 'Jack of all Trades',
            effect: 'Mastery Rank per Safe Haven Rest: before you roll any check (including attack rolls), you may add +(Mastery Rank \u00d7 4) to that roll.',
            flavor: 'When it matters, humans commit fully.',
            usage: 'mr-per-rest'
        }
    ],
    deck: [
        {
            id: 'refuse-to-give-up',
            name: 'Refuse to Give Up',
            trigger: 'You would be taken out of the scene (overwhelmed, restrained, or removed from the conflict).',
            options: [
                {
                    id: 'one-more-breath',
                    label: 'I \u2014 One More Breath',
                    skill: 'leadership',
                    description: 'You steady yourself and keep moving, one last push to stay in the scene when anyone else would fold.'
                },
                {
                    id: 'make-them-hesitate',
                    label: 'II \u2014 Make Them Hesitate',
                    skill: 'intimidation',
                    description: 'It\u2019s hopeless \u2014 but you surge one last time and force the other side to hesitate.'
                },
                {
                    id: 'dirty-exit',
                    label: 'III \u2014 Dirty Exit',
                    skill: 'streetwise',
                    description: 'You\u2019ve been here too often. You slip out by exploiting patterns, people, chaos, and weaknesses.'
                },
                {
                    id: 'hard-terms',
                    label: 'IV \u2014 Hard Terms',
                    skill: 'negotiation',
                    description: 'You force structure into chaos: conditions, leverage, and a controlled de-escalation \u2014 on your terms.'
                }
            ]
        },
        {
            id: 'desperate-bargain',
            name: 'Desperate Bargain',
            trigger: 'You have no clean options left and still need a win, right now.',
            options: [
                {
                    id: 'name-your-price',
                    label: 'I \u2014 Name Your Price',
                    skill: 'negotiation',
                    description: 'You state what you\u2019ll give and what you demand \u2014 so the bargain has teeth.'
                },
                {
                    id: 'sweeten-the-lie',
                    label: 'II \u2014 Sweeten the Lie',
                    skill: 'deception',
                    description: 'You wrap the deal in half-truths, plausible deniability, and a story they want to believe.'
                },
                {
                    id: 'make-it-personal',
                    label: 'III \u2014 Make It Personal',
                    skill: 'persuasion',
                    description: 'You push the one argument that hits the heart: duty, fear, love, shame, or hope.'
                },
                {
                    id: 'play-the-room',
                    label: 'IV \u2014 Play the Room',
                    skill: 'performance',
                    description: 'You turn the moment into a scene \u2014 timing, tone, audience \u2014 so the bargain becomes inevitable.'
                }
            ]
        },
        {
            id: 'scraprunner-instinct',
            name: 'Scraprunner Instinct',
            trigger: 'You try to solve a problem with whatever is at hand \u2014 junk, broken gear, stolen parts, improvised tools.',
            options: [
                {
                    id: 'quick-hands-quick-fix',
                    label: 'I \u2014 Quick Hands, Quick Fix',
                    skill: 'sleightOfHand',
                    description: 'You patch, swap, or palm the missing piece fast enough that nobody can stop you.'
                },
                {
                    id: 'make-it-move',
                    label: 'II \u2014 Make It Move',
                    skill: 'acrobatics',
                    description: 'You use your body as the tool \u2014 balance, timing, and momentum to turn a bad setup into a working solution.'
                },
                {
                    id: 'do-it-quiet',
                    label: 'III \u2014 Do It Quiet',
                    skill: 'stealth',
                    description: 'You improvise without drawing eyes: no noise, no obvious traces, no attention.'
                },
                {
                    id: 'force-it-through',
                    label: 'IV \u2014 Force It Through',
                    skill: 'athletics',
                    description: 'You brute the solution into place \u2014 bend, pry, drag, wedge \u2014 until reality gives in.'
                }
            ]
        },
        {
            id: 'hard-road-lessons',
            name: 'Hard Road Lessons',
            trigger: 'The day turns ugly \u2014 travel, pursuit, hostile ground, scarcity, or the kind of risk you only learn by surviving it.',
            options: [
                {
                    id: 'follow-the-signs',
                    label: 'I \u2014 Follow the Signs',
                    skill: 'tracking',
                    description: 'You read the ground, the breaks, the rhythm \u2014 finding where they went and how close they are.'
                },
                {
                    id: 'stay-alive-anyway',
                    label: 'II \u2014 Stay Alive Anyway',
                    skill: 'survival',
                    description: 'Shelter, warmth, water, food \u2014 whatever the land gives, you take, without wasting time.'
                },
                {
                    id: 'calm-the-beast',
                    label: 'III \u2014 Calm the Beast',
                    skill: 'animalHandling',
                    description: 'You steady a mount, silence an animal, or keep panic from turning into catastrophe.'
                },
                {
                    id: 'read-the-sky',
                    label: 'IV \u2014 Read the Sky',
                    skill: 'weatherSense',
                    description: 'You catch what\u2019s coming before it hits \u2014 storm, cold, heat, bad visibility \u2014 and adjust in time.'
                }
            ]
        }
    ]
};
//# sourceMappingURL=humans.js.map