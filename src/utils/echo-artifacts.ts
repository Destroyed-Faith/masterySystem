/**
 * Echo Artifact Catalog
 *
 * Per the Player's Guide (Echo Artifacts chapter), each Echo has zero or
 * more Echo-bound Artifacts that must be selected at character creation:
 *
 *   • Human:      0 required, 0 maximum.
 *   • Halfling:   0 required, 1 maximum.   (Ringchain of Kept Names — Amulet)
 *   • Dwarf:      1 required, 1 maximum.   (Stonebound Soles — Feet)
 *   • Elorian:    1 required, 1 maximum.   (Elorian Stride — Feet)
 *   • Sentinel:   1 required, 1 maximum.   (One frame per Order)
 *   • Titanborn:  1 required, 1 maximum.   (Titan Scars — Body)
 *   • Dragonborn: 1 required, 3 maximum.   (Dragon Claws, Dragon Head, and one
 *                  of Wyrm Scales / Serpent Scales — the two body armors are
 *                  mutually exclusive.)
 *   • Unbound:    1 required, 1 maximum.   (one identity artifact)
 *
 * Each entry below describes:
 *   • `key`           — stable id used by flags / picker lookups.
 *   • `name`          — display name.
 *   • `slot`          — canonical Equipment Slot.
 *   • `baseProfile`   — physical Base Profile per the new spec.
 *   • `baseValues`    — Base Value description (informational; UI shows them).
 *   • `binding`       — always `'echo'` for echo-bound artifacts.
 *   • `description`   — one-line flavor.
 *   • `requiresSubChoice` — when present, the player must have picked this
 *                            Echo sub-choice (e.g. Sentinel order, Elf lineage)
 *                            before this artifact is selectable.
 *   • `levelProgression` — the spec's 1..10 level table.
 *
 * The catalog is pure data; it is consumed by `character-sheet-echo-dialog.ts`
 * during creation, and by `artifact-actor-rules.ts` for echo-bound checks.
 */

import type {
  ArtifactBaseProfileKey,
  ArtifactSlotKey,
  ArtifactLevelProgressionRow,
  ArtifactStoneFunctionKind,
  CastingAttribute,
  PowerLevelKey,
  SpellResolution,
} from '../types/item.js';
import { resolvePickFromUi, tierFromSpecialKey, type MartialDelivery } from './artifact-power-pick.js';
import { catalogSpecialTierForTemplate } from './artifact-catalog-pick.js';
import {
  UNBOUND_ECHO_ARTIFACTS,
  UNBOUND_ECHO_ARTIFACT_KEYS,
  UNBOUND_PREDATOR_CROWN_KEYS,
  UNBOUND_BEAST_BODY_EXCLUSIVE_KEYS,
} from './echo-artifacts-unbound.js';

/** Universal Artifact Level 10 effect text (Core / Titan Scars / Hollow Crown). */
export const ARTIFACT_AWAKENING_EFFECT =
  "Use the universal Artifact Awakening rules for this Artifact's granted Powers, Stone support, and Stone resources. Permanent Passives remain unchanged.";

/** Level-10 Artifact Awakening row — no bespoke True … Ultimate. */
export function artifactAwakeningRow(artifactName: string): ArtifactLevelProgressionRow {
  return {
    level: 10,
    name: 'Artifact Awakening',
    type: 'Artifact Function',
    range: 'Self',
    duration: 'Special',
    effect: ARTIFACT_AWAKENING_EFFECT,
    special: `Artifact Level 10: Awakening (${artifactName})`,
  };
}

/**
 * Authoring shorthand for an Echo Artifact's single canonical Stone Function.
 * The generator copies this onto `system.stoneFunction` (so the actor-side
 * aggregator applies it) and emits a matching `progressionPicks` entry at
 * `level` (so the Node Editor's editable picks reflect it). Any of the 7
 * Attributes may be authored — the old per-slot attribute restriction
 * (`ATTRIBUTE_ACCESS_BY_SLOT`) was dropped; every slot accepts every Attribute.
 */
export interface EchoArtifactStoneFunctionHint {
  kind: ArtifactStoneFunctionKind;
  /** Attribute pool (any of the 7 Attributes). */
  attribute: string;
  /** For Stone Power Support: the supported Stone Power id. */
  stonePowerId?: string;
  /** Basic level (1-3) that introduces the Stone Function. */
  level: 1 | 2 | 3;
  /** Optional flavor/display name for the generated rows (e.g. "Draconic Recovery"). */
  name?: string;
}

/**
 * Rich Level Progression pick authoring for an Echo Artifact. Lets a definition
 * map a Basic level (1-3) onto a real, editable catalog Power — either a
 * martial damage pick (delivery + Special, tier derived from the Special) or a
 * non-martial catalog template (e.g. `ab-armor-aura`) — with an optional flavor
 * name (e.g. "Breath Weapon"). The underlying mechanics stay editable in the
 * Node Editor; only the displayed name is overridden.
 */
export interface EchoArtifactProgressionPickSpec {
  /** Flavor/display name for the generated rows (e.g. "Breath Weapon"). */
  name?: string;
  /** Non-martial catalog power template id (e.g. 'ab-armor-aura'). */
  templateId?: string;
  /** Martial damage delivery form (mutually exclusive with `templateId`). */
  delivery?: 'melee-single' | 'melee-aoe' | 'ranged-single' | 'ranged-aoe';
  /** Martial damage Special key — the damage tier is derived from it. */
  special?: string;
  /**
   * Stone Function for this slot (alternative to a catalog Power). Lets a
   * single artifact carry up to three independent Stone Functions — one per
   * Basic level — instead of the single `def.stoneFunction` shortcut. Used by
   * the Sentinel body frames, whose Stone Pool / Battery / Support lines live
   * on different slots. The actor-side aggregator reads every Stone Function
   * pick, so all of them apply mechanically.
   */
  stoneFunction?: {
    kind: ArtifactStoneFunctionKind;
    attribute: string;
    stonePowerId?: string;
    /** Artifact levels at which Support prefills Rank 2 / 3 / 4. Default 1 / 4 / 7. */
    supportStages?: [number, number, number];
  };
  /** Override staged catalog PL rows (default 4 / 10 / 16). */
  stagePowerLevels?: PowerLevelKey[];
  /** Override stage name suffixes (default I / II / III). */
  stageNumerals?: string[];
  /**
   * Per-stage catalog template ids (length 3). Each stage uses the matching
   * template at PL 4 / 10 / 16 instead of staging one `templateId` three times.
   */
  stageTemplateIds?: [string, string, string];
  /** Full row names per stage when `stageTemplateIds` is set (length 3). */
  stageNames?: [string, string, string];
  /**
   * Printed artifact-exclusive per-stage effect text (length 3). Overrides the
   * catalog template's effect column when the rulebook prints its own profile
   * (e.g. Wyrm Scales' +6/+12/+18 Armor buff).
   */
  stageEffectTexts?: [string, string, string];
  /** Cast this line as a Spell (Intellect / Resolve). */
  isSpell?: boolean;
  castingAttribute?: CastingAttribute;
  spellResolution?: SpellResolution;
}

export interface EchoArtifactBaseValueHint {
  /** Label as it appears in the Player's Guide (Base Value A / B / C). */
  slot: 'a' | 'b' | 'c';
  label: string;
  /** Short narrative effect note. */
  note: string;
}

