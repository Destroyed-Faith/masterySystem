/**
 * Active Buff: Parry Recovery (template id `ab-reinforced-parry`).
 * After Parry is spent, refund up to the buff's per-round cap.
 * The pool cannot rise above the amount with which Parry was entered.
 * Works for Martial Parry and Spell Parry — both spend the same pool.
 */
export interface ParryRecoveryInput {
    spent: number;
    pool: number;
    entryPool: number;
    recoveredThisRound: number;
    maxRecoverPerRound: number;
}
export interface ParryRecoveryResult {
    pool: number;
    recoveredThisRound: number;
    regained: number;
}
export declare function computeParryRecovery(input: ParryRecoveryInput): ParryRecoveryResult;
/** Per-round recovery cap from a maintained Parry Recovery buff. 0 if absent. */
export declare function readParryRecoveryCap(actor: any): number;
//# sourceMappingURL=parry-recovery.d.ts.map