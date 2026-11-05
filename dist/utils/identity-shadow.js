/**
 * C1 Shadow-Compare: legacy path decides; identity path runs in parallel and logs diffs.
 * Never changes combat outcomes (plan §10.5 / Batch C1 / K5).
 */
/** Soft cap — oldest mismatch entries are dropped first when exceeded. */
export const IDENTITY_SHADOW_LOG_CAP = 500;
const sessionLog = [];
const dedupeIndex = new Map();
let enabled = true;
let skippedNpcOrManeuver = 0;
export function setIdentityShadowEnabled(value) {
    enabled = value;
}
export function getIdentityShadowLog() {
    return sessionLog;
}
export function clearIdentityShadowLog() {
    sessionLog.length = 0;
    dedupeIndex.clear();
    skippedNpcOrManeuver = 0;
}
export function getIdentityShadowSkipCount() {
    return skippedNpcOrManeuver;
}
export function exportIdentityShadowReport(opts) {
    let entries = [...sessionLog];
    if (opts?.cluster) {
        const prefix = opts.cluster.endsWith('.') ? opts.cluster : `${opts.cluster}.`;
        entries = entries.filter((e) => e.siteId === opts.cluster || e.siteId.startsWith(prefix) || e.siteId.startsWith(opts.cluster));
    }
    const mismatches = entries.filter((e) => !e.equal).length;
    return {
        generatedAt: new Date().toISOString(),
        total: entries.length,
        mismatches,
        skippedNpcOrManeuver,
        ...(opts?.cluster ? { cluster: opts.cluster } : {}),
        entries,
    };
}
/** Group mismatches by siteId prefix (first segment before `.`). */
export function exportIdentityShadowClusterReports() {
    const clusters = new Set();
    for (const e of sessionLog) {
        clusters.add(e.siteId.split('.')[0] || e.siteId);
    }
    const out = {};
    for (const c of clusters) {
        out[c] = exportIdentityShadowReport({ cluster: c });
    }
    return out;
}
function stableEqual(a, b) {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    catch {
        return a === b;
    }
}
function fingerprint(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
}
function shouldSkipRef(ref) {
    if (!ref)
        return false;
    const source = String(ref.source || ref.optionSource || '');
    if (source === 'npc-attack' || source === 'maneuver')
        return true;
    if (ref.skipNpcOrManeuver === true)
        return true;
    return false;
}
function pushEntry(entry) {
    const existingIdx = dedupeIndex.get(entry.dedupeKey);
    if (existingIdx != null && sessionLog[existingIdx]) {
        // Refresh timestamp; keep first mismatch semantics (still one slot).
        sessionLog[existingIdx] = entry;
        return;
    }
    if (sessionLog.length >= IDENTITY_SHADOW_LOG_CAP) {
        // Drop oldest equal entries first; if none, drop oldest overall.
        let dropIdx = sessionLog.findIndex((e) => e.equal);
        if (dropIdx < 0)
            dropIdx = 0;
        const dropped = sessionLog.splice(dropIdx, 1)[0];
        if (dropped)
            dedupeIndex.delete(dropped.dedupeKey);
        // Rebuild index for shifted positions.
        dedupeIndex.clear();
        sessionLog.forEach((e, i) => dedupeIndex.set(e.dedupeKey, i));
    }
    dedupeIndex.set(entry.dedupeKey, sessionLog.length);
    sessionLog.push(entry);
}
/**
 * Compare legacy decision vs identity decision. Always returns the legacy value.
 * Identity exceptions are swallowed and logged — they must never affect the legacy path.
 */
export function compareIdentityDecision(siteId, legacyDecision, identityDecisionFactory, ref) {
    if (!enabled)
        return legacyDecision;
    if (shouldSkipRef(ref)) {
        skippedNpcOrManeuver += 1;
        return legacyDecision;
    }
    let identity;
    try {
        identity = identityDecisionFactory();
    }
    catch (err) {
        identity = {
            kind: 'identity-threw',
            message: err instanceof Error ? err.message : String(err),
        };
    }
    const equal = stableEqual(legacyDecision, identity);
    const dedupeKey = `${siteId}::${fingerprint(ref)}::${fingerprint(legacyDecision)}::${fingerprint(identity)}`;
    const entry = {
        siteId,
        at: new Date().toISOString(),
        legacy: legacyDecision,
        identity,
        equal,
        ref,
        dedupeKey,
    };
    pushEntry(entry);
    if (!equal && typeof console !== 'undefined' && console.info) {
        console.info('[identity-shadow]', siteId, { legacy: legacyDecision, identity, ref });
    }
    return legacyDecision;
}
//# sourceMappingURL=identity-shadow.js.map