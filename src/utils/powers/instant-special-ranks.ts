/**
 * Printed Special ranks (docs/Rules/Canonical/Actives.md, via the generated table module).
 * Each Special has its own Melee / Ranged Single Target and AoE progression.
 * Used by active-*-instant-special-t*, active-*-aoe-damage-t* and zone templates
 * via bindPoolSpecialsOnRow.
 */

import {
  ZONE_CANON_ID_BY_TIER,
  aoeSpecialCanonId,
  canonicalRadiusM,
  canonicalRadiusSeries,
  canonicalSpecialRank,
  canonicalSpecialSeries,
  singleTargetSpecialCanonId,
  type ActiveFlavour,
} from './canonical-active-lookup.js';

export type InstantSpecialKey =
  | 'blight'
  | 'challenge'
  | 'corrode'
  | 'disoriented'
  | 'expose'
  | 'hex'
  | 'lacerate'
  | 'mark'
  | 'root'
  | 'ruin'
  | 'slow'
  | 'soulburn'
  | 'sundered'
  | 'weaken';

const INSTANT_SPECIAL_KEYS: readonly InstantSpecialKey[] = [
  'blight', 'challenge', 'corrode', 'disoriented', 'expose', 'hex', 'lacerate',
  'mark', 'root', 'ruin', 'slow', 'soulburn', 'sundered', 'weaken',
];

function singleTargetTable(flavour: ActiveFlavour): Record<InstantSpecialKey, readonly number[]> {
  const out = {} as Record<InstantSpecialKey, readonly number[]>;
  for (const key of INSTANT_SPECIAL_KEYS) {
    out[key] = canonicalSpecialSeries(singleTargetSpecialCanonId(flavour, key), key);
  }
  return out;
}

export const MELEE_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>> =
  singleTargetTable('melee');

export const RANGED_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>> =
  singleTargetTable('ranged');

export const RANGED_AOE_INSTANT_ROOT_RANKS: readonly number[] = canonicalSpecialSeries(
  aoeSpecialCanonId('ranged', 'root'),
  'root',
);
export const RANGED_AOE_INSTANT_ROOT_RADIUS_M: readonly number[] = canonicalRadiusSeries(
  aoeSpecialCanonId('ranged', 'root'),
);
export const MELEE_AOE_INSTANT_LACERATE_RANKS: readonly number[] = canonicalSpecialSeries(
  aoeSpecialCanonId('melee', 'lacerate'),
  'lacerate',
);
export const MELEE_AOE_INSTANT_LACERATE_RADIUS_M: readonly number[] = canonicalRadiusSeries(
  aoeSpecialCanonId('melee', 'lacerate'),
);
export const MELEE_AOE_INSTANT_SLOW_RANKS: readonly number[] = canonicalSpecialSeries(
  aoeSpecialCanonId('melee', 'slow'),
  'slow',
);
export const MELEE_AOE_INSTANT_SLOW_RADIUS_M: readonly number[] = canonicalRadiusSeries(
  aoeSpecialCanonId('melee', 'slow'),
);

/** Printed AoE Special rank (Melee/Ranged AoE Special: X) for a Power Level. */
export function aoeSpecialRank(
  flavour: ActiveFlavour,
  specialKey: string | null | undefined,
  level: number,
): number | undefined {
  const key = String(specialKey ?? '').trim().toLowerCase();
  if (!isInstantSpecialKey(key)) return undefined;
  return canonicalSpecialRank(aoeSpecialCanonId(flavour, key), key, level);
}

/** Printed AoE Special radius (m) for a Power Level. */
export function aoeSpecialRadiusM(
  flavour: ActiveFlavour,
  specialKey: string | null | undefined,
  level: number,
): number | undefined {
  const key = String(specialKey ?? '').trim().toLowerCase();
  if (!isInstantSpecialKey(key)) return undefined;
  return canonicalRadiusM(aoeSpecialCanonId(flavour, key), level);
}

/**
 * Printed Ranged Persistent Special Zone rank. `undefined` when the Special is
 * not printed for that Zone tier (e.g. Root) or the PL is unavailable.
 */
export function zoneSpecialRank(
  tier: 3 | 4 | 5 | 6,
  specialKey: string | null | undefined,
  level: number,
): number | undefined {
  const key = String(specialKey ?? '').trim().toLowerCase();
  return canonicalSpecialRank(ZONE_CANON_ID_BY_TIER[tier], key, level);
}

/** Printed Ranged Persistent Special Zone radius (m); 0 when unavailable. */
export function zoneRadiusM(tier: 3 | 4 | 5 | 6, level: number): number {
  return canonicalRadiusM(ZONE_CANON_ID_BY_TIER[tier], level) ?? 0;
}
/** Printed Instant AoE Root rank for a Power Level (Ranged). */
export function rangedAoeInstantRootRank(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const rank = RANGED_AOE_INSTANT_ROOT_RANKS[lvl - 1];
  return typeof rank === 'number' ? rank : undefined;
}

/** Printed Instant AoE Root radius (m) for a Power Level (Ranged). */
export function rangedAoeInstantRootRadiusM(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const r = RANGED_AOE_INSTANT_ROOT_RADIUS_M[lvl - 1];
  return typeof r === 'number' ? r : undefined;
}

/** Printed Instant AoE Lacerate rank for a Power Level (Melee). */
export function meleeAoeInstantLacerateRank(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const rank = MELEE_AOE_INSTANT_LACERATE_RANKS[lvl - 1];
  return typeof rank === 'number' ? rank : undefined;
}

/** Printed Instant AoE Lacerate radius (m) for a Power Level (Melee). */
export function meleeAoeInstantLacerateRadiusM(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const r = MELEE_AOE_INSTANT_LACERATE_RADIUS_M[lvl - 1];
  return typeof r === 'number' ? r : undefined;
}

/** Printed Instant AoE Slow rank for a Power Level (Melee). */
export function meleeAoeInstantSlowRank(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const rank = MELEE_AOE_INSTANT_SLOW_RANKS[lvl - 1];
  return typeof rank === 'number' ? rank : undefined;
}

/** Printed Instant AoE Slow radius (m) for a Power Level (Melee). */
export function meleeAoeInstantSlowRadiusM(level: number): number | undefined {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const r = MELEE_AOE_INSTANT_SLOW_RADIUS_M[lvl - 1];
  return typeof r === 'number' ? r : undefined;
}

const VALID = new Set<string>(INSTANT_SPECIAL_KEYS);

export function isInstantSpecialKey(key: string | null | undefined): key is InstantSpecialKey {
  return VALID.has(String(key ?? '').trim().toLowerCase());
}

/** Printed Instant Single-Special rank for a delivery + Special + PL. */
export function instantSpecialRank(
  flavour: 'melee' | 'ranged',
  specialKey: string | null | undefined,
  level: number,
): number | undefined {
  const key = String(specialKey ?? '').trim().toLowerCase();
  if (!isInstantSpecialKey(key)) return undefined;
  const table = flavour === 'ranged' ? RANGED_INSTANT_SPECIAL_RANKS : MELEE_INSTANT_SPECIAL_RANKS;
  const row = table[key];
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 0)));
  const rank = row[lvl - 1];
  return typeof rank === 'number' ? rank : undefined;
}
