import type { EchoDefinition } from './types.js';

export const SENTINELS_ECHO: EchoDefinition = {
  key: 'sentinels',
  name: 'Sentinels',
  tagline: 'Verdicts in motion, built for gods that no longer answer.',
  theme: 'Haunted protocols of dead gods \u2014 living verdicts with a divine core, still executing orders in a world where the issuing authority is gone.',
  summary:
    'Divinely-forged engines of judgment: ancient, deathless, built for obedience. Their radiant divine cores are hunted by demons. Some remain, some doubt, some chose to defend mortals instead of ruling them.',
  creatureType: 'Humanoid',
  size: 'medium',
  speed: 10,
  coreTraits: [],
  subChoiceLabel: 'Order Protocol',
  subChoices: [
    {
      key: 'judicators',
      name: 'Judicators \u2014 Sentence Engine',
      trait: {
        id: 'sentence-engine',
        name: 'Sentence Engine',
        effect:
          'Mastery Rank per Safe Haven Rest: when you openly pronounce a Verdict on a target you can see (guilty, condemned, spared, warned), your next roll against that target this scene that succeeds gains +1 Raise. Cannot turn a failure into a success.',
        flavor: 'Law made sharp.',
        usage: 'mr-per-rest'
      }
    },
    {
      key: 'sentinels',
      name: 'Sentinels \u2014 Bulwark Overdrive',
      trait: {
        id: 'bulwark-overdrive',
        name: 'Bulwark Overdrive',
        effect:
          'Mastery Rank per Safe Haven Rest: as a reaction when you would take damage (or at the start of your turn), increase your Armor by your Mastery Rank until the start of your next turn.',
        flavor: 'A wall that remembers how to hold.',
        usage: 'mr-per-rest'
      }
    },
    {
      key: 'oracles',
      name: 'Oracles \u2014 Oracular Overclock',
      trait: {
        id: 'oracular-overclock',
        name: 'Oracular Overclock',
        effect:
          'Mastery Rank per Safe Haven Rest: after you roll Occultism, Investigation, Lore, Engineering, or any spell/arcane roll, you may mark 1 Stress to reroll one die. A die can\u2019t be rerolled twice.',
        flavor: 'The gods are gone. The signal remains.',
        usage: 'mr-per-rest'
      }
    }
  ],
  deck: [
    {
      id: 'lawkeepers-gaze',
      name: 'Lawkeeper\u2019s Gaze',
      trigger: 'You confront lies, crimes, or broken oaths in public and demand an answer.',
      options: [
        {
          id: 'speak-the-verdict',
          label: 'I \u2014 Speak the Verdict',
          skill: 'intimidation',
          description: 'You make the room feel the weight of consequences.'
        },
        {
          id: 'call-them-to-order',
          label: 'II \u2014 Call Them to Order',
          skill: 'leadership',
          description: 'You stabilize the moment and force a clear sequence: who speaks, who answers, what happens next.'
        },
        {
          id: 'set-the-terms',
          label: 'III \u2014 Set the Terms',
          skill: 'negotiation',
          description: 'You frame the exchange as conditions and obligations, not pleading.'
        },
        {
          id: 'invoke-protocol',
          label: 'IV \u2014 Invoke Protocol',
          skill: 'etiquette',
          description: 'You use rank, rite, and procedure to strip them of excuses.'
        }
      ]
    },
    {
      id: 'protocol-override',
      name: 'Protocol Override',
      trigger: 'Your directive clashes with the moment and you must bend the situation without breaking your purpose.',
      options: [
        {
          id: 'trace-the-facts',
          label: 'I \u2014 Trace the Facts',
          skill: 'investigation',
          description: 'You isolate the key variable that makes the whole scene change.'
        },
        {
          id: 'rewrite-the-ask',
          label: 'II \u2014 Rewrite the Ask',
          skill: 'persuasion',
          description: 'You reframe intent so compliance becomes the \u201creasonable\u201d choice.'
        },
        {
          id: 'feed-them-the-story',
          label: 'III \u2014 Feed Them the Story',
          skill: 'deception',
          description: 'You give them a version they can accept while you keep control.'
        },
        {
          id: 'read-the-fault-line',
          label: 'IV \u2014 Read the Fault Line',
          skill: 'empathy',
          description: 'You identify what they fear, crave, or hide, then press exactly there.'
        }
      ]
    },
    {
      id: 'divine-diagnostic',
      name: 'Divine Diagnostic',
      trigger: 'You examine a wound, device, ward, or scene for hidden failure, corruption, or the one detail that explains it all.',
      options: [
        {
          id: 'run-the-schema',
          label: 'I \u2014 Run the Schema',
          skill: 'engineering',
          description: 'You map the mechanism and identify the failure point.'
        },
        {
          id: 'read-the-record',
          label: 'II \u2014 Read the Record',
          skill: 'lore',
          description: 'You recognize origin, maker, rite, and intended function.'
        },
        {
          id: 'sense-the-interference',
          label: 'III \u2014 Sense the Interference',
          skill: 'occultism',
          description: 'You detect divine or demonic distortion and where it is anchored.'
        },
        {
          id: 'stabilize-the-subject',
          label: 'IV \u2014 Stabilize the Subject',
          skill: 'medicine',
          description: 'You prevent the situation from worsening and set a clean procedure to fix it.'
        }
      ]
    },
    {
      id: 'mandate-trail',
      name: 'Mandate Trail',
      trigger: 'You pursue a threat, keep a patrol line, or predict where trouble will break next.',
      options: [
        {
          id: 'hold-the-route',
          label: 'I \u2014 Hold the Route',
          skill: 'navigation',
          description: 'You pick the safest, fastest path and cut off detours.'
        },
        {
          id: 'follow-the-signs',
          label: 'II \u2014 Follow the Signs',
          skill: 'tracking',
          description: 'You read traces, habits, and direction like a report written in dust.'
        },
        {
          id: 'secure-the-ground',
          label: 'III \u2014 Secure the Ground',
          skill: 'survival',
          description: 'You lock down shelter, supplies, and watch so your mission can continue.'
        },
        {
          id: 'listen-to-the-sky',
          label: 'IV \u2014 Listen to the Sky',
          skill: 'weatherSense',
          description: 'You time the move to the coming shift and avoid the worst moment to strike.'
        }
      ]
    }
  ]
};
