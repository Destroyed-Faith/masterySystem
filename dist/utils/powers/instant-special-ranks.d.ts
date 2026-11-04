/**
 * Instant Single-Special printed ranks (docs/Rules/actives.md).
 * Each Special has its own Melee / Ranged single-target progression.
 * Used by active-*-instant-special-t* templates via bindPoolSpecialsOnRow.
 */
export type InstantSpecialKey = 'blight' | 'challenge' | 'corrode' | 'disoriented' | 'expose' | 'hex' | 'lacerate' | 'mark' | 'root' | 'ruin' | 'slow' | 'soulburn' | 'sundered' | 'weaken';
export declare const MELEE_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
export declare const RANGED_INSTANT_SPECIAL_RANKS: Readonly<Record<InstantSpecialKey, readonly number[]>>;
export declare function isInstantSpecialKey(key: string | null | undefined): key is InstantSpecialKey;
/** Printed Instant Single-Special rank for a delivery + Special + PL. */
export declare function instantSpecialRank(flavour: 'melee' | 'ranged', specialKey: string | null | undefined, level: number): number | undefined;
//# sourceMappingURL=instant-special-ranks.d.ts.map