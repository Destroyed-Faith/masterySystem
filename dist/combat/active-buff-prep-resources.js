/**
 * Preparation-scoped Active Buff resource ledger (Batch 6.1).
 *
 * Round-based Buff resources (Temp HP, Damage Negation pools) initialize once
 * per Preparation Phase per Buff template. Ending and re-activating the same
 * template in the same Prep (A → B → A) must not re-grant a fresh full pool.
 *
 * Critical / Maximization combat quotas stay on their own spent trackers.
 */
/** Stable key: one grant cycle per combat + Prep round + Buff template. */
export function activeBuffPrepResourceKey(combatId, prepRound, templateId) {
    const cid = String(combatId || '').trim() || 'no-combat';
    const round = Math.max(1, Math.floor(Number(prepRound) || 1));
    const tid = String(templateId || '').trim().toLowerCase() || 'unknown';
    return `${cid}:${round}:${tid}`;
}
export function readPrepResourceEntry(ledger, key) {
    const raw = ledger?.[key];
    return raw && typeof raw === 'object' ? { ...raw } : {};
}
/** True when Temp HP may still be granted for this template in this Prep. */
export function canGrantPrepTempHP(ledger, key) {
    return !readPrepResourceEntry(ledger, key).thpGranted;
}
export function markPrepTempHPGranted(ledger, key) {
    const next = { ...(ledger || {}) };
    const prev = readPrepResourceEntry(next, key);
    next[key] = { ...prev, thpGranted: true };
    return next;
}
/**
 * Resolve DN pool points for activate / Prep refresh.
 * First touch this Prep → full max. Later re-activate same template → prior remaining.
 */
export function resolvePrepDamageNegationPool(ledger, key, max) {
    const poolMax = Math.max(0, Math.floor(Number(max) || 0));
    const next = { ...(ledger || {}) };
    const prev = readPrepResourceEntry(next, key);
    if (prev.dnMax == null && prev.dnRemaining == null) {
        next[key] = { ...prev, dnMax: poolMax, dnRemaining: poolMax };
        return { remaining: poolMax, ledger: next };
    }
    const remaining = Math.max(0, Math.min(poolMax, Math.floor(Number(prev.dnRemaining) || 0)));
    next[key] = { ...prev, dnMax: poolMax, dnRemaining: remaining };
    return { remaining, ledger: next };
}
/** Snapshot DN remaining when a Buff ends (before effect deletion). */
export function snapshotPrepDamageNegationOnEnd(ledger, key, remaining, max) {
    const next = { ...(ledger || {}) };
    const prev = readPrepResourceEntry(next, key);
    const poolMax = Math.max(0, Math.floor(Number(max) || 0));
    const left = Math.max(0, Math.min(poolMax, Math.floor(Number(remaining) || 0)));
    next[key] = { ...prev, dnMax: poolMax || prev.dnMax, dnRemaining: left };
    return next;
}
/** Template / artifact key used for the Prep resource ledger. */
export function activeBuffResourceIdentity(flags) {
    if (!flags || typeof flags !== 'object')
        return '';
    const artifact = String(flags.artifactBuffKey || '').trim();
    if (artifact)
        return artifact.toLowerCase();
    const tid = String(flags.powerTemplateId || flags.templateId || flags.powerId || '').trim();
    return tid.toLowerCase();
}
//# sourceMappingURL=active-buff-prep-resources.js.map