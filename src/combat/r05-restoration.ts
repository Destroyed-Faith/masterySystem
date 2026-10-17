/**
 * R-05 — Healing / Restoration model helpers.
 *
 * Resolve Stones → ordinary HP.
 * Restoration Powers / Passive Regeneration / Remove Scar / rest → full Scarred Bars.
 * Damage Transfer unchanged (not handled here).
 */

import {
  buildRecoverScarredBarUpdates,
  countScarredHealthBars,
  recoverScarredBars,
} from '../stones/remove-scar.js';

// Pool tables, radius/range helpers and regen catalog text live in the leaf
// module `r05-pools.ts` (no import cycles); re-exported here for callers.
import {
  R05_MELEE_ST_POOL,
  R05_RANGED_ST_POOL,
  R05_MELEE_AOE_POOL,
  R05_RANGED_AOE_POOL,
  R05_PASSIVE_REGEN_POOL,
  clampPowerLevel,
  meleeAoeRadiusMeters,
  rangedAoeRadiusMeters,
  rangedRangeMeters,
  poolAt,
} from './r05-pools.js';

export {
  R05_MELEE_ST_POOL,
  R05_RANGED_ST_POOL,
  R05_MELEE_AOE_POOL,
  R05_RANGED_AOE_POOL,
  R05_PASSIVE_REGEN_POOL,
  clampPowerLevel,
  meleeAoeRadiusMeters,
  rangedAoeRadiusMeters,
  rangedRangeMeters,
  poolAt,
};
export { regenerationPoolMaxForLevel, regenerationCatalogText } from './r05-pools.js';

export const PP_PER_LEVEL_ACTIVE = 30;
export const PP_PER_LEVEL_PASSIVE = 20;
export const PP_PER_RESTORATION_BAR = 40;
export const PP_PER_RANGE_STEP = 5; // +4 m above 8 m
export const MELEE_AOE_RADIUS_COST: Record<number, number> = { 2: 20, 3: 50, 4: 90 };
export const RANGED_AOE_RADIUS_COST: Record<number, number> = { 2: 20, 3: 50 };

export function rangedRangeCostPp(pl: number): number {
  return PP_PER_RANGE_STEP * (clampPowerLevel(pl) - 1);
}

export function meleeAoePoolFromBudget(pl: number): number {
  const lvl = clampPowerLevel(pl);
  const radius = meleeAoeRadiusMeters(lvl);
  const cost = MELEE_AOE_RADIUS_COST[radius] ?? 90;
  return Math.max(0, Math.floor((PP_PER_LEVEL_ACTIVE * lvl - cost) / PP_PER_RESTORATION_BAR));
}

export function rangedAoePoolFromBudget(pl: number): number {
  const lvl = clampPowerLevel(pl);
  const radius = rangedAoeRadiusMeters(lvl);
  const radiusCost = RANGED_AOE_RADIUS_COST[radius] ?? 50;
  const budget = PP_PER_LEVEL_ACTIVE * lvl - rangedRangeCostPp(lvl) - radiusCost;
  return Math.max(0, Math.floor(budget / PP_PER_RESTORATION_BAR));
}

export function passiveRegenPoolFromBudget(pl: number): number {
  const lvl = clampPowerLevel(pl);
  return Math.max(0, Math.floor((PP_PER_LEVEL_PASSIVE * lvl) / PP_PER_RESTORATION_BAR));
}

/** Retired ordinary HP-heal Active template ids (R-05). */
export const R05_RETIRED_HEAL_ACTIVE_IDS = new Set([
  'active-melee-single-heal',
  'active-ranged-single-heal',
  'active-melee-aoe-heal',
  'active-ranged-aoe-heal',
  'active-melee-heal-cleanse-mixed',
  'active-ranged-heal-cleanse-mixed',
]);

/** Map legacy heal Active → Restoration template id. */
export const R05_HEAL_TO_RESTORATION_TEMPLATE: Record<string, string> = {
  'active-melee-single-heal': 'active-melee-health-level-heal',
  'active-ranged-single-heal': 'active-ranged-health-level-heal',
  'active-melee-aoe-heal': 'active-melee-aoe-restoration',
  'active-ranged-aoe-heal': 'active-ranged-aoe-restoration',
};

export const R05_RETIRED_HEALING_BUFF_IDS = new Set([
  'ab-healing',
  'ab-healing-aura',
  'ab-temp-hp-healing',
]);

export const R05_AOE_RESTORATION_IDS = new Set([
  'active-melee-aoe-restoration',
  'active-ranged-aoe-restoration',
]);

export function isScarredRestorationTemplateId(templateId: string | null | undefined): boolean {
  const tid = String(templateId || '');
  return (
    /health-level-heal/i.test(tid) ||
    /aoe-restoration/i.test(tid) ||
    tid === 'active-melee-aoe-restoration' ||
    tid === 'active-ranged-aoe-restoration'
  );
}

/**
 * Canonical Scarred Health Bar restoration (R-05).
 * Restored bars return at full current max HP; Active Bar and penalties recalculate.
 */
export async function restoreScarredHealthBars(
  actor: any,
  count: number,
): Promise<{ restored: number; updates: Record<string, unknown> }> {
  const want = Math.max(0, Math.floor(Number(count) || 0));
  if (!actor || want <= 0) return { restored: 0, updates: {} };
  const available = countScarredHealthBars(actor);
  const n = Math.min(want, available);
  if (n <= 0) return { restored: 0, updates: {} };
  const updates = buildRecoverScarredBarUpdates(actor, n);
  if (!Object.keys(updates).length) return { restored: 0, updates: {} };
  const before = available;
  await actor?.update?.(updates);
  try {
    const { clearDeathState, isIncapacitated } = await import('./death-check.js');
    if (!isIncapacitated(actor)) await clearDeathState(actor);
  } catch {
    /* ignore */
  }
  const after = countScarredHealthBars(actor);
  return { restored: Math.max(0, before - after), updates };
}

/** Sync wrapper matching older call sites that used recoverScarredBars. */
export async function restoreScarredHealthBarsCount(actor: any, count: number): Promise<number> {
  const { restored } = await restoreScarredHealthBars(actor, count);
  return restored;
}

/** Re-export for callers that still import recoverScarredBars semantics. */
export { recoverScarredBars, countScarredHealthBars, buildRecoverScarredBarUpdates };
