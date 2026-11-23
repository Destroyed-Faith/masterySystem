/**
 * Shared Intellect Free Raises.
 * The Stone user decides how its unchanged pool is split: an allocation moves
 * Raises from the donor's `stoneBonuses.freeRaises` into the recipient's
 * `sharedFreeRaisesReceived` (see `teamwork-transactions.ts`). A recipient
 * spends only its own pool and what it was assigned — never a donor's pool —
 * so each Raise is spent once and nobody confirms individual attacks.
 */
export type FreeRaiseSource = {
    /** The Stone user whose Raises these are (self for the own pool). */
    actorId: string;
    name: string;
    remaining: number;
    self: boolean;
};
/** Raises assigned to this actor by allies for the current Round. */
export declare function receivedSharedFreeRaises(recipient: any, combat: Combat | null): number;
/** Own pool first, then each ally assignment. */
export declare function listFreeRaiseSources(recipient: any, combat: Combat | null): FreeRaiseSource[];
/** Total Free Raises the recipient may commit (own pool + assigned Raises). */
export declare function totalAvailableSharedFreeRaises(recipient: any, combat: Combat | null): number;
/**
 * Commit `amount` Free Raises: own pool first, then assigned Raises in the
 * order they were given. One Round-state write on the recipient; a failed
 * write spends nothing.
 */
export declare function consumeFreeRaisesPreferSelfThenDonors(recipient: any, amount: number, combat: Combat | null): Promise<{
    spent: number;
    from: Array<{
        actorId: string;
        amount: number;
    }>;
}>;
/**
 * GM Stone reset of a donor: unspent Raises it assigned to allies return with
 * the refunded Stones, so the reset never leaves Raises without a Stone cost.
 * Raises a recipient already spent stay spent.
 */
export declare function reclaimSharedFreeRaises(donor: any, combat: Combat | null): Promise<number>;
//# sourceMappingURL=shared-free-raises.d.ts.map