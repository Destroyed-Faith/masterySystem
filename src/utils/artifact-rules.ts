/**
 * Artifact Rules — canonical reference for the new Artifact spec.
 *
 * Sources: `D:\DestroyedFaith\Powers\Artefacts.md` and the Player's Guide
 * "Artifacts" / "Echo Artifacts" sections.
 *
 * This module is the single source of truth for:
 *   • The 7 canonical Equipment Slots.
 *   • Per-Slot Base Value limits (1–2 depending on slot).
 *   • Per-Slot allowed Attributes for Stone Functions.
 *   • Per-Slot Power Access restrictions (what slot may grant).
 *   • Artifact Level Stage mapping (Basic / Improved / Greater / Ultimate).
 *   • Default Power Level per Stage (PL 4 / 10 / 16).
 *   • All baseline scaling tables: weapon damage, thrown range, weapon
 *     specials, body armor bonus, no-armor evade, head minor armor,
 *     feet evade / movement, minor movement (Base Value B), passive
 *     reinforcement, save/ward support, stone function scaling, and so on.
 *
 * Everything in this file is pure data + pure helpers — no Foundry types,
 * no DOM, no item mutation. It is consumed by:
 *   • `src/utils/artifact-actor-rules.ts` (capacity / binding)
 *   • `src/artifacts/node-editor.ts` (builder UI constraints)
 *   • `src/artifacts/artifact-evolution-dialog.ts` (player progression)
 *   • `src/utils/echos/*` (echo-artifact authoring)
 *   • `src/documents/actor.ts` (combat-side base-value aggregation)
 */

// ----------------------------------------------------------------------
// Canonical Equipment Slots
// ----------------------------------------------------------------------

/** The seven Equipment Slots defined by the new Artifact spec. */
export const ARTIFACT_SLOT_KEYS = [
  'mainHand',
  'offHand',
  'bothHands',
  'body',
  'head',
  'feet',
  'amulet',
  'ring',
] as const;

export type ArtifactSlot = (typeof ARTIFACT_SLOT_KEYS)[number];

/** Display label for each artifact slot. */
export const ARTIFACT_SLOT_LABELS: Record<ArtifactSlot, string> = {
  mainHand: 'Main Hand',
  offHand: 'Off Hand',
  bothHands: 'Both Hands (Main + Off)',
  body: 'Body',
  head: 'Head',
  feet: 'Feet',
  amulet: 'Amulet',
  ring: 'Ring',
};

/**
 * Map the canonical artifact slot key onto the legacy paperdoll slot key
 * (`src/utils/equip-slots.ts`). A two-handed artifact occupies two slots
 * (returns both keys).
 */
export const ARTIFACT_SLOT_TO_PAPERDOLL: Record<ArtifactSlot, string[]> = {
  mainHand: ['mainhand'],
  offHand: ['offhand'],
  bothHands: ['mainhand', 'offhand'],
  body: ['body'],
  head: ['head'],
  feet: ['feet'],
  amulet: ['amulet'],
  ring: ['ring'],
};

/**
 * Inverse map — used by migrations to derive a canonical slot from
 * paperdoll keys. Accepts both the new canonical paperdoll keys AND
 * legacy keys (`helmet`, `chest`, `boot`, `necklace`, `ring1`, `ring2`)
 * for backward compatibility.
 */
export const PAPERDOLL_TO_ARTIFACT_SLOT: Record<string, ArtifactSlot> = {
  mainhand: 'mainHand',
  offhand: 'offHand',
  body: 'body',
  head: 'head',
  feet: 'feet',
  amulet: 'amulet',
  ring: 'ring',
  chest: 'body',
  helmet: 'head',
  boot: 'feet',
  necklace: 'amulet',
  ring1: 'ring',
  ring2: 'ring',
};

// ----------------------------------------------------------------------
// Base Profile (Hand Artifacts + Body Robe etc.)
// ----------------------------------------------------------------------

