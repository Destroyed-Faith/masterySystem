/**
 * Echo Artifact Catalog
 *
 * Per the Player's Guide (Echo Artifacts chapter), each Echo has zero or
 * more Echo-bound Artifacts that must be selected at character creation:
 *
 *   • Human:      0 required, 0 maximum.
 *   • Dwarf:      1 required, 1 maximum.   (Stonebound Soles — Feet)
 *   • Elf:        1 required, 1 maximum.   (One Elven Stride per Elemental Lineage)
 *   • Sentinel:   1 required, 1 maximum.   (One frame per Order)
 *   • Titanborn:  1 required, 1 maximum.   (Titan Scars — Body)
 *   • Dragonborn: 1 required, 3 maximum.   (Dragon Claws, Dragon Head, and one
 *                  of Wyrm Scales / Serpent Scales — the two body armors are
 *                  mutually exclusive.)
 *   • Unbound:    0 required, 0 maximum.
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
} from '../types/item.js';
import { resolvePickFromUi, type MartialDelivery } from './artifact-power-pick.js';

/**
 * Authoring shorthand for an Echo Artifact's single canonical Stone Function.
 * The generator copies this onto `system.stoneFunction` (so the actor-side
 * aggregator applies it) and emits a matching `progressionPicks` entry at
 * `level` (so the Node Editor's editable picks reflect it). Only authored for
 * artifacts whose primary Stone Function uses a slot-legal Attribute
 * (`ATTRIBUTE_ACCESS_BY_SLOT`) and an existing Stone Power id.
 */
