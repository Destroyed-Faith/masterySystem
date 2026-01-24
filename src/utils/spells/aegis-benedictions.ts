/**
 * Aegis & Benedictions — School of Aid Spells
 */

import type { SpellDefinition } from './types.js';

export const AEGIS_BENEDICTIONS_SPELLS: SpellDefinition[] = [
  {
    name: 'Aid',
    school: 'Aegis & Benedictions',
    spellType: 'utility',
    description: 'Sacred vigor infuses the chosen, empowering body or mind.',
    levels: [
      { level: 1, type: 'Ranged (Spell)', range: '8 m', duration: '1 round', effect: 'Target gains +1 Attribute (not Vitality)', raises: 'Range +4 m, Duration +1 round, +1 Attribute', cost: { action: true, charged: true } },
      { level: 2, type: 'Ranged (Spell)', range: '12 m', duration: '1 round', effect: 'Target gains +2 Attributes (not Vitality)', raises: 'Range +4 m, Duration +1 round, +1 Attribute', cost: { action: true, charged: true } },
      { level: 3, type: 'Ranged (Spell)', range: '16 m', duration: '1 round', effect: 'Target gains +3 Attributes (not Vitality)', raises: 'Range +4 m, Duration +1 round, +1 Attribute', cost: { action: true, charged: true } },
      { level: 4, type: 'Ranged (Spell)', range: '20 m', duration: '1 round', effect: 'Target gains +4 Attributes (not Vitality)', raises: 'Range +4 m, Duration +1 round, +1 Attribute', cost: { action: true, charged: true } }
    ]
  },
  {
    name: 'Bless',
    school: 'Aegis & Benedictions',
    spellType: 'utility',
    description: 'A radiant pulse of faith blesses those within the light.',
    levels: [
      { level: 1, type: 'Zone (Spell)', range: '8 m', aoe: 'Radius 2 m', duration: '1 round', effect: 'All allies gain +2 Attack Dice and +1 Save Die', raises: 'Range +2 m, Radius +1 m, Duration +1 round', cost: { action: true } },
      { level: 2, type: 'Zone (Spell)', range: '10 m', aoe: 'Radius 4 m', duration: '1 round', effect: 'All allies gain +3 Attack Dice and +1 Save Die', raises: 'Range +2 m, Radius +1 m, Duration +1 round', cost: { action: true } },
      { level: 3, type: 'Zone (Spell)', range: '12 m', aoe: 'Radius 6 m', duration: '1 round', effect: 'All allies gain +4 Attack Dice and +2 Save Dice', raises: 'Range +2 m, Radius +1 m, Duration +1 round', cost: { action: true } },
      { level: 4, type: 'Zone (Spell)', range: '14 m', aoe: 'Radius 8 m', duration: '1 round', effect: 'All allies gain +5 Attack Dice and +2 Save Dice', raises: 'Range +2 m, Radius +1 m, Duration +1 round', cost: { action: true } }
    ]
  },
  {
    name: 'Beacon of Grace',
    school: 'Aegis & Benedictions',
    spellType: 'utility',
    description: 'A radiant aura steadies the soul, warding off darkness in a moment of need.',
    levels: [
      { level: 1, type: 'Utility (Spell)', range: '8 m', aoe: 'Radius 2 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 1 Save', raises: 'Range +2 m, Radius +2 m, Saves +1 (per creature), Duration +1 round', cost: { action: true } },
      { level: 2, type: 'Utility (Spell)', range: '10 m', aoe: 'Radius 4 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 2 Saves', raises: 'Range +2 m, Radius +2 m, Saves +1 (per creature), Duration +1 round', cost: { action: true } },
      { level: 3, type: 'Utility (Spell)', range: '12 m', aoe: 'Radius 6 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 3 Saves', raises: 'Range +2 m, Radius +2 m, Saves +1 (per creature), Duration +1 round', cost: { action: true } },
      { level: 4, type: 'Utility (Spell)', range: '14 m', aoe: 'Radius 8 m', duration: '1 Round', effect: 'Allies in the area gain Advantage on their next 4 Saves', raises: 'Range +2 m, Radius +2 m, Saves +1 (per creature), Duration +1 round', cost: { action: true } }
    ]
  },
  {
    name: 'Feather Fall',
    school: 'Aegis & Benedictions',
    spellType: 'utility',
    description: 'A shimmering aura slows every descent — wings of air cradle those within.',
    levels: [
      { level: 1, type: 'Utility', range: '8 m', aoe: 'Radius 2 m', duration: 'Active', effect: 'All creatures in the area descend slowly and take no fall damage', special: 'Glide Rate: 6 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 2, type: 'Utility', range: '12 m', aoe: 'Radius 4 m', duration: 'Active', effect: 'As above; larger area and faster glide', special: 'Glide Rate: 12 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 3, type: 'Utility', range: '16 m', aoe: 'Radius 6 m', duration: 'Active', effect: 'As above; allows minor horizontal drift (2 m / round)', special: 'Glide Rate: 20 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 4, type: 'Utility', range: '20 m', aoe: 'Radius 8 m', duration: 'Active', effect: 'As above; perfect slow-fall control, drift up to 4 m / round', special: 'Glide Rate: 26 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } }
    ]
  },
  {
    name: 'Wings of Faith',
    school: 'Aegis & Benedictions',
    spellType: 'utility',
    description: 'Radiant energy lifts you skyward, carrying you on unseen wings.',
    levels: [
      { level: 1, type: 'Utility', range: '8 m', aoe: 'Radius 2 m', duration: '1 round', effect: 'All creatures in area may fly up to 4 m for 1 round', special: 'Flight Speed: 4 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 2, type: 'Utility', range: '12 m', aoe: 'Radius 4 m', duration: '1 round', effect: 'As above; wider area and faster ascent', special: 'Flight Speed: 8 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 3, type: 'Utility', range: '16 m', aoe: 'Radius 6 m', duration: '1 round', effect: 'As above; allows hovering and gentle descent', special: 'Flight Speed: 12 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } },
      { level: 4, type: 'Utility', range: '20 m', aoe: 'Radius 8 m', duration: '1 round', effect: 'As above; full short-term flight with precise control', special: 'Flight Speed: 16 m / round', raises: 'Radius +2 m, Range +2 m, Duration +1 Round', cost: { action: true } }
    ]
  }
];

