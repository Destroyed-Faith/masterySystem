import { PowerDefinition } from './types';

export const BERSERKER_POWERS: PowerDefinition[] = [
  {
    name: 'Rending Strike',
    tree: 'Berserker of the Blood Moon',
    powerType: 'active',
    description: 'A vicious swing that tears flesh and armor.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Bleeding(5)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Leaping Cleave',
    tree: 'Berserker of the Blood Moon',
    powerType: 'active',
    description: 'Leap into the fray and cut down foes in a brutal arc.',
    levels: [
      { level: 1, type: 'Active', range: 'Self', aoe: 'Radius 1m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Bleeding(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Bleeding(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Bleeding(3)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Bleeding(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Reckless Attack',
    tree: 'Berserker of the Blood Moon',
    powerType: 'active',
    description: 'You throw caution aside and swing with brutal abandon. Enemies gain Advantage against you until your next turn.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', cost: { action: true }, roll: { damage: '+6d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 8d8 damage', cost: { action: true }, roll: { damage: '+8d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 10d8 damage', cost: { action: true }, roll: { damage: '+10d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Rage of the Blood Moon',
    tree: 'Berserker of the Blood Moon',
    powerType: 'buff',
    description: 'You let your own blood feed the fury.',
    levels: [
      { level: 1, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +3d8 damage, suffer Bleeding(1) (self) per Attack', cost: { action: true }},
      { level: 2, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +6d8 damage, suffer Bleeding(2) (self) per Attack', cost: { action: true }},
      { level: 3, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +8d8 damage, suffer Bleeding(3) (self) per Attack', cost: { action: true }},
      { level: 4, type: 'Buff', range: 'Self', duration: 'Mastery Rank Rounds', effect: 'Gain +10d8 damage, suffer Bleeding(4) (self) per Attack', cost: { action: true }}
    ]
  },
  {
    name: 'Brutal Howl',
    tree: 'Berserker of the Blood Moon',
    powerType: 'utility',
    description: 'A primal scream that shakes enemy resolve.',
    levels: [
      { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', cost: { action: true }},
      { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4m', duration: '1 Round', effect: 'Enemies suffer -1 Attack Die until your next turn', special: 'Frightened(1)', cost: { action: true }},
      { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true }},
      { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8m', duration: '1 Round', effect: 'Enemies suffer -2 Attack Dice until your next turn', special: 'Frightened(1)', cost: { action: true }}
    ]
  },
  {
    name: 'Bloodlust',
    tree: 'Berserker of the Blood Moon',
    powerType: 'passive',
    passiveCategory: 'damage',
    description: 'The scent of blood drives you deeper into frenzy.',
    levels: [
      { level: 1, type: 'Passive', effect: 'While any enemy within 2m is Bleeding, your attacks gain +3d8 damage.' },
      { level: 2, type: 'Passive', effect: 'While any enemy within 4m is Bleeding, your attacks gain +4d8 damage.' },
      { level: 3, type: 'Passive', effect: 'While any enemy within 6m is Bleeding, your attacks gain +5d8 damage.' },
      { level: 4, type: 'Passive', effect: 'While any enemy within 8m is Bleeding, your attacks gain +6d8 damage.' }
    ]
  }
];