/**
 * The Base Profile of an artifact — what physical category it falls into.
 * Hand Artifacts have only three legal profiles per spec; other slots
 * use a single profile that matches the slot.
 */
export type ArtifactBaseProfile =
  | 'oneHandedWeapon'
  | 'twoHandedWeapon'
  | 'shield'
  | 'bodyArmor'
  | 'noArmorBody'
  | 'robe'
  | 'headArmor'
  | 'feet'
  | 'amulet'
  | 'ring'
  | 'lantern'
  | 'custom';

/** Display label for each Base Profile. */
export const BASE_PROFILE_LABELS: Record<ArtifactBaseProfile, string> = {
  oneHandedWeapon: 'One-Handed Weapon',
  twoHandedWeapon: 'Two-Handed Weapon',
  shield: 'Shield',
  bodyArmor: 'Body Armor',
  noArmorBody: 'No-Armor Body (Evade)',
  robe: 'Robe',
  headArmor: 'Head Armor / Helm',
  feet: 'Feet',
  amulet: 'Amulet',
  ring: 'Ring',
  lantern: 'Lantern / Stone Battery',
  custom: 'Custom',
};

/** Profiles allowed for each canonical slot. */
export const BASE_PROFILES_BY_SLOT: Record<ArtifactSlot, ArtifactBaseProfile[]> = {
  mainHand: ['oneHandedWeapon', 'shield'],
  offHand: ['oneHandedWeapon', 'shield'],
  bothHands: ['twoHandedWeapon'],
  body: ['bodyArmor', 'noArmorBody', 'robe'],
  head: ['headArmor'],
  feet: ['feet'],
  amulet: ['amulet'],
  ring: ['ring'],
};

/** Does this Base Profile occupy two hand slots (i.e. Main + Off)? */
export function isTwoHandedProfile(profile: ArtifactBaseProfile): boolean {
  return profile === 'twoHandedWeapon';
}

// ----------------------------------------------------------------------
// Base Value Limits per Slot
// ----------------------------------------------------------------------

/**
 * Max number of Base Values per slot per spec:
 *   Main Hand / Off Hand: 2
 *   Body: 1
 *   Head: 2
 *   Feet: 2
 *   Ring / Amulet: 1
 */
export const BASE_VALUE_LIMIT_BY_SLOT: Record<ArtifactSlot, number> = {
  mainHand: 2,
  offHand: 2,
  // Two-handed weapons may carry Weapon Damage + two Weapon Specials
  // (e.g. Dragon Claws: Damage A, Penetration B, Brutal Impact C).
  bothHands: 3,
  body: 1,
  head: 2,
  feet: 2,
  amulet: 1,
  ring: 1,
};

/** Hard cap on Base Values per artifact regardless of slot. */
export const BASE_VALUE_HARD_CAP = 3;

// ----------------------------------------------------------------------
// Base Value Types (catalog)
// ----------------------------------------------------------------------

export type ArtifactBaseValueType =
  | 'weaponDamage'
  | 'thrownRange'
  | 'weaponSpecial'
  | 'bodyArmor'
  | 'headArmor'
  | 'shieldValue'
  | 'evade'
  | 'movement'
  | 'sense'
  | 'minorFeature';

export const BASE_VALUE_TYPE_LABELS: Record<ArtifactBaseValueType, string> = {
  weaponDamage: 'Weapon Damage',
  thrownRange: 'Thrown Range',
  weaponSpecial: 'Weapon Special',
  bodyArmor: 'Body Armor',
  headArmor: 'Head / Feet Minor Armor',
  shieldValue: 'Shield Value',
  evade: 'Evade',
  movement: 'Movement',
  sense: 'Sense',
  minorFeature: 'Minor Slot Feature',
};

// ----------------------------------------------------------------------
// Stone Function rules
// ----------------------------------------------------------------------

/** Stone Function variants per spec. */
export type ArtifactStoneFunctionKind =
  | 'stonePowerSupport'
  | 'stonePool'
  | 'stoneRefresh'
  | 'stoneBattery';

