/**
 * Instant Single-Special printed ranks (docs/Rules/actives.md).
 * Each Special has its own Melee / Ranged single-target progression.
 * Used by active-*-instant-special-t* templates via bindPoolSpecialsOnRow.
 */

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

export const MELEE_INSTANT_SPECIAL_RANKS: Readonly<
  Record<InstantSpecialKey, readonly number[]>
> = {
  blight: [4, 5, 7, 8, 9, 10, 11, 12, 12, 13, 14, 15, 15, 16, 16, 17],
  challenge: [1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5, 6],
  corrode: [2, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12],
  disoriented: [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  expose: [2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 10, 10],
  hex: [2, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12],
  lacerate: [3, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12, 13, 14, 14, 15],
  mark: [3, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12, 13, 14, 14, 15],
  root: [2, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12],
  ruin: [3, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12, 13, 14, 14, 15],
  slow: [3, 5, 6, 7, 8, 9, 9, 10, 11, 11, 12, 12, 13, 14, 14, 15],
  soulburn: [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5],
  sundered: [2, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12],
  weaken: [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11],
};

export const RANGED_INSTANT_SPECIAL_RANKS: Readonly<
  Record<InstantSpecialKey, readonly number[]>
> = {
  blight: [4, 5, 6, 7, 8, 9, 10, 11, 11, 12, 13, 13, 14, 14, 15, 15],
  challenge: [1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  corrode: [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11],
  disoriented: [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  expose: [2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9],
  hex: [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11],
  lacerate: [3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
  mark: [3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
  root: [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11],
  ruin: [3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
  slow: [3, 4, 5, 6, 7, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
  soulburn: [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
  sundered: [2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 11],
  // Canonical Actives.md — Ranged Single Target Special: Weaken (PL1–16).
  weaken: [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
};

/**
 * Canonical Actives.md — Ranged AoE Special: Root (named Instant AoE identity).
 * Used when Binding Circle / Instant AoE Root binds onto `active-ranged-aoe-damage-t*`.
 */
export const RANGED_AOE_INSTANT_ROOT_RANKS: readonly number[] = [
  2, 2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 6, 6, 6, 7,
];

export const RANGED_AOE_INSTANT_ROOT_RADIUS_M: readonly number[] = [
  1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 6, 6, 7, 7, 7,
];

/**
 * Canonical Actives.md — Melee AoE Special: Lacerate (Instant AoE identity).
 * Used when Rending Spiral / Instant AoE Lacerate binds onto `active-melee-aoe-damage-t*`.
 */
export const MELEE_AOE_INSTANT_LACERATE_RANKS: readonly number[] = [
  1, 4, 4, 5, 5, 6, 6, 7, 8, 9, 9, 9, 10, 10, 10, 10,
];

export const MELEE_AOE_INSTANT_LACERATE_RADIUS_M: readonly number[] = [
  2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7,
];

/**
 * Canonical Actives.md — Melee AoE Special: Slow (Instant AoE identity).
 * Used when Heart of Winter Frostwave / Instant AoE Slow binds onto
 * `active-melee-aoe-damage-t*` (dice remain 0; special-only).
 */
export const MELEE_AOE_INSTANT_SLOW_RANKS: readonly number[] = [
  1, 4, 4, 5, 5, 6, 6, 7, 8, 9, 9, 9, 10, 10, 10, 10,
];

export const MELEE_AOE_INSTANT_SLOW_RADIUS_M: readonly number[] = [
  2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 7, 7,
];

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

const VALID = new Set<string>(Object.keys(MELEE_INSTANT_SPECIAL_RANKS));

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
