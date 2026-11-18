/**
 * Printed Special ranks (docs/Rules/Canonical/Actives.md, via the generated table module).
 * Each Special has its own Melee / Ranged Single Target and AoE progression.
 * Used by active-*-instant-special-t*, active-*-aoe-damage-t* and zone templates
 * via bindPoolSpecialsOnRow.
 */
import { type ActiveFlavour } from './canonical-active-lookup.js';
export type InstantSpecialKey = 'blight' | 'challenge' | 'corrode' | 'disoriented' | 'expose' | 'hex' | 'lacerate' | 'mark' | 'root' | 'ruin' | 'slow' | 'soulburn' | 'sundered' | 'weaken';
export declare const MELEE_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
export declare const RANGED_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
export declare const RANGED_AOE_INSTANT_ROOT_RANKS: readonly number[];
export declare const RANGED_AOE_INSTANT_ROOT_RADIUS_M: readonly number[];
export declare const MELEE_AOE_INSTANT_LACERATE_RANKS: readonly number[];
export declare const MELEE_AOE_INSTANT_LACERATE_RADIUS_M: readonly number[];
export declare const MELEE_AOE_INSTANT_SLOW_RANKS: readonly number[];
export declare const MELEE_AOE_INSTANT_SLOW_RADIUS_M: readonly number[];
/** Printed AoE Special rank (Melee/Ranged AoE Special: X) for a Power Level. */
export declare function aoeSpecialRank(flavour: ActiveFlavour, specialKey: string | null | undefined, level: number): number | undefined;
/** Printed AoE Special radius (m) for a Power Level. */
export declare function aoeSpecialRadiusM(flavour: ActiveFlavour, specialKey: string | null | undefined, level: number): number | undefined;
/**
 * Printed Ranged Persistent Special Zone rank. `undefined` when the Special is
 * not printed for that Zone tier (e.g. Root) or the PL is unavailable.
 */
export declare function zoneSpecialRank(tier: 3 | 4 | 5 | 6, specialKey: string | null | undefined, level: number): number | undefined;
/** Printed Ranged Persistent Special Zone radius (m); 0 when unavailable. */
export declare function zoneRadiusM(tier: 3 | 4 | 5 | 6, level: number): number;
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