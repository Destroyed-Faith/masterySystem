/**
 * R-05 — Healing / Restoration model helpers.
 *
 * Resolve Stones → ordinary HP.
 * Restoration Powers / Passive Regeneration / Remove Scar / rest → full Scarred Bars.
 * Damage Transfer unchanged (not handled here).
 */
import { buildRecoverScarredBarUpdates, countScarredHealthBars, recoverScarredBars } from '../stones/remove-scar.js';
import { R05_MELEE_ST_POOL, R05_RANGED_ST_POOL, R05_MELEE_AOE_POOL, R05_RANGED_AOE_POOL, R05_PASSIVE_REGEN_POOL, clampPowerLevel, meleeAoeRadiusMeters, rangedAoeRadiusMeters, rangedRangeMeters, poolAt } from './r05-pools.js';
export { R05_MELEE_ST_POOL, R05_RANGED_ST_POOL, R05_MELEE_AOE_POOL, R05_RANGED_AOE_POOL, R05_PASSIVE_REGEN_POOL, clampPowerLevel, meleeAoeRadiusMeters, rangedAoeRadiusMeters, rangedRangeMeters, poolAt, };
export { regenerationPoolMaxForLevel, regenerationCatalogText } from './r05-pools.js';
export declare const PP_PER_LEVEL_ACTIVE = 30;
export declare const PP_PER_LEVEL_PASSIVE = 20;
export declare const PP_PER_RESTORATION_BAR = 40;
export declare const PP_PER_RANGE_STEP = 5;
export declare const MELEE_AOE_RADIUS_COST: Record<number, number>;
export declare const RANGED_AOE_RADIUS_COST: Record<number, number>;
export declare function rangedRangeCostPp(pl: number): number;
export declare function meleeAoePoolFromBudget(pl: number): number;
export declare function rangedAoePoolFromBudget(pl: number): number;
export declare function passiveRegenPoolFromBudget(pl: number): number;
/** Retired ordinary HP-heal Active template ids (R-05). */
export declare const R05_RETIRED_HEAL_ACTIVE_IDS: Set<string>;
/** Map legacy heal Active → Restoration template id. */
export declare const R05_HEAL_TO_RESTORATION_TEMPLATE: Record<string, string>;
export declare const R05_RETIRED_HEALING_BUFF_IDS: Set<string>;
export declare const R05_AOE_RESTORATION_IDS: Set<string>;
export declare function isScarredRestorationTemplateId(templateId: string | null | undefined): boolean;
/**
 * Canonical Scarred Health Bar restoration (R-05).
 * Restored bars return at full current max HP; Active Bar and penalties recalculate.
 */
export declare function restoreScarredHealthBars(actor: any, count: number): Promise<{
    restored: number;
    updates: Record<string, unknown>;
}>;
/** Sync wrapper matching older call sites that used recoverScarredBars. */
export declare function restoreScarredHealthBarsCount(actor: any, count: number): Promise<number>;
/** Re-export for callers that still import recoverScarredBars semantics. */
export { recoverScarredBars, countScarredHealthBars, buildRecoverScarredBarUpdates };
//# sourceMappingURL=r05-restoration.d.ts.map