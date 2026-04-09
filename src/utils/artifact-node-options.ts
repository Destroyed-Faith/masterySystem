/**
 * Dropdown option lists for the artifact node editor (weapon catalog + properties).
 */

import { WEAPONS, WEAPON_PROPERTIES } from './weapons.js';

/** Combat specials parsed from the mastery weapon table (comma-separated). */
export function getArtifactWeaponSpecialOptions(): string[] {
  const set = new Set<string>();
  for (const w of WEAPONS) {
    const sp = w.special?.trim();
    if (!sp || sp === '—') continue;
    for (const part of sp.split(',')) {
      const s = part.trim();
      if (s) set.add(s);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
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
