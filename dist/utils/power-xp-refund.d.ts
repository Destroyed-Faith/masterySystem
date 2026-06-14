/**
 * XP refund helpers when removing or replacing power items.
 */
type PowerItemLike = {
    system?: {
        level?: number;
        minLevel?: number;
        rank?: number;
        category?: string;
        powerType?: string;
    };
    type?: string;
};
/**
 * Creation baseline rank for a power category.
 *
 * Per the character-creation rules every starting Power is granted at a fixed
 * rank — Actives at R2, defensive Powers (Passive / Active Buff / Reaction) at
 * R4. A Power can never have been "paid for" below this rank, so it is the
 * floor for any XP-refund baseline regardless of what `minLevel` is stored.
 */
export declare function creationBaselineRank(item: PowerItemLike): number;
/**
 * The level a Power is considered to have started at for XP purposes.
 *
 * Uses the stored `minLevel` when it is a valid integer, but never drops below
 * the category creation rank. This makes refunds correct even when `minLevel`
 * is missing, zero, or corrupted to a value below the creation baseline (the
 * cause of the over-refund bug), while preserving legitimate refunds for Powers
 * genuinely upgraded above their baseline.
 */
export declare function getPowerMinLevel(item: PowerItemLike): number;
/** Refund XP spent raising this power above its creation baseline. */
export declare function calculatePowerUpgradeRefund(item: PowerItemLike): number;
export declare function calculatePowersUpgradeRefund(powers: PowerItemLike[]): number;
export {};
//# sourceMappingURL=power-xp-refund.d.ts.map