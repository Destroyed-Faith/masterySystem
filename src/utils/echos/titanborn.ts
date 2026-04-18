import type { EchoDefinition } from './types.js';

export const TITANBORN_ECHO: EchoDefinition = {
  key: 'titanborn',
  name: 'Titanborn',
  tagline: 'The blood remembers.',
  theme: 'Blood of bound giants \u2014 mortal vessels of ancient fury and purpose, wrestling with the pull toward greatness, catastrophe, and the unfinished war of their ancestors.',
  summary:
    'Awakened fury of the godless age. Where others break, Titanborn endure. Where others retreat, they advance. Their greatest struggle is often against the ancient hunger within them, the part that does not want the war to end.',
  creatureType: 'Humanoid',
  size: 'medium',
  speed: 12,
  coreTraits: [
    {
      id: 'large-form',
      name: 'Large Form',
      effect:
        'Starting at Mastery Level 3, you can use an Action to become Large, if space allows. No duration limit; may end at will.',
      flavor: 'The titan\u2019s might awakens within.',
      usage: 'unlock-mr3'
    },
    {
      id: 'true-form',
      name: 'True Form',
      effect:
        'Starting at Mastery Level 6, once per Safe Haven Rest, as an Action, enter your True Titan Form for 1 minute. Become Huge and Armor +6.',
      flavor: 'The full strength of the old blood reveals itself.',
      usage: 'unlock-mr6-once'
    },
    {
      id: 'powerful-build',
      name: 'Powerful Build',
      effect: 'Gain Advantage on checks to end Grappled.',
      flavor: 'Even among mortals, their strength is legend.',
      usage: 'passive'
    }
  ],
  deck: [
    {
      id: 'giantblood-portent',
      name: 'Giantblood Portent',
      trigger: 'You face a crossroads choice and the old blood pulls you toward a path.',
      options: [
        {
          id: 'remember-the-pattern',
          label: 'I \u2014 Remember the Pattern',
          skill: 'lore',
          description: 'You recall how this kind of story ends and what it costs.'
        },
        {
          id: 'see-the-lever',
          label: 'II \u2014 See the Lever',
          skill: 'investigation',
          description: 'You spot the one detail that changes everything.'
        },
        {
          id: 'take-the-measure',
          label: 'III \u2014 Take the Measure',
          skill: 'negotiation',
          description: 'You test motives, prices, and hidden terms before you commit.'
        },
        {
          id: 'feel-the-fault',
          label: 'IV \u2014 Feel the Fault',
          skill: 'empathy',
          description: 'You sense who is about to crack, lie, or betray.'
        }
      ]
    },
    {
      id: 'break-the-barrier',
      name: 'Break the Barrier',
      trigger: 'Something \u201cshouldn\u2019t move\u201d but you decide it will.',
      options: [
        {
          id: 'raw-force',
          label: 'I \u2014 Raw Force',
          skill: 'athletics',
          description: 'You bend, pry, lift, and push until it gives.'
        },
        {
          id: 'control-the-impact',
          label: 'II \u2014 Control the Impact',
          skill: 'acrobatics',
          description: 'You apply strength with timing so you do not overcommit or get punished for it.'
        },
        {
          id: 'through-the-crowd',
          label: 'III \u2014 Through the Crowd',
          skill: 'stealth',
          description: 'You reposition like a shadow despite your presence, taking the angle they never covered.'
        },
        {
          id: 'hold-the-line',
          label: 'IV \u2014 Hold the Line',
          skill: 'survival',
          description: 'You keep going under pain, cold, fire, and exhaustion. You do not stop.'
        }
      ]
    },
    {
      id: 'weight-of-the-sky',
      name: 'Weight of the Sky',
      trigger: 'A long ordeal hits the group and you choose to be the anchor that keeps everyone moving.',
      options: [
        {
          id: 'set-the-pace',
          label: 'I \u2014 Set the Pace',
          skill: 'navigation',
          description: 'You pick the route and timing that preserves strength and avoids the worst.'
        },
        {
          id: 'carry-the-burden',
          label: 'II \u2014 Carry the Burden',
          skill: 'athletics',
          description: 'You take the heavy share and make it possible for others to continue.'
        },
        {
          id: 'keep-them-alive',
          label: 'III \u2014 Keep Them Alive',
          skill: 'survival',
          description: 'Shelter, heat, water, food. You make the land pay its share.'
        },
        {
          id: 'read-the-storm',
          label: 'IV \u2014 Read the Storm',
          skill: 'weatherSense',
          description: 'You adjust before the weather becomes a killer.'
        }
      ]
    },
    {
      id: 'harmony-of-the-old-war',
      name: 'Harmony of the Old War',
      trigger: 'The group is about to fracture and you step in to align them.',
      options: [
        {
          id: 'speak-back-to-one-plan',
          label: 'I \u2014 Speak Them Back to One Plan',
          skill: 'leadership',
          description: 'You impose calm purpose and give everyone something to follow.'
        },
        {
          id: 'trade-peace-for-terms',
          label: 'II \u2014 Trade Peace for Terms',
          skill: 'negotiation',
          description: 'You find the compromise that avoids collapse.'
        },
        {
          id: 'say-what-hurts',
          label: 'III \u2014 Say What Hurts',
          skill: 'intimidation',
          description: 'You force honesty by making the cost of division obvious.'
        },
        {
          id: 'touch-the-human-part',
          label: 'IV \u2014 Touch the Human Part',
          skill: 'persuasion',
          description: 'You remind them what they are protecting and why it matters.'
        }
      ]
    }
  ]
};
