/**
 * General Artifact Catalog
 *
 * Bound (non-Echo) Artifacts from the Player's Guide "Artifact Examples"
 * chapter. Unlike Echo Artifacts these are not granted at character creation —
 * they are seeded as Artifact-Builder trees into the world library (folder
 * "General Artifacts") and handed out by the GM.
 *
 * Each definition reuses the `EchoArtifactDefinition` authoring shape with
 * `echoKey: ''`; the tree builder detects the empty echo key and emits
 * `binding: 'bound'` nodes without `echoBound` flags. The authored
 * `levelProgression` tables below are the source of truth (1:1 from the
 * rulebook) — they are NOT recompiled from progression picks.
 */

import type { EchoArtifactDefinition } from './echo-artifacts.js';

/**
 * General artifact authoring entry. Adds an optional paperdoll override for
 * "Main Hand or Off Hand" artifacts (one-handed items usable in either hand).
 */
export interface GeneralArtifactDefinition extends EchoArtifactDefinition {
  /** Override for `system.equipSlots` (e.g. ['mainhand', 'offhand']). */
  paperdollSlots?: string[];
}

// ----------------------------------------------------------------------
// Moonlight Greatsword (Two-Handed Weapon, Main Hand + Off Hand)
// ----------------------------------------------------------------------

const MOONLIGHT_GREATSWORD: GeneralArtifactDefinition = {
  key: 'moonlightGreatsword',
  name: 'Moonlight Greatsword',
  echoKey: '',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeapon',
  description:
    'A two-handed Artifact Weapon forged from pale lunar radiance. Moonlight Greatsword attacks may use Might or Agility.',
  restriction:
    'The Moonlight Greatsword occupies both hand Slots. A character with the Moonlight Greatsword cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time.',
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '5d8 to 14d8 across levels (4d8 two-handed base + 1d8/level).' },
    { slot: 'b', label: 'Weapon Special', note: 'Requiem(4) from L4, Requiem(8) from L7.' },
    { slot: 'c', label: 'Weapon Special', note: 'Expose(4) from L7, Expose(8) + True Moonlight at L10.' },
  ],
  // The three Level Progression lines are standard catalog Powers, only renamed:
  //   L1 Moonlight Mending  → Ranged Single-Target Heal (stages I/II/III @ L1/4/7),
  //   L2 Moonlight Judgment → Ranged AoE Targeted Special (Requiem),
  //   L3 Moonlight Shadow   → Damage Aura Active Buff (stages I/II/III @ L3/6/9).
  // The 1–9 rows are derived from these picks; only the bespoke L10 Ultimate
  // ("True Moonlight") is authored verbatim below.
  progressionPickSpecs: {
    1: { templateId: 'active-ranged-single-heal', name: 'Moonlight Mending' },
    2: { templateId: 'active-ranged-aoe-targeted-special', special: 'requiem', name: 'Moonlight Judgment' },
    3: { templateId: 'ab-damage-aura', name: 'Moonlight Shadow' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Moonlight',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Moonlight Greatsword fully awakens. Choose or define one final Moonlight effect with GM approval.',
      special: 'True Moonlight',
    },
  ],
};

// ----------------------------------------------------------------------
// Soul Sigil (Body, Soul Sigil / Soul Tattoo)
// ----------------------------------------------------------------------