export const STONE_FUNCTION_LABELS: Record<ArtifactStoneFunctionKind, string> = {
  stonePowerSupport: 'Stone Power Support',
  stonePool: 'Stone Pool',
  stoneRefresh: 'Stone Refresh',
  stoneBattery: 'Stone Battery',
};

/** Attributes allowed for an Artifact's Stone Function, keyed by slot. */
export const ATTRIBUTE_ACCESS_BY_SLOT: Record<ArtifactSlot, string[]> = {
  mainHand: ['might', 'agility'],
  offHand: ['might', 'agility'],
  bothHands: ['might', 'agility'],
  body: ['vitality', 'might'],
  head: ['wits', 'intellect'],
  feet: ['agility', 'vitality'],
  amulet: ['resolve', 'intellect'],
  ring: ['resolve', 'intellect'],
};

// ----------------------------------------------------------------------
// Artifact Level / Stage
// ----------------------------------------------------------------------

/** Stage of an artifact level (Basic / Improved / Greater / Ultimate). */
export type ArtifactStage = 'basic' | 'improved' | 'greater' | 'ultimate';

export const ARTIFACT_STAGE_LABELS: Record<ArtifactStage, string> = {
  basic: 'Basic',
  improved: 'Improved',
  greater: 'Greater',
  ultimate: 'Ultimate',
};

/** Map artifact level (1–10) → Stage. */
export function getArtifactStageForLevel(level: number): ArtifactStage {
  const l = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
  if (l <= 3) return 'basic';
  if (l <= 6) return 'improved';
  if (l <= 9) return 'greater';
  return 'ultimate';
}

/** Default Power Level for a Power granted at this artifact level. */
export function getDefaultPowerLevelForArtifactLevel(level: number): number {
  const stage = getArtifactStageForLevel(level);
  switch (stage) {
    case 'basic':
      return 4;
    case 'improved':
      return 10;
    case 'greater':
      return 16;
    case 'ultimate':
      return 16;
  }
}

/** Spec maximum artifact level (Ultimate). */
export const ARTIFACT_MAX_LEVEL = 10;

// ----------------------------------------------------------------------
// Slot Power Access (what kind of Powers each Slot may grant)
// ----------------------------------------------------------------------

export interface SlotPowerAccess {
  primary: string[];
  secondary: string[];
  notAllowed: string[];
}

export const SLOT_POWER_ACCESS: Record<ArtifactSlot, SlotPowerAccess> = {
  mainHand: {
    primary: ['Actives'],
    secondary: ['Reactions (Shield/Counter/Guard)'],
    notAllowed: ['Movement', 'Passives', 'Defensive Active Buffs'],
  },
  offHand: {
    primary: ['Actives'],
    secondary: ['Reactions (Shield/Counter/Guard)'],
    notAllowed: ['Movement', 'Passives', 'Defensive Active Buffs'],
  },
  bothHands: {
    primary: ['Actives'],
    secondary: ['Reactions (Shield/Counter/Guard)'],
    notAllowed: ['Movement', 'Passives', 'Defensive Active Buffs'],
  },
  body: {
    primary: ['Armor', 'Active Buff Support', 'Defensive Systems'],
    secondary: ['Defensive Actives', 'Defensive Stone Functions'],
    notAllowed: ['Weapon Damage', 'Movement', 'Awareness', 'Offensive Actives'],
  },
  head: {
    primary: ['Reactions', 'Awareness', 'Head Actives'],
    secondary: ['Senses', 'Ammo', 'Breath', 'Gaze', 'Roar'],
    notAllowed: ['Body Armor', 'Movement', 'Tremor Sense', 'Passive Reinforcement'],
  },
  feet: {
    primary: ['Movement'],
    secondary: ['Tremor Sense', 'Terrain Senses', 'Special Movement Modes'],
    notAllowed: ['Damage', 'Specials', 'Armor', 'Active Buffs', 'Reactions'],
  },
  amulet: {
    primary: ['Passive Reinforcement', 'Save/Ward Support'],
    secondary: ['Actives', 'Reactions', 'Stone Functions'],
    notAllowed: ['Weapon Damage', 'Body Armor', 'Movement', 'Extra Attacks'],
  },
  ring: {
    primary: ['Passive Reinforcement', 'Save/Ward Support'],
    secondary: ['Actives', 'Reactions', 'Stone Functions'],
    notAllowed: ['Weapon Damage', 'Body Armor', 'Movement', 'Extra Attacks'],
  },
};

