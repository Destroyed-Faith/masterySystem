/**
 * Read-only XP account. Explains Lifetime XP against spendable XP and
 * recorded spending. Does not write actor data.
 */
export interface XpConsistencyReport {
    lifetimeXp: number | null;
    lifetimeSource: string;
    totalEarned: number;
    freeEarned: number;
    totalGranted: number;
    spendableRegular: number;
    spendableFree: number;
    spendable: number;
    spentRegular: number;
    spentFree: number;
    spent: number;
    historySpend: Record<string, number>;
    martialXpRefund: number;
    /** totalGranted − (spendable + spent). 0 when the earned counters match the pools. */
    earnedGap: number;
    /** Lifetime XP − totalGranted. Null when Lifetime XP was never stored. */
    lifetimeGap: number | null;
    text: string;
}
export declare function explainXpAccount(actor: any): XpConsistencyReport;
//# sourceMappingURL=xp-consistency.d.ts.map