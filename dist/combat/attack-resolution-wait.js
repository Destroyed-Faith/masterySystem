/**
 * Wait for an attack card to fully resolve (roll → reactions → damage / miss / skip).
 * Used so Reaction Counterattacks pause the original attack's damage dialog.
 */
const pending = new Map();
/** True when something is waiting on this attack card. */
export function isAwaitingAttackResolution(messageId) {
    return pending.has(String(messageId || ''));
}
/**
 * Block until {@link completeAttackResolution} is called for this message.
 * Safe to call once per message id; a second call returns immediately as skipped.
 */
export function waitForAttackResolution(messageId) {
    const id = String(messageId || '');
    if (!id)
        return Promise.resolve({ status: 'failed' });
    if (pending.has(id)) {
        console.warn('Mastery System | waitForAttackResolution: already waiting on', id);
        return Promise.resolve({ status: 'skipped' });
    }
    return new Promise((resolve) => {
        pending.set(id, { resolve });
    });
}
/** Unblock any waiter for this attack card (idempotent). */
export function completeAttackResolution(messageId, result = { status: 'resolved' }) {
    const id = String(messageId || '');
    const waiter = pending.get(id);
    if (!waiter)
        return;
    pending.delete(id);
    try {
        waiter.resolve(result);
    }
    catch (err) {
        console.warn('Mastery System | completeAttackResolution resolve failed', err);
    }
}
//# sourceMappingURL=attack-resolution-wait.js.map