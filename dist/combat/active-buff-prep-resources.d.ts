/**
 * Preparation-scoped Active Buff resource ledger (Batch 6.1).
 *
 * Round-based Buff resources (Temp HP, Damage Negation pools) initialize once
 * per Preparation Phase per Buff template. Ending and re-activating the same
 * template in the same Prep (A → B → A) must not re-grant a fresh full pool.
 *
 * Critical / Maximization combat quotas stay on their own spent trackers.
 */
export type ActiveBuffPrepResourceEntry = {
    /** Temp HP for this template was already granted this Preparation. */
    thpGranted?: boolean;
    /** Last known DN remaining when the Buff ended or after last refresh. */
    dnRemaining?: number;
    /** Printed DN pool max for this template at last snapshot. */
    dnMax?: number;
};
export type ActiveBuffPrepResourceLedger = Record<string, ActiveBuffPrepResourceEntry>;
/** Stable key: one grant cycle per combat + Prep round + Buff template. */
export declare function activeBuffPrepResourceKey(combatId: string, prepRound: number, templateId: string): string;
export declare function readPrepResourceEntry(ledger: ActiveBuffPrepResourceLedger | null | undefined, key: string): ActiveBuffPrepResourceEntry;
/** True when Temp HP may still be granted for this template in this Prep. */
export declare function canGrantPrepTempHP(ledger: ActiveBuffPrepResourceLedger | null | undefined, key: string): boolean;
export declare function markPrepTempHPGranted(ledger: ActiveBuffPrepResourceLedger | null | undefined, key: string): ActiveBuffPrepResourceLedger;
/**
 * Resolve DN pool points for activate / Prep refresh.
 * First touch this Prep → full max. Later re-activate same template → prior remaining.
 */
export declare function resolvePrepDamageNegationPool(ledger: ActiveBuffPrepResourceLedger | null | undefined, key: string, max: number): {
    remaining: number;
    ledger: ActiveBuffPrepResourceLedger;
};
/** Snapshot DN remaining when a Buff ends (before effect deletion). */
export declare function snapshotPrepDamageNegationOnEnd(ledger: ActiveBuffPrepResourceLedger | null | undefined, key: string, remaining: number, max: number): ActiveBuffPrepResourceLedger;
/** Template / artifact key used for the Prep resource ledger. */
export declare function activeBuffResourceIdentity(flags: Record<string, unknown> | null | undefined): string;
//# sourceMappingURL=active-buff-prep-resources.d.ts.map