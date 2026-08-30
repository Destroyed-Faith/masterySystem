/**
 * Base Type catalog for the Artifact Node Editor.
 *
 * Lets the GM pick a standard rulebook weapon / armor / shield as the *base*
 * an artifact is built on (e.g. "Light Crossbow", "Heavy Armor"). Selecting a
 * base type pre-fills the Slot, Base Profile, weapon/armor/shield profile,
 * innate abilities, specials and the matching Base Value rows — the GM can then
 * fine-tune from there, or pick "Custom" to author everything by hand.
 *
 * Pure data + pure helpers: no DOM, no Foundry types. Consumed by
 * `src/artifacts/node-editor.ts`.
 */

import type {
  ArtifactBaseProfileKey,
  ArtifactBaseValueType,
  ArtifactSlotKey,
  ArtifactWeaponSpecialRef,
} from '../types/item.js';
import { WEAPONS } from './weapons.js';
import { BASE_ARMOR, BASE_SHIELDS } from './equipment.js';
import { parseEffectStrings } from './special-effects.js';

/** A single selectable option in the Base Type dropdown. */
export interface ArtifactBaseTypeOption {
  id: string;
  label: string;
}

/** An <optgroup> of base-type options (Weapons / Armor / Shields). */
export interface ArtifactBaseTypeGroup {
  group: string;
  options: ArtifactBaseTypeOption[];
}

/** One prefilled Base Value row derived from the base type. */
export interface ArtifactBaseTypeBaseValue {
  type: ArtifactBaseValueType;
  /** For `weaponSpecial` rows: the chosen special id. */
  specialId?: string;
}

interface WeaponBaseTypePrefill {
  kind: 'weapon';
  slot: ArtifactSlotKey;
  baseProfile: ArtifactBaseProfileKey;
  weaponType: 'melee' | 'ranged';
  hands: number;
  damage: string;
  range: string;
  innateAbilities: string[];
  specials: ArtifactWeaponSpecialRef[];
  baseValues: ArtifactBaseTypeBaseValue[];
}

interface ArmorBaseTypePrefill {
  kind: 'armor';
  slot: ArtifactSlotKey;
  baseProfile: ArtifactBaseProfileKey;
  armorType: 'light' | 'medium' | 'heavy';
  armorValue: number;
  evadeModifier: number;
  skillPenalty: string;
  baseValues: ArtifactBaseTypeBaseValue[];
}

interface ShieldBaseTypePrefill {
  kind: 'shield';
  slot: ArtifactSlotKey;
  baseProfile: ArtifactBaseProfileKey;
  shieldType: 'parry' | 'medium' | 'tower';
  shieldValue: number;
  evadeBonus: number;
  skillPenalty: string;
  baseValues: ArtifactBaseTypeBaseValue[];
}

export type ArtifactBaseTypePrefill =
  | WeaponBaseTypePrefill
  | ArmorBaseTypePrefill
  | ShieldBaseTypePrefill;

const WEAPON_PREFIX = 'weapon:';
const ARMOR_PREFIX = 'armor:';
const SHIELD_PREFIX = 'shield:';

