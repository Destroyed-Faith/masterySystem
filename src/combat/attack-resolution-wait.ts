/**
 * Wait for an attack card to fully resolve (roll → reactions → damage / miss / skip).
 * Used so Reaction Counterattacks pause the original attack's damage dialog.
 */

export type AttackResolutionStatus = 'resolved' | 'skipped' | 'failed';

export interface AttackResolutionResult {
  status: AttackResolutionStatus;
}

type Waiter = {
  resolve: (result: AttackResolutionResult) => void;
};

const pending = new Map<string, Waiter>();

/** True when something is waiting on this attack card. */
export function isAwaitingAttackResolution(messageId: string): boolean {
  return pending.has(String(messageId || ''));
}

/**
 * Block until {@link completeAttackResolution} is called for this message.
 * Safe to call once per message id; a second call returns immediately as skipped.
 */
export function waitForAttackResolution(messageId: string): Promise<AttackResolutionResult> {
  const id = String(messageId || '');
  if (!id) return Promise.resolve({ status: 'failed' });
  if (pending.has(id)) {
    console.warn('Mastery System | waitForAttackResolution: already waiting on', id);
    return Promise.resolve({ status: 'skipped' });
  }
  return new Promise<AttackResolutionResult>((resolve) => {
    pending.set(id, { resolve });
  });
}

/** Unblock any waiter for this attack card (idempotent). */
export function completeAttackResolution(
  messageId: string,
  result: AttackResolutionResult = { status: 'resolved' },
): void {
  const id = String(messageId || '');
  const waiter = pending.get(id);
  if (!waiter) return;
  pending.delete(id);
  try {
    waiter.resolve(result);
  } catch (err) {
    console.warn('Mastery System | completeAttackResolution resolve failed', err);
  }
}
