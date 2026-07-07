/**
 * Echo Artifact Tree Builder (pure)
 *
 * Turns an `EchoArtifactDefinition` (see `src/utils/echo-artifacts.ts`) into a
 * full Artifact Builder *tree*: one Folder + ten linked `artifact` node items
 * (Level 1 .. Level 10), exactly the shape the Node Editor / Artifact Builder
 * produce. Nodes are linked through the stable custom `nodeId` flags
 * (`parentIds` / `childIds`), NOT document `_id`, so a generated tree survives
 * compendium import and duplication intact.
 *
 * This module is **pure**: no Foundry globals, no `game`, no DOM, no random.
 * Node ids are deterministic (`<key>-l<level>`) so repeated builds — at runtime
 * seeding and at pack-compile time (plain Node) — produce identical, stable
 * trees. That is exactly what lets the world library and the shipped pack stay
 * in sync with zero drift.
 */

import type {
  ArtifactBaseValue,
  ArtifactBaseValueType,
  ArtifactLevelProgressionRow,
  EmbeddedPowerData,
  PowerCategory,
  PowerLevelKey,
  PowerLevelRow,
} from '../types/item.js';
import type { EchoArtifactDefinition } from '../utils/echo-artifacts.js';
import {
  ECHO_ARTIFACTS,
  buildEchoStoneFunction,
  buildEchoProgressionPicks,
} from '../utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../utils/general-artifacts.js';
import type { GeneralArtifactDefinition } from '../utils/general-artifacts.js';
import type { ArtifactProgressionPick } from '../types/item.js';
import {
  bodyArmorBonusForLevel,
  feetEvadeForLevel,
  minorArmorForLevel,
  noArmorEvadeForLevel,
  weaponDamageForLevel,
  spellFocusForLevel,
} from '../utils/artifact-base-derive.js';
import { getArmorDefinitionForType } from '../utils/equipment.js';
import {
  resolveFullLevelProgression,
  visibleAbilityRows,
} from '../utils/artifact-visible-abilities.js';
import {
  getMinorMovementBaselineB,
  getPaperdollSlotsForArtifact,
} from '../utils/artifact-rules.js';

/**
 * Content version of the generated trees. Bump this whenever the generator's
 * output (base values, powers, slot/profile, etc.) changes so the world seeder
 * can detect stale library copies and refresh them in place.
 */
export const ECHO_ARTIFACT_SEED_VERSION = 26;

const ARTIFACT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const ALL_POWER_LEVEL_KEYS: PowerLevelKey[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
];

// ---------------------------------------------------------------------------
// Per-level Base Value tables (exact, per the Player's Guide / Artefacts.md)
// ---------------------------------------------------------------------------

/** Two-handed weapon damage — 4d8 base + 1d8 per level (5d8 L1 … 14d8 L10). */
function twoHandedEchoDamageForLevel(level: number): string {
  return weaponDamageForLevel(level, 'twoHandedWeapon');
}
/** Value-based Weapon Special rank by Artifact level breakpoints (L1/L4/L7/L10). */
function weaponSpecialRankForLevel(table: [number, number, number, number], level: number): number {
  const l = clampLevel(level);
  if (l >= 10) return table[3];
  if (l >= 7) return table[2];
  if (l >= 4) return table[1];
  return table[0];
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
}

/** Scent of Blood tier — Detect L4, Locate L7, Identify L10. */
function scentOfBloodTierForLevel(level: number): string {
  const l = clampLevel(level);
  if (l >= 10) return 'Identify';
  if (l >= 7) return 'Locate';
  if (l >= 4) return 'Detect';
  return '';
}

// --- General-artifact per-level tables (Artifact Examples, Player's Guide) ---