export interface EchoArtifactDefinition {
  key: string;
  name: string;
  echoKey: string;
  slot: ArtifactSlotKey;
  baseProfile: ArtifactBaseProfileKey;
  description: string;
  /**
   * Optional gate. If present, the player must have selected this
   * Echo sub-choice (e.g. Sentinel order or Dragonborn lineage) at
   * Echo creation for the artifact to be selectable.
   */
  requiresSubChoice?: string;
  baseValues: EchoArtifactBaseValueHint[];
  levelProgression: ArtifactLevelProgressionRow[];
  /**
   * Optional alternative / combined portrait (stored on `system.imgAlt`).
   * When omitted, the tree builder still copies a catalog alt icon if one exists.
   */
  imgAlt?: string;
  /** Free-text restriction note (e.g. "occupies both hand slots"). */
  restriction?: string;
  /**
   * Optional canonical Stone Function (see `EchoArtifactStoneFunctionHint`).
   * Any Attribute is legal on any slot; some frames still omit this and keep
   * their stone supports purely as Level Progression abilities.
   */
  stoneFunction?: EchoArtifactStoneFunctionHint;
  /**
   * Catalog Power picks per Basic level (1-3). Each value is a catalog
   * `templateId` (see `ALL_POWER_TEMPLATES`). These are the picks-drive source:
   * the 1-10 Level Progression table is generated from them. A level claimed by
   * `stoneFunction` is filled by the Stone Function pick instead and should be
   * omitted here. Best-effort mappings of the rulebook lines to catalog Powers;
   * a GM can refine them in the Artifact Builder node editor.
   */
  progressionPickIds?: Partial<Record<1 | 2 | 3, string>>;
  /**
   * Rich per-level pick specs (martial delivery+Special or a non-martial
   * catalog template) with optional flavor names. Takes precedence over
   * `progressionPickIds` for any level it covers. Lets named artifact lines
   * (e.g. Dragon Head's Breath Weapon / Draconic Roar) be real, editable
   * catalog Powers instead of fixed text.
   */
  progressionPickSpecs?: Partial<Record<1 | 2 | 3, EchoArtifactProgressionPickSpec>>;
  /**
   * Extra Stone Functions that do not occupy a Basic 1/2/3 pick slot.
   * Used when a printed table has a fourth support line (e.g. Sentinel Frame
   * Ward at Artifact Level 5).
   */
  extraStoneFunctions?: Array<{
    level: number;
    name?: string;
    kind: ArtifactStoneFunctionKind;
    attribute: string;
    stonePowerId?: string;
    /** Artifact levels at which Support prefills T2 / T3 / T4. Default 1 / 4 / 7. */
    supportStages?: [number, number, number];
    /** Artifact levels at which Pool stores 2 / 4 / 8. Default 1 / 4 / 7. */
    poolStages?: [number, number, number];
  }>;
  /**
   * Optional natural/innate weapon for a non-weapon-slot artifact (e.g. Dragon
   * Head's Bite). When set, the tree builder attaches a scaling `artifactWeapon`
   * profile (damage pulled from the `weaponDamage` Base Value table) even though
   * the artifact's `artifactKind` is `gear`/`armor`, so the Bite is a usable
   * attack rather than a purely informational Base Value.
   */
  naturalWeapon?: {
    /** Attack label shown in the radial menu (e.g. "Bite"). Defaults to the item name. */
    name?: string;
    weaponType?: 'melee' | 'ranged';
    /** Hand slots occupied (a Bite occupies none → 0). */
    hands?: number;
    rangeM?: number;
    specials?: string[];
  };
  /**
   * When multiple Echo Artifact defs share the same `variantGroupKey`, the Echo
   * creation dialog renders a comparison table (see `variantRow`).
   */
  variantGroupKey?: string;
  /** One row in the Echo creation variant comparison table. */
  variantRow?: {
    armorClass: string;
    focus: string;
    flightL1: string;
    activeBuffL2: string;
    stonePowerL3: string;
  };
}

// ----------------------------------------------------------------------
// Stonebound Soles (Dwarf)
// ----------------------------------------------------------------------

const STONEBOUND_SOLES: EchoArtifactDefinition = {
  key: 'stoneboundSoles',
  name: 'Stonebound Soles',
  echoKey: 'dwarfs',
  slot: 'feet',
  baseProfile: 'feet',
  description:
    'Ancestral weight, deep-road memory, and the old bond between dwarven bodies and stone.',
  restriction:
    'A dwarf with Stonebound Soles cannot wear another Feet Artifact, magical boots, hooves, talons, or similar Feet-based Artifact.',
  progressionPickSpecs: {
    1: { name: 'Anchoring Stance', templateId: 'ab-immovable-temp-hp' },
    2: { name: 'Stone-Sure Step', templateId: 'movement-safe-movement' },
    3: { name: 'Stoneweave Guard', templateId: 'empower-buff-armor' },
  },
  baseValues: [
    { slot: 'a', label: 'Armor (Feet)', note: '+1 Armor at Level 1 up to +5 Armor at Levels 9–10.' },
    { slot: 'b', label: 'Tunneling', note: '+1 m Tunneling at Levels 4–5 up to +4 m at Level 10 (not Burrow).' },
    { slot: 'c', label: 'Tremor Sense (Sense Option)', note: 'Slot instead of Normal Combat Awareness; 20 m, shared solid surface. Does not scale.' },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Anchoring Stance I',
      type: 'Active Buff',
      range: 'Self',
      duration: '2 Rounds',
      effect: 'You become Immovable and gain 40 Temporary HP.',
      special: 'Immovable + Temporary HP',
    },
    {
      level: 2,
      name: 'Stone-Sure Step I',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Move up to 8 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
      special: 'Safe Movement',
    },
    {
      level: 3,
      name: 'Stoneweave Guard I',
      type: 'Support',
      range: 'Self',
      duration: 'Special',
      effect:
        "When you activate an Active Buff that grants Armor, you may increase that Buff's effective Power Level by +1 and its duration by +1 round (cannot exceed PL 16). Uses per Safe Haven Rest: half MR, rounded up.",
      special: 'Armor Empowerment',
    },
    {
      level: 4,
      name: 'Anchoring Stance II',
      type: 'Active Buff',
      range: 'Self',
      duration: '2 Rounds',
      effect: 'You become Immovable and gain 220 Temporary HP.',
      special: 'Immovable + Temporary HP',
    },
    {
      level: 5,
      name: 'Stone-Sure Step II',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Move up to 14 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
      special: 'Safe Movement',
    },
    {
      level: 6,
      name: 'Stoneweave Guard II',
      type: 'Support',
      range: 'Self',
      duration: 'Special',
      effect:
        'When you activate an Active Buff that grants Armor, you may increase its Power Level by +2 and duration by +2 rounds (cannot exceed PL 16).',
      special: 'Armor Empowerment',
    },
    {
      level: 7,
      name: 'Anchoring Stance III',
      type: 'Active Buff',
      range: 'Self',
      duration: '2 Rounds',
      effect: 'You become Immovable and gain 400 Temporary HP.',
      special: 'Immovable + Temporary HP',
    },
    {
      level: 8,
      name: 'Stone-Sure Step III',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'Move up to 20 m along a legal ground path. This movement does not provoke movement-triggered Reactions.',
      special: 'Safe Movement',
    },
    {
      level: 9,
      name: 'Stoneweave Guard III',
      type: 'Support',
      range: 'Self',
      duration: 'Special',
      effect:
        'When you activate an Active Buff that grants Armor, you may increase its Power Level by +3 and duration by +3 rounds (cannot exceed PL 16).',
      special: 'Armor Empowerment',
    },
    artifactAwakeningRow('Stonebound Soles'),
  ],
};

// ----------------------------------------------------------------------
// Elorian Stride (Elorian)
// ----------------------------------------------------------------------

const ELORIAN_STRIDE: EchoArtifactDefinition = {
  key: 'elorianStride',
  name: 'Elorian Stride',
  echoKey: 'elorians',
  slot: 'feet',
  baseProfile: 'feet',
  description:
    'Elorian Stride is an Elorian Echo Artifact representing otherworldly balance, reflex, clinging movement and focus in combat.',
  restriction:
    'An Elorian with Elorian Stride cannot wear another Feet Artifact, magical boots, hooves, talons, or similar Feet-based Artifact. Elorian Stride is Echo-bound and cannot normally be removed, replaced, sold, stolen, or unbound.',
  progressionPickSpecs: {
    // Players' Guide: Reaction: Evade at PL 2 / 4 / 6 → +2 / +4 / +6 Evade.
    1: {
      templateId: 'reaction-evade',
      name: 'Otherworld Reflex',
      stagePowerLevels: ['2', '4', '6'],
    },
    2: { templateId: 'movement-wall-walk', name: 'Elorian Cling' },
    // Slot 3 — Crit Support (Agility Ability: Crit). Catalog stone function,
    // editable in the Node Editor — not authored "Elorian Focus" rows.
    // Prefills Rank 2 / 3 / 4 at Artifact Levels 3 / 6 / 9.
    3: {
      name: 'Crit Support',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'agility',
        stonePowerId: 'agility.crit',
        supportStages: [3, 6, 9],
      },
    },
  },
  baseValues: [
    { slot: 'a', label: 'Evade', note: '+1 to +5 Evade across levels (paired bands L1–2 / L3–4 / …); Level 10 grants Artifact Awakening.' },
    { slot: 'b', label: 'Movement', note: '+1 to +4 m Movement from Level 4 onward.' },
  ],
  levelProgression: [
    artifactAwakeningRow('Elorian Stride'),
  ],
};

// ----------------------------------------------------------------------
// Titan Scars (Titanborn)
// ----------------------------------------------------------------------

