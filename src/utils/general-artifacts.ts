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
 * `binding: 'bound'` nodes without `echoBound` flags. L1–9 come from
 * `progressionPickSpecs` (official catalog templates); L10 is authored as
 * universal Artifact Awakening via `artifactAwakeningRow`.
 */

import { artifactAwakeningRow, type EchoArtifactDefinition } from './echo-artifacts.js';

/**
 * General artifact authoring entry. Adds an optional paperdoll override for
 * "Main Hand or Off Hand" artifacts (one-handed items usable in either hand).
 */
export interface GeneralArtifactDefinition extends EchoArtifactDefinition {
  /** Override for `system.equipSlots` (e.g. ['mainhand', 'offhand']). */
  paperdollSlots?: string[];
  /**
   * Batch 9G.4 — SOURCE MISSING hold: skip *fresh* world-library seed creates only.
   * Existing world trees and actor items stay resolvable; remove this flag to reopen.
   * Does **not** rewrite, revoke, or hide owned Actor Items.
   */
  newGrantHold?: boolean;
}

/** True when a General Artifact is on the temporary SOURCE MISSING new-grant hold. */
export function isArtifactNewGrantHeld(key: string | null | undefined): boolean {
  if (!key) return false;
  return GENERAL_ARTIFACTS[key]?.newGrantHold === true;
}

/**
 * Whether seed/refresh may create a brand-new world tree for this catalog key.
 * Existing world items (count > 0) are never blocked — only empty-world creates.
 */