// ----------------------------------------------------------------------
// Baseline scaling tables (level 1..10)
// ----------------------------------------------------------------------

/** Weapon Damage Baseline — `NdN` where N = level. */
export function getWeaponDamageBaseline(level: number): string {
  const l = clampLevel(level);
  return `${l}d8`;
}

/** Thrown Range Baseline — m. */
export function getThrownRangeBaseline(level: number): number {
  const l = clampLevel(level);
  return 5 + l; // 6 m at L1, 15 m at L10
}

/** Body Armor Bonus from Artifact (+Armor on top of base mundane armor type). */
export function getBodyArmorBaselineBonus(level: number): number {
  const l = clampLevel(level);
  if (l === 10) return 14;
  return 3 + l; // L1=+4, L9=+12
}

/** No-Armor Body Evade Bonus. */
export function getNoArmorBodyEvadeBaseline(level: number): number {
  const l = clampLevel(level);
  if (l === 10) return 26;
  return 6 + l * 2; // L1=8, L9=24
}

/** Feet Evade Baseline (Base Value A). */
export function getFeetEvadeBaseline(level: number): number {
  const l = clampLevel(level);
  if (l === 10) return 12;
  return 1 + l; // L1=+2, L9=+10
}

/** Minor Armor Baseline (Head / Feet Base Value A). */
export function getMinorArmorBaseline(level: number): number {
  const l = clampLevel(level);
  // Pattern: 1,1,2,2,3,3,4,4,5,5
  return Math.ceil(l / 2);
}

/** Feet Movement scaling (Base Value A: walking/climbing/swim/tunnel speed). */
export function getFeetMovementBaseline(level: number): number {
  const l = clampLevel(level);
  return Math.ceil(l / 2); // L1=1, L2=1, L3=2, L4=2, L5=3, L6=3, L7=4, L8=4, L9=5, L10=5
}

/** Base Value B Minor Movement (additive; starts at L4). */
export function getMinorMovementBaselineB(level: number): number {
  const l = clampLevel(level);
  if (l < 4) return 0;
  if (l === 10) return 4;
  // L4–L9: 1,1,2,2,3,3
  if (l <= 5) return 1;
  if (l <= 7) return 2;
  return 3;
}

/** Base Value B Minor Flight / Safe Movement (reduced scaling). */
export function getMinorFlightBaselineB(level: number): number {
  const l = clampLevel(level);
  if (l < 4) return 0;
  if (l === 10) return 3;
  if (l <= 7) return 1;
  return 2;
}

/** Weapon Special baseline value at a given level for high-value scaling specials. */
export interface WeaponSpecialBaseline {
  /** Penetration / Expose / Corrode / Push / Freeze / Shock / Mark. */
  standard: number;
  /** Precision / Prone. */
  precision: number;
  /** Brutal Impact. */
  brutal: number;
}

export function getWeaponSpecialBaseline(level: number): WeaponSpecialBaseline {
  const l = clampLevel(level);
  if (l >= 10) return { standard: 8, precision: 4, brutal: 9 };
  if (l >= 7) return { standard: 6, precision: 3, brutal: 7 };
  if (l >= 4) return { standard: 4, precision: 2, brutal: 5 };
  return { standard: 2, precision: 1, brutal: 3 };
}

/** Passive Reinforcement levels added by an Amulet/Ring at this artifact level. */
export function getPassiveReinforcementBaseline(level: number): number {
  const l = clampLevel(level);
  if (l === 10) return 4;
  if (l >= 7) return 3;
  if (l >= 4) return 2;
  return 1;
}