const SOUL_SIGIL: GeneralArtifactDefinition = {
  key: 'soulSigil',
  name: 'Soul Sigil',
  echoKey: '',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description:
    'A bound Body Artifact that appears as thin silver lines running across the bearer\u2019s skin. It pulls the bearer slightly out of harm\u2019s path, catches damage in a temporary soul shell, and slowly knits the body back together through silver soul-light.',
  restriction:
    'The Soul Sigil occupies the Body Slot as Light Armor (+4 Armor). The Soul Sigil cannot be worn together with another Body Artifact.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
    name: 'Soul Shell',
  },
  baseValues: [
    { slot: 'a', label: 'Light Armor', note: 'Flat +4 Armor (Light Armor, no class drawbacks).' },
    { slot: 'b', label: 'Evade (Silver Veil)', note: '+2 to +11 Evade across levels (+1 per level).' },
  ],
  // The three Level Progression lines are standard, not authored:
  //   L1 Soul Shell    → Temporary HP Stone Power Support (from `stoneFunction`),
  //   L2 Uncanny Soul  → Phasing Reaction (stages I/II/III @ L2/5/8),
  //   L3 Resting Soul  → Phasing Active Buff (stages I/II/III @ L3/6/9).
  // The 1–9 rows derive from these picks; only the bespoke L10 Ultimate
  // ("True Soul Sigil") is authored verbatim below.
  progressionPickSpecs: {
    2: { templateId: 'reaction-phasing', name: 'Uncanny Soul' },
    3: { templateId: 'ab-phasing', name: 'Resting Soul' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Soul Sigil',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Soul Sigil fully awakens. Choose or define one final Soul effect with GM approval.',
      special: 'True Soul Sigil',
    },
  ],
};

// ----------------------------------------------------------------------
// Frostbound Returning Axe (One-Handed Weapon, Main Hand)
// ----------------------------------------------------------------------

const FROSTBOUND_RETURNING_AXE: GeneralArtifactDefinition = {
  key: 'frostboundReturningAxe',
  name: 'Frostbound Returning Axe',
  echoKey: '',
  slot: 'mainHand',
  baseProfile: 'oneHandedWeapon',
  description:
    'A one-handed Artifact Weapon marked by winter runes and returning force. When thrown, it cuts through the air and returns to the wielder\u2019s hand after the attack resolves.',
  restriction:
    'Returning does not grant an additional attack and does not change the action cost of attacks or Actives. After a thrown attack or Active granted by this Artifact is resolved, the Axe returns to the wielder.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.ignoreArmor',
    level: 1,
    name: 'Stormpower',
  },
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '3d8 to 12d8 across levels (2d8 one-handed base + 1d8/level).' },
    { slot: 'b', label: 'Thrown Return', note: 'Thrown 9\u201315 m, Returning, from L4. True Frostbound Return at L10.' },
  ],
  // Slot 1 — Stormpower (Ignore Armor stone support) from `stoneFunction`.
  // Slot 2 — Frost Throw: catalog Ranged Single Damage (Tier 4) with Slow.
  // Slot 3 — Rainshield: catalog `reaction-special-increase`.
  progressionPickSpecs: {
    2: { delivery: 'ranged-single', special: 'slow', name: 'Frost Throw' },
    3: { templateId: 'reaction-special-increase', name: 'Rainshield' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Frostbound Return',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Axe fully awakens. Choose or define one final Frostbound Return effect with GM approval.',
      special: 'True Frostbound Return',
    },
  ],
};

// ----------------------------------------------------------------------
// Shadowgrave Armor (Body, Shadow Armor)
// ----------------------------------------------------------------------

