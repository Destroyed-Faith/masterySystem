/**
 * Old Pact — School of Forgotten Nature Spells
 */

import type { SpellDefinition } from './types.js';

export const OLD_PACT_SPELLS: SpellDefinition[] = [
  {
    name: 'Entangle',
    school: 'Old Pact',
    spellType: 'active',
    description: 'Roots and vines surge from the ground, gripping all who stand upon the cursed earth.',
    levels: [
      { level: 1, type: 'Ranged (Spell)', range: '8 m', duration: '1 round', effect: '—', special: 'Entangle (3)', raises: 'Range (+2 m), AoE (+1 m Radius), Entangle (+1), Rounds (+1)', cost: { action: true } },
      { level: 2, type: 'Ranged (Spell)', range: '12 m', duration: '1 round', effect: '—', special: 'Entangle (4)', raises: 'Range (+2 m), AoE (+1 m Radius), Entangle (+1), Rounds (+1)', cost: { action: true } },
      { level: 3, type: 'Ranged (Spell)', range: '16 m', aoe: 'Radius 2 m', duration: '2 rounds', effect: '—', special: 'Entangle (5)', raises: 'Range (+2 m), AoE (+1 m Radius), Entangle (+1), Rounds (+1)', cost: { action: true } },
      { level: 4, type: 'Ranged (Spell)', range: '20 m', aoe: 'Radius 4 m', duration: '3 rounds', effect: '—', special: 'Entangle (6)', raises: 'Range (+2 m), AoE (+1 m Radius), Entangle (+1), Rounds (+1)', cost: { action: true } }
    ]
  },
  {
    name: 'Healing Pulse',
    school: 'Old Pact',
    spellType: 'utility',
    description: 'Ancient vitality flows through the ground, mending wounds and purging corruption.',
    levels: [
      { level: 1, type: 'Support (Spell)', range: '8 m', duration: 'Instant', effect: 'Heal 2d8 HP (1 ally)', raises: 'Range (+2 m), AoE (+1 m Radius), Heal (+1d8), Cleanse (+1)', cost: { action: true }, roll: { healing: '2d8' } },
      { level: 2, type: 'Support (Spell)', range: '12 m', duration: 'Instant', effect: 'Heal 3d8 HP (1 ally)', special: 'Cleanse (4)', raises: 'Range (+2 m), AoE (+1 m Radius), Heal (+1d8), Cleanse (+1)', cost: { action: true }, roll: { healing: '3d8' } },
      { level: 3, type: 'Support (Spell)', range: '12 m', aoe: 'Radius 2 m', duration: 'Instant', effect: 'Heal 3d8 HP (all allies)', special: 'Cleanse (8)', raises: 'Range (+2 m), AoE (+1 m Radius), Heal (+1d8), Cleanse (+1)', cost: { action: true }, roll: { healing: '3d8' } },
      { level: 4, type: 'Support (Spell)', range: '16 m', aoe: 'Radius 4 m', duration: 'Instant', effect: 'Heal 4d8 HP (all allies)', special: 'Cleanse (12)', raises: 'Range (+2 m), AoE (+1 m Radius), Heal (+1d8), Cleanse (+1)', cost: { action: true }, roll: { healing: '4d8' } }
    ]
  },
  {
    name: 'Lightning of the Old Sky',
    school: 'Old Pact',
    spellType: 'active',
    description: 'Forked stormlight spears through the battlefield, searing nerves and locking limbs.',
    levels: [
      { level: 1, type: 'Ranged (Spell)', range: '12 m', duration: 'Instant', effect: '1d8 damage', special: 'Shock (2)', raises: 'Range (+4 m), Shock (+1), Autofire extra target, Radius (+1 m)', cost: { action: true }, roll: { damage: '1d8', damageType: 'lightning' } },
      { level: 2, type: 'Ranged (Spell, Charged)', range: '16 m', duration: 'Instant', effect: '1d8 damage', special: 'Shock (2), Autofire (1)', raises: 'Range (+4 m), Shock (+1), Autofire extra target, Radius (+1 m)', cost: { action: true, charged: true }, roll: { damage: '1d8', damageType: 'lightning' } },
      { level: 3, type: 'Ranged (Spell, Charged)', range: '20 m', duration: 'Instant', effect: '3d8 damage', special: 'Shock (3), Autofire (1)', raises: 'Range (+4 m), Shock (+1), Autofire extra target, Radius (+1 m)', cost: { action: true, charged: true }, roll: { damage: '3d8', damageType: 'lightning' } },
      { level: 4, type: 'Ranged (Spell, Charged)', range: '24 m', duration: 'Instant', effect: '4d8 damage', special: 'Shock (3), Autofire (2)', raises: 'Range (+4 m), Shock (+1), Autofire extra target, Radius (+1 m)', cost: { action: true, charged: true }, roll: { damage: '4d8', damageType: 'lightning' } }
    ]
  },
  {
    name: 'Call Storm',
    school: 'Old Pact',
    spellType: 'active',
    description: 'A roaring storm coalesces above, tearing at those trapped within its reach.',
    levels: [
      { level: 1, type: 'Zone (Spell)', range: '12 m', aoe: 'Radius 2 m', duration: '1 round', effect: 'Enemies inside take 1d8 Damage each round', special: 'Shock (1)', raises: 'Range (+4 m), Radius (+1 m), Shock (+1), Duration (+1 round)', cost: { action: true }, roll: { damage: '1d8', damageType: 'lightning' } },
      { level: 2, type: 'Zone (Spell)', range: '16 m', aoe: 'Radius 3 m', duration: '2 rounds', effect: 'Enemies inside take 2d8 Damage each round', special: 'Shock (1)', raises: 'Range (+4 m), Radius (+1 m), Shock (+1), Duration (+1 round)', cost: { action: true }, roll: { damage: '2d8', damageType: 'lightning' } },
      { level: 3, type: 'Zone (Spell)', range: '20 m', aoe: 'Radius 4 m', duration: '2 rounds', effect: 'Enemies inside take 3d8 Damage each round', special: 'Shock (2)', raises: 'Range (+4 m), Radius (+1 m), Shock (+1), Duration (+1 round)', cost: { action: true }, roll: { damage: '3d8', damageType: 'lightning' } },
      { level: 4, type: 'Zone (Spell)', range: '24 m', aoe: 'Radius 5 m', duration: '3 rounds', effect: 'Enemies inside take 4d8 Damage each round', special: 'Shock (2)', raises: 'Range (+4 m), Radius (+1 m), Shock (+1), Duration (+1 round)', cost: { action: true }, roll: { damage: '4d8', damageType: 'lightning' } }
    ]
  },
  {
    name: 'Shapechange',
    school: 'Old Pact',
    spellType: 'utility',
    description: 'You take the form of a harmless woodland creature (rabbit, fox, raven, owl, etc.).',
    levels: [
      { level: 1, type: 'Utility', range: 'Self', duration: '1 min', effect: 'Transform, +4 Stealth & +4 Move', cost: { action: true } },
      { level: 2, type: 'Utility', range: 'Self', duration: '5 min', effect: 'As above', cost: { action: true } },
      { level: 3, type: 'Utility', range: 'Self', duration: '10 min', effect: 'Resume/dismiss form as free action', cost: { action: true } },
      { level: 4, type: 'Utility', range: 'Self', duration: '15 min', effect: 'Understand simple animal speech', cost: { action: true } }
    ]
  },
  {
    name: 'Barkskin',
    school: 'Old Pact',
    spellType: 'utility',
    description: 'Your skin hardens like bark; life flows beneath, mending wounds with every breath.',
    levels: [
      { level: 1, type: 'Buff', range: '8 m', duration: '2 rounds', effect: 'Target gains +3 Armor', raises: 'Range (+2 m), Armor (+1), Regeneration (+1), Duration (+1 round)', cost: { action: true } },
      { level: 2, type: 'Buff', range: '12 m', duration: '3 rounds', effect: 'Target gains +4 Armor', raises: 'Range (+2 m), Armor (+1), Regeneration (+1), Duration (+1 round)', cost: { action: true } },
      { level: 3, type: 'Buff', range: '12 m', duration: '3 rounds', effect: 'Target gains +4 Armor and Regeneration (3)', raises: 'Range (+2 m), Armor (+1), Regeneration (+1), Duration (+1 round)', cost: { action: true } },
      { level: 4, type: 'Buff', range: '16 m', duration: '4 rounds', effect: 'Target gains +5 Armor and Regeneration (6)', raises: 'Range (+2 m), Armor (+1), Regeneration (+1), Duration (+1 round)', cost: { action: true } }
    ]
  },
  {
    name: 'Whispering Woods',
    school: 'Old Pact',
    spellType: 'active',
    description: 'The forest whispers with ancient dread — unseen eyes in the dark press against every mind.',
    levels: [
      { level: 1, type: 'Zone', range: 'Self', aoe: 'Radius 4 m', duration: '1 round', effect: 'Area becomes filled with psychic whispers and dread', special: 'Frightened(1)', raises: 'Radius (+2 m), Duration (+1 round), Frightened (+1), Range (+2 m)', cost: { action: true } },
      { level: 2, type: 'Zone', range: 'Self', aoe: 'Radius 6 m', duration: '1 round', effect: 'All creatures in the area must resist or flee in panic', special: 'Frightened(1)', raises: 'Radius (+2 m), Duration (+1 round), Frightened (+1), Range (+2 m)', cost: { action: true } },
      { level: 3, type: 'Zone', range: 'Self', aoe: 'Radius 8 m', duration: '2 rounds', effect: 'Minds crumble under ancient fear', special: 'Frightened(2)', raises: 'Radius (+2 m), Duration (+1 round), Frightened (+1), Range (+2 m)', cost: { action: true } },
      { level: 4, type: 'Zone', range: 'Self', aoe: 'Radius 10 m', duration: '2 rounds', effect: 'The forest itself howls; all enemies are seized by primal terror', special: 'Frightened(3)', raises: 'Radius (+2 m), Duration (+1 round), Frightened (+1), Range (+2 m)', cost: { action: true } }
    ]
  },
  {
    name: 'Moonbeam',
    school: 'Old Pact',
    spellType: 'active',
    description: 'A column of silver moonlight descends — serene, merciless, and pure.',
    levels: [
      { level: 1, type: 'Ranged', range: '12 m', duration: 'Instant', effect: '2d8 damage', special: 'Disoriented (1)', raises: 'Range (+4 m), Disoriented (+1), Radius (+2 m)', cost: { action: true }, roll: { damage: '2d8', damageType: 'radiant' } },
      { level: 2, type: 'Ranged', range: '16 m', duration: 'Instant', effect: '3d8 damage', special: 'Disoriented (2)', raises: 'Range (+4 m), Disoriented (+1), Radius (+2 m)', cost: { action: true }, roll: { damage: '3d8', damageType: 'radiant' } },
      { level: 3, type: 'Ranged', range: '20 m', aoe: 'Radius 2 m', duration: 'Instant', effect: '4d8 damage', special: 'Disoriented (3)', raises: 'Range (+4 m), Disoriented (+1), Radius (+2 m)', cost: { action: true }, roll: { damage: '4d8', damageType: 'radiant' } },
      { level: 4, type: 'Ranged', range: '24 m', aoe: 'Radius 4 m', duration: 'Instant', effect: '5d8 damage', special: 'Disoriented (4)', raises: 'Range (+4 m), Disoriented (+1), Radius (+2 m)', cost: { action: true }, roll: { damage: '5d8', damageType: 'radiant' } }
    ]
  }
];