export function shouldCreateNewWorldArtifactTree(
  key: string | null | undefined,
  existingWorldItemCount: number,
): boolean {
  if (!key) return false;
  if (Number(existingWorldItemCount) > 0) return true;
  return !isArtifactNewGrantHeld(key);
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
    'A two-handed Artifact Weapon forged from pale lunar radiance. Inherent Finesse: qualifying weapon attacks may use Might or Agility.',
  restriction:
    'The Moonlight Greatsword occupies both hand Slots. A character with the Moonlight Greatsword cannot use another weapon, shield, hand focus, claw Artifact, or hand-based magical item at the same time.',
  baseValues: [
    {
      slot: 'a',
      label: 'Weapon Damage',
      note: '4d8 base + 1d8 per Artifact Level (L1 = 5d8 … L10 = 14d8). Inherent Finesse is not a Base Value.',
    },
    {
      slot: 'b',
      label: 'Spell Focus (+4d8)',
      note: 'Unlocked at Level 4. Runestaff two-handed Spell Focus; applies once to damaging Spells including Moonlight Judgment when unlocked; never multiplied by Limited (×4 is Power Dice only).',
    },
    {
      slot: 'c',
      label: 'Weapon Special: Expose',
      note: 'Expose(4) at Levels 7–9; Expose(5) at Level 10. No separate Level-10 Ultimate.',
    },
  ],
  // Catalogue Technical References (Artefacts v0.9.9.5, 2026-10-25):
  //   L1/4/7 Moonlight Mending  → Ranged Single Target Heal (PL 4/10/16)
  //   L2/5/8 Moonlight Judgment → Limited Ranged AoE Attack (Spell; PL 4/10/16)
  //   L3/6/9 Moonlight Shadow   → Active Buff: Damage Aura (PL 4/10/16)
  //   L10 Artifact Awakening (universal; no True Moonlight Ultimate, no Requiem)
  progressionPickSpecs: {
    1: { templateId: 'active-ranged-single-heal', name: 'Moonlight Mending' },
    2: {
      templateId: 'active-ranged-limited-aoe',
      name: 'Moonlight Judgment',
      isSpell: true,
      // Catalogue does not name Intellect/Resolve/Influence; keep existing legal config.
      castingAttribute: 'intellect',
      spellResolution: 'spellAttack',
      limited: true,
      stageEffectTexts: [
        'Cast **Limited Ranged AoE Attack** (PL 4) as one damaging Spell AoE; printed **+3d8 Power Damage** becomes **+12d8** for this use (×4). Base B is not yet unlocked; no Focus bonus. **Shares the character\'s one global Limited use per Safe Haven Rest**; spent on declaration (miss still costs the use). No Weapon Damage; no Specials.',
        'Cast **Limited Ranged AoE Attack** (PL 10) as one damaging Spell AoE; printed **+4d8 Power Damage** becomes **+16d8** for this use (×4). When Base B is unlocked, **Spell Focus applies once** (not ×4). **Shares the character\'s one global Limited use per Safe Haven Rest**; spent on declaration (miss still costs the use). No Weapon Damage; no Specials.',
        'Cast **Limited Ranged AoE Attack** (PL 16) as one damaging Spell AoE; printed **+8d8 Power Damage** becomes **+32d8** for this use (×4). When Base B is unlocked, **Spell Focus applies once** (not ×4). **Shares the character\'s one global Limited use per Safe Haven Rest**; spent on declaration (miss still costs the use). No Weapon Damage; no Specials.',
      ],
    },
    3: {
      templateId: 'ab-damage-aura',
      name: 'Moonlight Shadow',
      stageEffectTexts: [
        'At the end of each of your Turns, enemies in a **2 m** aura take **3d8 damage**. Each creature once per Round. Uses/Safe Haven Rest = ceil(MR/2).',
        'At the end of each of your Turns, enemies in a **3 m** aura take **7d8 damage**. Replaces Moonlight Shadow I. Uses/Safe Haven Rest = ceil(MR/2).',
        'At the end of each of your Turns, enemies in a **4 m** aura take **11d8 damage**. Replaces Moonlight Shadow II. Uses/Safe Haven Rest = ceil(MR/2).',
      ],
    },
  },
  // Moonlight Shadow remains LEGACY (PH / Active_Buffs: redesign pending).
  levelProgression: [artifactAwakeningRow('Moonlight Greatsword')],
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
    'The Soul Sigil occupies the Body Slot. Silver Veil uses the Evade Body Armor profile (Light Armor layer + Evade). The Soul Sigil cannot be worn together with another Body Artifact. Listed Armor values are the full Silver Veil totals — no extra Artifact Armor Bonus.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'vitality',
    stonePowerId: 'vitality.tempHp',
    level: 1,
    name: 'Soul Shell',
  },
  baseValues: [
    { slot: 'a', label: 'Light Armor', note: 'Silver Veil Armor totals 4→8 (paired bands L1–2 / L3–4 / …).' },
    { slot: 'a', label: 'Evade (Silver Veil)', note: '+2 to +11 Evade across levels (+1 per level).' },
  ],
  // Compatibility catalogue + Core:
  //   L1 Soul Shell    → Temporary HP Stone Power Support
  //   L2 Uncanny Soul  → Reaction: Temporary HP (PL 4/10/16)
  //   L3 Resting Soul  → R-05 Self Restoration (older catalogue Active Buff: Healing
  //                      is Core-retired; keep Scarred-Bar Restoration)
  //   L10 universal Artifact Awakening
  progressionPickSpecs: {
    2: {
      templateId: 'reaction-temp-hp',
      name: 'Uncanny Soul',
      stageEffectTexts: [
        'Gain **20 Temporary HP** against the triggering damage instance. Any Temporary HP remaining afterward lasts until the end of your next Turn.',
        'Gain **50 Temporary HP** against the triggering damage instance. Any Temporary HP remaining afterward lasts until the end of your next Turn. This replaces Uncanny Soul I.',
        'Gain **80 Temporary HP** against the triggering damage instance. Any Temporary HP remaining afterward lasts until the end of your next Turn. This replaces Uncanny Soul II.',
      ],
    },
    3: {
      templateId: 'active-melee-health-level-heal',
      name: 'Resting Soul',
      stageEffectTexts: [
        'Restore up to **3 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. No turn-start healing; no HP dice.',
        'Restore up to **7 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. This replaces Resting Soul I.',
        'Restore up to **12 Scarred Health Bars on yourself only** (full HP each), once per Safe Haven Rest. This replaces Resting Soul II.',
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Soul Sigil')],
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
    stonePowerId: 'might.armorReduction',
    level: 1,
    name: 'Stormpower',
  },
  baseValues: [
    { slot: 'a', label: 'Weapon Damage', note: '3d8 to 12d8 across levels (2d8 one-handed base + 1d8/level).' },
    { slot: 'b', label: 'Thrown Return', note: 'Thrown 9\u201315 m, Returning, from L4.' },
  ],
  // Compatibility catalogue:
  //   L1 Stormpower → Might Armor Reduction Support
  //   L2 Frost Throw → Ranged Instant Special: Slow (thrown Axe; no damage)
  //   L3 Ivaldi's Anvil → Melee AoE Attack (weapon + printed Power Dice)
  //   L10 Artifact Awakening
  progressionPickSpecs: {
    2: {
      templateId: 'active-ranged-instant-special-t4',
      special: 'slow',
      name: 'Frost Throw',
      stageEffectTexts: [
        'Use **Ranged Single Target Special: Slow (PL 4)** with the thrown/returning Axe; on hit apply **Slow(6)**, no damage. The Axe returns after the attack resolves.',
        'Use **Ranged Single Target Special: Slow (PL 10)** with the thrown/returning Axe; on hit apply **Slow(10)**, no damage. The Axe returns after the attack resolves. This replaces Frost Throw I.',
        'Use **Ranged Single Target Special: Slow (PL 16)** with the thrown/returning Axe; on hit apply **Slow(13)**, no damage. The Axe returns after the attack resolves. This replaces Frost Throw II.',
      ],
    },
    3: {
      templateId: 'active-melee-weapon-aoe',
      name: "Ivaldi's Anvil",
      stageEffectTexts: [
        "Make one melee AoE attack with the Axe. Each creature hit takes the Axe's Weapon Damage + **4d8** bonus damage.",
        "Make one melee AoE attack with the Axe. Each creature hit takes the Axe's Weapon Damage + **7d8** bonus damage. This replaces Ivaldi's Anvil I; it does not grant an additional use.",
        "Make one melee AoE attack with the Axe. Each creature hit takes the Axe's Weapon Damage + **13d8** bonus damage. This replaces Ivaldi's Anvil II; it does not grant an additional use.",
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Frostbound Returning Axe')],
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
    { slot: 'a', label: 'Hybrid Defense', note: '4\u20139 Armor and +4 to +13 Evade across levels.' },
  ],
  // Compatibility catalogue:
  //   L1 Shadow Shell → Temporary HP Support
  //   L2 Grave Call → Melee Push / Pull (Push-only profile)
  //   L3 Deathly Reprisal → Reaction: Counter Damage + Push
  //   L10 Artifact Awakening (Hands of the Grave Root AoE retired from this Artifact)
  progressionPickSpecs: {
    2: {
      templateId: 'active-melee-control-push-pull',
      name: 'Grave Call',
      stageEffectTexts: [
        'Make the normal **Melee Push / Pull** melee Attack Roll; on hit **Push 8 m** with no damage or Prone.',
        'Make the normal **Melee Push / Pull** melee Attack Roll; on hit **Push 20 m** with no damage or Prone. This replaces Grave Call I.',
        'Make the normal **Melee Push / Pull** melee Attack Roll; on hit **Push 32 m** with no damage or Prone. This replaces Grave Call II.',
      ],
    },
    3: {
      templateId: 'reaction-counter-damage-push',
      name: 'Deathly Reprisal',
      stageEffectTexts: [
        'When a creature hits you with a melee attack, deal **2d8 damage** to the triggering creature and push it **4 m**.',
        'When a creature hits you with a melee attack, deal **6d8 damage** to the triggering creature and push it **8 m**. This replaces Deathly Reprisal I.',
        'When a creature hits you with a melee attack, deal **12d8 damage** to the triggering creature and push it **8 m**. This replaces Deathly Reprisal II.',
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Shadowgrave Armor')],
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
  // Compatibility catalogue (Spell delivery; Resolve or Influence):
  //   L1 Might of the Dark → Ranged Instant Special: Hex
  //   L2 Life Taken → Ranged Single Target Damage Transfer
  //   L3 Vision of the End → Ranged Instant Special: Soulburn
  //   L10 Artifact Awakening
  progressionPickSpecs: {
    1: {
      templateId: 'active-ranged-instant-special-t5',
      special: 'hex',
      name: 'Might of the Dark',
      isSpell: true,
      castingAttribute: 'resolve',
      stageEffectTexts: [
        'Make a standard Spell Casting Roll against one target; on success apply **Hex(5)**, **no damage**.',
        'Make a standard Spell Casting Roll against one target; on success apply **Hex(8)**, **no damage**. This replaces Might of the Dark I.',
        'Make a standard Spell Casting Roll against one target; on success apply **Hex(11)**, **no damage**. This replaces Might of the Dark II.',
      ],
    },
    2: {
      templateId: 'active-ranged-single-target-damage-transfer',
      name: 'Life Taken',
      isSpell: true,
      castingAttribute: 'resolve',
    },
    3: {
      templateId: 'active-ranged-instant-special-t6',
      special: 'soulburn',
      name: 'Vision of the End',
      isSpell: true,
      castingAttribute: 'resolve',
      stageEffectTexts: [
        'Make a standard Spell Casting Roll against one target; on success apply **Soulburn(2)**, **no damage**.',
        'Make a standard Spell Casting Roll against one target; on success apply **Soulburn(3)**, **no damage**. This replaces Vision of the End I.',
        'Make a standard Spell Casting Roll against one target; on success apply **Soulburn(4)**, **no damage**. This replaces Vision of the End II.',
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Staff of the Dark')],
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
    { slot: 'a', label: 'Shield Value', note: '+4 to +8 Armor across levels; drawback -2d8 Physical Skill Checks.' },
  ],
  // Compatibility catalogue:
  //   L1 Force Reversal → Reaction: Counter Damage + Push
  //   L2 Crystalized → Ranged AoE Special: Root (Spell)
  //   L3 Crystal Rain → Ranged AoE Attack (Spell)
  //   L10 Artifact Awakening
  progressionPickSpecs: {
    1: {
      templateId: 'reaction-counter-damage-push',
      name: 'Force Reversal',
      stageEffectTexts: [
        'When a creature within range hits you with an attack, deal **2d8 damage** to the triggering creature and push it **4 m**.',
        'When a creature within range hits you with an attack, deal **6d8 damage** to the triggering creature and push it **8 m**. This replaces Force Reversal I.',
        'When a creature within range hits you with an attack, deal **12d8 damage** to the triggering creature and push it **8 m**. This replaces Force Reversal II.',
      ],
    },
    2: {
      templateId: 'active-ranged-aoe-damage-t5',
      special: 'root',
      name: 'Crystalized',
      isSpell: true,
      castingAttribute: 'intellect',
      spellResolution: 'spellAttack',
      stageEffectTexts: [
        'Use **Ranged AoE Special: Root (PL 4)** with Spell delivery. Apply **Root(3)** to hit creatures; no damage.',
        'Use **Ranged AoE Special: Root (PL 10)** with Spell delivery. Apply **Root(5)** to hit creatures; no damage. This replaces Crystalized I.',
        'Use **Ranged AoE Special: Root (PL 16)** with Spell delivery. Apply **Root(7)** to hit creatures; no damage. This replaces Crystalized II.',
      ],
    },
    3: {
      templateId: 'active-ranged-weapon-aoe',
      name: 'Crystal Rain',
      isSpell: true,
      castingAttribute: 'intellect',
      spellResolution: 'spellAttack',
      stageEffectTexts: [
        'Use **Ranged AoE Attack (PL 4)** with Spell delivery. Each creature hit takes **+3d8 printed Power Damage** (no Weapon Damage; add Spell Focus only if a legal Focus is available).',
        'Use **Ranged AoE Attack (PL 10)** with Spell delivery. Each creature hit takes **+4d8 printed Power Damage** (no Weapon Damage; add Spell Focus only if a legal Focus is available). This replaces Crystal Rain I.',
        'Use **Ranged AoE Attack (PL 16)** with Spell delivery. Each creature hit takes **+8d8 printed Power Damage** (no Weapon Damage; add Spell Focus only if a legal Focus is available). This replaces Crystal Rain II.',
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Starfallen Forceshield')],
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
  levelProgression: [artifactAwakeningRow('Lantern of the Hollow Star')],
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
  // SOURCE MISSING (Batch 9F / 9G.4): no complete L1–9 table in Canonical PH,
  // Actives, Active_Buffs, or the 2026-11-04 Compatibility Catalogue. L1–9 keep
  // the existing catalogue-template wiring for owned actors; L10 is Core
  // universal Artifact Awakening. newGrantHold skips fresh world-library seeds only.
  newGrantHold: true,
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.armorReduction',
    level: 3,
    name: 'Might Ignore Armor Support',
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
  progressionPickSpecs: {
    1: { delivery: 'melee-single', special: 'challenge', name: 'Giant Shock Strike' },
    2: { templateId: 'reaction-armor', name: 'Ancestral Guard' },
  },
  levelProgression: [artifactAwakeningRow("Lor-Keth's Staff")],
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
  // Compatibility + Core clarification (Batch 9G.3):
  //   L1 Frozen Reserve → Temporary HP Support
  //   L2 Glacial Intercept → Reaction: Ally Armor
  //   L3 Frostwave → Melee AoE Special: Slow PL 4 / 8 / 16 (special-only; no extra Slow)
  //   L10 Artifact Awakening (retired bespoke Ultimate Temp-HP rider not carried)
  progressionPickSpecs: {
    2: { templateId: 'reaction-ally-armor', name: 'Glacial Intercept' },
    3: {
      delivery: 'melee-aoe',
      special: 'slow',
      name: 'Frostwave',
      // PL 8 (not 10) so catalogue Melee AoE Special: Slow prints Slow(7) / Radius 5 m.
      stagePowerLevels: ['4', '8', '16'],
      stageEffectTexts: [
        'Use **Melee AoE Special: Slow (PL 4)**. Make one self-centered AoE Attack Roll and compare it separately against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Slow(5)** (Radius 3 m); **no direct Power, Weapon, or Spell Focus Damage**.',
        'Use **Melee AoE Special: Slow (PL 8)**. Make one self-centered AoE Attack Roll and compare it separately against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Slow(7)** (Radius 5 m); **no direct Power, Weapon, or Spell Focus Damage**. This replaces Frostwave I.',
        'Use **Melee AoE Special: Slow (PL 16)**. Make one self-centered AoE Attack Roll and compare it separately against the Evade of each creature in the area; individual defenses and Dive for Cover apply. Each creature hit gains **Slow(10)** (Radius 7 m); **no direct Power, Weapon, or Spell Focus Damage**. This replaces Frostwave II.',
      ],
    },
  },
  levelProgression: [artifactAwakeningRow('Heart of Winter')],
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
  // Killing Focus pre-fills Crit Rank 2 / 3 / 4 (default level schedule).
  // The pre-filled Rank costs no Stones; lower Ranks are paid normally.
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
      note: 'Precision(2) from L4, Precision(3) from L7, Precision(4) at L10 — added to crossbow Precision(4).',
    },
  ],
  // Compatibility catalogue:
  //   L1 Divided Execution → Ranged Split Attack
  //   L2 Killing Focus → Agility Crit Support
  //   L3 Armorbreaker → Active Buff: Damage + Penetration
  //   L10 Artifact Awakening
  progressionPickSpecs: {
    1: { templateId: 'active-ranged-weapon-split', name: 'Divided Execution' },
    3: { templateId: 'ab-damage-penetration', name: 'Armorbreaker' },
  },
  levelProgression: [artifactAwakeningRow('Heartseeker')],
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
  // Compatibility catalogue:
  //   L1 Falcon Initiative → Wits Initiative Boost Support
  //   L2 Falcon Step → Reaction: Reposition
  //   L3 Falcon Momentum → Reaction: Initiative Gain
  //   L10 Artifact Awakening (Base Values continue normally; no bespoke Ultimate)
  progressionPickSpecs: {
    2: { templateId: 'reaction-reposition', name: 'Falcon Step' },
    3: { templateId: 'reaction-initiative-gain', name: 'Falcon Momentum' },
  },
  levelProgression: [artifactAwakeningRow('Falcon Wide Brim')],
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