const SHADOWGRAVE_ARMOR: GeneralArtifactDefinition = {
  key: 'shadowgraveArmor',
  name: 'Shadowgrave Armor',
  echoKey: '',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description:
    'A bound Body Artifact formed from living shadow, grave-cold mist, and deathly sigils.',
  restriction:
    'Shadowgrave Armor occupies the Body Slot. The bearer cannot wear another Body Artifact or mundane armor while Shadowgrave Armor is bound. Shadowgrave Armor does not grant Damage Reduction and does not grant Phasing.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
    name: 'Shadow Shell',
  },
  baseValues: [
    { slot: 'a', label: 'Hybrid Defense', note: '4\u20139 Armor and +4 to +13 Evade across levels. True Shadowgrave Armor at L10.' },
  ],
  // The three Level Progression lines are standard, not authored:
  //   L1 Shadow Shell      → Temporary HP Stone Power Support (from `stoneFunction`),
  //   L2 Deathly Reprisal  → Counter Damage + Push Reaction (stages I/II/III @ L2/5/8),
  //   L3 Hands of the Grave → Ranged AoE Special (Root). Extra damage dice are 0;
  //      the payload is Root. Stages I/II/III @ L3/6/9.
  // The 1–9 rows derive from these picks; only the bespoke L10 Ultimate
  // ("True Shadowgrave Armor") is authored verbatim below.
  progressionPickSpecs: {
    2: { templateId: 'reaction-counter-damage-push', name: 'Deathly Reprisal' },
    3: { delivery: 'ranged-aoe', special: 'root', name: 'Hands of the Grave' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Shadowgrave Armor',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Shadowgrave Armor fully awakens. Choose or define one final Shadowgrave effect with GM approval.',
      special: 'True Shadowgrave Armor',
    },
  ],
};

// ----------------------------------------------------------------------
// Staff of the Dark (One-Handed Arcane Staff, Main Hand or Off Hand)
// ----------------------------------------------------------------------

const STAFF_OF_THE_DARK: GeneralArtifactDefinition = {
  key: 'staffOfTheDark',
  name: 'Staff of the Dark',
  echoKey: '',
  // Not a melee weapon — a Spell Focus. `custom` keeps it out of the weapon
  // kind so it never surfaces a weapon attack in the radial menu; it occupies
  // one hand slot via `paperdollSlots`.
  slot: 'mainHand',
  baseProfile: 'custom',
  paperdollSlots: ['mainhand', 'offhand'],
  description:
    'A bound arcane staff made from dark metallic wood, curved sharp edges, and an emerald-green core of living death. It is not a melee weapon — it is a Spell Focus. The Staff of the Dark may be used with Resolve or Influence and adds its Spell Focus Bonus to damage of Spells cast through it.',
  restriction:
    'The Staff of the Dark occupies one hand Slot (Main Hand or Off Hand). It cannot be used to make melee weapon attacks unless another rule explicitly allows it. The Spell Focus Bonus applies only to Spells cast through this Staff, never to weapon attacks.',
  baseValues: [
    {
      slot: 'a',
      label: 'Weapon Damage',
      note: '2d8 (L1) to 11d8 (L10) Staff Weapon Damage for Spells cast through this Staff.',
    },
    {
      slot: 'b',
      label: 'Weapon Special',
      note: 'Hex(2) from L4, Hex(3) from L6, Hex(4) from L8, Hex(5) at L10. Applies only if the Spell can legally carry it.',
    },
  ],
  // The three Level Progression lines are standard catalog Spells, not authored:
  //   L1 Might of the Dark → Melee AoE Special (Hex) around the caster
  //   L2 Life Taken        → Ranged Single Attack (7 / 17 / 27 d8 extra, no Special)
  //   L3 Vision of the End → Ranged Single Special (Ruin; Soulburn is gone)
  // Only the bespoke L10 Ultimate is authored verbatim below.
  progressionPickSpecs: {
    1: {
      delivery: 'melee-aoe',
      special: 'hex',
      name: 'Might of the Dark',
      isSpell: true,
      castingAttribute: 'resolve',
    },
    2: {
      templateId: 'active-ranged-weapon-single',
      name: 'Life Taken',
      isSpell: true,
      castingAttribute: 'resolve',
    },
    3: {
      delivery: 'ranged-single',
      special: 'ruin',
      name: 'Vision of the End',
      isSpell: true,
      castingAttribute: 'resolve',
    },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Staff of the Dark',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Staff of the Dark fully awakens. Choose or define one final Staff of the Dark effect with GM approval.',
      special: 'True Staff of the Dark',
    },
  ],
};

// ----------------------------------------------------------------------
// Starfallen Forceshield (Medium Shield, Main Hand or Off Hand)
// ----------------------------------------------------------------------

