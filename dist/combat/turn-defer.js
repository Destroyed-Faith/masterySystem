/**
 * GM Turn Deferral — preserve a Turn without Delay Initiative (score change)
 * and without End Turn completion.
 */
export const DEFERRED_IDS_FLAG = 'deferredCombatantIds';
export const TURN_STARTED_IDS_FLAG = 'turnStartedCombatantIds';
export const COMPLETED_IDS_FLAG = 'completedCombatantIds';
export const DEFER_ORDER_FLAG = 'deferOrderIds';
function combatantList(combat) {
    const bag = combat?.combatants;
    if (!bag)
        return [];
    if (Array.isArray(bag.contents))
        return bag.contents;
    if (typeof bag.values === 'function')
        return Array.from(bag.values());
    return Array.from(bag);
}
function readIdList(combat, flag) {
    const raw = typeof combat?.getFlag === 'function'
        ? combat.getFlag('mastery-system', flag)
        : combat?.flags?.['mastery-system']?.[flag];
    if (!Array.isArray(raw))
        return [];
    return raw.map((id) => String(id || '').trim()).filter(Boolean);
}
async function writeIdList(combat, flag, ids) {
    if (!combat?.setFlag)
        return;
    await combat.setFlag('mastery-system', flag, [...new Set(ids.map(String))]);
}
export function readDeferredIds(combat) {
    return readIdList(combat, DEFERRED_IDS_FLAG);
}
export function readTurnStartedIds(combat) {
    return readIdList(combat, TURN_STARTED_IDS_FLAG);
}
export function readCompletedIds(combat) {
    return readIdList(combat, COMPLETED_IDS_FLAG);
}
export function readDeferOrderIds(combat) {
    return readIdList(combat, DEFER_ORDER_FLAG);
}
export function isCombatantDeferred(combat, combatantId) {
    return readDeferredIds(combat).includes(String(combatantId));
}
export function hasCombatantStartedTurn(combat, combatantId) {
    return readTurnStartedIds(combat).includes(String(combatantId));
}
export async function markTurnStarted(combat, combatantId) {
    const id = String(combatantId || '').trim();
    if (!id || !combat)
        return;
    const list = readTurnStartedIds(combat);
    if (list.includes(id))
        return;
    await writeIdList(combat, TURN_STARTED_IDS_FLAG, [...list, id]);
}
export async function markTurnCompleted(combat, combatantId) {
    const id = String(combatantId || '').trim();
    if (!id || !combat)
        return;
    const completed = readCompletedIds(combat);
    if (!completed.includes(id)) {
        await writeIdList(combat, COMPLETED_IDS_FLAG, [...completed, id]);
    }
    const deferred = readDeferredIds(combat).filter((x) => x !== id);
    await writeIdList(combat, DEFERRED_IDS_FLAG, deferred);
    if (!deferred.length) {
        await writeIdList(combat, DEFER_ORDER_FLAG, []);
    }
    else {
        const turns = Array.isArray(combat.turns) ? combat.turns : combatantList(combat);
        const turnIds = turns.map((c) => String(c.id ?? '')).filter(Boolean);
        await writeIdList(combat, DEFER_ORDER_FLAG, buildDeferredRoundOrder(turnIds, deferred, [...completed, id]));
    }
}
/** Whether start-of-turn effects should run for this combatant. */
export function shouldRunTurnStartEffects(combat, combatantId) {
    const id = String(combatantId || '').trim();
    if (!id)
        return true;
    // Already ran this Round — never replay.
    if (hasCombatantStartedTurn(combat, id))
        return false;
    return true;
}
/**
 * Build executable order: completed (in current turns order) →
 * non-deferred remaining (initiative / surprise order) → deferred remaining.
 */
