/**
 * R-05 pure data: Restoration pool tables, radius / range helpers, catalog text.
 *
 * Only imports the generated (import-free) canonical table, so power template
 * files can read it at module-load time without creating an import cycle
 * through actors / the power catalog. `r05-restoration.ts` re-exports everything here.
 */
import { CANONICAL_ACTIVES } from '../utils/powers/canonical-actives.generated.js';
/** Printed Scarred-Bar pool PL 1–16 (0 where Unavailable). */
function canonicalBarPool(canonId) {
    const rows = CANONICAL_ACTIVES[canonId]?.rows ?? [];
    return Array.from({ length: 16 }, (_, i) => rows[i]?.bars ?? 0);
}
/** Melee ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export const R05_MELEE_ST_POOL = canonicalBarPool('melee-single-target-restoration');
/** Ranged ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export const R05_RANGED_ST_POOL = canonicalBarPool('ranged-single-target-restoration');
/** Melee AoE Restoration pool (Safe Haven Rest). PL1 unavailable. */
export const R05_MELEE_AOE_POOL = canonicalBarPool('melee-aoe-restoration');
/** Ranged AoE Restoration pool (Safe Haven Rest). PL1–2 unavailable. */
export const R05_RANGED_AOE_POOL = canonicalBarPool('ranged-aoe-restoration');
/** Passive: Restoration daily pool (Tyhran Day). PL1 unavailable. */
export const R05_PASSIVE_REGEN_POOL = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
export function clampPowerLevel(pl) {
    return Math.max(1, Math.min(16, Math.floor(Number(pl) || 1)));
}
export function meleeAoeRadiusMeters(pl) {
    return CANONICAL_ACTIVES['melee-aoe-restoration']?.rows[clampPowerLevel(pl) - 1]?.radiusM ?? 2;
}
export function rangedAoeRadiusMeters(pl) {
    return CANONICAL_ACTIVES['ranged-aoe-restoration']?.rows[clampPowerLevel(pl) - 1]?.radiusM ?? 2;
}
export function rangedRangeMeters(pl) {
    return 8 + 4 * (clampPowerLevel(pl) - 1);
}
export function poolAt(table, pl) {
    const idx = clampPowerLevel(pl) - 1;
    return Math.max(0, Math.floor(Number(table[idx]) || 0));
}
/** Passive: Restoration daily pool for a Power Level. */
export function regenerationPoolMaxForLevel(level) {
    return poolAt(R05_PASSIVE_REGEN_POOL, level);
}
/** Catalog row text for Passive: Restoration. */
export function regenerationCatalogText(level) {
    const n = regenerationPoolMaxForLevel(level);
    if (n <= 0) {
        return '**Not available at Power Level 1:** a Scarred Health Bar costs 40 PP (Passive budget 20 PP × PL).';
    }
    const noun = n === 1 ? 'Scarred Health Bar' : 'Scarred Health Bars';
    return (`Restore up to **${n} ${noun}** on yourself per Tyhran Day (full HP). ` +
        `Activate when able; does not spend Attack or Reaction. No turn-start healing.`);
}
//# sourceMappingURL=r05-pools.js.map