/** One-handed weapon damage — 2d8 base + 1d8 per level (3d8 L1 … 12d8 L10). */
function oneHandedGeneralDamageForLevel(level: number): string {
  return weaponDamageForLevel(level, 'oneHandedWeapon');
}
/** Staff of the Dark Spell Focus Bonus — one-handed: 1:1 weapon damage (+3d8 L1 … +12d8 L10). */
function staffSpellFocusBonusForLevel(level: number): string {
  return spellFocusForLevel(level, 'oneHandedWeapon');
}
/** Staff of the Dark Hex rank — Hex(2) L4-5, Hex(3) L6-7, Hex(4) L8-9, Hex(5) L10. */
function hexRankForLevel(level: number): number {
  const l = clampLevel(level);
  if (l >= 10) return 5;
  if (l >= 8) return 4;
  if (l >= 6) return 3;
  return 2;
}
/** Soul Sigil Silver Veil Evade — +7 (L1) … +16 (L10), +6 base +1/level. */
function soulSigilEvadeForLevel(level: number): number {
  return noArmorEvadeForLevel(level);
}
/** Shadowgrave Armor hybrid Armor — 4,4,5,5,6,6,7,7,8,9. */
const SHADOWGRAVE_ARMOR_TABLE = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9];
function shadowgraveArmorForLevel(level: number): number {
  return SHADOWGRAVE_ARMOR_TABLE[clampLevel(level) - 1];
}
/** Shadowgrave Armor hybrid Evade — +4 (L1) … +13 (L10), +1 per level. */
function shadowgraveEvadeForLevel(level: number): number {
  return 3 + clampLevel(level);
}
/** Starfallen Forceshield Shield Value — +4,+4,+4,+5,+5,+5,+6,+6,+6,+8. */
const STARFALLEN_SHIELD_TABLE = [4, 4, 4, 5, 5, 5, 6, 6, 6, 8];
function starfallenShieldValueForLevel(level: number): number {
  return STARFALLEN_SHIELD_TABLE[clampLevel(level) - 1];
}
/** Frostbound Returning Axe thrown range — 9 m (L4) … 15 m (L10). */
function frostboundThrownRangeForLevel(level: number): number {
  return clampLevel(level) + 5;
}
/** Lor-Keth's Staff weapon damage — two-handed: 4d8 base + 1d8/level (5d8 … 14d8). */
function lorKethStaffDamageForLevel(level: number): string {
  return weaponDamageForLevel(level, 'twoHandedWeapon');
}
/** Lor-Keth's Staff Storm Rune tier — Shock Rune L4-6, Greater L7-9, True L10. */
function lorKethStormRuneForLevel(level: number): string {
  const l = clampLevel(level);
  if (l < 4) return '';
  if (l >= 10) return 'True Shock Rune';
  if (l >= 7) return 'Greater Shock Rune';
  return 'Shock Rune';
}
/** Lor-Keth's Staff Giant Weight tier — Giant Weight L7-9, True L10. */
function lorKethGiantWeightForLevel(level: number): string {
  const l = clampLevel(level);
  if (l < 7) return '';
  if (l >= 10) return 'True Giant Weight';
  return 'Giant Weight';
}

/** A single Base Value slot on an echo artifact, with an exact per-level value. */
interface BaseValueSpec {
  slot: 'a' | 'b' | 'c';
  type: ArtifactBaseValueType;
  label: string;
  /** Artifact level at which this slot unlocks (a=1, b=4, c=7 per spec). */
  unlock: number;
  /** Exact resolved value at the given artifact level. */
  valueAt: (level: number) => number | string;
  note?: string;
  /** Light / Medium / Heavy — `valueAt` returns artifact bonus only; mundane base added at runtime. */
  armorWeightClass?: 'light' | 'medium' | 'heavy';
}

/**
 * Per-echo-artifact Base Value tables. The numbers are the system's canonical
 * baselines (see `artifact-base-derive.ts` / Artefacts.md). Echo body armor
 * stores the artifact bonus only; mundane Light/Medium/Heavy base is added at runtime.
 */
