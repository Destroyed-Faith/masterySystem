import type { EchoDefinition } from './types.js';

export const DRAGONBORN_ECHO: EchoDefinition = {
  key: 'dragonborn',
  name: 'Dragonborn',
  tagline: 'We were erased. We remember.',
  theme: 'Hidden heirs of dragons living in human skins, guarding old lines, sealed hoards, and the last song that binds their souls.',
  summary:
    'Last living echoes of the First Dragons \u2014 a people who survived extermination by learning to disappear. Bloodlines kept narrow, gatherings rare, true names quiet. Survival taught them that being overlooked is the highest form of power.',
  creatureType: 'Humanoid',
  size: 'medium',
  speed: 12,
  veiledForm: true,
  coreTraits: [
    {
      id: 'veiled-form',
      name: 'Veiled Form',
      effect:
        'Choose one other Echo appearance that your Dragonborn permanently wears in public. You look and sound like that Echo at a glance. You do not gain any Traits, Size benefits, or special rules from that Echo. You are still Dragonborn for all mechanics. Under close inspection by a suspicious party, the GM may call for a Deception or Performance roll (TN Standard) to maintain the veil.',
      flavor: 'Survival is camouflage.',
      usage: 'passive'
    },
    {
      id: 'hoard-thread',
      name: 'Hoard Thread',
      effect:
        'Mastery Rank per Safe Haven Rest: when you need a plausible mundane item, tool, travel supply, or modest payment, you may declare you retrieve it from your sealed hoard (GM may veto only if it breaks the fiction).',
      flavor: 'The world can burn. The hoard remembers.',
      usage: 'mr-per-rest'
    },
    {
      id: 'melody-of-the-beginning',
      name: 'Melody of the Beginning',
      effect:
        'Mastery Rank per Safe Haven Rest at dawn or dusk: take a silent beat and roll Lore or Occultism. On success, learn one useful truth about a place, relic, or lineage. Each Raise makes it more specific.',
      flavor: 'For one breath, you are not alone.',
      usage: 'mr-per-rest'
    }
  ],
  deck: [
    {
      id: 'melody-bound-memory',
      name: 'Melody-Bound Memory',
      trigger: 'A relic, ruin, name, or moment of dawn/dusk stirs something old and you need a truth that was buried.',
      options: [
        {
          id: 'hear-the-chord',
          label: 'I \u2014 Hear the Chord',
          skill: 'occultism',
          description: 'You sense the unseen thread and what it is tied to.'
        },
        {
          id: 'name-the-age',
          label: 'II \u2014 Name the Age',
          skill: 'lore',
          description: 'You place it in the right era, clan, and story.'
        },
        {
          id: 'read-the-work',
          label: 'III \u2014 Read the Work',
          skill: 'engineering',
          description: 'You understand how it was built and where it can be bypassed.'
        },
        {
          id: 'make-it-real',
          label: 'IV \u2014 Make It Real',
          skill: 'crafting',
          description: 'You recreate the key detail: a seal, a proof, a workable replica.'
        }
      ]
    },
    {
      id: 'the-hidden-nest',
      name: 'The Hidden Nest',
      trigger: 'You must move unseen, find safety, or keep others alive while hunters, Sentinels, or fate closes in.',
      options: [
        {
          id: 'find-shelter',
          label: 'I \u2014 Find Shelter',
          skill: 'survival',
          description: 'You pick the safest place and the safest time to stop.'
        },
        {
          id: 'read-the-pursuit',
          label: 'II \u2014 Read the Pursuit',
          skill: 'tracking',
          description: 'You learn how close they are, and how they will approach.'
        },
        {
          id: 'steal-the-weather',
          label: 'III \u2014 Steal the Weather',
          skill: 'weatherSense',
          description: 'You choose the window where nature covers your mistakes.'
        },
        {
          id: 'turn-the-wild',
          label: 'IV \u2014 Turn the Wild',
          skill: 'animalHandling',
          description: 'You use beasts, noise, and instinct to draw danger away.'
        }
      ]
    },
    {
      id: 'make-them-look-away',
      name: 'Make Them Look Away',
      trigger: 'Someone is about to notice the wrong detail, ask the wrong question, or spread the wrong rumor.',
      options: [
        {
          id: 'feed-them-a-story',
          label: 'I \u2014 Feed Them a Story',
          skill: 'deception',
          description: 'You give them a version that ends the curiosity.'
        },
        {
          id: 'guide-the-conversation',
          label: 'II \u2014 Guide the Conversation',
          skill: 'persuasion',
          description: 'You redirect attention without raising alarms.'
        },
        {
          id: 'move-the-gossip',
          label: 'III \u2014 Move the Gossip',
          skill: 'streetwise',
          description: 'You shift the rumor through the right mouths and alleys.'
        },
        {
          id: 'hide-behind-ritual',
          label: 'IV \u2014 Hide Behind Ritual',
          skill: 'etiquette',
          description: 'You use protocol, titles, and social rules to shut doors politely.'
        }
      ]
    },
    {
      id: 'oath-of-the-last',
      name: 'Oath of the Last',
      trigger: 'The group fractures, fear spreads, or a vow must be spoken to keep the line alive.',
      options: [
        {
          id: 'speak-as-command',
          label: 'I \u2014 Speak as Command',
          skill: 'leadership',
          description: 'You make people stand together long enough to act.'
        },
        {
          id: 'bind-it-in-terms',
          label: 'II \u2014 Bind It in Terms',
          skill: 'negotiation',
          description: 'You turn intent into obligation and clear commitments.'
        },
        {
          id: 'remind-them-of-cost',
          label: 'III \u2014 Remind Them of Cost',
          skill: 'intimidation',
          description: 'You make the consequences feel real and immediate.'
        },
        {
          id: 'name-the-real-need',
          label: 'IV \u2014 Name the Real Need',
          skill: 'empathy',
          description: 'You identify what breaks them and offer the one thing that holds.'
        }
      ]
    }
  ]
};