const STARFALLEN_FORCESHIELD: GeneralArtifactDefinition = {
  key: 'starfallenForceshield',
  name: 'Starfallen Forceshield',
  echoKey: '',
  slot: 'offHand',
  baseProfile: 'shield',
  paperdollSlots: ['mainhand', 'offhand'],
  description:
    'A bound Shield Artifact forged from star-metal and celestial force. In its dormant state, it appears as a claw-like knuckle guard. When activated, it unfolds into a semi-transparent crescent shield of blue, gold, and violet force.',
  restriction:
    'The Starfallen Forceshield occupies one hand Slot. A character with the Starfallen Forceshield cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item in the same hand. Shield Value stacks with Armor Value as normal Armor resolution. Drawback: -2d8 Physical Skill Checks.',
  baseValues: [
    { slot: 'a', label: 'Shield Value', note: '+4 to +8 Armor across levels; drawback -2d8 Physical Skill Checks. True Starfallen Forceshield at L10.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Reflection I',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 2d8 damage to the triggering creature and push it 4 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 2,
      name: 'Crystalized I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 2 m',
      duration: 'Instant',
      effect: 'Deal +1d8 damage on hit.',
      special: 'Root(4)',
    },
    {
      level: 3,
      name: 'Crystal Rain I',
      type: 'Active',
      range: '20 m',
      aoe: 'Radius 2 m',
      duration: 'Instant',
      effect: 'Deal +7d8 damage on hit.',
    },
    {
      level: 4,
      name: 'Reflection II',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 6d8 damage to the triggering creature and push it 8 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 5,
      name: 'Crystalized II',
      type: 'Active',
      range: '44 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Deal +2d8 damage on hit.',
      special: 'Root(8)',
    },
    {
      level: 6,
      name: 'Crystal Rain II',
      type: 'Active',
      range: '44 m',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Deal +17d8 damage on hit.',
    },
    {
      level: 7,
      name: 'Reflection III',
      type: 'Reaction',
      range: '2 m',
      duration: 'Triggering attack only',
      effect:
        'When a creature within range hits you with an attack, deal 12d8 damage to the triggering creature and push it 8 m.',
      special: 'Counter Damage + Push',
    },
    {
      level: 8,
      name: 'Crystalized III',
      type: 'Active',
      range: '68 m',
      aoe: 'Radius 4 m',
      duration: 'Instant',
      effect: 'Deal +2d8 damage on hit.',
      special: 'Root(10)',
    },
    {
      level: 9,
      name: 'Crystal Rain III',
      type: 'Active',
      range: '68 m',
      aoe: 'Radius 4 m',
      duration: 'Instant',
      effect: 'Deal +27d8 damage on hit.',
    },
    {
      level: 10,
      name: 'True Starfallen Forceshield',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Starfallen Forceshield fully awakens. Choose or define one final Starfallen Forceshield effect with GM approval.',
      special: 'True Starfallen Forceshield',
    },
  ],
};

// ----------------------------------------------------------------------
// Lantern of the Hollow Star (Amulet, Lantern)
// ----------------------------------------------------------------------