const BASE_VALUE_TABLES: Record<string, BaseValueSpec[]> = {
  stoneboundSoles: [
    { slot: 'a', type: 'sense', label: 'Tremorsense', unlock: 1, valueAt: () => 0, note: 'Ground-contact detection; depth scales with level.' },
    { slot: 'b', type: 'headArmor', label: 'Armor (Feet)', unlock: 4, valueAt: (l) => minorArmorForLevel(l) },
  ],
  elorianStride: [
    { slot: 'a', type: 'evade', label: 'Evade', unlock: 1, valueAt: (l) => feetEvadeForLevel(l) },
    { slot: 'b', type: 'movement', label: 'Movement', unlock: 4, valueAt: (l) => getMinorMovementBaselineB(l) },
  ],
  // Titan Scars (Titanborn) has one variant per Attribute affinity
  // (titanScarsMight, titanScarsAgility, …). All share the same Medium Echo Armor
  // base value, so generate the identical table for every variant key.
  ...Object.fromEntries(
    ['Might', 'Agility', 'Vitality', 'Intellect', 'Resolve', 'Influence', 'Wits'].map((attr) => [
      `titanScars${attr}`,
      [
        {
          slot: 'a',
          type: 'bodyArmor',
          label: 'Medium Echo Armor',
          armorWeightClass: 'medium',
          unlock: 1,
          valueAt: (l: number) => bodyArmorBonusForLevel(l),
          note: 'Medium Armor: Evade −2, Initiative −4, −1d8 Physical Skills.',
        },
      ] as BaseValueSpec[],
    ]),
  ),
  wyrmScalesHeavy: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Heavy Echo Armor',
      armorWeightClass: 'heavy',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Heavy Armor: Evade −4, Initiative −8, −2d8 Physical Skills.',
    },
  ],
  wyrmScalesMedium: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Medium Echo Armor',
      armorWeightClass: 'medium',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Medium Armor: Evade −2, Initiative −4, −1d8 Physical Skills.',
    },
  ],
  wyrmScalesLight: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Light Echo Armor',
      armorWeightClass: 'light',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Light Armor: no class drawbacks.',
    },
  ],
  dragonClaws: [
    { slot: 'a', type: 'weaponDamage', label: 'Claw / Tail Damage', unlock: 1, valueAt: (l) => twoHandedEchoDamageForLevel(l) },
    { slot: 'b', type: 'weaponSpecial', label: 'Penetration', unlock: 4, valueAt: (l) => weaponSpecialRankForLevel([2, 4, 6, 8], l) },
    { slot: 'c', type: 'weaponSpecial', label: 'Brutal Impact', unlock: 7, valueAt: (l) => weaponSpecialRankForLevel([3, 5, 7, 9], l) },
  ],
  sentinelFrame: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Light Echo Armor',
      armorWeightClass: 'light',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Light Armor: no class drawbacks.',
    },
  ],
  judicatorFrame: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Light Echo Armor',
      armorWeightClass: 'light',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Light Armor: no class drawbacks.',
    },
  ],
  oracleFrame: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Light Echo Armor',
      armorWeightClass: 'light',
      unlock: 1,
      valueAt: (l) => bodyArmorBonusForLevel(l),
      note: 'Light Armor: no class drawbacks.',
    },
  ],
  dragonHead: [
    { slot: 'a', type: 'weaponDamage', label: 'Bite Weapon Damage', unlock: 1, valueAt: (l) => weaponDamageForLevel(l) },
    {
      slot: 'b',
      type: 'sense',
      label: 'Scent of Blood',
      unlock: 4,
      valueAt: (l) => scentOfBloodTierForLevel(l),
      note: 'Detect from L4, Locate from L7, Identify at L10.',
    },
  ],

  // --- General artifacts (Artifact Examples) ---
  moonlightGreatsword: [
    { slot: 'a', type: 'weaponDamage', label: 'Weapon Damage', unlock: 1, valueAt: (l) => twoHandedEchoDamageForLevel(l) },
    { slot: 'b', type: 'weaponSpecial', label: 'Smite', unlock: 4, valueAt: (l) => weaponSpecialRankForLevel([0, 4, 8, 8], l) },
    { slot: 'c', type: 'weaponSpecial', label: 'Expose', unlock: 7, valueAt: (l) => weaponSpecialRankForLevel([0, 0, 4, 8], l) },
  ],
  soulSigil: [
    {
      slot: 'a',
      type: 'evade',
      label: 'Evade (Silver Veil)',
      unlock: 1,
      valueAt: (l) => soulSigilEvadeForLevel(l),
      note: 'Silver Veil is not Armor; the Soul Sigil grants no Armor.',
    },
  ],
  frostboundReturningAxe: [
    { slot: 'a', type: 'weaponDamage', label: 'Weapon Damage', unlock: 1, valueAt: (l) => oneHandedGeneralDamageForLevel(l) },
    {
      slot: 'b',
      type: 'thrownRange',
      label: 'Thrown Return',
      unlock: 4,
      valueAt: (l) => `${frostboundThrownRangeForLevel(l)} m`,
      note: 'Returning: the Axe returns to the wielder after the attack resolves.',
    },
  ],
  shadowgraveArmor: [
    {
      slot: 'a',
      type: 'bodyArmor',
      label: 'Hybrid Defense (Armor)',
      armorWeightClass: 'light',
      unlock: 1,
      valueAt: (l) => shadowgraveArmorForLevel(l) - 4,
      note: 'Light Armor base + hybrid bonus. No Damage Reduction, no Phasing.',
    },
    {
      slot: 'a',
      type: 'evade',
      label: 'Hybrid Defense (Evade)',
      unlock: 1,
      valueAt: (l) => shadowgraveEvadeForLevel(l),
    },
  ],
  staffOfTheDark: [
    {
      slot: 'a',
      type: 'minorFeature',
      label: 'Spell Focus Bonus',
      unlock: 1,
      valueAt: (l) => staffSpellFocusBonusForLevel(l),
      note: 'Added to damage of Spells cast through the Staff; never to weapon attacks.',
    },
    {
      slot: 'b',
      type: 'weaponSpecial',
      label: 'Hex',
      unlock: 4,
      valueAt: (l) => hexRankForLevel(l),
      note: 'Focus Special — applies only if the Spell can legally carry it.',
    },
  ],
  starfallenForceshield: [
    {
      slot: 'a',
      type: 'shieldValue',
      label: 'Shield Value',
      unlock: 1,
      valueAt: (l) => starfallenShieldValueForLevel(l),
      note: 'Drawback: -2d8 Physical Skill Checks. Stacks with Armor Value as normal Armor resolution.',
    },
  ],
  lanternOfTheHollowStar: [],
  lorKethsStaff: [
    { slot: 'a', type: 'weaponDamage', label: 'Staff Damage', unlock: 1, valueAt: (l) => lorKethStaffDamageForLevel(l) },
    {
      slot: 'b',
      type: 'sense',
      label: 'Storm Rune',
      unlock: 4,
      valueAt: (l) => lorKethStormRuneForLevel(l),
      note: 'Base item feature; does not create attacks, actions, Stone uses, or reactions by itself.',
    },
    {
      slot: 'c',
      type: 'sense',
      label: 'Giant Weight',
      unlock: 7,
      valueAt: (l) => lorKethGiantWeightForLevel(l),
      note: 'Base item feature; requires both hands.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Level Progression row → embedded power mapping
// ---------------------------------------------------------------------------

/** Map the Player's-Guide "Type" column onto an embedded-power category. */
function categoryForRowType(rowType: string): PowerCategory {
  const t = String(rowType || '').toLowerCase();
  if (t.includes('reaction')) return 'reaction';
  if (t.includes('movement')) return 'movement';
  if (t.includes('active buff') || t.includes('buff')) return 'activeBuff';
  if (t.startsWith('active') || t === 'active' || t.includes('active,')) return 'active';
  // Catalog martial / attack row types (e.g. "Ranged AoE", "Melee", "Ranged
  // Single") are Actives that deliver an attack.
  if (
    t.includes('aoe') ||
    t.includes('attack') ||
    t === 'melee' ||
    t === 'ranged' ||
    t.startsWith('melee ') ||
    t.startsWith('ranged ')
  ) {
    return 'active';
  }
  // Stone Functions, Support, Base Armor, Passive, Ultimate → passive (descriptive).
  return 'passive';
}

function actionCostForCategory(cat: PowerCategory): 'attack' | 'movement' | 'full' | 'reaction' | 'none' {
  switch (cat) {
    case 'active':
      return 'attack';
    case 'activeBuff':
      return 'full';
    case 'reaction':
      return 'reaction';
    case 'movement':
      return 'movement';
    case 'passive':
    default:
      return 'none';
  }
}

/** Power Level a power is granted at, by Artifact Stage (Basic 4 / Improved 10 / Greater 16). */
function powerLevelForArtifactLevel(level: number): PowerLevelKey {
  const l = clampLevel(level);
  if (l <= 3) return '4';
  if (l <= 6) return '10';
  return '16';
}

function parseRange(raw: string | undefined): PowerLevelRow['range'] {
  const s = String(raw || '').trim();
  if (!s || s === '-' || s === '—') return null;
  const low = s.toLowerCase();
  if (low === 'self') return { kind: 'self' };
  if (low.includes('touch')) return { kind: 'touch' };
  if (low.includes('melee') || low.includes('reach')) return { kind: 'melee' };
  if (low.includes('thrown')) return { kind: 'distance', note: 'Thrown Range' };
  const m = s.match(/(\d+)\s*m/);
  if (m) return { kind: 'distance', m: Number(m[1]) };
  return { kind: 'self', note: s };
}

function parseAoe(raw: string | undefined): PowerLevelRow['aoe'] {
  const s = String(raw || '').trim();
  if (!s || s === '-' || s === '—') return null;
  const m = s.match(/(\d+)\s*m/);
  const meters = m ? Number(m[1]) : undefined;
  const low = s.toLowerCase();
  if (low.includes('cone')) return { shape: 'cone', m: meters, radiusM: meters };
  if (low.includes('line')) return { shape: 'line', m: meters, lengthM: meters };
  if (low.includes('aura')) return { shape: 'aura', m: meters, radiusM: meters };
  if (low.includes('radius') || meters != null) return { shape: 'radius', m: meters, radiusM: meters };
  return { shape: 'radius', note: s };
}

function parseDuration(raw: string | undefined): PowerLevelRow['duration'] {
  const s = String(raw || '').trim();
  const low = s.toLowerCase();
  if (!s || low === 'instant') return { kind: 'instant' };
  if (low.includes('mastery rank')) return { kind: 'masteryRankRounds' };
  if (low.includes('mastery')) return { kind: 'masteryRounds' };
  if (low.includes('passive') || low.includes('permanent')) return { kind: 'scene' };
  const m = s.match(/(\d+)\s*round/);
  if (m) return { kind: 'rounds', rounds: Number(m[1]) };
  if (low.includes('round')) return { kind: 'rounds', rounds: 1 };
  if (low.includes('trigger')) return { kind: 'untilNextTurn', note: s };
  if (low === 'special') return { kind: 'instant', note: 'Special' };
  return { kind: 'instant', note: s };
}

function emptyLevelRow(): PowerLevelRow {
  return { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] };
}

/** Build the EmbeddedPowerData for a single Level Progression row of an artifact. */
function buildEmbeddedPower(
  echoArtifactKey: string,
  row: ArtifactLevelProgressionRow,
): EmbeddedPowerData {
  const category = categoryForRowType(row.type);
  const plKey = powerLevelForArtifactLevel(row.level);
  const levels = {} as Record<PowerLevelKey, PowerLevelRow>;
  for (const k of ALL_POWER_LEVEL_KEYS) levels[k] = emptyLevelRow();
  levels[plKey] = {
    type: row.type || '',
    range: parseRange(row.range),
    aoe: parseAoe(row.aoe),
    duration: parseDuration(row.duration),
    effect: { text: row.effect || '' },
    specials: [],
    lvl: row.level,
  };
  const tags: string[] = [];
  const lowType = String(row.type || '').toLowerCase();
  if (lowType.includes('spell')) tags.push('spell');
  if (lowType.includes('stone')) tags.push('stone-function');
  return {
    id: `${echoArtifactKey}-pw-${row.level}`,
    name: row.name,
    fluff: row.special ? `Special: ${row.special}` : undefined,
    category,
    tags,
    cost: { action: actionCostForCategory(category) },
    levels,
  };
}

// ---------------------------------------------------------------------------
// Tree assembly
// ---------------------------------------------------------------------------

function deriveArtifactKind(baseProfile: string): 'weapon' | 'shield' | 'armor' | 'gear' {
  switch (baseProfile) {
    case 'oneHandedWeapon':
    case 'oneHandedWeaponRanged':
    case 'twoHandedWeapon':
    case 'twoHandedWeaponRanged':
      return 'weapon';
    case 'shield':
      return 'shield';
    case 'bodyArmor':
    case 'noArmorBody':
    case 'robe':
      return 'armor';
    default:
      return 'gear';
  }
}

function iconForKind(kind: string): string {
  switch (kind) {
    case 'weapon':
      return 'icons/svg/sword.svg';
    case 'shield':
      return 'icons/svg/shield.svg';
    case 'armor':
      return 'icons/svg/statue.svg';
    default:
      return 'icons/svg/upgrade.svg';
  }
}

/** Resolve the exact Base Values present on a node at the given artifact level. */
function baseValuesAtLevel(echoArtifactKey: string, level: number): ArtifactBaseValue[] {
  const specs = BASE_VALUE_TABLES[echoArtifactKey] || [];
  const out: ArtifactBaseValue[] = [];
  for (const spec of specs) {
    if (level < spec.unlock) continue; // slot not unlocked yet at this level
    out.push({
      slot: spec.slot,
      type: spec.type,
      label: spec.label,
      value: spec.valueAt(level),
      note: spec.note,
      isBaseline: true,
      ...(spec.armorWeightClass ? { armorWeightClass: spec.armorWeightClass } : {}),
    });
  }
  return out;
}

/** Weapon profile for weapon-kind echo artifacts at the given level (damage scales). */
function weaponProfileAtLevel(def: EchoArtifactDefinition, level: number): Record<string, unknown> {
  const table = BASE_VALUE_TABLES[def.key] || [];
  const hasSpellFocus = table.some((b) => b.type === 'spellFocus');
  const dmgBv = table.find((b) => b.type === 'weaponDamage');
  // Spell Focus weapons deal no normal weapon damage — their value boosts Spells.
  const damage = hasSpellFocus
    ? '0'
    : dmgBv
      ? String(dmgBv.valueAt(level))
      : weaponDamageForLevel(level, def.baseProfile);
  const isRanged =
    def.baseProfile === 'oneHandedWeaponRanged' || def.baseProfile === 'twoHandedWeaponRanged';
  const hands =
    def.baseProfile === 'twoHandedWeapon' || def.baseProfile === 'twoHandedWeaponRanged' ? 2 : 1;
  return {
    weaponType: isRanged ? 'ranged' : 'melee',
    damage,
    range: '0m',
    hands,
    innateAbilities: [],
    specials: [],
  };
}

/**
 * Natural-weapon profile for a non-weapon-slot artifact that still grants a
 * usable attack (e.g. Dragon Head's Bite). Damage comes from the artifact's
 * `weaponDamage` Base Value table so it scales 1d8…10d8 across levels.
 */
function naturalWeaponProfileAtLevel(def: EchoArtifactDefinition, level: number): Record<string, unknown> {
  const nw = def.naturalWeapon!;
  const dmgBv = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'weaponDamage');
  const damage = dmgBv ? String(dmgBv.valueAt(level)) : weaponDamageForLevel(level);
  const weaponType = nw.weaponType || 'melee';
  const hands = Number.isFinite(nw.hands) ? Number(nw.hands) : 0;
  const range = weaponType === 'ranged' && nw.rangeM ? `${nw.rangeM}m` : '0m';
  return {
    weaponType,
    damage,
    range,
    hands,
    innateAbilities: [],
    specials: nw.specials || [],
    ...(nw.name ? { name: nw.name } : {}),
  };
}

