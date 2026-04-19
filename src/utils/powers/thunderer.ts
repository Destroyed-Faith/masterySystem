/**
 * Thunderer Mastery Tree Powers
 *
 * Role: Ranged Spell Striker / Control Support • Casting: Intellect
 * Requirements: Arcane Focus • Tree bonus (table): once per round when you apply or increase Shock,
 * you and one ally within 2 m gain +1 Evade until the start of your next turn.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const THUNDERER_POWERS: NewArtifactPowerData[] = [
  {
    name: 'Storm Needle',
    category: 'active',
    tags: ['spell'],
    rank: 1,
    fluff:
      'A thin lance of lightning snaps from your hand and leaves the target\'s body trembling with stolen momentum.',
    cost: {
      action: 'attack',
      stones: 0
    },
    roll: {
      kind: 'attack',
      attribute: 'intellect'
    },
    levels: {
      '1': {
        type: 'ranged',
        range: { kind: 'distance', m: 8 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 2 }]
      },
      '2': {
        type: 'ranged',
        range: { kind: 'distance', m: 12 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 3 }]
      },
      '3': {
        type: 'ranged',
        range: { kind: 'distance', m: 16 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 4 }]
      },
      '4': {
        type: 'ranged',
        range: { kind: 'distance', m: 20 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 5 }]
      }
    }
  },
  {
    name: 'Forked Current',
    category: 'active',
    tags: ['spell', 'charged'],
    rank: 1,
    fluff:
      'Lightning forks outward in branching lines, hunting several bodies before the first scream is done.',
    cost: {
      action: 'attack',
      stones: 0,
      charges: 1
    },
    roll: {
      kind: 'attack',
      attribute: 'intellect'
    },
    levels: {
      '1': {
        type: 'ranged',
        range: { kind: 'distance', m: 12 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: 'One ray deals 1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 2 }]
      },
      '2': {
        type: 'ranged',
        range: { kind: 'distance', m: 16 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: 'Two rays deal 1d8 damage each', dice: '1d8' },
        specials: [{ key: 'shock', value: 2 }, { key: 'autofire', value: 1 }]
      },
      '3': {
        type: 'ranged',
        range: { kind: 'distance', m: 20 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: 'Three rays deal 1d8 damage each', dice: '1d8' },
        specials: [{ key: 'shock', value: 2 }, { key: 'autofire', value: 2 }]
      },
      '4': {
        type: 'ranged',
        range: { kind: 'distance', m: 24 },
        aoe: { shape: 'none' },
        duration: { kind: 'instant' },
        effect: { text: 'Three rays deal 1d8 damage each', dice: '1d8' },
        specials: [{ key: 'shock', value: 3 }, { key: 'autofire', value: 2 }]
      }
    }
  },
  {
    name: 'Thunderclap Sigil',
    category: 'active',
    tags: ['spell'],
    rank: 1,
    fluff:
      'You stamp a rune of pressure into the air, and the next heartbeat becomes a burst of sound and white-blue force.',
    cost: {
      action: 'attack',
      stones: 0
    },
    roll: {
      kind: 'check',
      attribute: 'intellect',
      vs: 'save:body'
    },
    levels: {
      '1': {
        type: 'ranged',
        range: { kind: 'distance', m: 8 },
        aoe: { shape: 'radius', m: 2 },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 1 }]
      },
      '2': {
        type: 'ranged',
        range: { kind: 'distance', m: 12 },
        aoe: { shape: 'radius', m: 4 },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 2 }]
      },
      '3': {
        type: 'ranged',
        range: { kind: 'distance', m: 16 },
        aoe: { shape: 'radius', m: 6 },
        duration: { kind: 'instant' },
        effect: { text: '1d8 damage', dice: '1d8' },
        specials: [{ key: 'shock', value: 3 }]
      },
      '4': {
        type: 'ranged',
        range: { kind: 'distance', m: 20 },
        aoe: { shape: 'radius', m: 8 },
        duration: { kind: 'instant' },
        effect: { text: '2d8 damage', dice: '2d8' },
        specials: [{ key: 'shock', value: 3 }]
      }
    }
  },
  {
    name: 'Eye of the Storm',
    category: 'activeBuff',
    tags: ['spell'],
    rank: 1,
    fluff:
      'At the center of your storm, motion bends, voices blur, and every ally moves half a beat ahead of the world.',
    cost: {
      action: 'none',
      stones: 0
    },
    roll: {
      kind: 'check',
      attribute: 'intellect'
    },
    levels: {
      '1': {
        type: 'buff',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 4 },
        duration: { kind: 'masteryRankRounds' },
        effect: {
          text: 'You and allies in the aura gain +2 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +1. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '2': {
        type: 'buff',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 6 },
        duration: { kind: 'masteryRankRounds' },
        effect: {
          text: 'You and allies in the aura gain +3 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +1. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '3': {
        type: 'buff',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 8 },
        duration: { kind: 'masteryRankRounds' },
        effect: {
          text: 'You and allies in the aura gain +4 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +2. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '4': {
        type: 'buff',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 10 },
        duration: { kind: 'masteryRankRounds' },
        effect: {
          text: 'You and allies in the aura gain +5 Evade. The first time each round you hit a target that is already Shocked with a Spell, increase its Shock by +3. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      }
    }
  },
  {
    name: 'Conductive Focus',
    category: 'passive',
    tags: ['spell'],
    rank: 1,
    fluff: 'Your magic follows charge gradients instinctively, always finding the easiest path through the air.',
    cost: {
      action: 'none',
      stones: 0
    },
    roll: {
      kind: 'none'
    },
    levels: {
      '1': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'none' },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'Spells with the Shock special gain +2 Pool to the Spell Roll.'
        },
        specials: []
      },
      '2': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'none' },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'Spells with the Shock special gain +4 Pool to the Spell Roll.'
        },
        specials: []
      },
      '3': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'none' },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'Spells with the Shock special gain +6 Pool to the Spell Roll.'
        },
        specials: []
      },
      '4': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'none' },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'Spells with the Shock special gain +8 Pool to the Spell Roll.'
        },
        specials: []
      }
    }
  },
  {
    name: 'Static Shelter',
    category: 'passive',
    tags: ['spell'],
    rank: 1,
    fluff:
      'Your storm wraps companions in a trembling veil; enemies already rattled by Shock find no clean angle.',
    cost: {
      action: 'none',
      stones: 0
    },
    roll: {
      kind: 'none'
    },
    levels: {
      '1': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 2 },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'You and allies within the aura gain +2 Evade. Against attacks made by Shocked enemies, this becomes +3 Evade. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '2': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 4 },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'You and allies within the aura gain +3 Evade. Against attacks made by Shocked enemies, this becomes +4 Evade. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '3': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 6 },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'You and allies within the aura gain +4 Evade. Against attacks made by Shocked enemies, this becomes +6 Evade. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      },
      '4': {
        type: 'passive',
        range: { kind: 'self' },
        aoe: { shape: 'aura', m: 8 },
        duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
        effect: {
          text: 'You and allies within the aura gain +5 Evade. Against attacks made by Shocked enemies, this becomes +7 Evade. (Evade bonuses from this tree do not stack; use the higher value.)'
        },
        specials: []
      }
    }
  }
];
