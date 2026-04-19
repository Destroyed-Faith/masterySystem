/**
 * Power spec consistency — canonical shapes after import / before persist.
 *
 * Rules (see docs/power-structure-new.json mergedPrimitives):
 * - PowerSpecial: canonical persisted form uses lowercase `key` + `rank` (not type/value).
 * - AoE: do not persist both radiusM and sizeM for radius-class shapes.
 * - PowerMechanics: usageLimit canonical; triggerLimit read once then stripped on persist.
 * - condition vs conditionExpr: if enum `condition` is set, clear redundant `conditionExpr`.
 */

import type { AoeSpec, PowerMechanics, PowerSpecial } from '../types/item.js';

const RADIUS_LIKE: ReadonlySet<AoeSpec['shape']> = new Set(['radius', 'aura', 'zone']);

function deepClone<T>(x: T): T {
  if (typeof structuredClone === 'function') return structuredClone(x);
  return JSON.parse(JSON.stringify(x)) as T;
}

/**
 * Normalize one special entry to canonical `{ key, rank?, ... }` (lowercase key; no type/value).
 */
export function normalizePowerSpecial(raw: unknown): PowerSpecial | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const keySrc = r.key ?? r.type;
  if (keySrc === undefined || keySrc === null) return null;
  const key = String(keySrc).trim().toLowerCase();
  if (!key) return null;

  let rank: number | undefined;
  if (r.rank !== undefined && r.rank !== null && r.rank !== '') {
    const n = Number(r.rank);
    if (Number.isFinite(n)) rank = n;
  } else if (r.value !== undefined && r.value !== null && r.value !== '') {
    const n = Number(r.value);
    if (Number.isFinite(n)) rank = n;
  }

  const out: PowerSpecial = { key };
  if (rank !== undefined) out.rank = rank;

  if (typeof r.raiseCost === 'number' && Number.isFinite(r.raiseCost)) {
    out.raiseCost = r.raiseCost;
  } else if (typeof r.raiseCost === 'string' && r.raiseCost.trim() !== '') {
    const rc = Number(r.raiseCost);
    if (Number.isFinite(rc)) out.raiseCost = rc;
  }

  if (typeof r.note === 'string' && r.note.trim()) out.note = r.note.trim();
  if (typeof r.target === 'string' && r.target.trim()) out.target = r.target.trim();
  if (typeof r.condition === 'string' && r.condition.trim()) out.condition = r.condition.trim();
  if (typeof r.duration === 'string' && r.duration.trim()) out.duration = r.duration.trim();
  if (typeof r.applyOn === 'string' && r.applyOn.trim()) out.applyOn = r.applyOn.trim();

  return out;
}

/** Normalize an array of specials (drops nulls). */
export function normalizePowerSpecialArray(raw: unknown): PowerSpecial[] {
  if (!Array.isArray(raw)) return [];
  const out: PowerSpecial[] = [];
  for (const item of raw) {
    const n = normalizePowerSpecial(item);
    if (n) out.push(n);
  }
  return out;
}

/**
 * Collapse sizeM into radiusM for radius-like shapes; never persist both.
 */
export function normalizeAoeSpec(raw: unknown): AoeSpec | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = { ...(raw as AoeSpec) };
  const shape = a.shape;
  if (!shape) return a as AoeSpec;

  if (RADIUS_LIKE.has(shape)) {
    const rm =
      typeof a.radiusM === 'number' && Number.isFinite(a.radiusM) ? a.radiusM : undefined;
    const sm = typeof a.sizeM === 'number' && Number.isFinite(a.sizeM) ? a.sizeM : undefined;
    if (rm !== undefined && sm !== undefined) {
      delete (a as any).sizeM;
    } else if (sm !== undefined && rm === undefined) {
      (a as any).radiusM = sm;
      delete (a as any).sizeM;
    } else if (sm !== undefined) {
      delete (a as any).sizeM;
    }
  } else if (typeof (a as any).sizeM === 'number') {
    delete (a as any).sizeM;
  }

  return a as AoeSpec;
}

/**
 * Prepare a mechanics object for persistence: limits, gates, nested specials.
 * Returns a deep-cloned, normalized copy (safe for JSON.parse results).
 */
export function persistPowerMechanics(input: PowerMechanics): PowerMechanics {
  const m = deepClone(input) as unknown as Record<string, unknown>;

  const ul = m.usageLimit as PowerMechanics['usageLimit'] | undefined;
  const tl = m.triggerLimit as PowerMechanics['usageLimit'] | undefined;
  if ((!ul || ul.max === undefined) && tl?.per && typeof tl.max === 'number') {
    m.usageLimit = { per: tl.per, max: tl.max };
  }
  delete m.triggerLimit;

  const cond = m.condition as string | null | undefined;
  const condTrim = cond !== undefined && cond !== null && String(cond).trim() !== '' ? String(cond).trim() : '';
  if (condTrim) {
    m.condition = condTrim as PowerMechanics['condition'];
    delete m.conditionExpr;
  } else {
    delete m.condition;
    const ex = m.conditionExpr;
    if (typeof ex === 'string' && !ex.trim()) delete m.conditionExpr;
  }

  const gnh = m.grantNextHitEffect;
  if (gnh && typeof gnh === 'object' && Array.isArray((gnh as any).specials)) {
    (gnh as any).specials = normalizePowerSpecialArray((gnh as any).specials);
  }

  const ms = m.modifySpecial;
  if (ms && typeof ms === 'object' && typeof (ms as any).type === 'string') {
    (ms as any).type = String((ms as any).type).trim().toLowerCase();
  }

  return m as unknown as PowerMechanics;
}
