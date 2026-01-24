/**
 * School of the Bound Mind Spells
 */

import type { SpellDefinition } from './types.js';

export const BOUND_MIND_SPELLS: SpellDefinition[] = [
  {
    name: 'Telekinetic Manipulation',
    school: 'School of the Bound Mind',
    spellType: 'active',
    description: 'Move or lift objects with the power of your mind.',
    levels: [
      { level: 1, type: 'Ranged', range: '8 m', effect: 'Move or lift up to 40 kg. May lift self or one ally', special: 'Grapple (2)', raises: 'Range (+4 m), Weight (+40 kg), Fine Manipulation, Grapple (+1)', cost: { action: true, charged: true } },
      { level: 2, type: 'Ranged', range: '8 m', effect: 'Move or lift up to 80 kg. Perform fine manipulation', special: 'Grapple (4)', raises: 'Range (+4 m), Weight (+40 kg), Fine Manipulation, Grapple (+1)', cost: { action: true, charged: true } },
      { level: 3, type: 'Ranged', range: '12 m', effect: 'Move or lift up to 160 kg. Maintain grip on 1 target', special: 'Grapple (6)', raises: 'Range (+4 m), Weight (+40 kg), Fine Manipulation, Grapple (+1)', cost: { action: true, charged: true } },
      { level: 4, type: 'Ranged', range: '16 m', effect: 'Move or lift up to 320 kg or multiple objects', special: 'Grapple (8)', raises: 'Range (+4 m), Weight (+40 kg), Fine Manipulation, Grapple (+1)', cost: { action: true, charged: true } }
    ]
  },
  {
    name: 'Telepathic Link',
    school: 'School of the Bound Mind',
    spellType: 'utility',
    description: 'Establish a mental connection for silent communication.',
    levels: [
      { level: 1, type: 'Ranged', range: '16 m', duration: 'Instant (extend via Raises)', effect: 'Establish a mental link with 1 creature; exchange words and surface thoughts', raises: '+1 Target, Range doubled, Share Emotion/Intent, Share Vision/Hearing, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 2, type: 'Ranged', range: '32 m', duration: 'Instant', effect: 'Maintain links with 2 creatures', raises: '+1 Target, Range doubled, Share Emotion/Intent, Share Vision/Hearing, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 3, type: 'Ranged', range: '64 m', duration: 'Instant', effect: 'Maintain links with 3 creatures', raises: '+1 Target, Range doubled, Share Emotion/Intent, Share Vision/Hearing, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 4, type: 'Ranged', range: '128 m', duration: 'Instant', effect: 'Maintain links with 4 creatures', raises: '+1 Target, Range doubled, Share Emotion/Intent, Share Vision/Hearing, Duration (+1 Step)', cost: { action: true, charged: true } }
    ]
  },
  {
    name: 'Veil of Invisibility',
    school: 'School of the Bound Mind',
    spellType: 'utility',
    description: 'Become invisible to sight and other senses.',
    levels: [
      { level: 1, type: 'Utility', range: 'Self', duration: '1 Round (extend via Raises)', effect: 'Become invisible to Sight. Ends on attack', raises: '+1 Target, +1 Sense Group, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 2, type: 'Utility', range: 'Self + 1 Ally', duration: '1 Round (extend via Raises)', effect: 'Both invisible to Sight. Ends on attack', raises: '+1 Target, +1 Sense Group, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 3, type: 'Utility', range: 'Self + 2 Allies', duration: '1 Round (extend via Raises)', effect: 'All invisible to Sight. Ends on attack', raises: '+1 Target, +1 Sense Group, Duration (+1 Step)', cost: { action: true, charged: true } },
      { level: 4, type: 'Utility', range: 'Self + 3 Allies', duration: '1 Round (extend via Raises)', effect: 'All invisible to Sight. Ends on attack', raises: '+1 Target, +1 Sense Group, Duration (+1 Step)', cost: { action: true, charged: true } }
    ]
  },
  {
    name: 'Phantasmic Reflection',
    school: 'School of the Bound Mind',
    spellType: 'active',
    description: 'Create illusory images that confuse attackers.',
    levels: [
      { level: 1, type: 'Active', range: 'Self', duration: '1 Round (extend via Raises)', effect: 'Create 1 Illusory Image', raises: '+1 Image, Duration (+1 Step), Hits to Destroy the images +1', cost: { action: true } },
      { level: 2, type: 'Active', range: 'Self', duration: '1 Round (extend via Raises)', effect: 'Create 2 Illusory Images', raises: '+1 Image, Duration (+1 Step), Hits to Destroy the images +1', cost: { action: true } },
      { level: 3, type: 'Active', range: 'Self', duration: '1 Round (extend via Raises)', effect: 'Create 3 Illusory Images', raises: '+1 Image, Duration (+1 Step), Hits to Destroy the images +1', cost: { action: true } },
      { level: 4, type: 'Active', range: 'Self', duration: '1 Round (extend via Raises)', effect: 'Create 4 Illusory Images', raises: '+1 Image, Duration (+1 Step), Hits to Destroy the images +1', cost: { action: true } }
    ]
  }
];

