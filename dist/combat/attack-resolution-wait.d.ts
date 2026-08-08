/**
 * Wait for an attack card to fully resolve (roll → reactions → damage / miss / skip).
 * Used so Reaction Counterattacks pause the original attack's damage dialog.
 */
export type AttackResolutionStatus = 'resolved' | 'skipped' | 'failed';
export interface AttackResolutionResult {
    status: AttackResolutionStatus;
}
/** True when something is waiting on this attack card. */
export declare function isAwaitingAttackResolution(messageId: string): boolean;
/**
 * Block until {@link completeAttackResolution} is called for this message.
 * Safe to call once per message id; a second call returns immediately as skipped.
 */
export declare function waitForAttackResolution(messageId: string): Promise<AttackResolutionResult>;
/** Unblock any waiter for this attack card (idempotent). */
export declare function completeAttackResolution(messageId: string, result?: AttackResolutionResult): void;
//# sourceMappingURL=attack-resolution-wait.d.ts.map