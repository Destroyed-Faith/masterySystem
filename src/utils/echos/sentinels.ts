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
  speed: 8,
  coreTraits: [],
  subChoiceLabel: 'Order Protocol',
  // Keys match the Echo Artifact `requiresSubChoice` values (sentinel / judicator / oracle).
  // Order traits in older drafts are not in the current rulebook — keep flavor only.
  subChoices: [
    {
      key: 'judicator',
      name: 'Judicator',
      trait: {
        id: 'judicator-order',
        name: 'Judicator',
        effect: 'Order protocol: Judicator Frame.',
        usage: 'passive',
      },
    },
    {
      key: 'sentinel',
      name: 'Sentinel',
      trait: {
        id: 'sentinel-order',
        name: 'Sentinel',
        effect: 'Order protocol: Sentinel Frame.',
        usage: 'passive',
      },
    },
    {
      key: 'oracle',
      name: 'Oracle',
      trait: {
        id: 'oracle-order',
        name: 'Oracle',
        effect: 'Order protocol: Oracle Frame.',
        usage: 'passive',
      },
    },
  ],
  deck: [
    {
      id: 'lawkeepers-gaze',
      name: 'Lawkeeper\u2019s Gaze',
      trigger: 'Demand an answer in public \u2014 make consequences felt, restore order, set terms, or strip excuses with rite.',
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
      trigger: 'Bend the moment without breaking purpose \u2014 isolate the fact, reframe the ask, feed a story, or press the fault line.',
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
      trigger: 'Find the hidden failure \u2014 map the mechanism, read origin, sense corruption, or stabilize the subject.',
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
      trigger: 'Keep the line and predict the break \u2014 hold the route, follow traces, lock down camp, or time the weather.',
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