const TITAN_SCARS: EchoArtifactDefinition = {
  key: 'titanScars',
  name: 'Titan Scars',
  echoKey: 'titanborn',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description:
    'Ancient scars, stone-like tissue, Titan blood, and broken divine bindings grown into the body.',
  restriction:
    'A Titanborn with Titan Scars cannot wear mundane armor or bind another Body Artifact. Titan Scars are Echo-bound and cannot normally be removed, replaced, sold, stolen, unequipped, or unbound.',
  // Slot 1 is authored Transformation Growth (not ab-growth-form Active Buff).
  // Slots 2–3 are Stone Power Support (Might Damage / Remove Scar).
  progressionPickSpecs: {
    2: {
      name: 'Titan Might',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'might',
        stonePowerId: 'might.meleeDamage',
        supportStages: [2, 5, 8],
      },
    },
    3: {
      name: 'Titan Healing',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'vitality',
        stonePowerId: 'vitality.removeScar',
        supportStages: [3, 6, 9],
      },
    },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Medium Armor',
      note: '+12 to +22 Armor; counts as Medium Armor (Evade −2, Initiative −4, −1d8 Physical).',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Titan Growth I',
      type: 'Transformation',
      range: 'Self',
      aoe: '7 occupied Hexes',
      duration: 'Unlimited',
      effect:
        'You may assume **Growth 1** using the universal Transformation rules. Grants one additional 0-penalty Growth Health Bar and +2 m Melee Reach; reduces Push/Pull by **1 × MR m**. Uses: Mastery Rank times per Safe Haven Rest.',
      special: 'Artifact Function: Transformation (Growth 1)',
    },
    {
      level: 2,
      name: 'Titan Might I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill **Rank 2** of Might Ability: Damage. Rank 1 must still be paid.',
      special: 'Might Ability: Damage (Stone Power Support, Rank 2)',
    },
    {
      level: 3,
      name: 'Titan Healing I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill **Rank 2** of Remove Scar. Rank 1 must still be paid.',
      special: 'Vitality Ability: Remove Scar (Stone Power Support, Rank 2)',
    },
    {
      level: 4,
      name: 'Titan Growth II',
      type: 'Transformation',
      range: 'Self',
      aoe: '19 occupied Hexes',
      duration: 'Unlimited',
      effect:
        'You may assume **Growth 2**. Grants two 0-penalty Growth Health Bars and +4 m Melee Reach; reduces Push/Pull by **2 × MR m**. Physical Ranged and Spell Range are doubled once. Replaces Growth I.',
      special: 'Artifact Function: Transformation (Growth 2)',
    },
    {
      level: 5,
      name: 'Titan Might II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill **Rank 3**. Ranks 1 and 2 must still be paid.',
      special: 'Might Ability: Damage (Stone Power Support, Rank 3)',
    },
    {
      level: 6,
      name: 'Titan Healing II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill **Rank 3** of Remove Scar. Ranks 1 and 2 must still be paid.',
      special: 'Vitality Ability: Remove Scar (Stone Power Support, Rank 3)',
    },
    {
      level: 7,
      name: 'Titan Growth III',
      type: 'Transformation',
      range: 'Self',
      aoe: '37 occupied Hexes',
      duration: 'Unlimited',
      effect:
        'You may assume **Growth 3**. Grants three 0-penalty Growth Health Bars and +6 m Melee Reach; reduces Push/Pull by **3 × MR m**. Physical Ranged and Spell Range remain doubled once. Replaces Growth II.',
      special: 'Artifact Function: Transformation (Growth 3)',
    },
    {
      level: 8,
      name: 'Titan Might III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill **Rank 4**. Ranks 1, 2, and 3 must still be paid.',
      special: 'Might Ability: Damage (Stone Power Support, Rank 4)',
    },
    {
      level: 9,
      name: 'Titan Healing III',
      type: 'Stone Power Support',
      range: 'Self / Touch',
      duration: 'Instant',
      effect:
        'Pre-fill **Rank 4** of Remove Scar. Ranks 1, 2, and 3 must still be paid. Remove Scar may also be used on one willing creature you touch.',
      special: 'Vitality Ability: Remove Scar (Stone Power Support, Rank 4)',
    },
    artifactAwakeningRow('Titan Scars'),
  ],
};

// ----------------------------------------------------------------------
// Wyrm Scales variants (Dragonborn — pick one body armor line)
// ----------------------------------------------------------------------

export const WYRM_SCALES_VARIANT_GROUP = 'wyrmScales';

/** Legacy compendium / character keys → current variant keys. */
export const ECHO_ARTIFACT_KEY_ALIASES: Record<string, string> = {
  wyrmScales: 'wyrmScalesHeavy',
  wyrmScalesMedium: 'wyrmScalesHeavy',
  serpentScales: 'wyrmScalesLight',
  titanScarsMight: 'titanScars',
  titanScarsAgility: 'titanScars',
  titanScarsVitality: 'titanScars',
  titanScarsIntellect: 'titanScars',
  titanScarsResolve: 'titanScars',
  titanScarsInfluence: 'titanScars',
  titanScarsWits: 'titanScars',
  elvenStride: 'elorianStride',
  elvenStrideFire: 'elorianStride',
  elvenStrideEarth: 'elorianStride',
  elvenStrideWater: 'elorianStride',
  elvenStrideAir: 'elorianStride',
};

const WYRM_BODY_RESTRICTION =
  'A Dragonborn with Wyrm Scales cannot wear mundane armor or another Body Artifact.';

const WYRM_SCALES_HEAVY: EchoArtifactDefinition = {
  key: 'wyrmScalesHeavy',
  name: 'Wyrm Scales (Heavy)',
  echoKey: 'dragonborn',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'The heaviest Dragonborn scale-form — maximum armor, heavy class drawbacks.',
  restriction: WYRM_BODY_RESTRICTION,
  variantGroupKey: WYRM_SCALES_VARIANT_GROUP,
  variantRow: {
    armorClass: 'Heavy',
    focus: 'Armor',
    flightL1: 'Dragon Wings (Flight)',
    activeBuffL2: 'Active Buff: Armor (Wyrm Scales)',
    stonePowerL3: 'Might — ARMOR Stone Power',
  },
  // L1 Dragon Wings → movement-flight; L2 Wyrm Scales → ab-armor;
  // L3 Armor Stone Support → might.armor (the ARMOR stone power lives in the
  // Might pool; the old vitality.armor was removed when Vitality was aligned
  // with the rules table: TempHP / Damage Negation / Remove Scar / Extend Active Buff).
  progressionPickSpecs: {
    1: { name: 'Dragon Wings', templateId: 'movement-flight' },
    2: {
      name: 'Wyrm Scales',
      templateId: 'ab-armor',
      // Standard Active Buff: Armor PL 4 / 10 / 16 (+2 Armor / PL → +8 / +20 / +32).
      stagePowerLevels: ['4', '10', '16'],
      stageEffectTexts: [
        'Gain **+8 Armor**.',
        'Gain **+20 Armor**. This replaces Wyrm Scales I.',
        'Gain **+32 Armor**. This replaces Wyrm Scales II.',
      ],
    },
    3: {
      name: 'Armor Stone Support',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'might',
        stonePowerId: 'might.armor',
      },
    },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Heavy Echo Armor',
      note: 'Heavy Armor +16 (L1) … +25 (L10). Drawbacks −2/−4/−6 Evade & Initiative; −2d8 Physical Skills.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Dragon Wings I',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 6 m.',
      special: 'Flight',
    },
    {
      level: 2,
      name: 'Wyrm Scales I',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Use standard Active Buff: Armor (PL 4): gain +8 Armor for Mastery Rank Rounds.',
      special: 'Armor',
    },
    {
      level: 3,
      name: 'Armor Stone Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Wyrm Scales support the Vitality Ability ARMOR Stone Power and pre-fill Rank 2. Rank 1 must still be paid normally.',
      special: 'ARMOR Stone Power',
    },
    {
      level: 4,
      name: 'Dragon Wings II',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 15 m.',
      special: 'Flight',
    },
    {
      level: 5,
      name: 'Wyrm Scales II',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Use standard Active Buff: Armor (PL 10): gain +20 Armor for Mastery Rank Rounds. This replaces Wyrm Scales I.',
      special: 'Armor',
    },
    {
      level: 6,
      name: 'Armor Stone Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Wyrm Scales pre-fill Rank 3 of the Vitality Ability ARMOR Stone Power. Ranks 1 and 2 must still be paid normally.',
      special: 'ARMOR Stone Power',
    },
    {
      level: 7,
      name: 'Dragon Wings III',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 24 m.',
      special: 'Flight',
    },
    {
      level: 8,
      name: 'Wyrm Scales III',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Use standard Active Buff: Armor (PL 16): gain +32 Armor for Mastery Rank Rounds. This replaces Wyrm Scales II.',
      special: 'Armor',
    },
    {
      level: 9,
      name: 'Armor Stone Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Wyrm Scales pre-fill Rank 4 of the Vitality Ability ARMOR Stone Power. Ranks 1, 2, and 3 must still be paid normally.',
      special: 'ARMOR Stone Power',
    },
    artifactAwakeningRow('Wyrm Scales'),
  ],
};

