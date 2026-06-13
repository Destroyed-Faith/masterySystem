/**
 * XP refund helpers when removing or replacing power items.
 */
export declare function getPowerMinLevel(item: {
    system?: {
        level?: number;
        minLevel?: number;
    };
}): number;
/** Refund XP spent raising this power above its minLevel. */
export declare function calculatePowerUpgradeRefund(item: {
    system?: {
        level?: number;
        minLevel?: number;
    };
}): number;
export declare function calculatePowersUpgradeRefund(powers: Array<{
    system?: {
        level?: number;
        minLevel?: number;
    };
}>): number;
//# sourceMappingURL=power-xp-refund.d.ts.map