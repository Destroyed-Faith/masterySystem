/**
 * Chapter → pack / journal / page mapping for the Player's Guide.
 *
 * `start` is a regex matched against a heading line (including # markers).
 * Content runs until the next mapped section start (or EOF).
 *
 * Packs:
 *   rules-core      — Core Rules
 *   rules-world     — World & Echoes
 *   rules-quickref  — Quick Reference
 *
 * Excluded from Phase 1: Power Catalogues, Minor Expressions Catalogue.
 */

/** @typedef {{ pack: string, journal: string, page: string, start: RegExp, gmOnly?: boolean, exclude?: boolean }} ChapterSpec */

/** @type {ChapterSpec[]} */
export const CHAPTER_SPECS = [
  // ── World & Echoes ──────────────────────────────────────────────
  { pack: 'rules-world', journal: 'World & Setting', page: 'Tyhra', start: /^## Tyhra\s*$/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Eight Laws', start: /^>\s*## The Eight Laws/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Three Moons', start: /^## The Three Moons/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Veil Days', start: /^## The Veil Days/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Triune Alignment', start: /^## The Triune Alignment/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Archangels of Creation', start: /^## The Archangels of Creation/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The History of Tyhra', start: /^# The History of Tyhra/ },
  { pack: 'rules-world', journal: 'World & Setting', page: 'The Realms of the Nine', start: /^#{2,4}\s+The Realms of the Nine/ },

  // ── Character Creation (Core) ───────────────────────────────────
  { pack: 'rules-core', journal: 'Character Creation', page: 'Mastery System', start: /^## Mastery System\s*$/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'The Spirit of Mastery', start: /^## The Spirit of Mastery/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Attributes', start: /^## Attributes\s*$/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Starting Attributes', start: /^## Starting Attributes/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Example: Attributes', start: /^## Example: Alaris Chooses Her Attributes/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Skills', start: /^## Skills\s*$/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Example: Skills', start: /^## Example: Alaris Selects Her Skills/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Choosing Powers', start: /^## Choose your Powers/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Example: Powers', start: /^## Example: Alaris Chooses Her Powers/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Languages', start: /^## Choose a Language/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Schticks', start: /^## Schticks/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Example: Languages and Schticks', start: /^## Example: Alaris Chooses Languages and Schticks/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Social Combat', start: /^## Social Combat/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Disadvantages', start: /^## Disadvantages/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Example: Disadvantages', start: /^## Example: Alaris Chooses Disadvantages/ },
  { pack: 'rules-core', journal: 'Character Creation', page: 'Finished Character: Alaris', start: /^## The Finished Character: Alaris/ },

  // ── Echoes (World) — intro + each Echo ──────────────────────────
  { pack: 'rules-world', journal: 'Playable Echoes', page: 'Overview', start: /^## Playable Echoes/ },
  { pack: 'rules-world', journal: 'Playable Echoes', page: 'Example: Choosing an Echo', start: /^## Example: Alaris Chooses Her Echo/ },
  { pack: 'rules-world', journal: 'Playable Echoes', page: 'Echo Artifacts', start: /^### Echo Artifacts/ },
  { pack: 'rules-world', journal: 'Humans', page: 'Overview', start: /^### Humans\s*$/ },
  { pack: 'rules-world', journal: 'Humans', page: 'Echo Deck', start: /^#### Human Echo Deck/ },
  { pack: 'rules-world', journal: 'Halflings', page: 'Overview', start: /^### Halflings\s*$/ },
  { pack: 'rules-world', journal: 'Halflings', page: 'Artifacts', start: /^#### Ringchain of Kept Names/ },
  { pack: 'rules-world', journal: 'Halflings', page: 'Echo Deck', start: /^#### Halfling Echo Deck/ },
  { pack: 'rules-world', journal: 'Dwarves', page: 'Overview', start: /^### Dwarves\s*$/ },
  { pack: 'rules-world', journal: 'Dwarves', page: 'Artifacts', start: /^#### Stonebound Soles/ },
  { pack: 'rules-world', journal: 'Dwarves', page: 'Echo Deck', start: /^#### Dwarves Echo Deck/ },
  { pack: 'rules-world', journal: 'Elorians', page: 'Overview', start: /^### \*\*Elorians\*\*/ },
  { pack: 'rules-world', journal: 'Elorians', page: 'Artifacts', start: /^#### Elorian Stride/ },
  { pack: 'rules-world', journal: 'Sentinels', page: 'Overview', start: /^### \*\*Sentinels\*\*/ },
  { pack: 'rules-world', journal: 'Sentinels', page: 'Echo Artifacts', start: /^## Sentinel Echo Artifacts/ },
  { pack: 'rules-world', journal: 'Titanborn', page: 'Overview', start: /^### \*\*Titanborn\*\*/ },
  { pack: 'rules-world', journal: 'Titanborn', page: 'Artifacts', start: /^#### Titan Scars/ },
  { pack: 'rules-world', journal: 'Titanborn', page: 'Echo Deck', start: /^#### Titanborn Echo Deck/ },
  { pack: 'rules-world', journal: 'Dragonborn', page: 'Overview', start: /^### Dragonborn\s*$/ },
  { pack: 'rules-world', journal: 'Dragonborn', page: 'Echo Deck', start: /^#### Dragonborn Echo Deck/ },
  { pack: 'rules-world', journal: 'Unbound', page: 'Overview', start: /^### Unbound\s*$/ },
  { pack: 'rules-world', journal: 'Unbound', page: 'Echo Deck', start: /^#### Unbound Echo Deck/ },
  { pack: 'rules-world', journal: 'Deathless', page: 'Overview', start: /^## Deathless\s*$/ },

  // ── Stones & Progression ────────────────────────────────────────
  { pack: 'rules-core', journal: 'Stones & Progression', page: 'Stone Abilities', start: /^## Stone Abilities/ },
  { pack: 'rules-core', journal: 'Stones & Progression', page: 'Types of Powers', start: /^## Types of Powers/ },
  { pack: 'rules-core', journal: 'Stones & Progression', page: 'Progression (XP)', start: /^## Progression \(XP\)/ },
  { pack: 'rules-core', journal: 'Stones & Progression', page: 'Mastery Rank Progression', start: /^## Mastery Rank Progression/ },

  // ── Combat Core ─────────────────────────────────────────────────
  { pack: 'rules-core', journal: 'Combat Core', page: 'Combat Core', start: /^## Combat Core\s*$/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Raises', start: /^## Raises - Universal Combat Raise Catalog/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Combat Senses', start: /^## Combat Senses/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Stealth, Hidden, and Invisibility', start: /^## Stealth, Hidden, and Invisibility/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Round Structure', start: /^### Round Structure/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Initiative', start: /^## Initiative/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Attacks', start: /^## Attacks\s*$/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Armor and Shields', start: /^## Armor and Shields/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Opposed Attribute Contests', start: /^## Opposed Attribute Contests/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Advantage and Disadvantage', start: /^## Advantage and Disadvantage/ },
  // Health / Maneuvers / Rest live as ### under Advantage section region in the source
  { pack: 'rules-core', journal: 'Combat Core', page: 'Health & Fear', start: /^### Health & Fear/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Combat Maneuvers', start: /^### Combat Maneuvers/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Rest & Recovery', start: /^### Rest & Recovery/ },
  { pack: 'rules-core', journal: 'Combat Core', page: 'Special Effects Reference', start: /^### Special Effects Reference/ },

  // ── Equipment, Magic & Powers (general only) ────────────────────
  { pack: 'rules-core', journal: 'Equipment, Magic & Powers', page: 'Equipment', start: /^## Equipment\s*$/ },
  { pack: 'rules-core', journal: 'Equipment, Magic & Powers', page: 'Weapons', start: /^## Weapons\s*$/ },
  { pack: 'rules-core', journal: 'Equipment, Magic & Powers', page: 'Magic', start: /^## Magic\s*$/ },
  { pack: 'rules-core', journal: 'Equipment, Magic & Powers', page: 'Powers', start: /^## Powers\s*$/ },
  { pack: 'rules-core', journal: 'Equipment, Magic & Powers', page: 'Minor Expressions', start: /^## Minor Expressions\s*$/ },

  // EXCLUDE Minor Expressions Catalogue and attribute ME chapters
  { pack: 'rules-core', journal: '_excluded', page: 'Minor Expressions Catalogue', start: /^# Minor Expressions Catalogue/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Might', start: /^## Might\s*$/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Agility', start: /^## Agility\s*$/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Intellect', start: /^## Intellect\s*$/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Resolve', start: /^## Resolve\s*$/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Influence', start: /^## Influence\s*$/, exclude: true },
  { pack: 'rules-core', journal: '_excluded', page: 'ME Wits', start: /^## Wits\s*$/, exclude: true },

  // ── Rituals, Summons, Artifacts ─────────────────────────────────
  { pack: 'rules-core', journal: 'Rituals, Summons & Artifacts', page: 'Rituals', start: /^## Rituals\s*$/ },
  { pack: 'rules-core', journal: 'Rituals, Summons & Artifacts', page: 'Summons', start: /^## Summons\s*$/ },
  { pack: 'rules-core', journal: 'Rituals, Summons & Artifacts', page: 'Summon Examples', start: /^## Summon Examples/ },
  { pack: 'rules-core', journal: 'Rituals, Summons & Artifacts', page: 'Minor Magic Items', start: /^## Minor Magic Items/ },
  { pack: 'rules-core', journal: 'Rituals, Summons & Artifacts', page: 'Artifacts', start: /^### Artifacts\s*$/ },

  // ── Advanced (GM-leaning) ───────────────────────────────────────
  { pack: 'rules-core', journal: 'Advanced & Optional', page: 'Building Encounters', start: /^## Building Encounters/, gmOnly: true },
  { pack: 'rules-core', journal: 'Advanced & Optional', page: 'Game System Details', start: /^## Game System Details/ },
  { pack: 'rules-core', journal: 'Advanced & Optional', page: 'Limited Power Modifier', start: /^## Limited Power Modifier/ },

  // ── Quick Reference (cheat sheets live in the PG appendix) ──────
  { pack: 'rules-quickref', journal: 'Player Cheat Sheets', page: 'Core Flow', start: /^#### \*\*Player Cheat Sheet: Core Flow\*\*/ },
  { pack: 'rules-quickref', journal: 'Player Cheat Sheets', page: 'Defense & Resources', start: /^#### \*\*Player Cheat Sheet: Defense & Resources\*\*/ },

  // Compact topic pages (same source text as Core; separate journal for browsing)
  { pack: 'rules-quickref', journal: 'Combat Quick Reference', page: 'Round Structure', start: /^### Round Structure/ },
  { pack: 'rules-quickref', journal: 'Combat Quick Reference', page: 'Health & Fear', start: /^### Health & Fear/ },
  { pack: 'rules-quickref', journal: 'Combat Quick Reference', page: 'Special Effects Reference', start: /^### Special Effects Reference/ },
  { pack: 'rules-quickref', journal: 'Combat Quick Reference', page: 'Raises', start: /^## Raises - Universal Combat Raise Catalog/ },
  { pack: 'rules-quickref', journal: 'Stones Quick Reference', page: 'Stone Abilities', start: /^## Stone Abilities/ },
  { pack: 'rules-quickref', journal: 'Core Terms', page: 'Core Terms', start: /^>\s*## Core Terms/ },
];

export const PACK_META = {
  'rules-core': {
    name: 'rules-core',
    label: 'Destroyed Faith: Core Rules',
    type: 'JournalEntry',
  },
  'rules-world': {
    name: 'rules-world',
    label: 'Destroyed Faith: World & Echoes',
    type: 'JournalEntry',
  },
  'rules-quickref': {
    name: 'rules-quickref',
    label: 'Destroyed Faith: Quick Reference',
    type: 'JournalEntry',
  },
};
