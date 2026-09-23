/**
 * v0.9.9.0 printed ranks for Specials that remove Attack / Attribute Pool dice.
 *
 * Shared Active tables stay on the non-pool column (Corrode, Hex, Sundered,
 * Expose, Root, and the rest). These overrides apply only when the chosen
 * Special is Challenge, Disoriented, Soulburn, or Weaken.
 *
 * Source: docs/Rules/actives.md, active-buffs.md, reactions.md. Do not halve
 * a rank at runtime — the arrays below are the catalogue.
 */
export declare const POOL_REDUCING_SPECIAL_KEYS: readonly ["challenge", "disoriented", "soulburn", "weaken"];
export type PoolReducingSpecialKey = (typeof POOL_REDUCING_SPECIAL_KEYS)[number];
export declare function isPoolReducingSpecial(key: string | null | undefined): boolean;
/**
 * Printed rank for a pool-reducing Special on a known template.
 * `undefined` means "keep the shared non-pool table".
 * `null` means this level prints no Special.
 */
export declare function poolSpecialRankOverride(templateId: string | null | undefined, specialKey: string | null | undefined, level: number): number | null | undefined;
/** Active Buff: Special Increase. Non-pool curve, or the pool-special curve when `key` is one. */
export declare function activeBuffSpecialIncrease(level: number, key?: string | null): number;
/** Reaction: Special Increase. Narrower than the Active Buff curve. */
export declare function reactionSpecialIncrease(level: number, key?: string | null): number;
export declare function specialIncreasePair(templateId: string | null | undefined, level: number): {
    amount: number;
    poolAmount: number;
} | null;
type SpecialRow = {
    key: string;
    rank?: number;
    note?: string;
};
/**
 * Bind a `SPECIAL` placeholder and, when the chosen Special is pool-reducing,
 * replace the shared-table rank with the printed v0.9.9.0 rank.
 * Root still cannot print below Root(2).
 */
export declare function bindPoolSpecialsOnRow<T extends {
    specials?: SpecialRow[];
    effect?: {
        text?: string;
    };
}>(row: T, chosenKey: string | null | undefined, templateId: string | null | undefined, level: number): T;
export {};
//# sourceMappingURL=pool-special-ranks.d.ts.map