const WYRM_SCALES_LIGHT: EchoArtifactDefinition = {
  key: 'wyrmScalesLight',
  name: 'Serpent Scales',
  echoKey: 'dragonborn',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'Light serpent scale-form — evasion, mobility, and aerial grace over raw soak.',
  restriction: WYRM_BODY_RESTRICTION,
  variantGroupKey: WYRM_SCALES_VARIANT_GROUP,
  variantRow: {
    armorClass: 'Light',
    focus: 'Evade',
    flightL1: 'Dragon Wings (Flight)',
    activeBuffL2: 'Active Buff: Evade (Serpent Evasion)',
    stonePowerL3: 'Agility — EVADE Stone Power',
  },
  // L1 Dragon Wings → movement-flight; L2 Serpent Evasion (ab-evade) +
  // Mobility Extension (extend-buff-mobility) at L5/L8; L3 → agility.evade.
  progressionPickSpecs: {
    1: { name: 'Dragon Wings', templateId: 'movement-flight' },
    2: {
      name: 'Serpent Evasion',
      templateId: 'ab-evade',
      // Stage I only uses ab-evade; guide prints +6 Evade → AB Evade PL 3.
      stagePowerLevels: ['3', '10', '16'],
      stageTemplateIds: ['ab-evade', 'extend-buff-mobility', 'extend-buff-mobility'],
      stageNames: ['Serpent Evasion I', 'Mobility Extension II', 'Mobility Extension III'],
    },
    3: {
      name: 'Evasion Stone Support',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'agility',
        stonePowerId: 'agility.evade',
      },
    },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Light Echo Armor',
      note: 'Light Armor base + artifact bonus; no armor-class drawbacks.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Dragon Wings I',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 6 m.',
      special: 'Flight',
    },
    {
      level: 2,
      name: 'Serpent Evasion I',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Gain +6 Evade.',
      special: 'Evade',
      powerTemplateId: 'ab-evade',
    },
    {
      level: 3,
      name: 'Evasion Stone Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Serpent Scales support the Agility Ability EVADE Stone Power and pre-fill Rank 2. Rank 1 must still be paid normally.',
      special: 'EVADE Stone Power',
    },
    {
      level: 4,
      name: 'Dragon Wings II',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 15 m.',
      special: 'Flight',
    },
    {
      level: 5,
      name: 'Mobility Extension II',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect:
        "Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by +2 rounds. This does not increase the Buff's value. This does not allow you to maintain a second Active Buff.",
      special: 'Mobility Extension',
      powerTemplateId: 'extend-buff-mobility',
    },
    {
      level: 6,
      name: 'Evasion Stone Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Serpent Scales pre-fill Rank 3 of the Agility Ability EVADE Stone Power. Ranks 1 and 2 must still be paid normally.',
      special: 'EVADE Stone Power',
    },
    {
      level: 7,
      name: 'Dragon Wings III',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 24 m.',
      special: 'Flight',
    },
    {
      level: 8,
      name: 'Mobility Extension III',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect:
        "Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by +3 rounds. This does not increase the Buff's value. This does not allow you to maintain a second Active Buff.",
      special: 'Mobility Extension',
      powerTemplateId: 'extend-buff-mobility',
    },
    {
      level: 9,
      name: 'Evasion Stone Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Serpent Scales pre-fill Rank 4 of the Agility Ability EVADE Stone Power. Ranks 1, 2, and 3 must still be paid normally.',
      special: 'EVADE Stone Power',
    },
    artifactAwakeningRow('Serpent Scales'),
  ],
};

// ----------------------------------------------------------------------
// Dragon Claws (Dragonborn — two-handed natural weapon)
// ----------------------------------------------------------------------

const DRAGON_CLAWS: EchoArtifactDefinition = {
  key: 'dragonClaws',
  name: 'Dragon Claws',
  echoKey: 'dragonborn',
  slot: 'bothHands',
  baseProfile: 'twoHandedWeapon',
  description: 'Both hands become natural weapons: claws, scales, and tail.',
  restriction:
    'A Dragonborn with Dragon Claws cannot wield another weapon, shield, or hand-based Artifact while using them. Occupies both hand slots.',
  // Stone Power Support targets an Attribute's Stone Power. The generic Extra
  // Attack power is not attribute-bound, so it cannot be a support target;
  // Dragon Claws instead support the Might: Martial Damage Stone Power.
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.meleeDamage',
    level: 1,
    name: 'Extra Damage Support',
  },
  // Rending Spiral is the canonical Melee AoE Attack + Lacerate (PL 4 / 10 / 16):
  // current Claw / Tail Weapon Damage only, plus Lacerate(5 / 7 / 10). No bonus
  // power dice. Tail Sweep stays the artifact-exclusive weapon AoE + Push.
  progressionPickSpecs: {
    2: { name: 'Rending Spiral', templateId: 'active-melee-aoe-damage-t4', special: 'lacerate' },
    3: { name: 'Tail Sweep', templateId: 'active-melee-weapon-aoe', special: 'push' },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Claw / Tail Damage',
      note: '4d8 at Level 1 up to 16d8 at Level 10 (printed per-level table).',
    },
    {
      slot: 'b',
      label: 'Weapon Special',
      note: 'Penetration(2) at L4 up to Penetration(5) at L9–10.',
    },
    {
      slot: 'c',
      label: 'Weapon Special',
      note: 'Brutal Impact(4) at L7–8, Brutal Impact(5) at L9–10.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Extra Damage Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Dragon Claws support the Might Ability Martial Damage Stone Power. They pre-fill Rank 2. Rank 1 must still be paid normally.',
      special: '',
    },
    {
      level: 2,
      name: 'Rending Spiral I',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Affected creatures take your current Claw / Tail Weapon Damage.',
      special: 'Lacerate(5)',
    },
    {
      level: 3,
      name: 'Tail Sweep I',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 3 m',
      duration: 'Instant',
      effect: 'Affected creatures take Claw / Tail Damage and are pushed 2 m.',
      special: 'Push',
    },
    {
      level: 4,
      name: 'Extra Damage Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Dragon Claws support the Might Ability Martial Damage Stone Power. They pre-fill Rank 3. Ranks 1 and 2 must still be paid normally.',
      special: '',
    },
    {
      level: 5,
      name: 'Rending Spiral II',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 6 m',
      duration: 'Instant',
      effect: 'Affected creatures take Claw / Tail Damage.',
      special: 'Lacerate(7)',
    },
    {
      level: 6,
      name: 'Tail Sweep II',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 5 m',
      duration: 'Instant',
      effect: 'Affected creatures take Claw / Tail Damage and are pushed 6 m.',
      special: 'Push',
    },
    {
      level: 7,
      name: 'Extra Damage Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Dragon Claws support the Might Ability Martial Damage Stone Power. They pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally.',
      special: '',
    },
    {
      level: 8,
      name: 'Rending Spiral III',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 7 m',
      duration: 'Instant',
      effect: 'Affected creatures take Claw / Tail Damage.',
      special: 'Lacerate(10)',
    },
    {
      level: 9,
      name: 'Tail Sweep III',
      type: 'Active',
      range: 'Self',
      aoe: 'Radius 7 m',
      duration: 'Instant',
      effect: 'Affected creatures take Claw / Tail Damage and are pushed 10 m.',
      special: 'Push',
    },
    artifactAwakeningRow('Dragon Claws'),
  ],
};

// ----------------------------------------------------------------------
// Dragon Head (Dragonborn)
// ----------------------------------------------------------------------

