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
/** Effective Invisibility Bonus from combat flags (powers preferred via profile layer). */
export function effectiveInvisibilityBonus(state) {
    return Math.max(0, Math.floor(Number(state.invisibilityBonus) || 0));
}
/**
 * Sense Obscured by stored veil list, or by any live Invisibility Bonus
 * (Normal Combat Awareness + Darkvision). Special senses come from `blockedSenses`.
 */
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
/** @deprecated Cloak Disruption removed from rules — no-op identity. */
export function applyCloakDisruption(state, _amount) {
    return { ...state };
}
export async function markRevealedThisRound(actor, round) {
    if (!actor)
        return;
    const r = Math.max(1, Math.floor(Number(round) || globalThis.game?.combat?.round || 1));
    await setPerceptionCombatState(actor, { revealedThisRound: r });
}
export function isRevealedThisRound(actor, round) {
    const r = Math.max(1, Math.floor(Number(round) || globalThis.game?.combat?.round || 1));
    const st = getPerceptionCombatState(actor);
    return Math.floor(Number(st.revealedThisRound) || 0) === r;
}
/** Clear only this observer's Perception attempts (call on their turn start). */
export async function clearPerceptionRoundUsage(actor) {
    const st = getPerceptionCombatState(actor);
    if (!st.perceptionUsedVs || Object.keys(st.perceptionUsedVs).length === 0)
        return;
    await setPerceptionCombatState(actor, { perceptionUsedVs: {} });
}
/** New Round: attempts + attack-reveal + retroactive Stealth TN bonus. */
export async function clearPerceptionRoundState(actor) {
    const st = getPerceptionCombatState(actor);
    const hasAttempts = st.perceptionUsedVs && Object.keys(st.perceptionUsedVs).length > 0;
    const hasReveal = !!st.revealedThisRound;
    const hasSpend = (st.stealthSpentThisRound ?? 0) > 0;
    if (!hasAttempts && !hasReveal && !hasSpend)
        return;
    await setPerceptionCombatState(actor, {
        perceptionUsedVs: {},
        revealedThisRound: 0,
        stealthSpentThisRound: 0,
    });
}
/**
 * Full combat-scoped perception wipe (combat end / new encounter).
 * Keeps live Invisibility bonus fields — callers re-sync from powers afterwards.
 */
export async function clearPerceptionCombatEncounterState(actor) {
    if (!actor?.setFlag && !actor?.unsetFlag)
        return;
    const st = getPerceptionCombatState(actor);
    const hasAnything = !!st.hidden ||
        (st.stealthRaiseBonus ?? 0) > 0 ||
        (st.stealthSpentThisRound ?? 0) > 0 ||
        !!st.revealedThisRound ||
        (st.perceptionUsedVs && Object.keys(st.perceptionUsedVs).length > 0) ||
        (st.locatedTargets && Object.keys(st.locatedTargets).length > 0);
    if (!hasAnything && st.invisibilityBonus === undefined && !st.blockedSenses?.length) {
        // Still unset stale flag blobs from older combats.
        try {
            await actor.unsetFlag?.('mastery-system', FLAG_KEY);
        }
        catch {
            /* ignore */
        }
        return;
    }
    await setPerceptionCombatState(actor, {
        hidden: false,
        stealthRaiseBonus: 0,
        stealthSpentThisRound: 0,
        revealedThisRound: 0,
        perceptionUsedVs: {},
        locatedTargets: {},
    });
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
/** Locate until end of the current Round (expiresRound = round). */
export async function markLocatedTarget(observer, target, round) {
    const tgtId = String(target?.id ?? '');
    if (!tgtId)
        return;
    const st = getPerceptionCombatState(observer);
    const located = { ...(st.locatedTargets ?? {}) };
    located[tgtId] = { targetId: tgtId, round, expiresRound: round };
    await setPerceptionCombatState(observer, { locatedTargets: located });
}
/**
 * Lost Health Bars for Invisibility TN (Healthy=0 … Broken=4).
 * Incapacitated is handled separately via `isInvisibilitySuppressedByHealth`.
 */
export function lostHealthBarsForInvis(actor) {
    const bars = Array.isArray(actor?.system?.health?.bars) ? actor.system.health.bars : [];
    const idx = Math.max(0, Math.floor(Number(actor?.system?.health?.currentBar) || 0));
    if (bars.length) {
        const name = String(bars[idx]?.name || '').toLowerCase();
        if (name.includes('incapacitat'))
            return 4;
        if (name.includes('broken'))
            return 4;
        if (name.includes('wound'))
            return 3;
        if (name.includes('injur'))
            return 2;
        if (name.includes('bruise'))
            return 1;
        if (name.includes('healthy') || idx === 0)
            return 0;
    }
    // Index fallback: 0 Healthy … 4 Broken … 5+ Incapacitated
    return Math.min(4, idx);
}
export function isInvisibilitySuppressedByHealth(actor) {
    const bars = Array.isArray(actor?.system?.health?.bars) ? actor.system.health.bars : [];
    const idx = Math.max(0, Math.floor(Number(actor?.system?.health?.currentBar) || 0));
    if (bars.length) {
        const name = String(bars[idx]?.name || '').toLowerCase();
        if (name.includes('incapacitat'))
            return true;
    }
    return idx >= 5;
}
//# sourceMappingURL=perception-state.js.map