export function buildDeferredRoundOrder(turnIds, deferredIds, completedIds) {
    const deferred = new Set(deferredIds.map(String));
    const completed = new Set(completedIds.map(String));
    const done = turnIds.filter((id) => completed.has(id));
    const remaining = turnIds.filter((id) => !completed.has(id));
    const active = remaining.filter((id) => !deferred.has(id));
    const def = remaining.filter((id) => deferred.has(id));
    // Preserve relative order within each bucket (turnIds already sorted).
    return [...done, ...active, ...def];
}
export async function deferCombatantTurn(combat, combatantId) {
    if (!globalThis.game?.user?.isGM) {
        return { ok: false, message: 'GM only' };
    }
    if (!combat?.started)
        return { ok: false, message: 'Combat is not live.' };
    const id = String(combatantId || combat.combatant?.id || '').trim();
    if (!id)
        return { ok: false, message: 'No combatant to defer.' };
    const completed = readCompletedIds(combat);
    if (completed.includes(id)) {
        return { ok: false, message: 'That Turn is already completed.' };
    }
    const deferred = readDeferredIds(combat);
    if (!deferred.includes(id)) {
        await writeIdList(combat, DEFERRED_IDS_FLAG, [...deferred, id]);
    }
    const turns = Array.isArray(combat.turns) ? combat.turns : combatantList(combat);
    const turnIds = turns.map((c) => String(c.id ?? '')).filter(Boolean);
    const order = buildDeferredRoundOrder(turnIds, readDeferredIds(combat), completed);
    await writeIdList(combat, DEFER_ORDER_FLAG, order);
    // Advance spotlight to the next non-deferred remaining combatant without
    // marking the deferred one completed.
    const currentIdx = Math.max(0, Math.floor(Number(combat.turn) || 0));
    const currentId = String(turns[currentIdx]?.id ?? combat.combatant?.id ?? '');
    let nextIdx = order.findIndex((x) => x === currentId);
    if (nextIdx < 0)
        nextIdx = currentIdx;
    // Prefer the first remaining non-completed after current in new order
    let targetId = null;
    for (let i = 0; i < order.length; i++) {
        const oid = order[i];
        if (completed.includes(oid))
            continue;
        if (oid === id)
            continue;
        if (!readDeferredIds(combat).includes(oid) || i > nextIdx) {
            // first non-deferred remaining, else first deferred after current
            if (!readDeferredIds(combat).includes(oid)) {
                targetId = oid;
                break;
            }
        }
    }
    if (!targetId) {
        // Only deferred left — stay on first deferred that isn't the one we just deferred if possible
        targetId = order.find((oid) => !completed.includes(oid) && oid !== id) || id;
    }
    if (typeof combat.setupTurns === 'function') {
        await combat.setupTurns();
    }
    const refreshed = Array.isArray(combat.turns) ? combat.turns : combatantList(combat);
    const targetIdx = refreshed.findIndex((c) => String(c.id) === targetId);
    if (targetIdx >= 0) {
        const { MASTERY_SKIP_TURN_BONUS_CLEAR } = await import('./combat-update-options.js');
        await combat.update({ turn: targetIdx }, { [MASTERY_SKIP_TURN_BONUS_CLEAR]: true });
    }
    try {
        const ChatMessage = globalThis.ChatMessage;
        const name = turns.find((c) => String(c.id) === id)?.name || id;
        await ChatMessage?.create?.({
            content: `<p><strong>Defer Turn</strong>: ${name} acts later this Round (Turn preserved).</p>`,
            style: globalThis.CONST?.CHAT_MESSAGE_STYLES?.OTHER,
        });
    }
    catch {
        /* ignore */
    }
    return { ok: true, message: 'Turn deferred.' };
}
export function pendingDeferredBlocksRoundAdvance(combat) {
    const deferred = readDeferredIds(combat);
    if (!deferred.length)
        return false;
    const completed = new Set(readCompletedIds(combat));
    return deferred.some((id) => !completed.has(id));
}
export async function clearDeferStateForNewRound(combat) {
    if (!combat)
        return;
    await writeIdList(combat, DEFERRED_IDS_FLAG, []);
    await writeIdList(combat, TURN_STARTED_IDS_FLAG, []);
    await writeIdList(combat, COMPLETED_IDS_FLAG, []);
    await writeIdList(combat, DEFER_ORDER_FLAG, []);
}
/** Sort compare aid: when defer order cache present, use it. */
export function compareByDeferOrder(combat, aId, bId) {
    const order = readDeferOrderIds(combat);
    if (!order.length)
        return null;
    const ia = order.indexOf(String(aId));
    const ib = order.indexOf(String(bId));
    if (ia < 0 && ib < 0)
        return null;
    if (ia >= 0 && ib >= 0)
        return ia - ib;
    if (ia >= 0)
        return -1;
    return 1;
}
//# sourceMappingURL=turn-defer.js.map