const DRAGON_HEAD: EchoArtifactDefinition = {
  key: 'dragonHead',
  name: 'Dragon Head',
  echoKey: 'dragonborn',
  slot: 'head',
  baseProfile: 'headArmor',
  description:
    'A draconic head: a scaling Bite weapon, a Breath Weapon (Damage or Ruin Melee AoE), the Draconic Roar armor aura, and stone-refreshing Draconic Recovery.',
  restriction:
    'A Dragonborn with Dragon Head cannot wear another Head Artifact, helmet, mask, crown, or magical headgear.',
  // Bite Weapon Damage (1d8…10d8): martial weapon source for Powers / Basic
  // Attack (free radial toggle), not a standalone Attack Action. Occupies no hands.
  naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
  // Breath Weapon = Melee AoE Attack (Damage + Dragon Head Bite) OR Melee AoE Special: Ruin
  // on each use (shared rest + once-per-combat). Damage uses active-melee-weapon-aoe plus
  // this Artifact's Bite (Dragon Head-only AoE weapon-damage exception). Ruin is Special-only.
  // Attack Attribute: Might or Agility (choose before the roll). Roar = Armor Aura;
  // Recovery = Stone Refresh (Might).
  progressionPickSpecs: {
    1: {
      name: 'Breath Weapon',
      templateId: 'active-melee-weapon-aoe',
      stagePowerLevels: ['4', '10', '16'],
      stageEffectTexts: [
        'Choose **Damage Breath** (Melee AoE Attack PL 4: **Bite Weapon Damage + 4d8** Power Damage, radius 3 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 4: **Ruin(5)**, radius 3 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter.',
        'Choose **Damage Breath** (Melee AoE Attack PL 10: **Bite Weapon Damage + 7d8** Power Damage, radius 6 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 10: **Ruin(9)**, radius 5 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter. This replaces Breath Weapon I.',
        'Choose **Damage Breath** (Melee AoE Attack PL 16: **Bite Weapon Damage + 13d8** Power Damage, radius 8 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 16: **Ruin(10)**, radius 7 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter. This replaces Breath Weapon II.',
      ],
    },
    2: {
      name: 'Draconic Roar',
      templateId: 'ab-armor-aura',
      // Armor Aura PL 4 / 10 / 16 (+1 Armor / PL → +4 / +10 / +16; radii 8 / 20 / 32 m).
      stagePowerLevels: ['4', '10', '16'],
    },
  },
  stoneFunction: { level: 3, kind: 'stoneRefresh', attribute: 'might', name: 'Draconic Recovery' },
  baseValues: [
    {
      slot: 'a',
      label: 'Bite Weapon Damage',
      note: '1d8 to 10d8 across levels.',
    },
    {
      slot: 'b',
      label: 'Head Armor',
      note: '+1 Armor at Level 1 up to +5 Armor at Levels 9–10 (minor Armor, stacks normally).',
    },
    {
      slot: 'c',
      label: 'Predator Sense (Sense Option)',
      note: 'Sense Slot option, 20 m. Does not scale with Artifact Level.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Breath Weapon I',
      type: 'Melee AoE',
      range: 'Self',
      aoe: 'Damage: radius 3 m / Ruin: radius 3 m',
      duration: 'Instant',
      effect:
        'Choose **Damage Breath** (Melee AoE Attack PL 4: **Bite Weapon Damage + 4d8** Power Damage, radius 3 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 4: **Ruin(5)**, radius 3 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter.',
      special: 'Melee AoE Attack (PL 4) OR Melee AoE Special: Ruin (PL 4)',
    },
    {
      level: 2,
      name: 'Draconic Roar I',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 8 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +4 Armor.',
      special: 'Active Buff: Armor Aura (PL 4)',
    },
    {
      level: 3,
      name: 'Draconic Recovery I',
      type: 'Stone Refresh',
      range: 'Self',
      duration: 'Instant',
      effect: 'Restore 1 spent Stone of the chosen Attribute.',
      special: 'Stone Refresh',
    },
    {
      level: 4,
      name: 'Breath Weapon II',
      type: 'Melee AoE',
      range: 'Self',
      aoe: 'Damage: radius 6 m / Ruin: radius 5 m',
      duration: 'Instant',
      effect:
        'Choose **Damage Breath** (Melee AoE Attack PL 10: **Bite Weapon Damage + 7d8** Power Damage, radius 6 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 10: **Ruin(9)**, radius 5 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter. This replaces Breath Weapon I.',
      special: 'Melee AoE Attack (PL 10) OR Melee AoE Special: Ruin (PL 10)',
    },
    {
      level: 5,
      name: 'Draconic Roar II',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 20 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +10 Armor.',
      special: 'Active Buff: Armor Aura (PL 10)',
    },
    {
      level: 6,
      name: 'Draconic Recovery II',
      type: 'Stone Refresh',
      range: 'Self',
      duration: 'Instant',
      effect: 'Restore 2 spent Stones of the chosen Attribute.',
      special: 'Stone Refresh',
    },
    {
      level: 7,
      name: 'Breath Weapon III',
      type: 'Melee AoE',
      range: 'Self',
      aoe: 'Damage: radius 8 m / Ruin: radius 7 m',
      duration: 'Instant',
      effect:
        'Choose **Damage Breath** (Melee AoE Attack PL 16: **Bite Weapon Damage + 13d8** Power Damage, radius 8 m; Might or Agility) **or Ruin Breath** (Melee AoE Special: Ruin PL 16: **Ruin(10)**, radius 7 m, no damage; Might or Agility). Use one AoE attack and the shared Breath Weapon counter. This replaces Breath Weapon II.',
      special: 'Melee AoE Attack (PL 16) OR Melee AoE Special: Ruin (PL 16)',
    },
    {
      level: 8,
      name: 'Draconic Roar III',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 32 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +16 Armor.',
      special: 'Active Buff: Armor Aura (PL 16)',
    },
    {
      level: 9,
      name: 'Draconic Recovery III',
      type: 'Stone Refresh',
      range: 'Self',
      duration: 'Instant',
      effect: 'Restore 4 spent Stones of the chosen Attribute.',
      special: 'Stone Refresh',
    },
    artifactAwakeningRow('Dragon Head'),
  ],
};

// ----------------------------------------------------------------------
// Sentinel Frames (Sentinel — one frame per Order)
// ----------------------------------------------------------------------

const SENTINEL_FRAME: EchoArtifactDefinition = {
  key: 'sentinelFrame',
  name: 'Sentinel Frame',
  echoKey: 'sentinels',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'The armored enforcer frame — an iron wall of heavenly order.',
  requiresSubChoice: 'sentinel',
  restriction:
    'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
  // Printed table: Restoration 1/4/7 (R-05; ordinary Single Heal retired),
  // Resolve Pool 2/6, Healing Support 3/8, Ward 5/9. The 1/2/3 compiler covers
  // Restoration + Pool + Healing; Ward is an extra Stone Function from Artifact Level 5.
  progressionPickSpecs: {
    1: { templateId: 'active-ranged-health-level-heal', name: 'Sentinel Restoration' },
    2: { name: 'Resolve Core', stoneFunction: { kind: 'stonePool', attribute: 'resolve' } },
    3: {
      name: 'Healing Support',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'resolve',
        stonePowerId: 'resolve.healing',
      },
    },
  },
  extraStoneFunctions: [
    {
      level: 5,
      name: 'Ward Support',
      kind: 'stonePowerSupport',
      attribute: 'resolve',
      stonePowerId: 'resolve.ward',
      supportStages: [5, 5, 9],
    },
  ],
  baseValues: [
    {
      slot: 'a',
      label: 'Light Echo Armor',
      note: '+8 to +18 Armor; no Light Armor drawback.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Sentinel Restoration I',
      type: 'Active, Support',
      range: '20 m',
      duration: 'Instant',
      effect: 'Restore up to 2 Scarred Health Bars per Safe Haven Rest on one creature (full HP each). Does not heal HP.',
      special: 'Ranged Single Target Restoration (PL 4)',
    },
    {
      level: 2,
      name: 'Resolve Core I',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'Store 2 Resolve Stones after each Safe Haven Rest. They may be spent only on Sentinel Frame\'s listed Resolve Stone functions.',
      special: 'Resolve Stones',
    },
    {
      level: 3,
      name: 'Healing Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Sentinel Frame supports the Resolve Ability: Healing Stone Power and pre-fills Tier 2.',
      special: 'Healing Stone Power',
    },
    {
      level: 4,
      name: 'Sentinel Restoration II',
      type: 'Active, Support',
      range: '44 m',
      duration: 'Instant',
      effect: 'Sentinel Restoration improves to Power Level 10: pool of 6 Scarred Health Bars per Safe Haven Rest. Replaces Sentinel Restoration I.',
      special: 'Ranged Single Target Restoration (PL 10)',
    },
    {
      level: 5,
      name: 'Ward Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Supports Resolve Ability: Ward and pre-fills Tier 3. Tiers 1 and 2 must still be paid.',
      special: 'resolve.ward',
    },
    {
      level: 6,
      name: 'Resolve Core II',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'Store 4 Resolve Stones after each Safe Haven Rest. They may be spent only on Sentinel Frame\'s listed Resolve Stone functions.',
      special: 'Resolve Stones',
    },
    {
      level: 7,
      name: 'Sentinel Restoration III',
      type: 'Active, Support',
      range: '68 m',
      duration: 'Instant',
      effect: 'Sentinel Restoration improves to Power Level 16: pool of 10 Scarred Health Bars per Safe Haven Rest. Replaces Sentinel Restoration II.',
      special: 'Ranged Single Target Restoration (PL 16)',
    },
    {
      level: 8,
      name: 'Healing Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill Tier 4 of Resolve Ability: Healing. Tiers 1, 2, and 3 must still be paid.',
      special: 'Healing Stone Power',
    },
    {
      level: 9,
      name: 'Ward Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill Tier 4 of Resolve Ability: Ward. Tiers 1, 2, and 3 must still be paid.',
      special: 'resolve.ward',
    },
    artifactAwakeningRow('Sentinel Frame'),
  ],
};

const JUDICATOR_FRAME: EchoArtifactDefinition = {
  key: 'judicatorFrame',
  name: 'Judicator Frame',
  echoKey: 'sentinels',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'A judge, inquisitor, and divine executioner frame.',
  requiresSubChoice: 'judicator',
  restriction:
    'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
  // Three clean tracks mapped to real, editable Powers / Stone Functions:
  //   L1 Armor Hasten → `empower-buff-armor` (Armor Empowerment artifact meta),
  //   L2 Wits Core    → Stone Pool (Wits),
  //   L3 Regeneration → Stone Power Support (Influence: Regeneration).
  // The Stone Functions live on their own picks, so both apply mechanically.
  progressionPickSpecs: {
    1: { templateId: 'empower-buff-armor', name: 'Armor Hasten' },
    2: { name: 'Wits Core', stoneFunction: { kind: 'stonePool', attribute: 'wits' } },
    3: {
      name: 'Regeneration Support',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'influence',
        stonePowerId: 'influence.colorlessRecovery',
      },
    },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Light Echo Armor',
      note: '+8 to +18 Armor; no Light Armor drawback.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Armor Hasten I',
      type: 'Active Buff Empowerment',
      range: 'Self',
      duration: 'Passive',
      effect:
        'When activating an Active Buff that grants Armor, empower it by +1 Power Level and +1 round (cannot exceed PL 16).',
      special: 'Armor Empowerment',
    },
    {
      level: 2,
      name: 'Wits Core I',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Judicator Frame stores 2 Wits Stones.',
      special: 'Wits Stones',
    },
    {
      level: 3,
      name: 'Regeneration Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Judicator Frame supports Influence Ability: Regeneration and pre-fills Tier 2.',
      special: 'influence.regeneration',
    },
    {
      level: 4,
      name: 'Armor Hasten II',
      type: 'Active Buff Empowerment',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Empowerment improves to +2 PL and +2 rounds.',
      special: 'Armor Empowerment',
    },
    {
      level: 5,
      name: 'Wits Core II',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Judicator Frame stores 4 Wits Stones.',
      special: 'Wits Stones',
    },
    {
      level: 6,
      name: 'Regeneration Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 3 of Influence Ability: Regeneration.',
      special: 'influence.regeneration',
    },
    {
      level: 7,
      name: 'Armor Hasten III',
      type: 'Active Buff Empowerment',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Empowerment improves to +3 PL and +3 rounds.',
      special: 'Armor Empowerment',
    },
    {
      level: 8,
      name: 'Wits Core III',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Judicator Frame stores 8 Wits Stones.',
      special: 'Wits Stones',
    },
    {
      level: 9,
      name: 'Regeneration Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 4 of Influence Ability: Regeneration.',
      special: 'influence.regeneration',
    },
    artifactAwakeningRow('Judicator Frame'),
  ],
};

