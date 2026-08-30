import type { EchoDefinition } from './types.js';

export const ELORIANS_ECHO: EchoDefinition = {
  key: 'elorians',
  name: 'Elorians',
  tagline: 'We were not made for this world \u2014 and yet we are still here.',
  theme: 'Lingering light of a lost world \u2014 outsiders between realms, carrying memories, dreams and beauty that no longer belong here.',
  summary:
    'Children of the Otherworld, Eloria. Stranded when the Four Stone Gates were sealed. Demonic marks catch like thorns in them, never fully sinking \u2014 but that resistance is its own private war.',
  creatureType: 'Humanoid',
  size: 'medium',
  speed: 8,
  coreTraits: [],
  deck: [
    {
      id: 'mask-of-the-fair',
      name: 'Mask of the Fair',
      trigger: 'Courtesy as a weapon \u2014 belong in any court, bend the story, hold the room, or turn minds without force.',
      options: [
        {
          id: 'speak-their-rules',
          label: 'I \u2014 Speak Their Rules',
          skill: 'etiquette',
          description: 'You act like you belong and make it costly to question you.',
        },
        {
          id: 'soften-the-truth',
          label: 'II \u2014 Soften the Truth',
          skill: 'deception',
          description: 'You bend the story just enough to pass without breaking it.',
        },
        {
          id: 'capture-the-room',
          label: 'III \u2014 Capture the Room',
          skill: 'performance',
          description: 'You choose tone and timing. People follow your rhythm instead of their doubts.',
        },
        {
          id: 'turn-them-gently',
          label: 'IV \u2014 Turn Them Gently',
          skill: 'persuasion',
          description: 'You guide their thinking without force and make them feel it was their idea.',
        },
      ],
    },
    {
      id: 'twilight-read',
      name: 'Twilight Read',
      trigger: 'See through the mask \u2014 read motive, pulse, leverage, or desire in a layered moment.',
      options: [
        {
          id: 'follow-the-thread',
          label: 'I \u2014 Follow the Thread',
          skill: 'investigation',
          description: 'You connect details into motive, pattern, and opportunity.',
        },
        {
          id: 'hear-the-heartbeat',
          label: 'II \u2014 Hear the Heartbeat',
          skill: 'empathy',
          description: 'You sense what they hide behind poise, fear, or pride.',
        },
        {
          id: 'frame-the-deal',
          label: 'III \u2014 Frame the Deal',
          skill: 'negotiation',
          description: 'You set terms and leverage that reveal what they truly value.',
        },
        {
          id: 'draw-them-close',
          label: 'IV \u2014 Draw Them Close',
          skill: 'seduction',
          description: 'You pull attention into intimacy and turn desire into access.',
        },
      ],
    },
    {
      id: 'echo-of-ages',
      name: 'Echo of Ages',
      trigger: 'Old Eloria still speaks \u2014 recall forgotten history, wards, body-memory, or the geometry of lost roads.',
      options: [
        {
          id: 'remember-the-old-story',
          label: 'I \u2014 Remember the Old Story',
          skill: 'lore',
          description: 'You recall fragments of history, courts, and forbidden names that still carry weight.',
        },
        {
          id: 'read-the-hidden-layer',
          label: 'II \u2014 Read the Hidden Layer',
          skill: 'occultism',
          description: 'You recognize wards, bindings, and the invisible rules beneath the surface.',
        },
        {
          id: 'body-memory',
          label: 'III \u2014 Body Memory',
          skill: 'medicine',
          description: 'You notice what age did to flesh and bone. Old wounds, old rituals, old methods.',
        },
        {
          id: 'trace-the-way-it-moved',
          label: 'IV \u2014 Trace the Way It Moved',
          skill: 'navigation',
          description:
            'You read routes, patterns, and the geometry of places as if the world still followed Eloria\u2019s design.',
        },
      ],
    },
    {
      id: 'unseen-grace',
      name: 'Unseen Grace',
      trigger: 'Move as if you were never there \u2014 keep your center, vanish, blend, or take with a light touch.',
      options: [
        {
          id: 'never-lose-your-center',
          label: 'I \u2014 Never Lose Your Center',
          skill: 'acrobatics',
          description: 'You keep control through pressure. Balance, timing, and calm motion carry you through.',
        },
        {
          id: 'step-between-attention',
          label: 'II \u2014 Step Between Attention',
          skill: 'stealth',
          description: 'You move when eyes blink and noise rises. You pass without becoming a target.',
        },
        {
          id: 'become-part-of-the-scene',
          label: 'III \u2014 Become Part of the Scene',
          skill: 'concealment',
          description: 'You choose the angle and the cover that makes you simply not worth noticing.',
        },
        {
          id: 'light-touch-clean-result',
          label: 'IV \u2014 Light Touch, Clean Result',
          skill: 'sleightOfHand',
          description: 'You take, plant, swap, or free something small without breaking the flow of the moment.',
        },
      ],
    },
  ],
};
