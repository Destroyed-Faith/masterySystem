/**
 * Cascade refund of one XP-history spend row.
 *
 * Drops the live value from current down to the row's `from` (floored at the
 * creation baseline) and refunds the *current* cost table, not the stored amount.
 */
import type { XpHistoryRow } from './xp-history.js';
export interface HistoryRefundPlan {
    refundable: boolean;
    reason?: string;
    category: string;
    key: string;
    label: string;
    current: number;
    target: number;
    floor: number;
    pending: number;
    refundXp: number;
}
export declare function liveRefundXp(category: string, current: number, target: number): number;
export declare function planHistoryRefund(actor: any, row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>): HistoryRefundPlan;
export declare function canRefundHistoryRow(actor: any, row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>): boolean;
export declare function refundHistoryRow(actor: any, row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>): Promise<{
    ok: boolean;
    error?: string;
    plan?: HistoryRefundPlan;
}>;
//# sourceMappingURL=xp-history-refund.d.ts.map