const ORACLE_FRAME: EchoArtifactDefinition = {
  key: 'oracleFrame',
  name: 'Oracle Frame',
  echoKey: 'sentinels',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'An arcane vessel of command, prophecy, and divine will.',
  requiresSubChoice: 'oracle',
  restriction:
    'A character with a Sentinel Body Artifact cannot wear mundane armor or bind another Body Artifact.',
  // L1 Oracle Field → `ab-armor-aura` (PL 1 / 3 / 5 → I / III / V),
  // L2 Oracle Aid → Stone Power Support (Influence: Aid Roll),
  // L3 Influence Core → Stone Pool (Influence).
  progressionPickSpecs: {
    1: {
      name: 'Oracle Field',
      templateId: 'ab-armor-aura',
      stagePowerLevels: ['1', '3', '5'],
      stageNumerals: ['I', 'III', 'V'],
    },
    2: {
      name: 'Oracle Aid',
      stoneFunction: {
        kind: 'stonePowerSupport',
        attribute: 'influence',
        stonePowerId: 'influence.cleanse',
      },
    },
    3: { name: 'Influence Core', stoneFunction: { kind: 'stonePool', attribute: 'influence' } },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Light Echo Armor',
      note: '+8 to +18 Armor; no Light Armor drawback.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Oracle Field I',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 2 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +1 Armor.',
      special: 'Armor Aura',
    },
    {
      level: 2,
      name: 'Oracle Aid I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Oracle Frame supports the Influence Ability: Aid Roll Stone Power and pre-fills Rank 2. Rank 1 must still be paid normally.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 3,
      name: 'Influence Core I',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect:
        "After each Safe Haven Rest, Oracle Frame stores 2 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
      special: 'Influence Stones',
    },
    {
      level: 4,
      name: 'Oracle Field III',
      type: 'Active Buff Upgrade',
      range: 'Self',
      aoe: 'Radius 6 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +3 Armor.',
      special: 'Armor Aura',
    },
    {
      level: 5,
      name: 'Oracle Aid II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Oracle Frame pre-fills Rank 3 of the Influence Ability: Aid Roll Stone Power. Ranks 1 and 2 must still be paid normally.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 6,
      name: 'Influence Core II',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect:
        "After each Safe Haven Rest, Oracle Frame stores 4 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
      special: 'Influence Stones',
    },
    {
      level: 7,
      name: 'Oracle Field V',
      type: 'Active Buff Upgrade',
      range: 'Self',
      aoe: 'Radius 10 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +5 Armor.',
      special: 'Armor Aura',
    },
    {
      level: 8,
      name: 'Oracle Aid III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Oracle Frame pre-fills Rank 4 of the Influence Ability: Aid Roll Stone Power. Ranks 1, 2, and 3 must still be paid normally.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 9,
      name: 'Influence Core III',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect:
        "After each Safe Haven Rest, Oracle Frame stores 8 Influence Stones. These Stones may only be used for Oracle Frame's listed Influence Stone functions.",
      special: 'Influence Stones',
    },
    artifactAwakeningRow('Oracle Frame'),
  ],
};

// ----------------------------------------------------------------------
// Ringchain of Kept Names (Halfling — optional Amulet)
// ----------------------------------------------------------------------

const RINGCHAIN_OF_KEPT_NAMES: EchoArtifactDefinition = {
  key: 'ringchainOfKeptNames',
  name: 'Ringchain of Kept Names',
  echoKey: 'halflings',
  slot: 'amulet',
  baseProfile: 'noArmorBody',
  description:
    'Halfling Echo Artifact: family rings on one chain. No numeric Base Values. Influence Ability: Not a Target, Cleanse, Melee AoE Restoration (Hearth Circle), and Ranged Single Target Restoration (Remembered Hands).',
  restriction:
    'The Ringchain occupies the Amulet Slot. A Halfling with the Ringchain cannot wear another Amulet Artifact. Echo-bound and cannot normally be removed, replaced, sold, stolen, or unbound.',
  extraStoneFunctions: [
    {
      level: 1,
      name: 'Kept from Sight',
      kind: 'stonePowerSupport',
      attribute: 'influence',
      stonePowerId: 'influence.notATarget',
      // Not a Target is a Premium Stone Ability with four Ranks. Kept from
      // Sight I (artifact L1) pre-fills Rank 2, II (L5) Rank 3, III (L9)
      // Rank 4. All lower Ranks must still be activated and paid normally.
      supportStages: [1, 5, 9],
    },
  ],
  baseValues: [
    {
      slot: 'a',
      label: 'No numeric Base Values',
      note: 'Grants no Armor, Evade, Movement, or weapon value. Power comes from Level Progression.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Kept from Sight I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill Rank 2. Rank 1 must still be paid normally.',
      special: 'influence.notATarget',
    },
    {
      level: 2,
      name: 'Burden Lifted I',
      type: 'Active, Support',
      range: '20 m',
      duration: 'Instant',
      effect: 'Remove up to 6 total points of eligible negative Special value from one creature.',
      special: 'Ranged Single Target Cleanse (PL 4)',
    },
    {
      level: 3,
      name: 'Hearth Circle I',
      type: 'Active, Support',
      range: 'Melee Reach',
      aoe: 'Radius 2 m',
      duration: 'Instant',
      effect: 'Restore up to 2 Scarred Health Bars per Safe Haven Rest among allies within 2 m (full HP each). The pool is shared across the AoE; allocate bars among eligible allies. Does not heal HP.',
      special: 'Melee AoE Restoration (PL 4)',
      powerTemplateId: 'active-melee-aoe-restoration',
    },
    {
      level: 4,
      name: 'Remembered Hands I',
      type: 'Active, Support',
      range: '44 m',
      duration: 'Instant',
      effect: 'Restore up to 6 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). Does not heal HP.',
      special: 'Ranged Single Target Restoration (PL 10)',
      powerTemplateId: 'active-ranged-health-level-heal',
    },
    {
      level: 5,
      name: 'Kept from Sight II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill Rank 3. Ranks 1 and 2 must still be paid normally.',
      special: 'influence.notATarget',
    },
    {
      level: 6,
      name: 'Burden Lifted II',
      type: 'Active, Support',
      range: '44 m',
      duration: 'Instant',
      effect: 'Remove up to 10 total points of eligible negative Special value from one creature. This replaces Burden Lifted I.',
      special: 'Ranged Single Target Cleanse (PL 10)',
    },
    {
      level: 7,
      name: 'Remembered Hands II',
      type: 'Active, Support',
      range: '68 m',
      duration: 'Instant',
      effect: 'Restore up to 10 Scarred Health Bars per Safe Haven Rest on one creature at a time (full HP each). Does not heal HP. Replaces Remembered Hands I.',
      special: 'Ranged Single Target Restoration (PL 16)',
      powerTemplateId: 'active-ranged-health-level-heal',
    },
    {
      level: 8,
      name: 'Hearth Circle II',
      type: 'Active, Support',
      range: 'Melee Reach',
      aoe: 'Radius 4 m',
      duration: 'Instant',
      effect: 'Restore up to 9 Scarred Health Bars per Safe Haven Rest among allies within 4 m (full HP each). The pool is shared across the AoE; allocate bars among eligible allies. Does not heal HP. This replaces Hearth Circle I.',
      special: 'Melee AoE Restoration (PL 16)',
      powerTemplateId: 'active-melee-aoe-restoration',
    },
    {
      level: 9,
      name: 'Kept from Sight III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fill Rank 4. Ranks 1, 2, and 3 must still be paid normally.',
      special: 'influence.notATarget',
    },
    artifactAwakeningRow('Ringchain of Kept Names'),
  ],
};

// ----------------------------------------------------------------------
// Hollow Crown (Deathless)
// ----------------------------------------------------------------------

