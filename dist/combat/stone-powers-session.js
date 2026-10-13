/**
 * Session flags for Stone Powers encounter prompts.
 * Kept separate so close handlers can mark dismiss synchronously
 * without importing the full encounter pipeline (no cycles / no await).
 */
const dismissedThisSession = new Set();
let stonePowersClosedAt = 0;
/** After ✕, block ALL auto-opens until explicit UI open or round change. */
let autoOpenSuppressed = false;
let autoOpenSuppressedRound = 0;
function stepKey(combatId, actorId, step, round) {
    return round == null ? `${combatId}:${actorId}:${step}` : `${combatId}:${actorId}:${step}:${round}`;
}
function currentCombatRound() {
    return Math.max(1, Number(game?.combat?.round) || 1);
}
export function clearStonePowersSession() {
    dismissedThisSession.clear();
    stonePowersClosedAt = 0;
    autoOpenSuppressed = false;
    autoOpenSuppressedRound = 0;
}
/** Explicit player/GM open (sheet, carousel, …) may reopen after ✕. */
export function allowStonePowersAutoOpen() {
    autoOpenSuppressed = false;
    autoOpenSuppressedRound = 0;
    stonePowersClosedAt = 0;
}
export function stonePowersReopenBlocked(cooldownMs = 4000) {
    if (Date.now() - stonePowersClosedAt < cooldownMs)
        return true;
    return stonePowersAutoOpenSuppressed();
}
/**
 * True after the player closed Stone Powers with ✕ this round.
 * Round advance clears the block automatically.
 */
export function stonePowersAutoOpenSuppressed() {
    if (!autoOpenSuppressed)
        return false;
    const round = currentCombatRound();
    if (autoOpenSuppressedRound > 0 && round !== autoOpenSuppressedRound) {
        autoOpenSuppressed = false;
        autoOpenSuppressedRound = 0;
        return false;
    }
    return true;
}
export function isStonePowersDismissed(combatId, actorId, round, combatantId) {
    if (stonePowersAutoOpenSuppressed() && round === autoOpenSuppressedRound)
        return true;
    if (dismissedThisSession.has(stepKey(combatId, actorId, 'stones', round)))
        return true;
    if (combatantId && dismissedThisSession.has(stepKey(combatId, String(combatantId), 'stones', round))) {
        return true;
    }
    return false;
}
/**
 * Mark Stone Powers as dismissed for this combat round.
 * Call synchronously on ✕ / Escape — before any await — so a concurrent
 * encounter resume cannot reopen the dialog.
 */
export function dismissStonePowersPrompt(combat, actor, combatant) {
    stonePowersClosedAt = Date.now();
    autoOpenSuppressed = true;
    const round = Math.max(1, Number(combat?.round ?? game?.combat?.round) || 1);
    autoOpenSuppressedRound = round;
    const combatId = String(combat?.id ?? game?.combat?.id ?? '');
    const actorId = String(actor?.id ?? '');
    try {
        console.log('Mastery Stones | dismiss', {
            combatId: combatId || '(none)',
            actorId: actorId || '(none)',
            combatantId: combatant?.id ?? null,
            round,
            autoOpenSuppressed: true,
        });
    }
    catch {
        /* ignore */
    }
    if (!combatId || !actorId)
        return;
    dismissedThisSession.add(stepKey(combatId, actorId, 'stones', round));
    const combatantId = combatant?.id;
    if (combatantId) {
        dismissedThisSession.add(stepKey(combatId, String(combatantId), 'stones', round));
    }
}
export function logStonePowersGate(reason, detail) {
    try {
        console.log('Mastery Stones | gate', reason, detail ?? {});
    }
    catch {
        /* ignore */
    }
}
//# sourceMappingURL=stone-powers-session.js.map