/**
 * GM utility: wipe XP accounting on a character without reverting purchased
 * attributes / skills / powers (use `resetActorProgressToPostCreation` for that).
 */
export interface XpAccountingSnapshot {
    regularAvailable: number;
    freeAvailable: number;
    totalEarned: number;
    totalSpent: number;
    freeEarned: number;
    freeSpent: number;
    historyLength: number;
}
/** Read current XP pool totals for confirm dialogs. */
export declare function readXpAccounting(actor: any): XpAccountingSnapshot;
export declare function hasAnyXpAccounting(snap: XpAccountingSnapshot): boolean;
/** HTML snippet for the GM confirm dialog. */
export declare function formatXpAccountResetConfirmHtml(actorName: string, snap: XpAccountingSnapshot): string;
/**
 * Zero all XP balances, clear history, and reset the Upgrade Step bump lists.
 * Does not change attributes, skills, power levels, or post-creation snapshots.
 */
export declare function resetActorXpAccounting(actor: any): Promise<void>;
/** Reset XP accounting for every character actor. Returns count touched. */
export declare function resetAllCharactersXpAccounting(actors: any[]): Promise<number>;
/** GM confirm dialog — reset one character's XP accounting. */
export declare function promptResetActorXpAccounting(actor: any, onComplete?: () => void): void;
/** GM confirm dialog — reset XP accounting on every player character. */
export declare function promptResetAllCharactersXpAccounting(onComplete?: () => void): void;
//# sourceMappingURL=xp-account-reset.d.ts.map