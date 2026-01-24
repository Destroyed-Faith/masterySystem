/**
 * Thorn & Whisper — School of Enchantment & Venom Spells
 */

import type { SpellDefinition } from './types.js';

export const THORN_WHISPER_SPELLS: SpellDefinition[] = [
  {
    name: 'Beguiling Glance',
    school: 'Thorn & Whisper',
    spellType: 'active',
    description: 'Your eyes shimmer with impossible grace — the will of your prey bends like silk in the wind.',
    levels: [
      { level: 1, type: 'Ranged', range: '8 m', duration: '1 Round', effect: 'Charmed (3)', raises: 'Range +4 m, Charmed (+1), Duration (+1 Step)', cost: { action: true } },
      { level: 2, type: 'Ranged', range: '12 m', duration: '1 Round', effect: 'Charmed (6)', raises: 'Range +4 m, Charmed (+1), Duration (+1 Step)', cost: { action: true } },
      { level: 3, type: 'Ranged', range: '16 m', duration: '1 Round', effect: 'Charmed (9)', raises: 'Range +4 m, Charmed (+1), Duration (+1 Step)', cost: { action: true } },
      { level: 4, type: 'Ranged', range: '20 m', duration: '1 Round', effect: 'Charmed (12)', raises: 'Range +4 m, Charmed (+1), Duration (+1 Step)', cost: { action: true } }
    ]
  },
  {
    name: 'Nightshade Cloud',
    school: 'Thorn & Whisper',
    spellType: 'active',
    description: 'A noxious mist seeps from the ground, smelling sweet but burning the lungs.',
    levels: [
      { level: 1, type: 'Ranged', range: '8 m', aoe: 'Radius 2 m', duration: '1 Round', effect: '1d8 damage', special: 'Poisoned(2)', raises: 'Radius +1 m, Duration +1 Round, Poisoned +1 for two raises, Range +4 m', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 2, type: 'Ranged', range: '12 m', aoe: 'Radius 2 m', duration: '1 Round', effect: '1d8 damage', special: 'Poisoned(3)', raises: 'Radius +1 m, Duration +1 Round, Poisoned +1 for two raises, Range +4 m', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 3, type: 'Ranged', range: '16 m', aoe: 'Radius 3 m', duration: '2 Rounds', effect: '2d8 damage', special: 'Poisoned(4)', raises: 'Radius +1 m, Duration +1 Round, Poisoned +1 for two raises, Range +4 m', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } },
      { level: 4, type: 'Ranged', range: '20 m', aoe: 'Radius 3 m', duration: '2 Rounds', effect: '2d8 damage', special: 'Poisoned(5)', raises: 'Radius +1 m, Duration +1 Round, Poisoned +1 for two raises, Range +4 m', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } }
    ]
  },
  {
    name: 'Serpent\'s Kiss',
    school: 'Thorn & Whisper',
    spellType: 'active',
    description: 'Your lips whisper venom, conjuring spectral fangs that pierce with toxic bite.',
    levels: [
      { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (3)', raises: 'Range +4 m, Poisoned +1 for two raises', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (4)', raises: 'Range +4 m, Poisoned +1 for two raises', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 3, type: 'Ranged', range: '20 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (5)', raises: 'Range +4 m, Poisoned +1 for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } },
      { level: 4, type: 'Ranged', range: '24 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (6)', raises: 'Range +4 m, Poisoned +1 for two raises', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } }
    ]
  },
  {
    name: 'Ivy Lash',
    school: 'Thorn & Whisper',
    spellType: 'active',
    description: 'Barbed vines whip forward, tearing flesh and seeding venom into wounds.',
    levels: [
      { level: 1, type: 'Ranged', range: '8 m', aoe: 'Line 4 m × 1 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (2)', raises: 'Range +4 m, Line +2 m length or +1m width, Poisoned +1 for two raises, Duration +1 Round', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 2, type: 'Ranged', range: '12 m', aoe: 'Line 6 m × 1 m', duration: 'Instant', effect: '1d8 damage', special: 'Poisoned (3)', raises: 'Range +4 m, Line +2 m length or +1m width, Poisoned +1 for two raises, Duration +1 Round', cost: { action: true }, roll: { damage: '1d8', damageType: 'poison' } },
      { level: 3, type: 'Ranged', range: '16 m', aoe: 'Line 8 m × 1 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (4)', raises: 'Range +4 m, Line +2 m length or +1m width, Poisoned +1 for two raises, Duration +1 Round', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } },
      { level: 4, type: 'Ranged', range: '20 m', aoe: 'Line 10 m × 1 m', duration: 'Instant', effect: '2d8 damage', special: 'Poisoned (5)', raises: 'Range +4 m, Line +2 m length or +1m width, Poisoned +1 for two raises, Duration +1 Round', cost: { action: true }, roll: { damage: '2d8', damageType: 'poison' } }
    ]
  }
];

