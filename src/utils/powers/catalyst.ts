import { PowerDefinition } from './types';

export const CATALYST_POWERS: PowerDefinition[] = [
  {
    name: 'Mutagenic Strike',
    tree: 'Catalyst',
    powerType: 'active',
    description: 'An attack empowered by chemical transformation.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Poison(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'poison' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Poison(2)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'poison' }}
    ]
  },
  {
    name: 'Reactive Serum',
    tree: 'Catalyst',
    powerType: 'buff',
    description: 'Inject a serum that enhances combat abilities.',
    levels: [
      { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +2 to Attack rolls', cost: { action: true }},
      { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +3 to Attack rolls and +2d8 damage', cost: { action: true }},
      { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +4 to Attack rolls and +3d8 damage', cost: { action: true }},
      { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +5 to Attack rolls and +4d8 damage', cost: { action: true }}
    ]
  },
  {
    name: 'Toxin Cloud',
    tree: 'Catalyst',
    powerType: 'utility',
    description: 'Release a cloud of poisonous gas.',
    levels: [
      { level: 1, type: 'Utility', range: '8m', aoe: 'Radius 2m', duration: '2 Rounds', effect: 'Enemies in area suffer Poison(1)', cost: { action: true }},
      { level: 2, type: 'Utility', range: '12m', aoe: 'Radius 4m', duration: '2 Rounds', effect: 'Enemies in area suffer Poison(2)', cost: { action: true }},
      { level: 3, type: 'Utility', range: '16m', aoe: 'Radius 4m', duration: '3 Rounds', effect: 'Enemies in area suffer Poison(3)', cost: { action: true }},
      { level: 4, type: 'Utility', range: '20m', aoe: 'Radius 6m', duration: '3 Rounds', effect: 'Enemies in area suffer Poison(4)', cost: { action: true }}
    ]
  },
  {
    name: 'Adaptive Mutation',
    tree: 'Catalyst',
    powerType: 'passive',
    passiveCategory: 'healing',
    description: 'Your body adapts to damage through chemical reactions.',
    levels: [
      { level: 1, type: 'Passive', effect: 'Gain Regeneration(1) when you take damage.' },
      { level: 2, type: 'Passive', effect: 'Gain Regeneration(2) when you take damage.' },
      { level: 3, type: 'Passive', effect: 'Gain Regeneration(3) when you take damage and +1 Armor.' },
      { level: 4, type: 'Passive', effect: 'Gain Regeneration(4) when you take damage and +2 Armor.' }
    ]
  }
];