export interface EchoArtifactStoneFunctionHint {
  kind: ArtifactStoneFunctionKind;
  /** Attribute pool (must be legal for the artifact's slot). */
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
  /** Free-text restriction note (e.g. "occupies both hand slots"). */
  restriction?: string;
  /**
   * Optional canonical Stone Function. Authored only when slot-legal (see
   * `EchoArtifactStoneFunctionHint`). Artifacts whose stone supports use an
   * attribute outside their slot's access (e.g. body frames supporting
   * Resolve/Wits/Influence) intentionally omit this and keep their stone
   * supports purely as Level Progression abilities.
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
  progressionPickIds: {
    1: 'ab-immovable-temp-hp',
    2: 'movement-safe-movement',
    3: 'ab-armor',
  },
  baseValues: [
    { slot: 'a', label: 'Tremorsense', note: 'Ground-contact detection within 4–16 m.' },
    { slot: 'b', label: 'Armor (Feet)', note: '+1 to +4 Armor at higher levels.' },
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
      special: 'Armor Buff Empowerment',
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
      special: 'Armor Buff Empowerment',
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
      effect: 'Move up to 20 m along a legal ground path (Safe Movement).',
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
      special: 'Armor Buff Empowerment',
    },
    {
      level: 10,
      name: 'True Stonebound Soles',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Stonebound Soles fully awaken. Choose or define one final Tremorsense, Armor, Immovable, Safe Movement, or stone defense effect with GM approval.',
      special: 'True Stonebound Soles',
    },
  ],
};

// ----------------------------------------------------------------------
// Elven Stride (Elf)
// ----------------------------------------------------------------------

/** Shared Elven Stride shell; lineage-specific L3/L6/L9 rows are injected. */
function buildElvenStrideDefinition(opts: {
  key: string;
  name: string;
  lineageLabel: string;
  lineageRows: [
    { name: string; effect: string; special: string },
    { name: string; effect: string; special: string },
    { name: string; effect: string; special: string },
  ];
}): EchoArtifactDefinition {
  const [l3, l6, l9] = opts.lineageRows;
  return {
    key: opts.key,
    name: opts.name,
    echoKey: 'elves',
    slot: 'feet',
    baseProfile: 'feet',
    description: `Elven Stride (${opts.lineageLabel}): otherworldly balance, reflex, clinging movement, and ${opts.lineageLabel} lineage empowerment.`,
    restriction:
      'An elf with Elven Stride cannot wear another Feet Artifact, magical boots, hooves, talons, or similar Feet-based Artifact.',
    progressionPickIds: {
      1: 'reaction-evade',
      2: 'movement-wall-walk',
      3: 'ab-evade',
    },
    baseValues: [
      { slot: 'a', label: 'Evade', note: '+2 to +12 Evade across levels.' },
      { slot: 'b', label: 'Clinging', note: '+1 to +4 m Clinging at higher levels.' },
    ],
    levelProgression: [
      {
        level: 1,
        name: 'Otherworld Reflex I',
        type: 'Reaction',
        range: 'Self',
        duration: 'Triggering attack only',
        effect: 'Gain +4 Evade against the triggering attack.',
        special: 'Otherworld Reflex',
      },
      {
        level: 2,
        name: 'Elven Cling I',
        type: 'Movement',
        range: 'Self',
        duration: 'Instant',
        effect: 'Move up to 10 m along walls, ceilings, or similar solid surfaces.',
        special: 'Wall Walk',
      },
      {
        level: 3,
        name: l3.name,
        type: 'Support',
        range: 'Self',
        duration: 'Special',
        effect: l3.effect,
        special: l3.special,
      },
      {
        level: 4,
        name: 'Otherworld Reflex II',
        type: 'Reaction',
        range: 'Self',
        duration: 'Triggering attack only',
        effect: 'Gain +8 Evade against the triggering attack.',
        special: 'Otherworld Reflex',
      },
      {
        level: 5,
        name: 'Elven Cling II',
        type: 'Movement',
        range: 'Self',
        duration: 'Instant',
        effect: 'Move up to 25 m along walls, ceilings, or similar solid surfaces.',
        special: 'Wall Walk',
      },
      {
        level: 6,
        name: l6.name,
        type: 'Support',
        range: 'Self',
        duration: 'Special',
        effect: l6.effect,
        special: l6.special,
      },
      {
        level: 7,
        name: 'Otherworld Reflex III',
        type: 'Reaction',
        range: 'Self',
        duration: 'Triggering attack only',
        effect: 'Gain +12 Evade against the triggering attack.',
        special: 'Otherworld Reflex',
      },
      {
        level: 8,
        name: 'Elven Cling III',
        type: 'Movement',
        range: 'Self',
        duration: 'Instant',
        effect: 'Move up to 28 m along walls, ceilings, or similar solid surfaces.',
        special: 'Wall Walk',
      },
      {
        level: 9,
        name: l9.name,
        type: 'Support',
        range: 'Self',
        duration: 'Special',
        effect: l9.effect,
        special: l9.special,
      },
      {
        level: 10,
        name: 'True Elven Stride',
        type: 'Ultimate',
        range: 'Self',
        duration: 'Special',
        effect:
          'Elven Stride fully awakens. Choose or define one final movement, reflex, clinging, lineage, or agility effect with GM approval.',
        special: 'True Elven Stride',
      },
    ],
  };
}

const lineageUsesNote =
  'Uses per Safe Haven Rest: half Mastery Rank, rounded up. The Active Buff cannot exceed Power Level 16.';

const ELVEN_STRIDE_FIRE = buildElvenStrideDefinition({
  key: 'elvenStrideFire',
  name: 'Elven Stride (Fire)',
  lineageLabel: 'Fire',
  lineageRows: [
    {
      name: 'Ember Surge I',
      effect: `When you activate an Active Buff that grants Damage as one of its effects, you may increase that Buff's effective Power Level by +1 and its duration by +1 round. ${lineageUsesNote}`,
      special: 'Damage Buff Empowerment',
    },
    {
      name: 'Ember Surge II',
      effect: `When you activate an Active Buff that grants Damage as one of its effects, you may increase that Buff's effective Power Level by +2 and its duration by +2 rounds. ${lineageUsesNote}`,
      special: 'Damage Buff Empowerment',
    },
    {
      name: 'Ember Surge III',
      effect: `When you activate an Active Buff that grants Damage as one of its effects, you may increase that Buff's effective Power Level by +3 and its duration by +3 rounds. ${lineageUsesNote}`,
      special: 'Damage Buff Empowerment',
    },
  ],
});

const ELVEN_STRIDE_EARTH = buildElvenStrideDefinition({
  key: 'elvenStrideEarth',
  name: 'Elven Stride (Earth)',
  lineageLabel: 'Earth',
  lineageRows: [
    {
      name: 'Stoneweave Guard I',
      effect: `When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff's effective Power Level by +1 and its duration by +1 round. ${lineageUsesNote}`,
      special: 'Armor Buff Empowerment',
    },
    {
      name: 'Stoneweave Guard II',
      effect: `When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff's effective Power Level by +2 and its duration by +2 rounds. ${lineageUsesNote}`,
      special: 'Armor Buff Empowerment',
    },
    {
      name: 'Stoneweave Guard III',
      effect: `When you activate an Active Buff that grants Armor as one of its effects, you may increase that Buff's effective Power Level by +3 and its duration by +3 rounds. ${lineageUsesNote}`,
      special: 'Armor Buff Empowerment',
    },
  ],
});

const ELVEN_STRIDE_WATER = buildElvenStrideDefinition({
  key: 'elvenStrideWater',
  name: 'Elven Stride (Water)',
  lineageLabel: 'Water',
  lineageRows: [
    {
      name: 'Tidal Slip I',
      effect: `When you activate an Active Buff that grants Evade as one of its effects, you may increase that Buff's effective Power Level by +1 and its duration by +1 round. ${lineageUsesNote}`,
      special: 'Evade Buff Empowerment',
    },
    {
      name: 'Tidal Slip II',
      effect: `When you activate an Active Buff that grants Evade as one of its effects, you may increase that Buff's effective Power Level by +2 and its duration by +2 rounds. ${lineageUsesNote}`,
      special: 'Evade Buff Empowerment',
    },
    {
      name: 'Tidal Slip III',
      effect: `When you activate an Active Buff that grants Evade as one of its effects, you may increase that Buff's effective Power Level by +3 and its duration by +3 rounds. ${lineageUsesNote}`,
      special: 'Evade Buff Empowerment',
    },
  ],
});

const ELVEN_STRIDE_AIR = buildElvenStrideDefinition({
  key: 'elvenStrideAir',
  name: 'Elven Stride (Air)',
  lineageLabel: 'Air',
  lineageRows: [
    {
      name: 'Wind-First I',
      effect: `When you activate an Active Buff that grants Evade or movement-related positioning as one of its effects, you may increase that Buff's effective Power Level by +1 and its duration by +1 round. ${lineageUsesNote}`,
      special: 'Wind Buff Empowerment',
    },
    {
      name: 'Wind-First II',
      effect: `When you activate an Active Buff that grants Evade or movement-related positioning as one of its effects, you may increase that Buff's effective Power Level by +2 and its duration by +2 rounds. ${lineageUsesNote}`,
      special: 'Wind Buff Empowerment',
    },
    {
      name: 'Wind-First III',
      effect: `When you activate an Active Buff that grants Evade or movement-related positioning as one of its effects, you may increase that Buff's effective Power Level by +3 and its duration by +3 rounds. ${lineageUsesNote}`,
      special: 'Wind Buff Empowerment',
    },
  ],
});

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
    'A Titanborn with Titan Scars cannot wear mundane armor or bind another Body Artifact.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.meleeDamage',
    level: 2,
  },
  progressionPickIds: {
    1: 'ab-damage',
    3: 'active-ranged-single-heal',
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
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'You may activate Growth Form at Power Level 4. Uses your maintained Active Buff slot.',
      special: 'Growth Form',
    },
    {
      level: 2,
      name: 'Titan Might I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Titan Scars support the Might Ability: Melee Damage Stone Power and pre-fill Tier 2. You must still pay Tier 1.',
      special: 'Melee Damage Stone Power',
    },
    {
      level: 3,
      name: 'Titan Healing I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Titan Scars support the Vitality Ability: Remove Scar Stone Power. You pay the normal cost.',
      special: 'Remove Scar Stone Power',
    },
    {
      level: 4,
      name: 'Titan Growth II',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Growth Form improves to Power Level 10.',
      special: 'Growth Form',
    },
    {
      level: 5,
      name: 'Titan Might II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 3 of Might Ability: Melee Damage.',
      special: 'Melee Damage Stone Power',
    },
    {
      level: 6,
      name: 'Titan Healing II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Remove Scar through Titan Scars may recover 1 Scarred Health Bar (as the Stone Power describes).',
      special: 'Remove Scar Stone Power',
    },
    {
      level: 7,
      name: 'Titan Growth III',
      type: 'Active Buff',
      range: 'Self',
      duration: 'Mastery Rank Rounds',
      effect: 'Growth Form improves to Power Level 16.',
      special: 'Growth Form',
    },
    {
      level: 8,
      name: 'Titan Might III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 4 of Might Ability: Melee Damage.',
      special: 'Melee Damage Stone Power',
    },
    {
      level: 9,
      name: 'Titan Healing III',
      type: 'Stone Power Support',
      range: 'Self / Touch',
      duration: 'Instant',
      effect:
        'Remove Scar through Titan Scars may target yourself or one touched willing creature.',
      special: 'Remove Scar Stone Power',
    },
    {
      level: 10,
      name: 'True Titan Scars',
      type: 'Ultimate',
      range: 'Self / Touch',
      duration: 'Instant',
      effect:
        'Once per Safe Haven Rest, use Remove Scar through Titan Scars without paying its Stone cost.',
      special: 'True Titan Scars',
    },
  ],
};