const HOLLOW_CROWN: EchoArtifactDefinition = {
  key: 'hollowCrown',
  name: 'Hollow Crown',
  echoKey: 'deathless',
  slot: 'head',
  baseProfile: 'headArmor',
  description:
    'The Hollow Crown marks the place where death failed. Deathless Body, Life Sense (Life Sight 30 m), Hollow Stillness, and Life Absorption.',
  restriction:
    'Hollow Crown occupies the Head Slot. It cannot normally be removed, replaced, sold, stolen, unequipped, or unbound.',
  baseValues: [
    {
      slot: 'a',
      label: 'Life Sense — Life Sight',
      note: 'Life Sense 30 m. Does not scale with Artifact Level; does not consume a Power Line.',
    },
  ],
  // Authored Core lines (Deathless Body / Life Absorption / Hollow Stillness).
  levelProgression: [
    {
      level: 1,
      name: 'Deathless Body I',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Shift Health Penalties 2 steps toward Healthy. Maximum Health Penalty 20%.',
      special: 'Hollow Crown Passive: Deathless Body I',
    },
    {
      level: 2,
      name: 'Life Absorption I',
      type: 'Artifact Function',
      range: 'Touch',
      duration: 'Out of combat',
      effect:
        'Drain living creatures for Absorbed Vitality Stones. Maximum 2 Stones per Safe Haven Rest. Not usable in combat.',
      special: 'Hollow Crown: Life Absorption I',
    },
    {
      level: 3,
      name: 'Hollow Stillness I',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect:
        'Advantage on Attribute Checks to resist Fear, Pain, Poison, Disease, Suffocation, Exhaustion, and living-body effects.',
      special: 'Hollow Crown: Hollow Stillness I',
    },
    {
      level: 4,
      name: 'Deathless Body II',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Shift Health Penalties 3 steps. Maximum Health Penalty 10%. Replaces Deathless Body I.',
      special: 'Hollow Crown Passive: Deathless Body II',
    },
    {
      level: 5,
      name: 'Life Absorption II',
      type: 'Artifact Function',
      range: 'Touch',
      duration: 'Out of combat',
      effect: 'Maximum 4 Absorbed Vitality Stones per Safe Haven Rest. Replaces Life Absorption I.',
      special: 'Hollow Crown: Life Absorption II',
    },
    {
      level: 6,
      name: 'Hollow Stillness II',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Keep Advantage and add +1d8 to the Pool of those Attribute Checks. Replaces Hollow Stillness I.',
      special: 'Hollow Crown: Hollow Stillness II',
    },
    {
      level: 7,
      name: 'Deathless Body III',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Shift Health Penalties 4 steps. Maximum Health Penalty 0%. Replaces Deathless Body II.',
      special: 'Hollow Crown Passive: Deathless Body III',
    },
    {
      level: 8,
      name: 'Life Absorption III',
      type: 'Artifact Function',
      range: 'Touch',
      duration: 'Out of combat',
      effect: 'Maximum 8 Absorbed Vitality Stones per Safe Haven Rest. Replaces Life Absorption II.',
      special: 'Hollow Crown: Life Absorption III',
    },
    {
      level: 9,
      name: 'Hollow Stillness III',
      type: 'Passive',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Keep Advantage and increase the Pool bonus to +2d8. Replaces Hollow Stillness II.',
      special: 'Hollow Crown: Hollow Stillness III',
    },
    artifactAwakeningRow('Hollow Crown'),
  ],
};

// ----------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------

export const ECHO_ARTIFACTS: Record<string, EchoArtifactDefinition> = {
  stoneboundSoles: STONEBOUND_SOLES,
  elorianStride: ELORIAN_STRIDE,
  titanScars: TITAN_SCARS,
  wyrmScalesHeavy: WYRM_SCALES_HEAVY,
  wyrmScalesLight: WYRM_SCALES_LIGHT,
  dragonClaws: DRAGON_CLAWS,
  dragonHead: DRAGON_HEAD,
  sentinelFrame: SENTINEL_FRAME,
  judicatorFrame: JUDICATOR_FRAME,
  oracleFrame: ORACLE_FRAME,
  hollowCrown: HOLLOW_CROWN,
  ringchainOfKeptNames: RINGCHAIN_OF_KEPT_NAMES,
  ...UNBOUND_ECHO_ARTIFACTS,
};

/** Per-Echo character-creation rules. */
export interface EchoArtifactRules {
  echoKey: string;
  /** Required count at character creation (>= 0). */
  requiredAtCreation: number;
  /** Maximum count at character creation (>= required). */
  maxAtCreation: number;
  /** Echo-Artifact keys offered to this Echo at character creation. */
  availableKeys: string[];
  /**
   * Mutually-exclusive groups: the player may select AT MOST ONE key from each
   * listed group. Used e.g. for Dragonborn body armor where Wyrm Scales and
   * Serpent Scales are an OR choice (both occupy the Body slot).
   */
  exclusiveGroups?: string[][];
}

export const ECHO_ARTIFACT_RULES: Record<string, EchoArtifactRules> = {
  humans: { echoKey: 'humans', requiredAtCreation: 0, maxAtCreation: 0, availableKeys: [] },
  dwarfs: {
    echoKey: 'dwarfs',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['stoneboundSoles'],
  },
  elorians: {
    echoKey: 'elorians',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['elorianStride'],
  },
  sentinels: {
    echoKey: 'sentinels',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['sentinelFrame', 'judicatorFrame', 'oracleFrame'],
  },
  titanborn: {
    echoKey: 'titanborn',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['titanScars'],
  },
  halflings: {
    echoKey: 'halflings',
    requiredAtCreation: 0,
    maxAtCreation: 1,
    availableKeys: ['ringchainOfKeptNames'],
  },
  dragonborn: {
    echoKey: 'dragonborn',
    requiredAtCreation: 1,
    maxAtCreation: 3,
    // Claws (both hands), Head (head) and one Body armor. Wyrm Scales and
    // Serpent Scales both occupy the Body slot, so they are mutually exclusive.
    availableKeys: ['dragonClaws', 'dragonHead', 'wyrmScalesHeavy', 'wyrmScalesLight'],
    exclusiveGroups: [['wyrmScalesHeavy', 'wyrmScalesLight']],
  },
  unbound: {
    echoKey: 'unbound',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: UNBOUND_ECHO_ARTIFACT_KEYS,
    // Predator Crown attribute variants + Primal Vestment are mutually exclusive.
    exclusiveGroups: [UNBOUND_BEAST_BODY_EXCLUSIVE_KEYS],
  },
  deathless: {
    echoKey: 'deathless',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['hollowCrown'],
  },
};

/** Lookup an Echo Artifact by key (legacy aliases resolve to current variant keys). */
export function getEchoArtifact(key: string | null | undefined): EchoArtifactDefinition | null {
  if (!key) return null;
  const resolved = ECHO_ARTIFACT_KEY_ALIASES[key] ?? key;
  return ECHO_ARTIFACTS[resolved] ?? null;
}

/** Echo Artifact defs that share a variant comparison group, in display order. */
export function listEchoArtifactsInVariantGroup(groupKey: string): EchoArtifactDefinition[] {
  const order = ['Heavy', 'Light'];
  return Object.values(ECHO_ARTIFACTS)
    .filter((d) => d.variantGroupKey === groupKey && d.variantRow)
    .sort(
      (a, b) =>
        order.indexOf(a.variantRow!.armorClass) - order.indexOf(b.variantRow!.armorClass),
    );
}

/** Resolve legacy echo keys (e.g. elves → elorians). */
function resolveEchoKey(echoKey: string | null | undefined): string | null {
  if (!echoKey) return null;
  if (echoKey === 'elves') return 'elorians';
  if (echoKey === 'halfling') return 'halflings';
  return echoKey;
}

/** Rules block for an Echo (returns Human default if unknown). */
export function getEchoArtifactRules(echoKey: string | null | undefined): EchoArtifactRules {
  const resolved = resolveEchoKey(echoKey);
  if (!resolved) return ECHO_ARTIFACT_RULES.humans;
  return ECHO_ARTIFACT_RULES[resolved] ?? ECHO_ARTIFACT_RULES.humans;
}

/**
 * Build the list of Echo Artifacts a character may pick at creation,
 * filtered by sub-choice gating. Used by the Echo creation dialog.
 */
export function listSelectableEchoArtifacts(
  echoKey: string,
  subChoiceKey?: string | null,
): EchoArtifactDefinition[] {
  const rules = getEchoArtifactRules(echoKey);
  const out: EchoArtifactDefinition[] = [];
  for (const k of rules.availableKeys) {
    const def = getEchoArtifact(k);
    if (!def) continue;
    if (def.requiresSubChoice && def.requiresSubChoice !== subChoiceKey) continue;
    out.push(def);
  }
  return out;
}

/**
 * Validate a set of selected Echo Artifact keys against an Echo's rules
 * (count + mutually-exclusive groups). Returns an error string, or null if OK.
 */
export function validateEchoArtifactSelection(
  echoKey: string,
  selectedKeys: string[],
): string | null {
  const rules = getEchoArtifactRules(echoKey);
  const unique = Array.from(new Set(selectedKeys.filter(Boolean)));
  if (unique.length < rules.requiredAtCreation) {
    return `This Echo requires at least ${rules.requiredAtCreation} Echo Artifact(s).`;
  }
  if (unique.length > rules.maxAtCreation) {
    return `This Echo allows at most ${rules.maxAtCreation} Echo Artifact(s).`;
  }
  for (const group of rules.exclusiveGroups ?? []) {
    const chosen = unique.filter((k) => group.includes(k));
    if (chosen.length > 1) {
      const names = chosen
        .map((k) => getEchoArtifact(k)?.name ?? k)
        .join(' / ');
      return `You may pick only one of: ${names}.`;
    }
  }
  return null;
}

/**
 * Build a partial `system` object for an artifact item from an Echo
 * Artifact definition — used when seeding the embedded artifact item
 * on character creation.
 */