const LANTERN_OF_THE_HOLLOW_STAR: GeneralArtifactDefinition = {
  key: 'lanternOfTheHollowStar',
  name: 'Lantern of the Hollow Star',
  echoKey: '',
  slot: 'amulet',
  baseProfile: 'lantern',
  description:
    'A bound Amulet Artifact shaped like a black lantern filled with pale inner fire. It is not a shield. It grants no Armor, no Evade, no Weapon Damage, and no Base Value \u2014 all of its power is written into its three Stone Functions. It is one of the eight Artifacts in the world that may carry three Stone Functions at once.',
  restriction:
    'The Lantern of the Hollow Star occupies the Amulet Slot. A character with the Lantern of the Hollow Star cannot bind another Amulet Artifact at the same time.',
  // Three Stone Functions — not two authored extras. This is one of the eight
  // artifacts allowed to do that:
  //   L1 Stone Battery → Resolve battery (10 / 20 / 40)
  //   L2 Resolve Pool  → fixed Resolve stones after each Safe Haven Rest (2 / 4 / 8)
  //   L3 Recovery      → Restore spent Resolve stones (1 / 2 / 4)
  progressionPickSpecs: {
    1: { name: 'Stone Battery', stoneFunction: { kind: 'stoneBattery', attribute: 'resolve' } },
    2: { name: 'Resolve Pool', stoneFunction: { kind: 'stonePool', attribute: 'resolve' } },
    3: { name: 'Recovery', stoneFunction: { kind: 'stoneRefresh', attribute: 'resolve' } },
  },
  baseValues: [],
  levelProgression: [
    {
      level: 10,
      name: 'True Hollow Star',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Lantern fully awakens. Choose or define one final Stone Battery, Resolve Pool, Recovery, or stored-stone effect with GM approval.',
      special: 'True Hollow Star',
    },
  ],
};

// ----------------------------------------------------------------------
// Lor-Keth's Staff (Two-Handed Stone Staff, Main Hand + Off Hand)
// ----------------------------------------------------------------------

const LOR_KETHS_STAFF: GeneralArtifactDefinition = {
  key: 'lorKethsStaff',
  name: "Lor-Keth's Staff",
  echoKey: '',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeapon',
  description:
    "Lor-Keth's Staff is a two-handed Rod of the Storm Ancestors. It was forged for giants, shaped from smooth blue-gray stone, and awakened by old runes of storm and bloodline.\n\nThe Staff changes with its bearer.\n\nIt is not a wand. It is a giant's weapon.",
  restriction:
    "Lor-Keth's Staff requires both hands.\n\nWhile wielding it, the character cannot wield another weapon, shield, or Hand Artifact.",
  // The Ignore Armor Stone Power Support unlocks at L3 (L1/L2 are the Giant
  // Shock Strike Active and Ancestor Guard Reaction), so the mechanical stone
  // function gates at level 3 to match the authored Level Progression.
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.ignoreArmor',
    level: 3,
  },
  baseValues: [
    { slot: 'a', label: 'Staff Damage', note: '5d8 to 14d8 across levels (4d8 two-handed base + 1d8/level).' },
    {
      slot: 'b',
      label: 'Storm Rune',
      note: 'Shock Rune from L4, Greater Shock Rune from L7, True Shock Rune at L10.',
    },
    {
      slot: 'c',
      label: 'Giant Weight',
      note: 'Giant Weight from L7, True Giant Weight at L10.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Giant Shock Strike I',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 4. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Challenge(5)',
    },
    {
      level: 2,
      name: 'Ancestor Guard I',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 4. When you are hit or would take damage, gain +10 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 3,
      name: 'Might Ignore Armor Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff supports the Might Ability Ignore Armor and pre-fills Tier 2. You must still pay Tier 1 yourself. If Tier 1 is not paid, the pre-filled Tier 2 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 4,
      name: 'Giant Shock Strike II',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 10. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Challenge(9)',
    },
    {
      level: 5,
      name: 'Ancestor Guard II',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 10. When you are hit or would take damage, gain +26 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 6,
      name: 'Might Ignore Armor Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff pre-fills Tier 3 of the Might Ability Ignore Armor. You must still pay Tier 1 and Tier 2 yourself. If Tier 1 and Tier 2 are not paid, the pre-filled Tier 3 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 7,
      name: 'Giant Shock Strike III',
      type: 'Active',
      range: 'Melee Reach',
      duration: 'Instant',
      effect:
        "Use Melee — Damage + Start PP 6 Special at Power Level 16. Make a melee attack with Lor-Keth's Staff. On hit, deal Staff Weapon Damage + 2d8 damage.",
      special: 'Challenge(11)',
    },
    {
      level: 8,
      name: 'Ancestor Guard III',
      type: 'Reaction',
      range: 'Self',
      duration: 'Triggering attack or damage instance only',
      effect:
        'Use Reaction: Armor at Power Level 16. When you are hit or would take damage, gain +42 Armor against the triggering attack or damage instance.',
      special: 'Armor',
    },
    {
      level: 9,
      name: 'Might Ignore Armor Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        "Lor-Keth's Staff pre-fills Tier 4 of the Might Ability Ignore Armor. You must still pay Tier 1, Tier 2, and Tier 3 yourself. If the lower tiers are not paid, the pre-filled Tier 4 has no effect.",
      special: 'Ignore Armor',
    },
    {
      level: 10,
      name: 'Heart of the Storm Ancestors',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'The Staff fully awakens as a giant-forged ancestral weapon. Choose or define one final Storm Ancestor effect with GM approval.',
      special: 'True Storm Ancestor',
    },
  ],
};

