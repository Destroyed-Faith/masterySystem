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

export interface RawStatusEntry {
  id?: string;
  name?: string;
  value?: number | null;
  source?: string;
  sourceUuid?: string;
  sourceMasteryRank?: number;
  timestamp?: number;
}

function readMasteryFlag(actor: any, key: string): unknown {
  if (!actor) return undefined;
  if (typeof actor.getFlag === 'function') {
    try {
      const flagged = actor.getFlag('mastery-system', key);
      if (flagged !== undefined) return flagged;
    } catch {
      /* fall through */
    }
  }
  return actor.flags?.['mastery-system']?.[key];
}

type StatusFlagRow = {
  k?: string;
  n?: string;
  v?: number | null;
  s?: string;
  u?: string;
  m?: number;
  t?: number;
};

/**
 * Persist without `{ id: ... }` arrays. Foundry ActorDelta treats those as
 * embedded documents and drops them on unlinked NPC tokens.
 */
export function encodeStatusFlag(list: unknown): string {
  return JSON.stringify(
    coerceStatusEffectsArray(list).map((entry) => {
      const row: StatusFlagRow = {
        k: String(entry?.id ?? ''),
        n: String(entry?.name ?? ''),
        v: entry?.value ?? null,
      };
      if (entry?.source) row.s = String(entry.source);
      if (entry?.sourceUuid) row.u = String(entry.sourceUuid);
      if (entry?.sourceMasteryRank != null) row.m = Number(entry.sourceMasteryRank);
      if (entry?.timestamp != null) row.t = Number(entry.timestamp);
      return row;
    }),
  );
}

function rowFromFlag(entry: StatusFlagRow): RawStatusEntry {
  return {
    id: String(entry.k || ''),
    name: String(entry.n || ''),
    value: entry.v,
    source: entry.s,
    sourceUuid: entry.u,
    sourceMasteryRank: entry.m,
    timestamp: entry.t,
  };
}

/** Read the JSON flag, a leftover array flag, or a raw list. */
export function decodeStatusFlag(raw: unknown): RawStatusEntry[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return undefined;
    try {
      parsed = JSON.parse(text);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((entry: any) => {
      if (entry && typeof entry === 'object' && entry.id == null && (entry.k != null || entry.n != null)) {
        return rowFromFlag(entry as StatusFlagRow);
      }
      return entry as RawStatusEntry;
    });
  }
  if (parsed && typeof parsed === 'object') {
    return coerceStatusEffectsArray(parsed);
  }
  return undefined;
}

/**
 * Live Specials on a creature. The JSON flag survives unlinked NPC tokens;
 * `system.statusEffects` is only a fallback for older actors.
 */
export function readActorStatusEffects(actor: any): RawStatusEntry[] {
  const fromJson = decodeStatusFlag(readMasteryFlag(actor, 'statusJson'));
  if (fromJson !== undefined) return coerceStatusEffectsArray(fromJson);
  const fromFlag = decodeStatusFlag(readMasteryFlag(actor, 'statusEffects'));
  if (fromFlag !== undefined) return coerceStatusEffectsArray(fromFlag);
  return coerceStatusEffectsArray(actor?.system?.statusEffects);
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
  const list = readActorStatusEffects(actor);
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

/**
 * Whether a given Special is present on a creature at all — including
 * valueless conditions (Stunned, Prone, Immovable) whose entries carry no
 * numeric stack.
 */
export function hasActiveSpecial(actor: any, id: string): boolean {
  const list = readActorStatusEffects(actor);
  for (const entry of list) {
    if (statusEntryId(entry) === id) return true;
  }
  return false;
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
