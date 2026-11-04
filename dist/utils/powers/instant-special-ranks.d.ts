/**
 * Instant Single-Special printed ranks (docs/Rules/actives.md).
 * Each Special has its own Melee / Ranged single-target progression.
 * Used by active-*-instant-special-t* templates via bindPoolSpecialsOnRow.
 */
export type InstantSpecialKey = 'blight' | 'challenge' | 'corrode' | 'disoriented' | 'expose' | 'hex' | 'lacerate' | 'mark' | 'root' | 'ruin' | 'slow' | 'soulburn' | 'sundered' | 'weaken';
export declare const MELEE_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
export declare const RANGED_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
/**
 * Canonical Actives.md — Ranged AoE Special: Root (named Instant AoE identity).
 * Used when Binding Circle / Instant AoE Root binds onto `active-ranged-aoe-damage-t*`.
 */
export declare const RANGED_AOE_INSTANT_ROOT_RANKS: readonly number[];
export declare const RANGED_AOE_INSTANT_ROOT_RADIUS_M: readonly number[];
/**
 * Canonical Actives.md — Melee AoE Special: Lacerate (Instant AoE identity).
 * Used when Rending Spiral / Instant AoE Lacerate binds onto `active-melee-aoe-damage-t*`.
 */
export declare const MELEE_AOE_INSTANT_LACERATE_RANKS: readonly number[];
export declare const MELEE_AOE_INSTANT_LACERATE_RADIUS_M: readonly number[];
/**
 * Canonical Actives.md — Melee AoE Special: Slow (Instant AoE identity).
 * Used when Heart of Winter Frostwave / Instant AoE Slow binds onto
 * `active-melee-aoe-damage-t*` (dice remain 0; special-only).
 */
export declare const MELEE_AOE_INSTANT_SLOW_RANKS: readonly number[];
export declare const MELEE_AOE_INSTANT_SLOW_RADIUS_M: readonly number[];
/** Printed Instant AoE Root rank for a Power Level (Ranged). */
export declare function rangedAoeInstantRootRank(level: number): number | undefined;
/** Printed Instant AoE Root radius (m) for a Power Level (Ranged). */
export declare function rangedAoeInstantRootRadiusM(level: number): number | undefined;
/** Printed Instant AoE Lacerate rank for a Power Level (Melee). */
export declare function meleeAoeInstantLacerateRank(level: number): number | undefined;
/** Printed Instant AoE Lacerate radius (m) for a Power Level (Melee). */
export declare function meleeAoeInstantLacerateRadiusM(level: number): number | undefined;
/** Printed Instant AoE Slow rank for a Power Level (Melee). */
export declare function meleeAoeInstantSlowRank(level: number): number | undefined;
/** Printed Instant AoE Slow radius (m) for a Power Level (Melee). */
export declare function meleeAoeInstantSlowRadiusM(level: number): number | undefined;
export declare function isInstantSpecialKey(key: string | null | undefined): key is InstantSpecialKey;
/** Printed Instant Single-Special rank for a delivery + Special + PL. */
export declare function instantSpecialRank(flavour: 'melee' | 'ranged', specialKey: string | null | undefined, level: number): number | undefined;
//# sourceMappingURL=instant-special-ranks.d.ts.map