// ----------------------------------------------------------------------
// Wyrm Scales (Dragonborn)
// ----------------------------------------------------------------------

const WYRM_SCALES: EchoArtifactDefinition = {
  key: 'wyrmScales',
  name: 'Wyrm Scales',
  echoKey: 'dragonborn',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'The heaviest form of Dragonborn natural armor — the character\u2019s body itself.',
  restriction:
    'A Dragonborn with Wyrm Scales cannot wear mundane armor or another Body Artifact.',
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.armor',
    level: 3,
  },
  progressionPickIds: {
    1: 'movement-flight',
    2: 'ab-armor',
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Heavy Echo Armor',
      note: '+16 to +25 Armor; heavy drawbacks scale with level.',
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
      name: 'Armor Buff Extension I',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Active Buffs that grant Armor gain +1 round duration.',
      special: 'Armor Buff Extension',
    },
    {
      level: 3,
      name: 'Armor Stone Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Wyrm Scales support the Vitality Ability ARMOR Stone Power and pre-fill Tier 2.',
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
      name: 'Armor Buff Extension II',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Active Buffs gain +2 rounds duration.',
      special: 'Armor Buff Extension',
    },
    {
      level: 6,
      name: 'Armor Stone Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 3 of the Vitality Ability ARMOR Stone Power.',
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
      name: 'Armor Buff Extension III',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Active Buffs gain +3 rounds duration.',
      special: 'Armor Buff Extension',
    },
    {
      level: 9,
      name: 'Armor Stone Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 4 of the Vitality Ability ARMOR Stone Power.',
      special: 'ARMOR Stone Power',
    },
    {
      level: 10,
      name: 'Dragon Transformation',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect: 'You unlock your Wyrm Dragon Form (transformation rules apply).',
      special: 'Wyrm Dragon Form',
    },
  ],
};

