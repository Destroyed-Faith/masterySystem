/**
 * Cascade refund of one XP-history spend row.
 *
 * Drops the live value from current down to the row's `from` (floored at the
 * creation baseline) and refunds the *current* cost table, not the stored amount.
 *
 * Artifact rows prefer the world evolution node's level over a stale embed field.
 * When history shows a paid upgrade but live level is already at/below `from`
 * (desync / orphan spend), GMs can still credit the XP without a tree walk.
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
    /** Artifact XP was spent but live evolution no longer reflects it. */
    orphan?: boolean;
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