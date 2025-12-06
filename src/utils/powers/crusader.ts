import { PowerDefinition } from './types';

export const CRUSADER_POWERS: PowerDefinition[] = [
  {
    name: 'Overhead Blow',
    tree: 'Crusader',
    powerType: 'active',
    description: 'A crushing strike that shatters shields and drives foes back.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Push(2)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Push(4)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Push(8)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 6d8 damage', special: 'Push(16)', cost: { action: true }, roll: { damage: '+6d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Smiting Arc',
    tree: 'Crusader',
    powerType: 'active',
    description: 'A radiant arc of steel that cleaves through darkness and sin alike.',
    levels: [
      { level: 1, type: 'Active', range: '2m', aoe: 'Cone 90°, 2m', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Smite(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'radiant' }},
      { level: 2, type: 'Active', range: '4m', aoe: 'Cone 90°, 4m', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', special: 'Smite(1)', cost: { action: true }, roll: { damage: '+2d8', damageType: 'radiant' }},
      { level: 3, type: 'Active', range: '8m', aoe: 'Cone 90°, 6m', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'radiant' }},
      { level: 4, type: 'Active', range: '16m', aoe: 'Cone 90°, 8m', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Smite(2)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'radiant' }}
    ]
  },
  {
    name: 'Smashing Blow',
    tree: 'Crusader',
    powerType: 'active',
    description: 'A brutal impact meant to break stance and bone.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 2d8 damage', cost: { action: true }, roll: { damage: '+2d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 3d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+3d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 4d8 damage', special: 'Prone(1)', cost: { action: true }, roll: { damage: '+4d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 5d8 damage', special: 'Prone(2)', cost: { action: true }, roll: { damage: '+5d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Shield Crush',
    tree: 'Crusader',
    powerType: 'active',
    description: 'You slam your shield forward, crushing both body and will.',
    levels: [
      { level: 1, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' }},
      { level: 2, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage', special: 'Stunned(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' }},
      { level: 3, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn', special: 'Stunned(1)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' }},
      { level: 4, type: 'Active', range: 'Melee', duration: 'Instant', effect: 'Weapon DMG + 1d8 damage; gain +2 Armor vs that enemy until your next turn', special: 'Stunned(2)', cost: { action: true }, roll: { damage: '+1d8', damageType: 'physical' }}
    ]
  },
  {
    name: 'Inspiring Cry',
    tree: 'Crusader',
    powerType: 'utility',
    description: 'A battle cry that restores faith and drives away corruption.',
    levels: [
      { level: 1, type: 'Utility', range: 'Self', aoe: 'Radius 2m', duration: 'Instant', effect: 'Heal allies for 1d8 HP', cost: { action: true }},
      { level: 2, type: 'Utility', range: 'Self', aoe: 'Radius 4m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)', cost: { action: true }},
      { level: 3, type: 'Utility', range: 'Self', aoe: 'Radius 6m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)', cost: { action: true }},
      { level: 4, type: 'Utility', range: 'Self', aoe: 'Radius 8m', duration: 'Instant', effect: 'Heal allies for 2d8 HP', special: 'Cleanse(1)', cost: { action: true }}
    ]
  },
  {
    name: 'Unbreakable Vow',
    tree: 'Crusader',
    powerType: 'buff',
    description: 'An oath of defiance that hardens flesh and faith alike.',
    levels: [
      { level: 1, type: 'Buff', range: 'Self', aoe: 'Radius 2m', duration: 'Mastery Rank Rounds', effect: 'Gain +4 Armor', cost: { action: true }},
      { level: 2, type: 'Buff', range: 'Self', aoe: 'Radius 2m', duration: 'Mastery Rank Rounds', effect: 'Gain +6 Armor and become Immovable', cost: { action: true }},
      { level: 3, type: 'Buff', range: 'Self', aoe: 'Radius 4m', duration: 'Mastery Rank Rounds', effect: 'Gain +8 Armor and become Immovable', cost: { action: true }},
      { level: 4, type: 'Buff', range: 'Self', aoe: 'Radius 8m', duration: 'Mastery Rank Rounds', effect: 'Gain +10 Armor and become Immovable', cost: { action: true }}
    ]
  },
  {
    name: 'Bolster',
    tree: 'Crusader',
    powerType: 'passive',
    passiveCategory: 'save',
    description: 'Your presence steels hearts and sharpens reflexes.',
    levels: [
      { level: 1, type: 'Passive', effect: 'You and allies within 2m gain +1 Evade and +1 Save Die.' },
      { level: 2, type: 'Passive', effect: 'You and allies within 4m gain +3 Evade and +1 Save Die.' },
      { level: 3, type: 'Passive', effect: 'You and allies within 6m gain +3 Evade and +2 Save Dice.' },
      { level: 4, type: 'Passive', effect: 'You and allies within 8m gain +5 Evade and +2 Save Dice.' }
    ]
  },
  {
    name: 'Hold the Line',
    tree: 'Crusader',
    powerType: 'passive',
    passiveCategory: 'armor',
    description: 'You anchor the line — no ally falls while you stand.',
    levels: [
      { level: 1, type: 'Passive', effect: 'You and one ally within 2m gain +1 Armor.' },
      { level: 2, type: 'Passive', effect: 'You and one ally within 4m gain +2 Armor.' },
      { level: 3, type: 'Passive', effect: 'You and one ally within 6m gain +4 Armor.' },
      { level: 4, type: 'Passive', effect: 'You and one ally within 8m gain +6 Armor.' }
    ]
  }
];