export function buildEchoStoneFunction(
  def: EchoArtifactDefinition,
): { kind: ArtifactStoneFunctionKind; attribute: string; stonePowerId?: string } | null {
  const sf = def.stoneFunction;
  if (!sf) return null;
  const out: { kind: ArtifactStoneFunctionKind; attribute: string; stonePowerId?: string } = {
    kind: sf.kind,
    attribute: sf.attribute,
  };
  if (sf.kind === 'stonePowerSupport' && sf.stonePowerId) out.stonePowerId = sf.stonePowerId;
  return out;
}

/**
 * Build the up-to-three Level Progression picks from an Echo definition.
 * Each Basic level (1-3) becomes a catalog Power pick (from `progressionPickIds`)
 * or, when claimed by `stoneFunction`, the Stone Function pick. The 1-10 table is
 * generated from these picks by `deriveLevelProgressionFromPicks`.
 */
export function buildEchoProgressionPicks(
  def: EchoArtifactDefinition,
): {
  level: 1 | 2 | 3;
  kind: 'none' | 'power' | 'stoneFunction' | 'authored';
  powerTemplateId?: string;
  stoneFunction?: unknown;
  authoredStages?: unknown[];
  delivery?: MartialDelivery;
  chosenSpecial?: { key: string; tier: 3 | 4 | 5 | 6 };
  displayName?: string;
  stagePowerLevels?: PowerLevelKey[];
  stageNumerals?: string[];
  stageTemplateIds?: [string, string, string];
  stageNames?: [string, string, string];
  stageEffectTexts?: [string, string, string];
  isSpell?: boolean;
  castingAttribute?: CastingAttribute;
  spellResolution?: SpellResolution;
}[] {
  const picks: {
    level: 1 | 2 | 3;
    kind: 'none' | 'power' | 'stoneFunction' | 'authored';
    powerTemplateId?: string;
    stoneFunction?: unknown;
    authoredStages?: unknown[];
    delivery?: MartialDelivery;
    chosenSpecial?: { key: string; tier: 3 | 4 | 5 | 6 };
    displayName?: string;
    stagePowerLevels?: PowerLevelKey[];
    stageNumerals?: string[];
    stageTemplateIds?: [string, string, string];
    stageNames?: [string, string, string];
    stageEffectTexts?: [string, string, string];
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
  }[] = [
    { level: 1, kind: 'none' },
    { level: 2, kind: 'none' },
    { level: 3, kind: 'none' },
  ];

  // Catalog Power picks per level.
  const ids = def.progressionPickIds || {};
  for (const lvl of [1, 2, 3] as const) {
    const tplId = ids[lvl];
    if (tplId) {
      picks[lvl - 1] = { level: lvl, kind: 'power', powerTemplateId: tplId };
    }
  }

  // Rich pick specs (martial delivery+Special or non-martial template) with
  // optional flavor names — take precedence over `progressionPickIds`.
  const specs = def.progressionPickSpecs || {};
  for (const lvl of [1, 2, 3] as const) {
    const spec = specs[lvl];
    if (!spec) continue;
    const displayName = spec.name?.trim() || undefined;
    const stageOverrides = {
      ...(spec.stagePowerLevels ? { stagePowerLevels: spec.stagePowerLevels } : {}),
      ...(spec.stageNumerals ? { stageNumerals: spec.stageNumerals } : {}),
      ...(spec.stageTemplateIds ? { stageTemplateIds: spec.stageTemplateIds } : {}),
      ...(spec.stageNames ? { stageNames: spec.stageNames } : {}),
      ...(spec.stageEffectTexts ? { stageEffectTexts: spec.stageEffectTexts } : {}),
      ...(spec.isSpell ? { isSpell: true } : {}),
      ...(spec.castingAttribute ? { castingAttribute: spec.castingAttribute } : {}),
      ...(spec.spellResolution ? { spellResolution: spec.spellResolution } : {}),
    };
    if (spec.stoneFunction) {
      const sfSpec = spec.stoneFunction;
      const stoneFunction: {
        kind: ArtifactStoneFunctionKind;
        attribute: string;
        stonePowerId?: string;
        supportStages?: [number, number, number];
      } = {
        kind: sfSpec.kind,
        attribute: sfSpec.attribute,
      };
      if (sfSpec.kind === 'stonePowerSupport' && sfSpec.stonePowerId) {
        stoneFunction.stonePowerId = sfSpec.stonePowerId;
      }
      if (sfSpec.supportStages) {
        stoneFunction.supportStages = sfSpec.supportStages;
      }
      picks[lvl - 1] = { level: lvl, kind: 'stoneFunction', stoneFunction, displayName, ...stageOverrides };
    } else if (spec.delivery && spec.special) {
      const resolved = resolvePickFromUi(spec.delivery, spec.special);
      picks[lvl - 1] = {
        level: lvl,
        kind: 'power',
        powerTemplateId: resolved.powerTemplateId,
        delivery: resolved.delivery,
        chosenSpecial: resolved.chosenSpecial,
        displayName,
        ...stageOverrides,
      };
    } else if (spec.templateId) {
      const pick: (typeof picks)[number] = {
        level: lvl,
        kind: 'power',
        powerTemplateId: spec.templateId,
        displayName,
        ...stageOverrides,
      };
      if (spec.special && !spec.delivery) {
        const tier =
          tierFromSpecialKey(spec.special) ??
          catalogSpecialTierForTemplate(spec.templateId) ??
          4;
        pick.chosenSpecial = { key: spec.special, tier: tier as 3 | 4 | 5 | 6 };
      }
      picks[lvl - 1] = pick;
    }
  }

  // Stone Function pick claims its level (overrides any Power pick there).
  const sf = def.stoneFunction;
  if (sf) {
    picks[sf.level - 1] = {
      level: sf.level,
      kind: 'stoneFunction',
      stoneFunction: buildEchoStoneFunction(def),
      displayName: sf.name?.trim() || undefined,
    };
  }

  // Authored fallback: any base level (1/2/3) still empty but covered by the
  // hand-written `levelProgression` table (e.g. Dragon Head's Breath Weapon /
  // Draconic Roar / Draconic Recovery) becomes an `authored` pick carrying its
  // staged rows. This keeps bespoke lines visible in the Node Editor and stops
  // a save/inheritance from recompiling them away.
  const authoredRows = Array.isArray(def.levelProgression) ? def.levelProgression : [];
  if (authoredRows.length > 0) {
    for (const baseLevel of [1, 2, 3] as const) {
      if (picks[baseLevel - 1].kind !== 'none') continue;
      // Collect the slot's rows at levels base / base+3 / base+6 (skip L10 Ultimate).
      const stages = [baseLevel, baseLevel + 3, baseLevel + 6]
        .map((lvl) => authoredRows.find((r) => Number(r.level) === lvl))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((r) => ({
          level: Number(r.level),
          name: r.name || '',
          type: r.type || '',
          range: r.range || '',
          aoe: r.aoe || '',
          duration: r.duration || '',
          effect: r.effect || '',
          special: r.special || '',
        }));
      if (stages.length > 0) {
        picks[baseLevel - 1] = { level: baseLevel, kind: 'authored', authoredStages: stages };
      }
    }
  }

  return picks;
}

export function buildArtifactSystemFromEchoDef(
  def: EchoArtifactDefinition,
): Record<string, unknown> {
  return {
    level: 1,
    currentLevel: 1,
    equipped: true,
    effects: [],
    artifactKind:
      def.baseProfile === 'twoHandedWeapon' ||
      def.baseProfile === 'twoHandedWeaponRanged' ||
      def.baseProfile === 'oneHandedWeapon' ||
      def.baseProfile === 'oneHandedWeaponRanged'
        ? 'weapon'
        : def.baseProfile === 'shield'
          ? 'shield'
          : def.baseProfile === 'bodyArmor' || def.baseProfile === 'noArmorBody'
            ? 'armor'
            : 'gear',
    slot: def.slot,
    baseProfile: def.baseProfile,
    binding: 'echo',
    echoKey: def.echoKey,
    baseValues: def.baseValues.map((bv) => ({
      slot: bv.slot,
      type: bv.label.toLowerCase().includes('damage')
        ? 'weaponDamage'
        : bv.label.toLowerCase().includes('armor')
          ? bv.label.toLowerCase().includes('feet') || bv.label.toLowerCase().includes('head')
            ? 'headArmor'
            : 'bodyArmor'
          : bv.label.toLowerCase().includes('evade')
            ? 'evade'
            : bv.label.toLowerCase().includes('clinging') ||
                bv.label.toLowerCase().includes('move') ||
                bv.label.toLowerCase().includes('cling')
              ? 'movement'
              : 'minorFeature',
      label: bv.label,
      note: bv.note,
      isBaseline: true,
    })),
    levelProgression: def.levelProgression,
    stoneFunction: buildEchoStoneFunction(def),
    extraStoneFunctions: def.extraStoneFunctions ?? [],
    progressionPicks: buildEchoProgressionPicks(def),
    lore: def.description,
    bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
    requirements: { stones: 0, masteryRank: 1 },
    powers: [],
    inventorySize: '1x1',
    baseDamage: '',
    specials: [],
    description: def.description,
  };
}
