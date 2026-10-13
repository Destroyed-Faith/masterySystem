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
    flags?: {
        'mastery-system'?: {
            xpPurchased?: boolean;
            gmGranted?: boolean;
            startingPower?: boolean;
        };
    };
    getFlag?: (scope: string, key: string) => unknown;
};
/** Sum of `powerLevelCost(1) … powerLevelCost(level)`. */
export declare function powerLadderCost(toLevel: number): number;
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
/**
 * True when this power was bought with XP after character creation
 * (or legacy L1 floor without a free-grant flag).
 */
export declare function wasPowerXpPurchased(item: PowerItemLike): boolean;
/**
 * XP to return when deleting a power item after character creation.
 *
 * - GM-granted / Startfähigkeit: only paid upgrades above baseline
 * - XP-purchased (or legacy minLevel === 1): full ladder 1…level
 * - Creation package: upgrades above creation baseline only
 */
export declare function calculatePowerDeletionRefund(item: PowerItemLike): number;
export {};
//# sourceMappingURL=power-xp-refund.d.ts.map