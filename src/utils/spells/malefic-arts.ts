/**
 * Malefic Arts — School of Hex Spells
 */

import type { SpellDefinition } from './types.js';

export const MALEFIC_ARTS_SPELLS: SpellDefinition[] = [
  {
    name: 'Eldritch Bolt',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'A chain of pact lightning leaps from mark to mark.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '8 m',
        duration: 'Instant',
        effect: '+2d8 damage',
        raises: 'Range (+4m), additional targets up to autofire value (+1), +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '16 m',
        duration: 'Instant',
        effect: '+2d8 damage',
        special: 'Autofire (1)',
        raises: 'Range (+4m), additional targets up to autofire value (+1), +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '24 m',
        duration: 'Instant',
        effect: '+2d8 damage',
        special: 'Autofire (2)',
        raises: 'Range (+4m), additional targets up to autofire value (+1), +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '32 m',
        duration: 'Instant',
        effect: '+2d8 damage',
        special: 'Autofire (3)',
        raises: 'Range (+4m), additional targets up to autofire value (+1), +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      }
    ]
  },
  {
    name: 'Blight Surge',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'A wave of black sigils spreads like wildfire across cursed ground.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '8 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '—',
        special: 'Hex (3)',
        raises: 'Range (+4 m), Hex (+1) for every two Raises. (Radius is fixed at 2 m — cannot be increased by Raises.)',
        cost: { action: true }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '12 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '—',
        special: 'Hex (4)',
        raises: 'Range (+4 m), Hex (+1) for every two Raises. (Radius is fixed at 2 m — cannot be increased by Raises.)',
        cost: { action: true }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '16 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '—',
        special: 'Hex (5)',
        raises: 'Range (+4 m), Hex (+1) for every two Raises. (Radius is fixed at 2 m — cannot be increased by Raises.)',
        cost: { action: true }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '20 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '—',
        special: 'Hex (6)',
        raises: 'Range (+4 m), Hex (+1) for every two Raises. (Radius is fixed at 2 m — cannot be increased by Raises.)',
        cost: { action: true }
      }
    ]
  },
  {
    name: 'Soul Drain',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'You tear at a Hexed foe\'s spirit and draw its fading essence into your own.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '8 m',
        duration: 'Instant',
        effect: 'Heal 2d8 HP from a Hexed target; deal 1d8 damage',
        raises: 'Range (+2 m), +1d8 heal, +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '1d8', healing: '2d8', damageType: 'eldritch' }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '10 m',
        duration: 'Instant',
        effect: 'Heal 3d8 HP from a Hexed target; deal 2d8 damage',
        raises: 'Range (+2 m), +1d8 heal, +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '2d8', healing: '3d8', damageType: 'eldritch' }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '12 m',
        duration: 'Instant',
        effect: 'Heal 4d8 HP from a Hexed target; deal 3d8 damage',
        raises: 'Range (+2 m), +1d8 heal, +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '3d8', healing: '4d8', damageType: 'eldritch' }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '14 m',
        duration: 'Instant',
        effect: 'Heal 5d8 HP from a Hexed target; deal 4d8 damage',
        raises: 'Range (+2 m), +1d8 heal, +1d8 damage for two raises',
        cost: { action: true },
        roll: { damage: '4d8', healing: '5d8', damageType: 'eldritch' }
      }
    ]
  },
  {
    name: 'Agony Lash',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'A whip of burning malice lashes through the air, pain weaving into the curse itself.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '8 m',
        duration: 'Instant',
        effect: '1d8 damage',
        special: 'Hex (2)',
        raises: 'Range (+2 m), +1d8 damage, Hex (+1 per two Raises)',
        cost: { action: true },
        roll: { damage: '1d8', damageType: 'eldritch' }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '12 m',
        duration: 'Instant',
        effect: '1d8 damage',
        special: 'Hex (3)',
        raises: 'Range (+2 m), +1d8 damage, Hex (+1 per two Raises)',
        cost: { action: true },
        roll: { damage: '1d8', damageType: 'eldritch' }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '16 m',
        duration: 'Instant',
        effect: '2d8 damage',
        special: 'Hex (4)',
        raises: 'Range (+2 m), +1d8 damage, Hex (+1 per two Raises)',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '20 m',
        duration: 'Instant',
        effect: '2d8 damage',
        special: 'Hex (5)',
        raises: 'Range (+2 m), +1d8 damage, Hex (+1 per two Raises)',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      }
    ]
  },
  {
    name: 'Maddening Whisper',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'A cursed voice claws at the mind, pain blooming into ever-deeper torment.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '8 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '1d8 damage',
        special: 'Torment (2)',
        raises: 'Range (+2 m), +1d8 damage, Torment (+1). (AoE bleibt Radius 2 m.)',
        cost: { action: true },
        roll: { damage: '1d8', damageType: 'eldritch' }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '12 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '2d8 damage',
        special: 'Torment (3)',
        raises: 'Range (+2 m), +1d8 damage, Torment (+1). (AoE bleibt Radius 2 m.)',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '16 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '2d8 damage',
        special: 'Torment (4)',
        raises: 'Range (+2 m), +1d8 damage, Torment (+1). (AoE bleibt Radius 2 m.)',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '20 m',
        aoe: 'Radius 2 m',
        duration: 'Instant',
        effect: '2d8 damage',
        special: 'Torment (5)',
        raises: 'Range (+2 m), +1d8 damage, Torment (+1). (AoE bleibt Radius 2 m.)',
        cost: { action: true },
        roll: { damage: '2d8', damageType: 'eldritch' }
      }
    ]
  },
  {
    name: 'Void Maw',
    school: 'Malefic Arts',
    spellType: 'active',
    description: 'You tear a hole in the world; light dies within and dread gnaws at the mind.',
    levels: [
      {
        level: 1,
        type: 'Ranged (Spell)',
        range: '12 m',
        aoe: 'Radius 4 m',
        duration: '1 round',
        effect: 'Create a darkness zone that blocks normal sight; creatures inside suffer Torment (1) each round',
        raises: 'Range (+2 m), AoE (+1 m radius), Duration (+1 round), Torment (+1)',
        cost: { action: true }
      },
      {
        level: 2,
        type: 'Ranged (Spell)',
        range: '16 m',
        aoe: 'Radius 6 m',
        duration: '2 rounds',
        effect: 'Darkness blocks sight and darkvision; creatures inside suffer Torment (2) each round',
        raises: 'Range (+2 m), AoE (+1 m radius), Duration (+1 round), Torment (+1)',
        cost: { action: true }
      },
      {
        level: 3,
        type: 'Ranged (Spell)',
        range: '20 m',
        aoe: 'Radius 8 m',
        duration: '3 rounds',
        effect: 'Darkness blocks sight, darkvision, and tremorsense; creatures inside suffer Torment (3) each round',
        raises: 'Range (+2 m), AoE (+1 m radius), Duration (+1 round), Torment (+1)',
        cost: { action: true }
      },
      {
        level: 4,
        type: 'Ranged (Spell)',
        range: '24 m',
        aoe: 'Radius 10 m',
        duration: '4 rounds',
        effect: 'Darkness suppresses all common visual/motion senses (sight, darkvision, tremorsense); creatures inside suffer Torment (4) each round',
        raises: 'Range (+2 m), AoE (+1 m radius), Duration (+1 round), Torment (+1)',
        cost: { action: true }
      }
    ]
  },
  {
    name: 'Rift Step',
    school: 'Malefic Arts',
    spellType: 'movement',
    description: 'You tear through the void, stepping between worlds, dragging those bound to your soul through the rift.',
    levels: [
      {
        level: 1,
        type: 'Movement (Spell)',
        range: '8 m',
        aoe: 'Self + 1 ally (2 m)',
        duration: 'Instant',
        effect: 'Teleport up to 8 m',
        special: 'Torment(1) self',
        raises: 'Range (+4 m), +1 ally within 2 m',
        cost: { movement: true }
      },
      {
        level: 2,
        type: 'Movement (Spell)',
        range: '12 m',
        aoe: 'Self + 2 allies (2 m)',
        duration: 'Instant',
        effect: 'Teleport up to 12 m',
        special: 'Torment(1) self',
        raises: 'Range (+4 m), +1 ally within 2 m',
        cost: { movement: true }
      },
      {
        level: 3,
        type: 'Movement (Spell)',
        range: '16 m',
        aoe: 'Self + 3 allies (2 m)',
        duration: 'Instant',
        effect: 'Teleport up to 16 m',
        special: 'Torment(1) self',
        raises: 'Range (+4 m), +1 ally within 2 m',
        cost: { movement: true }
      },
      {
        level: 4,
        type: 'Movement (Spell)',
        range: '20 m',
        aoe: 'Self + 4 allies (2 m)',
        duration: 'Instant',
        effect: 'Teleport up to 20 m',
        special: 'Torment(1) self',
        raises: 'Range (+4 m), +1 ally within 2 m',
        cost: { movement: true }
      }
    ]
  }
];