/** Stable id slug for a catalog name (matches ids used in the dropdown). */
function slug(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isRangedWeapon(innateAbilities: string[]): boolean {
  return innateAbilities.some((a) => /^ranged/i.test(String(a).trim()));
}

/** Extract the printed range from a `Ranged (32 m)` / `Thrown (16 m)` innate. */
function extractRangeBand(innateAbilities: string[]): string | null {
  for (const a of innateAbilities) {
    const m = String(a).match(/\(([\d/]+\s*m?)\)/i);
    if (m && /ranged|thrown/i.test(a)) {
      return m[1].replace(/\s+/g, '');
    }
  }
  return null;
}

function weaponProfileForHands(
  hands: number,
  ranged: boolean,
): { slot: ArtifactSlotKey; baseProfile: ArtifactBaseProfileKey } {
  if (hands >= 2) {
    return {
      slot: 'bothHands',
      baseProfile: ranged ? 'twoHandedWeaponRanged' : 'twoHandedWeapon',
    };
  }
  return {
    slot: 'mainHand',
    baseProfile: ranged ? 'oneHandedWeaponRanged' : 'oneHandedWeapon',
  };
}

/**
 * The base-type options, grouped for the dropdown. Excludes "Unarmed" (no real
 * weapon base). Sorted alphabetically inside each group.
 */
export function getArtifactBaseTypeGroups(): ArtifactBaseTypeGroup[] {
  const weapons: ArtifactBaseTypeOption[] = WEAPONS.filter((w) => w.name !== 'Unarmed')
    .map((w) => ({ id: `${WEAPON_PREFIX}${slug(w.name)}`, label: w.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const armor: ArtifactBaseTypeOption[] = BASE_ARMOR.map((a) => ({
    id: `${ARMOR_PREFIX}${a.type}`,
    label: a.name,
  }));

  const shields: ArtifactBaseTypeOption[] = BASE_SHIELDS.map((s) => ({
    id: `${SHIELD_PREFIX}${s.type}`,
    label: s.name,
  }));

  return [
    { group: 'Weapons', options: weapons },
    { group: 'Armor', options: armor },
    { group: 'Shields', options: shields },
  ];
}

/**
 * Resolve a base-type id into a normalized prefill descriptor, or `null` for an
 * unknown / "Custom" selection.
 */
export function resolveArtifactBaseType(id: string): ArtifactBaseTypePrefill | null {
  const key = String(id || '').trim();
  if (!key) return null;

  if (key.startsWith(WEAPON_PREFIX)) {
    const wSlug = key.slice(WEAPON_PREFIX.length);
    const weapon = WEAPONS.find((w) => slug(w.name) === wSlug);
    if (!weapon) return null;
    const ranged = isRangedWeapon(weapon.innateAbilities);
    const { slot, baseProfile } = weaponProfileForHands(weapon.hands, ranged);
    const band = extractRangeBand(weapon.innateAbilities);
    const specialParts = String(weapon.special || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== '—');
    const specials = parseEffectStrings(specialParts) as ArtifactWeaponSpecialRef[];

    // Base Value rows: weapon damage first, then each special (bothHands can
    // host up to 3, mainHand up to 2 — the editor trims to the slot's limit).
    const baseValues: ArtifactBaseTypeBaseValue[] = [{ type: 'weaponDamage' }];
    for (const s of specials) {
      if (s.specialId) baseValues.push({ type: 'weaponSpecial', specialId: s.specialId });
    }

    return {
      kind: 'weapon',
      slot,
      baseProfile,
      weaponType: ranged ? 'ranged' : 'melee',
      hands: weapon.hands,
      damage: weapon.weaponDamage,
      range: ranged && band ? band : '0m',
      innateAbilities: [...weapon.innateAbilities],
      specials,
      baseValues,
    };
  }

  if (key.startsWith(ARMOR_PREFIX)) {
    const type = key.slice(ARMOR_PREFIX.length) as 'light' | 'medium' | 'heavy';
    const armor = BASE_ARMOR.find((a) => a.type === type);
    if (!armor) return null;
    return {
      kind: 'armor',
      slot: 'body',
      baseProfile: 'bodyArmor',
      armorType: armor.type,
      armorValue: armor.armorValue,
      evadeModifier: armor.evadeModifier,
      skillPenalty: armor.skillPenalty === '—' ? '' : armor.skillPenalty,
      baseValues: [{ type: 'bodyArmor' }],
    };
  }

  if (key.startsWith(SHIELD_PREFIX)) {
    const type = key.slice(SHIELD_PREFIX.length) as 'parry' | 'medium' | 'tower';
    const shield = BASE_SHIELDS.find((s) => s.type === type);
    if (!shield) return null;
    return {
      kind: 'shield',
      slot: 'mainHand',
      baseProfile: 'shield',
      shieldType: shield.type,
      shieldValue: shield.shieldValue,
      evadeBonus: shield.evadeBonus,
      skillPenalty: shield.skillPenalty === '—' ? '' : shield.skillPenalty,
      baseValues: [{ type: 'shieldValue' }],
    };
  }

  return null;
}
