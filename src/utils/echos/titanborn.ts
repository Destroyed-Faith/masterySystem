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
  speed: 8,
  coreTraits: [],
  deck: [
    {
      id: 'giantblood-portent',
      name: 'Giantblood Portent',
      trigger: 'The old blood pulls at a crossroads \u2014 recall the pattern, spot the lever, test the price, or feel who will crack.',
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
      trigger: 'What should not move, will \u2014 raw force, timed impact, a shadow\u2019s angle, or endurance that does not stop.',
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
      trigger: 'Be the anchor through a long ordeal \u2014 set the pace, carry the burden, keep them alive, or read the storm.',
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
      trigger: 'Hold the group together \u2014 one plan, hard terms, painful honesty, or the human reason they fight.',
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
