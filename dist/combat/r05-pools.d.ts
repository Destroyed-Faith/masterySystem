/**
 * R-05 pure data: Restoration pool tables, radius / range helpers, catalog text.
 *
 * Leaf module (no imports) so power template files can read it at module-load
 * time without creating an import cycle through actors / the power catalog.
 * `r05-restoration.ts` re-exports everything here.
 */
/** Melee ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export declare const R05_MELEE_ST_POOL: readonly [0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12];
/** Ranged ST Restoration pool (Safe Haven Rest). PL1 unavailable. */
export declare const R05_RANGED_ST_POOL: readonly [0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, 9, 10];
/** Melee AoE Restoration pool (Safe Haven Rest). */
export declare const R05_MELEE_AOE_POOL: readonly [0, 1, 1, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7, 8, 9, 9];
/** Ranged AoE Restoration pool (Safe Haven Rest). */
export declare const R05_RANGED_AOE_POOL: readonly [0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 5, 6, 7, 7, 8, 8];
/** Passive: Restoration daily pool (Tyhran Day). PL1 unavailable. */
export declare const R05_PASSIVE_REGEN_POOL: readonly [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
export declare function clampPowerLevel(pl: number): number;
export declare function meleeAoeRadiusMeters(pl: number): number;
export declare function rangedAoeRadiusMeters(pl: number): number;
export declare function rangedRangeMeters(pl: number): number;
export declare function poolAt(table: readonly number[], pl: number): number;
/** Passive: Restoration daily pool for a Power Level. */
export declare function regenerationPoolMaxForLevel(level: number): number;
/** Catalog row text for Passive: Restoration. */
export declare function regenerationCatalogText(level: number): string;
//# sourceMappingURL=r05-pools.d.ts.map