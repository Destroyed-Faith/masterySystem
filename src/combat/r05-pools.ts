/**
 * R-05 pure data: Restoration pool tables, radius / range helpers, catalog text.
 *
 * Leaf module (no imports) so power template files can read it at module-load
 * time without creating an import cycle through actors / the power catalog.
 * `r05-restoration.ts` re-exports everything here.
 */

/** Melee ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export const R05_MELEE_ST_POOL = [0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12] as const;
/** Ranged ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export const R05_RANGED_ST_POOL = [0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, 9, 10] as const;
/** Melee AoE Restoration pool (Safe Haven Rest). */
export const R05_MELEE_AOE_POOL = [0, 1, 1, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7, 8, 9, 9] as const;
/** Ranged AoE Restoration pool (Safe Haven Rest). */
export const R05_RANGED_AOE_POOL = [0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 5, 6, 7, 7, 8, 8] as const;
/** Passive: Restoration daily pool (Tyhran Day). PL1 unavailable. */
export const R05_PASSIVE_REGEN_POOL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8] as const;

export function clampPowerLevel(pl: number): number {
  return Math.max(1, Math.min(16, Math.floor(Number(pl) || 1)));
}

export function meleeAoeRadiusMeters(pl: number): number {
  const lvl = clampPowerLevel(pl);
  if (lvl <= 5) return 2;
  if (lvl <= 8) return 3;
  return 4;
}

export function rangedAoeRadiusMeters(pl: number): number {
  const lvl = clampPowerLevel(pl);
  return lvl <= 8 ? 2 : 3;
}

export function rangedRangeMeters(pl: number): number {
  return 8 + 4 * (clampPowerLevel(pl) - 1);
}

export function poolAt(table: readonly number[], pl: number): number {
  const idx = clampPowerLevel(pl) - 1;
  return Math.max(0, Math.floor(Number(table[idx]) || 0));
}

/** Passive: Restoration daily pool for a Power Level. */
export function regenerationPoolMaxForLevel(level: number): number {
  return poolAt(R05_PASSIVE_REGEN_POOL, level);
}

/** Catalog row text for Passive: Restoration. */
export function regenerationCatalogText(level: number): string {
  const n = regenerationPoolMaxForLevel(level);
  if (n <= 0) {
    return '**Not available at Power Level 1:** a Scarred Health Bar costs 40 PP (Passive budget 20 PP × PL).';
  }
  const noun = n === 1 ? 'Scarred Health Bar' : 'Scarred Health Bars';
  return (
    `Restore up to **${n} ${noun}** on yourself per Tyhran Day (full HP). ` +
    `Activate when able; does not spend Attack or Reaction. No turn-start healing.`
  );
}
