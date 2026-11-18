/**
 * Read access to the printed PL 1–16 tables of docs/Rules/Canonical/Actives.md
 * (generated into canonical-actives.generated.ts).
 */

import { CANONICAL_ACTIVES, type CanonicalActiveRow } from './canonical-actives.generated.js';

export type ActiveFlavour = 'melee' | 'ranged';

function clampLevel(level: number): number {
  const n = Math.floor(Number(level) || 0);
  return Math.max(1, Math.min(16, n));
}

export function canonicalActiveRow(canonId: string, level: number): CanonicalActiveRow | null {
  const table = CANONICAL_ACTIVES[canonId];
  if (!table) return null;
  return table.rows[clampLevel(level) - 1] ?? null;
}

/** Printed Special(X) for one Power Level; `undefined` when not printed. */
export function canonicalSpecialRank(canonId: string, key: string, level: number): number | undefined {
  const v = canonicalActiveRow(canonId, level)?.specials?.[String(key).toLowerCase()];
  return typeof v === 'number' ? v : undefined;
}

export function canonicalRadiusM(canonId: string, level: number): number | undefined {
  return canonicalActiveRow(canonId, level)?.radiusM;
}

/** PL 1–16 series of one printed Special (0 where the PL is unavailable or unprinted). */
export function canonicalSpecialSeries(canonId: string, key: string): number[] {
  return Array.from({ length: 16 }, (_, i) => canonicalSpecialRank(canonId, key, i + 1) ?? 0);
}

/** PL 1–16 radius series (0 where the PL is unavailable or has no radius). */
export function canonicalRadiusSeries(canonId: string): number[] {
  return Array.from({ length: 16 }, (_, i) => canonicalRadiusM(canonId, i + 1) ?? 0);
}

export function singleTargetSpecialCanonId(flavour: ActiveFlavour, key: string): string {
  return `${flavour}-single-target-special-${String(key).toLowerCase()}`;
}

export function aoeSpecialCanonId(flavour: ActiveFlavour, key: string): string {
  return `${flavour}-aoe-special-${String(key).toLowerCase()}`;
}

/** Printed Ranged Persistent Special Zone table per Special tier. */
export const ZONE_CANON_ID_BY_TIER: Readonly<Record<3 | 4 | 5 | 6, string>> = {
  3: 'ranged-persistent-zone-blight',
  4: 'ranged-persistent-zone-standard-diminishing-special',
  5: 'ranged-persistent-zone-heavy-diminishing-special',
  6: 'ranged-persistent-zone-pool-reduction-special',
};
