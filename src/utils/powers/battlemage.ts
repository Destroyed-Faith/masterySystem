import { PowerDefinition } from './types';

export const BATTLEMAGE_POWERS: PowerDefinition[] = [
  {
    name: 'Arcane Combustion',
    tree: 'Battlemage',
    powerType: 'passive',
    passiveCategory: 'roll',
    description: 'Your flames always find more fuel.',
    levels: [
      { level: 1, type: 'Passive', effect: 'All Spells with the Ignite Special gain +2 automatic Raises.' },
      { level: 2, type: 'Passive', effect: 'All Spells with the Ignite Special gain +3 automatic Raises.' },
      { level: 3, type: 'Passive', effect: 'All Spells with the Ignite Special gain +4 automatic Raises.' },
      { level: 4, type: 'Passive', effect: 'All Spells with the Ignite Special gain +6 automatic Raises.' }
    ]
  },
  {
    name: 'Flameguard',
    tree: 'Battlemage',
    powerType: 'passive',
    passiveCategory: 'armor',
    description: 'The fire clings to you like a living shield.',
    levels: [
      { level: 1, type: 'Passive', effect: 'While you have Ignite on yourself, gain +3 Armor.' },
      { level: 2, type: 'Passive', effect: 'While you have Ignite, gain +5 Armor.' },
      { level: 3, type: 'Passive', effect: 'While you have Ignite, gain +7 Armor.' },
      { level: 4, type: 'Passive', effect: 'While you have Ignite, gain +11 Armor.' }
    ]
  },
  {
    name: 'Elemental Focus',
    tree: 'Battlemage',
    powerType: 'passive',
    passiveCategory: 'roll',
    description: 'Precision over raw fury — then both.',
    levels: [
      { level: 1, type: 'Passive', effect: 'Spells with the Ignite Special: +2 Pool to the Spell Roll.' },
      { level: 2, type: 'Passive', effect: 'Spells with the Ignite Special: +4 Pool to the Spell Roll.' },
      { level: 3, type: 'Passive', effect: 'Spells with the Ignite Special: +6 Pool to the Spell Roll.' },
      { level: 4, type: 'Passive', effect: 'Spells with the Ignite Special: +8 Pool to the Spell Roll.' }
    ]
  },
  {
    name: 'Combustion Surge',
    tree: 'Battlemage',
    powerType: 'buff',
    description: 'You superheat the matrix of your next spell.',
    levels: [
      { level: 1, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Your next Spells with the Ignite Special deals +2d8 damage.', cost: { action: true }},
      { level: 2, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Your next Spells with the Ignite Special deals +4d8 damage.', cost: { action: true }},
      { level: 3, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Your next Spells with the Ignite Special deals +6d8 damage.', cost: { action: true }},
      { level: 4, type: 'Buff', range: 'Self', aoe: '—', duration: 'Mastery Rank Rounds', effect: 'Your next Spells with the Ignite Special deals +8d8 damage.', cost: { action: true }}
    ]
  },
  {
    name: 'Inferno Core',
    tree: 'Battlemage',
    powerType: 'buff',
    description: 'Your blaze swells nearby embers into a roaring inferno.',
    levels: [
      { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank Rounds', effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +1.', cost: { action: true }},
      { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 6m', duration: 'Mastery Rank Rounds', effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +2.', cost: { action: true }},
      { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 8m', duration: 'Mastery Rank Rounds', effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +3.', cost: { action: true }},
      { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 10m', duration: 'Mastery Rank Rounds', effect: 'At the end of your round, each enemy in the radius that already has Ignite ≥ 1 increases their Ignite by +4.', cost: { action: true }}
    ]
  },
  {
    name: 'Flamewave',
    tree: 'Battlemage',
    powerType: 'passive',
    passiveCategory: 'damage',
    description: 'Every flame you cast spreads to new fuel.',
    levels: [
      { level: 1, type: 'Passive', effect: 'Once per round, when you cast a Spell, also apply Ignite(1) to all affected enemies by the spell.' },
      { level: 2, type: 'Passive', effect: 'Once per round, when you cast a Spell, also apply Ignite(2) to all affected enemies by the spell.' },
      { level: 3, type: 'Passive', effect: 'Once per round, when you cast a Spell, also apply Ignite(4) to all affected enemies by the spell.' },
      { level: 4, type: 'Passive', effect: 'Once per round, when you cast a Spell, also apply Ignite(5) to all affected enemies by the spell.' }
    ]
  },
  {
    name: 'Phoenix Mantle',
    tree: 'Battlemage',
    powerType: 'passive',
    passiveCategory: 'healing',
    description: 'Burn, and be reborn between every heartbeat.',
    levels: [
      { level: 1, type: 'Passive', effect: 'While you have Ignite ≥ 4, gain Regeneration(1) and +2 Armor.' },
      { level: 2, type: 'Passive', effect: 'While you have Ignite ≥ 4, gain Regeneration(3) and +3 Armor.' },
      { level: 3, type: 'Passive', effect: 'While you have Ignite ≥ 4, gain Regeneration(5) and +4 Armor.' },
      { level: 4, type: 'Passive', effect: 'While you have Ignite ≥ 4, gain Regeneration(7) and +5 Armor.' }
    ]
  },
  {
    name: 'Immolation Strike',
    tree: 'Battlemage',
    powerType: 'active',
    description: 'You channel raw flame into your weapon, dealing fire damage.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', aoe: '—', duration: 'Instant', effect: 'Make a weapon attack. On hit, deal +1d8 Fire damage and apply Ignite(1).', cost: { action: true }, roll: { attribute: 'might', damage: '+1d8', damageType: 'fire' }, special: 'Ignite(1)' },
      { level: 2, type: 'Active', range: 'Melee', aoe: '—', duration: 'Instant', effect: 'Make a weapon attack. On hit, deal +2d8 Fire damage and apply Ignite(1).', cost: { action: true }, roll: { attribute: 'might', damage: '+2d8', damageType: 'fire' }, special: 'Ignite(1)' },
      { level: 3, type: 'Active', range: 'Melee', aoe: '—', duration: 'Instant', effect: 'Make a weapon attack. On hit, deal +3d8 Fire damage and apply Ignite(2).', cost: { action: true }, roll: { attribute: 'might', damage: '+3d8', damageType: 'fire' }, special: 'Ignite(2)' },
      { level: 4, type: 'Active', range: 'Melee', aoe: '—', duration: 'Instant', effect: 'Make a weapon attack. On hit, deal +4d8 Fire damage and apply Ignite(2).', cost: { action: true }, roll: { attribute: 'might', damage: '+4d8', damageType: 'fire' }, special: 'Ignite(2)' }
    ]
  }
];

