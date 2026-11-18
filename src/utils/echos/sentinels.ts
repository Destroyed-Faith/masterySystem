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
};