/** Shield profile for shield-kind artifacts at the given level (Shield Value scales). */
function shieldProfileAtLevel(def: EchoArtifactDefinition, level: number): Record<string, unknown> {
  const shieldBv = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'shieldValue');
  const shieldValue = shieldBv ? Number(shieldBv.valueAt(level)) || 0 : 0;
  return { type: 'medium', shieldValue, evadeBonus: 0, skillPenalty: '-2d8 Physical Skill Checks' };
}

/** Body armor profile for armor-kind artifacts (weight class + artifact bonus). */
function armorProfileAtLevel(def: EchoArtifactDefinition, level: number): Record<string, unknown> | null {
  const bodySpec = (BASE_VALUE_TABLES[def.key] || []).find((b) => b.type === 'bodyArmor');
  if (!bodySpec?.armorWeightClass) return null;
  const armorDef = getArmorDefinitionForType(bodySpec.armorWeightClass);
  if (!armorDef) return null;
  const bonus = Number(bodySpec.valueAt(level)) || 0;
  return {
    type: bodySpec.armorWeightClass,
    armorValue: bonus,
    evadeModifier: armorDef.evadeModifier,
    skillPenalty: armorDef.skillPenalty === '—' ? '' : armorDef.skillPenalty,
  };
}

/** One generated node (artifact item data minus its folder, which is set at seed time). */
export interface GeneratedArtifactNode {
  nodeId: string;
  level: number;
  isRoot: boolean;
  parentNodeId: string | null;
  childNodeId: string | null;
  /** Foundry-ready item data (folder injected by the seeder / pack writer). */
  itemData: Record<string, unknown>;
}