// ----------------------------------------------------------------------
// Heart of Winter (Medium Shield, Main Hand or Off Hand)
// ----------------------------------------------------------------------

const HEART_OF_WINTER: GeneralArtifactDefinition = {
  key: 'heartOfWinter',
  name: 'Heart of Winter',
  echoKey: '',
  slot: 'offHand',
  baseProfile: 'shield',
  paperdollSlots: ['mainhand', 'offhand'],
  description:
    'A bound Shield Artifact formed from supernatural ice, frozen crystal, or condensed protective force. In battle, the shield awakens and surrounds its bearer and nearby allies with layers of freezing protection.',
  restriction:
    'The Frostshield occupies one hand Slot. A character with the Frostshield cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item in the same hand. Shield Armor stacks with other Armor as normal.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
    name: 'Frozen Reserve',
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Shield Armor',
      note: '+5 to +14 Armor across levels (includes Medium Shield +4). Drawback: -2d8 Physical Skills.',
    },
  ],
  // Slot 1 — Frozen Reserve (Temporary HP stone support) from `stoneFunction`.
  // Slot 2 — Glacial Intercept: catalog `reaction-ally-armor`.
  // Slot 3 — Frostwave: catalog Melee AoE Special Damage with Slow.
  progressionPickSpecs: {
    2: { templateId: 'reaction-ally-armor', name: 'Glacial Intercept' },
    3: { delivery: 'melee-aoe', special: 'slow', name: 'Frostwave' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'Heart of Winter',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Permanent',
      effect:
        'The Frostshield fully awakens. Its Shield Armor increases to **+14 Armor**. Once per Combat, when you use **Glacial Intercept**, the protected ally also gains **Temporary HP equal to your Mastery Rank × 10** after the triggering damage is resolved.',
      special: 'Heart of Winter',
    },
  ],
};

// ----------------------------------------------------------------------
// Heartseeker (Heavy Crossbow, Main Hand + Off Hand)
// ----------------------------------------------------------------------

const HEARTSEEKER: GeneralArtifactDefinition = {
  key: 'heartseeker',
  name: 'Heartseeker',
  echoKey: '',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeaponRanged',
  description:
    'A massive two-handed Artifact Crossbow built for calculated volleys, armor-breaking shots, and decisive kills. Its mechanism draws with supernatural force, aligning every bolt along invisible lines of weakness.',
  restriction:
    'Heartseeker occupies both the Main Hand and Off Hand Slots. A character wielding Heartseeker cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time. Penetration and Precision on Base Value B apply only to attacks made with Heartseeker.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'agility',
    stonePowerId: 'agility.crit',
    level: 2,
    name: 'Killing Focus',
  },
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '5d8 to 14d8 (Heavy Crossbow 4d8 base + 1d8/level).' },
    {
      slot: 'b',
      label: 'Precision',
      note: 'Precision(2) from L4, Precision(3) from L7, Precision(4) + True Heartseeker at L10 — added to crossbow Precision(4).',
    },
  ],
  // Slot 1 — Divided Execution: catalog Ranged Split Attack.
  // Slot 2 — Killing Focus: Agility Critical stone support (`stoneFunction`).
  // Slot 3 — Armorbreaker: catalog Active Buff Damage + Penetration.
  progressionPickSpecs: {
    1: { templateId: 'active-ranged-weapon-split', name: 'Divided Execution' },
    3: { templateId: 'ab-damage-penetration', name: 'Armorbreaker' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Heartseeker',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Heartseeker fully awakens. Its additional Precision increases to **Precision(4)**. Choose or define one final Split Attack, Critical, Precision, Damage, Penetration, or execution-themed effect with GM approval.',
      special: 'True Heartseeker',
    },
  ],
};

