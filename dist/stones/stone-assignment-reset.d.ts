/**
 * GM "Reset Stone Assignments" must refund stones AND reverse applied effects
 * (Temp HP, once-per-combat gates, round stone bonuses, enemy Movement Reduction /
 * Reaction Denial). Otherwise the stone returns while the buff remains.
 */
export type StoneReceiptRow = {
    accKey: string;
    value: unknown;
};
/** Highest paid Rank per powerId from a payment receipt. */
export declare function receiptPowerTiers(receipt: StoneReceiptRow[] | undefined | null): Map<string, number>;
/** Temp HP granted by vitality.tempHp for a paid receipt (0 if absent). */
export declare function tempHpFromStoneReceipt(receipt: StoneReceiptRow[] | undefined | null): number;
/**
 * Reverse effects from a paid Stone Assignment receipt before stones are refunded.
 */
export declare function revertStoneAssignmentEffects(opts: {
    actor: any;
    combat: any;
    combatant?: any;
    receipt?: StoneReceiptRow[] | null;
}): Promise<{
    tempHpRemoved: number;
    powers: string[];
}>;
//# sourceMappingURL=stone-assignment-reset.d.ts.map