export interface GeneratedArtifactTree {
  echoArtifactKey: string;
  echoKey: string;
  /** Display name for the world folder / compendium folder. */
  folderName: string;
  /** The 10 nodes, ordered Level 1 → Level 10. */
  nodes: GeneratedArtifactNode[];
}

/**
 * Build the full 10-node linear tree for one Echo Artifact.
 *
 * Node naming matches the Artifact Builder convention (`<Name> - Level N-1`).
 * Each node stores only the abilities unlocked at that level (1 / 2 / 3 slots,
 * upgrading in place at L4 and L7) plus embedded powers for those rows. Base
 * Values are resolved to their exact value at each node's level.
 */
export function buildEchoArtifactTree(def: EchoArtifactDefinition): GeneratedArtifactTree {
  // General (non-Echo) artifacts use the same authoring shape with an empty
  // `echoKey`: they bind as 'bound', never carry the `echoBound` flag, and
  // their authored Level Progression tables are the source of truth (no
  // picks-derived recompilation).
  const isGeneral = !def.echoKey;
  const kind = deriveArtifactKind(def.baseProfile);
  const img = iconForKind(kind);
  const paperdollOverride = (def as GeneralArtifactDefinition).paperdollSlots;
  const paperdoll =
    paperdollOverride && paperdollOverride.length > 0
      ? paperdollOverride
      : getPaperdollSlotsForArtifact(def.slot as any, def.baseProfile as any);

  const picks = buildEchoProgressionPicks(def) as ArtifactProgressionPick[];
  // General artifacts normally use their authored table verbatim. When a general
  // artifact opts into standard catalog Powers via `progressionPickSpecs` (e.g.
  // the Moonlight Greatsword), derive its 1–9 rows from those picks and keep only
  // the authored L10 Ultimate — so the rows are real Powers, not "authored" text.
  const generalUsesPicks = isGeneral && !!def.progressionPickSpecs;
  const fullProgression =
    isGeneral && !generalUsesPicks
      ? [...def.levelProgression]
      : resolveFullLevelProgression(def.levelProgression, picks);

  const nodeId = (level: number) => `${def.key}-l${level}`;

  const nodes: GeneratedArtifactNode[] = ARTIFACT_LEVELS.map((level) => {
    const isRoot = level === 1;
    const parentNodeId = isRoot ? null : nodeId(level - 1);
    const childNodeId = level === 10 ? null : nodeId(level + 1);

    const isWeapon = kind === 'weapon';
    const levelProgression = visibleAbilityRows(fullProgression, level);
    const powers = levelProgression.map((row) => buildEmbeddedPower(def.key, row));

    const system: Record<string, unknown> = {
      level,
      currentLevel: level,
      equipped: false,
      effects: [],
      artifactKind: kind,
      gearSlot:
        def.slot === 'head' || def.slot === 'feet' || def.slot === 'amulet' || def.slot === 'ring'
          ? def.slot
          : '',
      slot: def.slot,
      baseProfile: def.baseProfile,
      binding: isGeneral ? 'bound' : 'echo',
      echoKey: def.echoKey,
      baseValues: baseValuesAtLevel(def.key, level),
      levelProgression,
      stoneFunction:
        def.stoneFunction && level >= def.stoneFunction.level
          ? buildEchoStoneFunction(def)
          : null,
      progressionPicks: picks,
      lore: def.description,
      description: def.restriction ? `${def.description}\n\n${def.restriction}` : def.description,
      bonuses: { attack: 0, damage: '', defense: 0, specials: [] },
      requirements: { stones: 0, masteryRank: 1 },
      powers,
      inventorySize: '1x1',
      ...(isWeapon
        ? { artifactWeapon: weaponProfileAtLevel(def, level) }
        : def.naturalWeapon
          ? { artifactWeapon: naturalWeaponProfileAtLevel(def, level) }
          : {}),
      ...(kind === 'shield' ? { artifactShield: shieldProfileAtLevel(def, level) } : {}),
      ...(kind === 'armor' ? { artifactArmor: armorProfileAtLevel(def, level) } : {}),
      ...(paperdoll.length ? { equipSlots: paperdoll } : {}),
    };

    const itemData: Record<string, unknown> = {
      name: `${def.name} - Level ${level}-1`,
      type: 'artifact',
      img,
      system,
      flags: {
        'mastery-system': {
          nodeId: nodeId(level),
          parentIds: parentNodeId ? [parentNodeId] : [],
          childIds: childNodeId ? [childNodeId] : [],
          ...(isRoot ? { isRoot: true } : {}),
          ...(isGeneral ? {} : { echoBound: def.echoKey }),
          echoArtifactKey: def.key,
          seedVersion: ECHO_ARTIFACT_SEED_VERSION,
        },
      },
    };

    return { nodeId: nodeId(level), level, isRoot, parentNodeId, childNodeId, itemData };
  });

  return {
    echoArtifactKey: def.key,
    echoKey: def.echoKey,
    folderName: def.name,
    nodes,
  };
}

/** Build trees for every Echo Artifact in the catalog. */
export function buildAllEchoArtifactTrees(): GeneratedArtifactTree[] {
  return Object.values(ECHO_ARTIFACTS).map((def) => buildEchoArtifactTree(def));
}

/** Build trees for every General (bound, non-Echo) Artifact in the catalog. */
export function buildAllGeneralArtifactTrees(): GeneratedArtifactTree[] {
  return Object.values(GENERAL_ARTIFACTS).map((def) => buildEchoArtifactTree(def));
}
