/**
 * XP history: one row per spend/grant step, plus a resizable GM dialog.
 *
 * Older batched confirm entries (`details.changes`) are expanded when shown
 * so existing logs still read as individual steps.
 */
export type XpHistoryKind = 'grant' | 'spend' | 'adjust' | 'step' | 'step-end';
export type XpHistoryCategory = 'xp' | 'attribute' | 'skill' | 'power' | 'artifact';
export interface XpHistoryBalances {
    available: number;
    totalEarned: number;
    totalSpent: number;
}
export interface XpHistoryEntry {
    ts: number;
    userId?: string;
    userName?: string;
    kind: XpHistoryKind | string;
    category?: XpHistoryCategory | string;
    amount?: number;
    note?: string;
    details?: any;
    before?: XpHistoryBalances;
    after?: XpHistoryBalances;
}
export interface XpHistoryRow {
    ts: number;
    kind: string;
    category: string;
    amount: number;
    signedAmount: number;
    what: string;
    note: string;
    key: string;
    from?: number;
    to?: number;
}
export declare function currentXpUser(): {
    userId: string;
    userName: string;
};
export declare function appendXpHistory(actor: any, entries: XpHistoryEntry[]): XpHistoryEntry[];
export declare function localizeXpHistory(key: string, fallback: string, data?: Record<string, string>): string;
export declare function escapeXpHistoryHtml(value: unknown): string;
export declare function historyChangeKey(change: any, details?: any): string;
/** Expand stored history into one display row per XP step. */
export declare function expandHistoryRows(entries: XpHistoryEntry[] | unknown): XpHistoryRow[];
/** Spend rows for artifact levels that exist on the actor but were never logged. */
export declare function inferMissingArtifactHistoryEntries(actor: any, existing?: XpHistoryEntry[]): XpHistoryEntry[];
export declare function historyEntriesForActor(actor: any): XpHistoryEntry[];
export declare function buildBandedStepEntries(opts: {
    category: 'attribute' | 'skill' | 'power';
    pendingMap: Record<string, number>;
    getCurrent: (key: string) => number;
    getLabel: (key: string) => string;
    costForTarget: (targetValue: number) => number;
    before: XpHistoryBalances;
    after: XpHistoryBalances;
    user?: {
        userId: string;
        userName: string;
    };
    ts?: number;
}): XpHistoryEntry[];
export declare function renderXpHistoryTableHtml(actorName: string, entries: XpHistoryEntry[], options?: {
    canRefund?: (row: XpHistoryRow) => boolean;
    actor?: any;
}): string;
export declare function openXpHistoryDialog(actor: any, options?: {
    onCleared?: () => void;
}): Promise<void>;
//# sourceMappingURL=xp-history.d.ts.map