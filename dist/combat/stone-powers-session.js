/**
 * Session flags for Stone Powers encounter prompts.
 * Kept separate so close handlers can mark dismiss synchronously
 * without importing the full encounter pipeline (no cycles / no await).
 */
const dismissedThisSession = new Set();
let stonePowersClosedAt = 0;
function stepKey(combatId, actorId, step, round) {
    return round == null ? `${combatId}:${actorId}:${step}` : `${combatId}:${actorId}:${step}:${round}`;
}
export function clearStonePowersSession() {
    dismissedThisSession.clear();
    stonePowersClosedAt = 0;
}
export function stonePowersReopenBlocked(cooldownMs = 2500) {
    return Date.now() - stonePowersClosedAt < cooldownMs;
}
export function isStonePowersDismissed(combatId, actorId, round, combatantId) {
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
    const combatId = String(combat?.id ?? game?.combat?.id ?? '');
    const actorId = String(actor?.id ?? '');
    if (!combatId || !actorId)
        return;
    const round = Math.max(1, Number(combat?.round ?? game?.combat?.round) || 1);
    dismissedThisSession.add(stepKey(combatId, actorId, 'stones', round));
    const combatantId = combatant?.id;
    if (combatantId) {
        dismissedThisSession.add(stepKey(combatId, String(combatantId), 'stones', round));
    }
}
//# sourceMappingURL=stone-powers-session.js.map