// ----------------------------------------------------------------------
// Falcon Wide Brim (Head, Tailored Wide-Brimmed Hat)
// ----------------------------------------------------------------------

const FALCON_WIDE_BRIM: GeneralArtifactDefinition = {
  key: 'falconWideBrim',
  name: 'Falcon Wide Brim',
  echoKey: '',
  slot: 'head',
  baseProfile: 'headArmor',
  description:
    'A carefully tailored, wide-brimmed Artifact Hat made for hunters, marksmen, scouts, and combatants who control the rhythm of battle through awareness, positioning, and initiative. Its broad brim hides the wearer\u2019s eyes and movements.',
  restriction:
    'Falcon Wide Brim occupies the Head Slot. A character with Falcon Wide Brim cannot wear another Head Artifact, helmet, mask, crown, or magical headgear at the same time.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'wits',
    stonePowerId: 'wits.initiativeBoost',
    level: 1,
    name: 'Falcon Initiative',
  },
  baseValues: [
    { slot: 'a', label: 'Evade', note: '+1 to +5 Evade across levels.' },
    { slot: 'b', label: 'Combat Sense', note: 'Predator Sense from L4.' },
  ],
  // Slot 1 — Falcon Initiative (Wits Initiative Boost stone support) from `stoneFunction`.
  // Slot 2 — Falcon Step: catalog `reaction-reposition`.
  // Slot 3 — Falcon Momentum: catalog `reaction-initiative-gain`.
  progressionPickSpecs: {
    2: { templateId: 'reaction-reposition', name: 'Falcon Step' },
    3: { templateId: 'reaction-initiative-gain', name: 'Falcon Momentum' },
  },
  levelProgression: [
    {
      level: 10,
      name: 'True Falcon Wide Brim',
      type: 'Base Completion',
      range: 'Self',
      duration: 'Permanent',
      effect:
        'Falcon Wide Brim reaches its final Base Values. It grants **+5 Evade** and **Predator Sense**. It gains no additional Power.',
      special: '—',
    },
  ],
};

// ----------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------

export const GENERAL_ARTIFACTS: Record<string, GeneralArtifactDefinition> = {
  moonlightGreatsword: MOONLIGHT_GREATSWORD,
  soulSigil: SOUL_SIGIL,
  frostboundReturningAxe: FROSTBOUND_RETURNING_AXE,
  shadowgraveArmor: SHADOWGRAVE_ARMOR,
  staffOfTheDark: STAFF_OF_THE_DARK,
  starfallenForceshield: STARFALLEN_FORCESHIELD,
  heartOfWinter: HEART_OF_WINTER,
  heartseeker: HEARTSEEKER,
  falconWideBrim: FALCON_WIDE_BRIM,
  lanternOfTheHollowStar: LANTERN_OF_THE_HOLLOW_STAR,
  lorKethsStaff: LOR_KETHS_STAFF,
};

/** Lookup a General Artifact by key. */
export function getGeneralArtifact(key: string | null | undefined): GeneralArtifactDefinition | null {
  if (!key) return null;
  return GENERAL_ARTIFACTS[key] ?? null;
}
