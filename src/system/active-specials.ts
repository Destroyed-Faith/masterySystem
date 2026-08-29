/**
 * Shared read helpers for a creature's active Special Effects.
 *
 * On-hit specials are stored on the actor as `system.statusEffects[]` entries
 * (`{ id?, name?, value? }`). These helpers resolve them to canonical ids and
 * numeric values so derived-stat maluses (Slow, Corrode, Expose, Soulburn,
 * Weaken, Disoriented), the start-of-turn Tick, and combat riders can read a
 * single normalized view.
 */

import { getEffect, getEffectById, canonicalSpecialId } from '../utils/special-effects.js';

export interface ActiveSpecial {
  id: string;
  value: number;
}

interface RawStatusEntry {
  id?: string;
  name?: string;
  value?: number | null;
}

function slugSpecialName(name: string): string {
  return String(name || '')
    .replace(/\(X\)/gi, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** Resolve the canonical special id for a stored status entry. */
export function statusEntryId(entry: RawStatusEntry): string | undefined {
  if (entry?.id) {
    const byId = getEffectById(entry.id);
    if (byId) return byId.id;
    return canonicalSpecialId(entry.id);
  }
  if (entry?.name) {
    const byName = getEffect(entry.name);
    if (byName) return byName.id;
    const slug = slugSpecialName(entry.name);
    if (slug) return slug;
  }
  return undefined;
}

/** Normalized list of a creature's active Specials (id + value). */
export function readActiveSpecials(actor: any): ActiveSpecial[] {
  const list = coerceStatusEffectsArray(actor?.system?.statusEffects);
  const out: ActiveSpecial[] = [];
  for (const entry of list) {
    const id = statusEntryId(entry);
    if (!id) continue;
    out.push({ id, value: Math.max(0, Math.floor(Number(entry?.value ?? 0))) });
  }
  return out;
}

/**
 * Total value of a given active Special on a creature (0 when absent).
 * Diminishing Specials track a single stack value, so entries are summed.
 */
export function getActiveSpecialValue(actor: any, id: string): number {
  let total = 0;
  for (const s of readActiveSpecials(actor)) {
    if (s.id === id) total += s.value;
  }
  return total;
}

/** Coerce Foundry object-shaped `statusEffects` to a real array. */
export function coerceStatusEffectsArray(raw: unknown): RawStatusEntry[] {
  if (Array.isArray(raw)) return raw as RawStatusEntry[];
  if (raw && typeof raw === 'object') {
    return Object.keys(raw as object)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      .map((k) => (raw as Record<string, RawStatusEntry>)[k]);
  }
  return [];
}

/**
 * Reduce (or remove) one statusEffects entry by `steps`.
 * Non-positive / missing values are treated as a single stack (any reduce removes).
 */
export function reduceStatusEffectAt(
  list: unknown,
  index: number,
  steps: number,
): RawStatusEntry[] {
  const next = coerceStatusEffectsArray(list).map((e) => ({ ...(e as object) })) as RawStatusEntry[];
  const i = Math.floor(Number(index));
  const n = Math.max(1, Math.floor(Number(steps) || 1));
  if (!Number.isFinite(i) || i < 0 || i >= next.length) return next;
  const entry = next[i]!;
  const rawVal = entry.value;
  const cur =
    rawVal === undefined || rawVal === null || rawVal === ('' as any)
      ? 0
      : Math.floor(Number(rawVal));
  if (!Number.isFinite(cur) || cur <= 0) {
    next.splice(i, 1);
    return next;
  }
  const remaining = cur - n;
  if (remaining <= 0) {
    next.splice(i, 1);
  } else {
    next[i] = { ...entry, value: remaining };
  }
  return next;
}