// ----------------------------------------------------------------------
// Serpent Scales (Dragonborn, lighter alternative)
// ----------------------------------------------------------------------

const SERPENT_SCALES: EchoArtifactDefinition = {
  key: 'serpentScales',
  name: 'Serpent Scales',
  echoKey: 'dragonborn',
  slot: 'body',
  baseProfile: 'bodyArmor',
  description: 'A lighter form of Dragonborn natural armor — flexible, smooth, built for movement.',
  restriction:
    'A Dragonborn with Serpent Scales cannot wear mundane armor or another Body Artifact.',
  progressionPickIds: {
    1: 'movement-flight',
    2: 'ab-evade',
    3: 'passive-evade',
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
      name: 'Dragon Wings I',
      type: 'Movement',
      range: 'Self',
      duration: 'Instant',
      effect: 'You may fly up to 6 m.',
      special: 'Flight',
    },
    {
      level: 2,
      name: 'Mobility Buff Extension I',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Active Buffs that grant Movement or Evade gain +1 round duration.',
      special: 'Mobility Buff Extension',
    },
    {
      level: 3,
      name: 'Evasion Stone Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Serpent Scales support the Agility Ability: Evade Stone Power and pre-fill Tier 2.',
      special: 'Evade Stone Power',
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
      name: 'Mobility Buff Extension II',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Mobility Active Buffs gain +2 rounds duration.',
      special: 'Mobility Buff Extension',
    },
    {
      level: 6,
      name: 'Evasion Stone Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 3 of the Agility Ability: Evade Stone Power.',
      special: 'Evade Stone Power',
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
      name: 'Mobility Buff Extension III',
      type: 'Support',
      range: 'Self',
      duration: 'Passive',
      effect: 'Mobility Active Buffs gain +3 rounds duration.',
      special: 'Mobility Buff Extension',
    },
    {
      level: 9,
      name: 'Evasion Stone Support III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 4 of the Agility Ability: Evade Stone Power.',
      special: 'Evade Stone Power',
    },
    {
      level: 10,
      name: 'Serpent Transformation',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect: 'You unlock your Serpent Dragon Form.',
      special: 'Serpent Dragon Form',
    },
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
  // Attack power is not attribute-bound, so it cannot be a slot-gated support;
  // Dragon Claws instead support the Might: Melee Damage Stone Power.
  stoneFunction: {
    kind: 'stonePowerSupport',
    attribute: 'might',
    stonePowerId: 'might.meleeDamage',
    level: 1,
    name: 'Extra Damage Support',
  },
  // Rending Spiral and Tail Sweep are real, editable catalog Powers — both are
  // self-centered Melee AoE weapon attacks that deal the current Claw / Tail
  // Weapon Damage in a radius. Only the names are overridden; the GM can add the
  // Bleeding / Push Specials and tune them freely in the Node Editor.
  progressionPickSpecs: {
    2: { name: 'Rending Spiral', templateId: 'active-melee-weapon-aoe' },
    3: { name: 'Tail Sweep', templateId: 'active-melee-weapon-aoe' },
  },
  baseValues: [
    {
      slot: 'a',
      label: 'Claw / Tail Damage',
      note: '4d8 to 16d8 across levels.',
    },
    {
      slot: 'b',
      label: 'Weapon Special',
      note: 'Penetration scaling from L4.',
    },
    {
      slot: 'c',
      label: 'Weapon Special',
      note: 'Brutal Impact scaling from L7.',
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
        'Dragon Claws support the Extra Might Damage Stone Power. They pre-fill Tier 2. You must still pay Tier 1 yourself.',
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
      special: 'Bleeding(3)',
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
        'Dragon Claws support the Extra Might Damage Stone Power. They pre-fill Tier 3. You must still pay Tier 1 and 2 yourself.',
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
      special: 'Bleeding(5)',
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
        'Dragon Claws support the Extra Might Damage Stone Power. They pre-fill Tier 4. You must still pay Tier 1, 2 and 3 yourself.',
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
      special: 'Bleeding(7)',
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
    {
      level: 10,
      name: 'True Dragon Claws',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect: 'Dragon Claws fully awaken. Choose or define one final Claw or Tail effect.',
      special: 'True Dragon Claws',
    },
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
    'A draconic head: a scaling Bite weapon, a Breath Weapon, the Draconic Roar armor aura, and stone-refreshing Draconic Recovery. Pick a Breath Shape and a Breath Special when the artifact is created.',
  restriction:
    'A Dragonborn with Dragon Head cannot wear another Head Artifact, helmet, mask, crown, or magical headgear.',
  // The Bite is a real, usable natural weapon (1d8…10d8) even though the Head
  // slot's artifactKind is gear. Occupies no hand slots.
  naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
  // The three Level Progression lines are real, editable catalog Powers, just
  // flavored with the Dragon Head names. Breath Weapon = a Ranged AoE Special
  // Damage active (Tier 4, default Ignite); Draconic Roar = the Armor Aura
  // Active Buff; Draconic Recovery = a Stone Refresh (Might). All editable in
  // the Node Editor; only the names are overridden.
  progressionPickSpecs: {
    1: { name: 'Breath Weapon', delivery: 'ranged-aoe', special: 'ignite' },
    2: { name: 'Draconic Roar', templateId: 'ab-armor-aura' },
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
      label: 'Scent of Blood',
      note: 'Detect from L4, Locate from L7, Identify at L10.',
    },
  ],
  levelProgression: [
    {
      level: 1,
      name: 'Breath Weapon I',
      type: 'Active',
      range: 'Self',
      aoe: 'Chosen Breath Shape',
      duration: 'Instant',
      effect: 'Bite Damage + 8d8 damage to affected creatures.',
      special: 'Chosen Breath Special',
    },
    {
      level: 2,
      name: 'Draconic Roar I',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 8 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +12 Armor.',
      special: 'Armor Aura',
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
      type: 'Active',
      range: 'Self',
      aoe: 'Chosen Breath Shape',
      duration: 'Instant',
      effect: 'Bite Damage + 16d8 damage to affected creatures.',
      special: 'Chosen Breath Special',
    },
    {
      level: 5,
      name: 'Draconic Roar II',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 20 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +28 Armor.',
      special: 'Armor Aura',
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
      type: 'Active',
      range: 'Self',
      aoe: 'Chosen Breath Shape',
      duration: 'Instant',
      effect: 'Bite Damage + 24d8 damage to affected creatures.',
      special: 'Chosen Breath Special',
    },
    {
      level: 8,
      name: 'Draconic Roar III',
      type: 'Active Buff',
      range: 'Self',
      aoe: 'Radius 32 m',
      duration: 'Mastery Rank Rounds',
      effect: 'You and allies in the area gain +44 Armor.',
      special: 'Armor Aura',
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
    {
      level: 10,
      name: 'True Dragon Head',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Choose or define one final Breath, Bite, Roar, Recovery, or Head effect with GM approval.',
      special: 'True Dragon Head',
    },
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
  progressionPickIds: {
    1: 'active-ranged-single-heal',
    2: 'ab-temp-hp',
    3: 'passive-regeneration',
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
      name: 'Single Heal I',
      type: 'Active',
      range: '8 m',
      duration: 'Instant',
      effect: 'Use a single-target healing Active at Power Level 4.',
      special: 'Healing',
    },
    {
      level: 2,
      name: 'Resolve Core I',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Sentinel Frame stores 2 Resolve Stones.',
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
      name: 'Single Heal II',
      type: 'Active',
      range: '8 m',
      duration: 'Instant',
      effect: 'Single Heal improves to Power Level 10.',
      special: 'Healing',
    },
    {
      level: 5,
      name: 'Special Reduction Support I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Sentinel Frame supports the Resolve Ability: Special Reduction Stone Power and pre-fills Tier 3.',
      special: 'Special Reduction Stone Power',
    },
    {
      level: 6,
      name: 'Resolve Core II',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Sentinel Frame stores 4 Resolve Stones.',
      special: 'Resolve Stones',
    },
    {
      level: 7,
      name: 'Single Heal III',
      type: 'Active',
      range: '8 m',
      duration: 'Instant',
      effect: 'Single Heal improves to Power Level 16.',
      special: 'Healing',
    },
    {
      level: 8,
      name: 'Healing Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Sentinel Frame pre-fills Tier 4 of the Resolve Ability: Healing Stone Power.',
      special: 'Healing Stone Power',
    },
    {
      level: 9,
      name: 'Special Reduction Support II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect:
        'Sentinel Frame pre-fills Tier 4 of the Resolve Ability: Special Reduction Stone Power.',
      special: 'Special Reduction Stone Power',
    },
    {
      level: 10,
      name: 'True Sentinel Frame',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Once per Safe Haven Rest, when you use Healing or Special Reduction through Sentinel Frame, treat one required lower Tier as already paid.',
      special: 'Resolve Stone Power',
    },
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
  progressionPickIds: {
    1: 'ab-armor',
    2: 'passive-regeneration',
    3: 'reaction-damage-reduction',
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
      special: 'Armor Buff Empowerment',
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
        'Judicator Frame supports the Regeneration Stone Power and pre-fills Tier 2.',
      special: 'Regeneration Stone Power',
    },
    {
      level: 4,
      name: 'Armor Hasten II',
      type: 'Active Buff Empowerment',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Buff Empowerment improves to +2 PL and +2 rounds.',
      special: 'Armor Buff Empowerment',
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
      effect: 'Pre-fills Tier 3 of the Regeneration Stone Power.',
      special: 'Regeneration Stone Power',
    },
    {
      level: 7,
      name: 'Armor Hasten III',
      type: 'Active Buff Empowerment',
      range: 'Self',
      duration: 'Passive',
      effect: 'Armor Buff Empowerment improves to +3 PL and +3 rounds.',
      special: 'Armor Buff Empowerment',
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
      effect: 'Pre-fills Tier 4 of the Regeneration Stone Power.',
      special: 'Regeneration Stone Power',
    },
    {
      level: 10,
      name: 'True Judicator Frame',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Once per Safe Haven Rest, when activating an Armor Active Buff through Armor Hasten, you may also use the supported Regeneration Stone Power as part of the same activation.',
      special: 'Armor / Regeneration',
    },
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
  progressionPickIds: {
    1: 'ab-armor',
    2: 'ab-special-overdrive',
    3: 'passive-temp-hp',
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
      name: 'Oracle Armor I',
      type: 'Base Armor',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Gain the shared Light Echo Armor value for this Artifact Level.',
      special: 'Armor',
    },
    {
      level: 2,
      name: 'Oracle Aid I',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Oracle Frame supports the Influence Ability: Aid Roll Stone Power and pre-fills Tier 2.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 3,
      name: 'Influence Core I',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Oracle Frame stores 2 Influence Stones.',
      special: 'Influence Stones',
    },
    {
      level: 4,
      name: 'Oracle Armor II',
      type: 'Base Armor',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Continue using the shared Light Echo Armor value.',
      special: 'Armor',
    },
    {
      level: 5,
      name: 'Oracle Aid II',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 3 of the Influence Ability: Aid Roll Stone Power.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 6,
      name: 'Influence Core II',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Oracle Frame stores 4 Influence Stones.',
      special: 'Influence Stones',
    },
    {
      level: 7,
      name: 'Oracle Armor III',
      type: 'Base Armor',
      range: 'Self',
      duration: 'Permanent',
      effect: 'Continue using the shared Light Echo Armor value.',
      special: 'Armor',
    },
    {
      level: 8,
      name: 'Oracle Aid III',
      type: 'Stone Power Support',
      range: 'Self',
      duration: 'Instant',
      effect: 'Pre-fills Tier 4 of the Influence Ability: Aid Roll Stone Power.',
      special: 'Aid Roll Stone Power',
    },
    {
      level: 9,
      name: 'Influence Core III',
      type: 'Stone Pool',
      range: 'Self',
      duration: 'Passive',
      effect: 'After each Safe Haven Rest, Oracle Frame stores 8 Influence Stones.',
      special: 'Influence Stones',
    },
    {
      level: 10,
      name: 'True Oracle Frame',
      type: 'Ultimate',
      range: 'Self',
      duration: 'Special',
      effect:
        'Once per Safe Haven Rest, when you use Aid Roll through Oracle Frame, treat one required lower Tier as already paid.',
      special: 'Aid Roll Stone Power',
    },
  ],
};

// ----------------------------------------------------------------------
// Registry
// ----------------------------------------------------------------------

export const ECHO_ARTIFACTS: Record<string, EchoArtifactDefinition> = {
  stoneboundSoles: STONEBOUND_SOLES,
  elvenStrideFire: ELVEN_STRIDE_FIRE,
  elvenStrideEarth: ELVEN_STRIDE_EARTH,
  elvenStrideWater: ELVEN_STRIDE_WATER,
  elvenStrideAir: ELVEN_STRIDE_AIR,
  titanScars: TITAN_SCARS,
  wyrmScales: WYRM_SCALES,
  serpentScales: SERPENT_SCALES,
  dragonClaws: DRAGON_CLAWS,
  dragonHead: DRAGON_HEAD,
  sentinelFrame: SENTINEL_FRAME,
  judicatorFrame: JUDICATOR_FRAME,
  oracleFrame: ORACLE_FRAME,
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
  elves: {
    echoKey: 'elves',
    requiredAtCreation: 1,
    maxAtCreation: 1,
    availableKeys: ['elvenStrideFire', 'elvenStrideEarth', 'elvenStrideWater', 'elvenStrideAir'],
    exclusiveGroups: [['elvenStrideFire', 'elvenStrideEarth', 'elvenStrideWater', 'elvenStrideAir']],
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
  dragonborn: {
    echoKey: 'dragonborn',
    requiredAtCreation: 1,
    maxAtCreation: 3,
    // Claws (both hands), Head (head) and one Body armor. Wyrm Scales and
    // Serpent Scales both occupy the Body slot, so they are mutually exclusive.
    availableKeys: ['dragonClaws', 'dragonHead', 'wyrmScales', 'serpentScales'],
    exclusiveGroups: [['wyrmScales', 'serpentScales']],
  },
  unbound: { echoKey: 'unbound', requiredAtCreation: 0, maxAtCreation: 0, availableKeys: [] },
};

/** Lookup an Echo Artifact by key. */
export function getEchoArtifact(key: string | null | undefined): EchoArtifactDefinition | null {
  if (!key) return null;
  return ECHO_ARTIFACTS[key] ?? null;
}

/** Rules block for an Echo (returns Human default if unknown). */
export function getEchoArtifactRules(echoKey: string | null | undefined): EchoArtifactRules {
  if (!echoKey) return ECHO_ARTIFACT_RULES.humans;
  return ECHO_ARTIFACT_RULES[echoKey] ?? ECHO_ARTIFACT_RULES.humans;
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
    if (spec.delivery && spec.special) {
      const resolved = resolvePickFromUi(spec.delivery, spec.special);
      picks[lvl - 1] = {
        level: lvl,
        kind: 'power',
        powerTemplateId: resolved.powerTemplateId,
        delivery: resolved.delivery,
        chosenSpecial: resolved.chosenSpecial,
        displayName,
      };
    } else if (spec.templateId) {
      picks[lvl - 1] = { level: lvl, kind: 'power', powerTemplateId: spec.templateId, displayName };
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
      def.baseProfile === 'twoHandedWeapon' || def.baseProfile === 'oneHandedWeapon'
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