/** Active Buff Empowerment uses per Safe Haven Rest based on MR (ceil(MR/2)). */
export function getActiveBuffEmpowermentUsesPerRest(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  return Math.max(1, Math.ceil(mr / 2));
}

// ----------------------------------------------------------------------
// Stone Function scaling
// ----------------------------------------------------------------------

/** Stone Power Support pre-fill tier at an artifact level. */
export function getStonePowerSupportPrefillTier(level: number): 0 | 2 | 3 | 4 {
  const l = clampLevel(level);
  if (l >= 7) return 4;
  if (l >= 4) return 3;
  if (l >= 1) return 2;
  return 0;
}

/** Stone Pool stored stones per Safe Haven Rest. */
export function getStonePoolStoredStones(level: number): number {
  const l = clampLevel(level);
  if (l >= 7) return 8;
  if (l >= 4) return 4;
  if (l >= 1) return 2;
  return 0;
}

/** Stone Refresh stones restored per Safe Haven Rest. */
export function getStoneRefreshAmount(level: number): number {
  const l = clampLevel(level);
  if (l >= 7) return 4;
  if (l >= 4) return 2;
  if (l >= 1) return 1;
  return 0;
}

/** Stone Battery capacity. */
export function getStoneBatteryCapacity(level: number): number {
  const l = clampLevel(level);
  if (l >= 7) return 40;
  if (l >= 4) return 20;
  if (l >= 1) return 10;
  return 0;
}

/** Stone Power Cost Chain. Tier (1..4) → stones spent. */
export const STONE_POWER_COST_CHAIN: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
};

// ----------------------------------------------------------------------
// Internal
// ----------------------------------------------------------------------

function clampLevel(level: number): number {
  return Math.max(1, Math.min(ARTIFACT_MAX_LEVEL, Math.floor(Number(level) || 1)));
}

// ----------------------------------------------------------------------
// Public helpers for builders / sheets / aggregator
// ----------------------------------------------------------------------

/** True if the given slot can host the given Base Profile. */
export function isBaseProfileAllowedForSlot(
  slot: ArtifactSlot,
  profile: ArtifactBaseProfile,
): boolean {
  return BASE_PROFILES_BY_SLOT[slot]?.includes(profile) ?? false;
}

/** True if the given Base Value type is generally allowed in the given slot. */
export function isBaseValueTypeAllowedForSlot(
  slot: ArtifactSlot,
  type: ArtifactBaseValueType,
): boolean {
  switch (slot) {
    case 'mainHand':
    case 'offHand':
    case 'bothHands':
      return ['weaponDamage', 'thrownRange', 'weaponSpecial', 'shieldValue', 'minorFeature']
        .includes(type);
    case 'body':
      return ['bodyArmor', 'evade'].includes(type);
    case 'head':
      return ['headArmor', 'sense', 'minorFeature'].includes(type);
    case 'feet':
      return ['evade', 'movement', 'headArmor' /* minor armor */, 'sense', 'minorFeature']
        .includes(type);
    case 'amulet':
    case 'ring':
      return ['minorFeature'].includes(type);
    default:
      return false;
  }
}

/** True if the given Attribute (`might`, `agility`, …) is legal for this slot's Stone Function. */
export function isAttributeAllowedForStoneFunctionInSlot(
  slot: ArtifactSlot,
  attr: string,
): boolean {
  return ATTRIBUTE_ACCESS_BY_SLOT[slot]?.includes(attr) ?? false;
}

/** Map an Artifact's canonical slot to the paperdoll slot keys it should occupy. */
export function getPaperdollSlotsForArtifact(
  slot: ArtifactSlot,
  baseProfile: ArtifactBaseProfile,
): string[] {
  if (isTwoHandedProfile(baseProfile)) {
    return ['mainhand', 'offhand'];
  }
  return ARTIFACT_SLOT_TO_PAPERDOLL[slot] ?? [];
}
