/**
 * Per-combat stealth, hidden, invisibility, and perception-check bookkeeping.
 * Stored on `actor.flags['mastery-system'].perceptionCombat`.
 */
const FLAG_KEY = 'perceptionCombat';
export function emptyPerceptionCombatState() {
    return {};
}
export function getPerceptionCombatState(actor) {
    try {
        const raw = actor?.getFlag?.('mastery-system', FLAG_KEY);
        if (raw && typeof raw === 'object')
            return { ...raw };
    }
    catch {
        /* ignore */
    }
    return emptyPerceptionCombatState();
}
export async function setPerceptionCombatState(actor, patch) {
    if (!actor?.setFlag)
        return;
    const cur = getPerceptionCombatState(actor);
    await actor.setFlag('mastery-system', FLAG_KEY, { ...cur, ...patch });
}
export function effectiveInvisibilityBonus(state) {
    if (state.currentInvisibilityBonus !== undefined) {
        return Math.max(0, Math.floor(Number(state.currentInvisibilityBonus) || 0));
    }
    return Math.max(0, Math.floor(Number(state.invisibilityBonus) || 0));
}
export function isSenseBlockedOnTarget(target, senseId) {
    const st = getPerceptionCombatState(target);
    const blocked = st.blockedSenses ?? [];
    if (blocked.includes(senseId))
        return true;
    const inv = effectiveInvisibilityBonus(st);
    if (inv > 0 && (senseId === 'normalCombatAwareness' || senseId === 'darkvision')) {
        return true;
    }
    return false;
}
export function computeStealthRaiseBonus(raises) {
    return Math.max(0, Math.floor(Number(raises) || 0)) * 2;
}
/** Cloak Disruption — reduce current invisibility bonus; clears stealth raise bonus. */
export function applyCloakDisruption(state, amount) {
    const base = effectiveInvisibilityBonus(state);
    const next = Math.max(0, base - Math.max(0, Math.floor(Number(amount) || 0)));
    return {
        ...state,
        currentInvisibilityBonus: next,
        stealthRaiseBonus: 0,
    };
}
export async function resetInvisibilityAtTurnStart(actor) {
    const st = getPerceptionCombatState(actor);
    if (st.invisibilityBonus === undefined && st.currentInvisibilityBonus === undefined)
        return;
    await setPerceptionCombatState(actor, {
        currentInvisibilityBonus: Math.max(0, Math.floor(Number(st.invisibilityBonus) || 0)),
    });
}
export async function clearPerceptionRoundUsage(actor) {
    const st = getPerceptionCombatState(actor);
    if (!st.perceptionUsedVs || Object.keys(st.perceptionUsedVs).length === 0)
        return;
    await setPerceptionCombatState(actor, { perceptionUsedVs: {} });
}
export function hasLocatedTarget(observer, target, round) {
    const tgtId = String(target?.id ?? '');
    if (!tgtId)
        return false;
    const st = getPerceptionCombatState(observer);
    const entry = st.locatedTargets?.[tgtId];
    if (!entry)
        return false;
    return round <= (entry.expiresRound ?? entry.round);
}
export async function markLocatedTarget(observer, target, round) {
    const tgtId = String(target?.id ?? '');
    if (!tgtId)
        return;
    const st = getPerceptionCombatState(observer);
    const located = { ...(st.locatedTargets ?? {}) };
    located[tgtId] = { targetId: tgtId, round, expiresRound: round + 1 };
    await setPerceptionCombatState(observer, { locatedTargets: located });
}
//# sourceMappingURL=perception-state.js.map