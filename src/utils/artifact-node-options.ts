/**
 * Dropdown option lists for the artifact node editor (weapon catalog + special effects + powers).
 */

import { WEAPONS, WEAPON_PROPERTIES } from './weapons.js';
import {
  ALL_SPECIAL_EFFECTS,
  getEffect,
  getEffectBaseName,
  getEffectById,
  parseEffectString
} from './special-effects.js';
import { ALL_MASTERY_POWERS } from './powers/index.js';

export type ArtifactSpecialSelectOption = { id: string; label: string; hasValue: boolean };

function slugFromKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '-');
}

function addEffectToMap(map: Map<string, ArtifactSpecialSelectOption>, id: string, label: string, hasValue: boolean): void {
  if (!id) return;
  if (!map.has(id)) {
    map.set(id, { id, label, hasValue });
  }
}

function addWeaponTableSpecials(map: Map<string, ArtifactSpecialSelectOption>): void {
  for (const w of WEAPONS) {
    const sp = w.special?.trim();
    if (!sp || sp === '—') continue;
    for (const part of sp.split(',')) {
      const piece = part.trim();
      if (!piece) continue;
      const ref = parseEffectString(piece);
      if (ref) {
        const ef = getEffectById(ref.specialId);
        if (ef) {
          addEffectToMap(map, ef.id, getEffectBaseName(ef.name), ef.hasValue);
        }
      } else {
        const m = piece.match(/^([^(]+)/);
        if (m) {
          const ef = getEffect(m[1].trim());
          if (ef) {
            addEffectToMap(map, ef.id, getEffectBaseName(ef.name), ef.hasValue);
          }
        }
      }
    }
  }
}

function collectSpecialKeysFromPowerLevel(row: any, map: Map<string, ArtifactSpecialSelectOption>): void {
  if (!row) return;
  if (Array.isArray(row.specials)) {
    for (const s of row.specials) {
      const key = s?.key != null ? String(s.key).trim() : '';
      if (!key) continue;
      const ef = getEffect(key);
      if (ef) {
        addEffectToMap(map, ef.id, getEffectBaseName(ef.name), ef.hasValue);
      } else {
        const id = slugFromKey(key);
        addEffectToMap(map, id, key, true);
      }
    }
  }
  if (typeof row.special === 'string' && row.special.trim()) {
    for (const part of row.special.split(',')) {
      const piece = part.trim();
      if (!piece) continue;
      const ref = parseEffectString(piece);
      if (ref) {
        const ef = getEffectById(ref.specialId);
        if (ef) {
          addEffectToMap(map, ef.id, getEffectBaseName(ef.name), ef.hasValue);
        }
      }
    }
  }
}

function collectFromMasteryPower(power: any, map: Map<string, ArtifactSpecialSelectOption>): void {
  const levels = power?.levels;
  if (!levels) return;
  if (typeof levels === 'object' && !Array.isArray(levels)) {
    for (const row of Object.values(levels)) {
      collectSpecialKeysFromPowerLevel(row, map);
    }
  } else if (Array.isArray(levels)) {
    for (const row of levels) {
      collectSpecialKeysFromPowerLevel(row, map);
    }
  }
}

/**
 * All special IDs for artifact weapon rows: rulebook effects, weapon table, every mastery power definition.
 */
export function getArtifactSpecialSelectOptions(): ArtifactSpecialSelectOption[] {
  const map = new Map<string, ArtifactSpecialSelectOption>();

  for (const e of ALL_SPECIAL_EFFECTS) {
    map.set(e.id, { id: e.id, label: getEffectBaseName(e.name), hasValue: e.hasValue });
  }

  addWeaponTableSpecials(map);

  for (const power of ALL_MASTERY_POWERS) {
    collectFromMasteryPower(power, map);
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

/** Innate lines: catalog table + all keys from WEAPON_PROPERTIES. */
export function getArtifactWeaponInnateOptions(): string[] {
  const set = new Set<string>();
  for (const key of Object.keys(WEAPON_PROPERTIES)) {
    set.add(key);
  }
  for (const w of WEAPONS) {
    for (const a of w.innateAbilities || []) {
      const s = String(a).trim();
      if (s) set.add(s);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Damage dice presets (matches former artifact builder). */
export function getArtifactWeaponDamagePresets(): { value: string; label: string }[] {
  return [
    { value: '1d4', label: '1d4' },
    { value: '1d6', label: '1d6' },
    { value: '1d8', label: '1d8' },
    { value: '1d10', label: '1d10' },
    { value: '1d12', label: '1d12' },
    { value: '2d6', label: '2d6' },
    { value: '2d8', label: '2d8' },
    { value: '4d8', label: '4d8' }
  ];
}

/** Artifact tree node editor: 1d8 … 8d8 only. */
export function getArtifactTreeWeaponDamagePresets(): { value: string; label: string }[] {
  return Array.from({ length: 8 }, (_, i) => {
    const n = i + 1;
    const v = `${n}d8`;
    return { value: v, label: v };
  });
}

/** Accessory slots aligned with character sheet equipment (non-weapon/armor/shield). */
export const ARTIFACT_GEAR_SLOT_OPTIONS: { value: string; label: string }[] = [
  { value: 'helmet', label: 'Helmet' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'cloak', label: 'Cloak' },
  { value: 'glove', label: 'Gloves' },
  { value: 'ring1', label: 'Ring (1)' },
  { value: 'ring2', label: 'Ring (2)' },
  { value: 'belt', label: 'Belt' },
  { value: 'leggings', label: 'Leggings' },
  { value: 'boot', label: 'Boots' }
];
