/**
 * Weapon Specials shared by artifacts, raise options, and the damage pipeline.
 *
 * Catalog Specials (Penetration, Precision, …) ride the wielded weapon. They
 * always apply on a hit, and they are legal Raise targets. The same Special
 * must not be applied twice when the raise snapshot already carries it.
 */

import type { PowerSnapshot, PowerSpecialEntry } from '../combat/raise-resolution.js';
import { resolveArtifactBaseType } from './artifact-base-type-catalog.js';
import { getEffectById, parseEffectString } from './special-effects.js';

export interface WeaponSpecialEntry {
  key: string;
  rank: number;
}

export function specialKeyFromLabel(label: string): string {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\(.*$/, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function catalogKey(key: string): string | null {
  const id = specialKeyFromLabel(key);
  if (!id || !getEffectById(id)) return null;
  return id;
}

/** Parse a weapon special string or `{ specialId, value }` into a raisable catalog Special. */
export function parseWeaponSpecialRaw(raw: unknown): WeaponSpecialEntry | null {
  if (raw && typeof raw === 'object') {
    const ref = raw as { specialId?: string; value?: unknown };
    const key = catalogKey(String(ref.specialId || ''));
    const rank = Math.floor(Number(ref.value) || 0);
    if (!key || rank <= 0) return null;
    return { key, rank };
  }
  const text = String(raw ?? '').trim();
  if (!text || text === '—' || text === '-') return null;
  const parsed = parseEffectString(text);
  if (parsed?.specialId) {
    const key = catalogKey(parsed.specialId);
    const rank = Math.floor(Number(parsed.value) || 0);
    if (!key || rank <= 0) return null;
    return { key, rank };
  }
  const match = text.match(/^([^(]+)\((\d+)\)$/);
  if (!match) return null;
  const key = catalogKey(match[1]);
  const rank = parseInt(match[2], 10);
  if (!key || rank <= 0) return null;
  return { key, rank };
}

export function weaponSpecialEntries(weapon: any): WeaponSpecialEntry[] {
  const raw = weapon?.system?.specials;
  if (!Array.isArray(raw)) return [];
  const out: WeaponSpecialEntry[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const entry = parseWeaponSpecialRaw(row);
    if (!entry || seen.has(entry.key)) continue;
    seen.add(entry.key);
    out.push(entry);
  }
  return out;
}

/**
 * Add weapon Specials that the power snapshot does not already list.
 * Existing power ranks are left alone so a chosen Special is not doubled.
 */
export function mergeWeaponSpecialsIntoSnapshot(
  snapshot: PowerSnapshot,
  entries: WeaponSpecialEntry[],
): PowerSnapshot {
  const specials: PowerSpecialEntry[] = snapshot.specials.map((sp) => ({ ...sp }));
  const seen = new Set(specials.map((sp) => sp.key));
  for (const entry of entries) {
    if (seen.has(entry.key)) continue;
    specials.push({ key: entry.key, rank: entry.rank });
    seen.add(entry.key);
  }
  return { ...snapshot, specials };
}

function numericSpecialRank(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value);
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const n = parseInt(text, 10);
  return n > 0 ? n : null;
}

/** Base Value rows of type `weaponSpecial` with a positive numeric rank. */
export function specialRefsFromBaseValueRows(
  rows: unknown,
): Array<{ specialId: string; value: number }> {
  if (!Array.isArray(rows)) return [];
  const out: Array<{ specialId: string; value: number }> = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const rec = row as { type?: string; label?: string; specialId?: string; value?: unknown };
    if (String(rec.type || '') !== 'weaponSpecial') continue;
    const key = catalogKey(String(rec.specialId || rec.label || ''));
    const rank = numericSpecialRank(rec.value);
    if (!key || rank == null || seen.has(key)) continue;
    seen.add(key);
    out.push({ specialId: key, value: rank });
  }
  return out;
}

/**
 * When an artifact weapon blob has no Specials, recover them from its Base
 * Values, then from the chosen mundane base type (`weapon:heavy-crossbow`, …).
 */
export function backfillArtifactWeaponSpecials(sys: any, existing: unknown): unknown[] {
  const list = Array.isArray(existing) ? existing : [];
  if (list.length > 0) return list;
  const fromRows = specialRefsFromBaseValueRows(sys?.baseValues);
  if (fromRows.length) return fromRows;
  const prefill = resolveArtifactBaseType(String(sys?.baseTypeKey || ''));
  if (prefill?.kind === 'weapon' && prefill.specials.length) return prefill.specials;
  return list;
}

function effectKey(text: string): string | null {
  return parseWeaponSpecialRaw(text)?.key ?? null;
}

/**
 * On-hit Specials: power snapshot first, then weapon Specials that are not
 * already in that snapshot (so a Raise does not stack the printed rank twice).
 */
export function selectOnHitSpecialEffects(
  available: Array<{ type?: string; effect?: string }>,
): string[] {
  const used: string[] = [];
  const covered = new Set<string>();
  for (const special of available) {
    if (special.type !== 'power-special' || !special.effect) continue;
    used.push(special.effect);
    const key = effectKey(special.effect);
    if (key) covered.add(key);
  }
  for (const special of available) {
    if (special.type !== 'weapon' || !special.effect) continue;
    const key = effectKey(special.effect);
    if (!key || covered.has(key)) continue;
    used.push(special.effect);
  }
  return used;
}
