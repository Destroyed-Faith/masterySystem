/**
 * Power spec consistency — canonical shapes after import / before persist.
 *
 * Power-spec normalization rules:
 * - PowerSpecial: canonical persisted form uses lowercase `key` + `rank` (not type/value).
 * - AoE: do not persist both radiusM and sizeM for radius-class shapes.
 * - PowerMechanics: usageLimit canonical; triggerLimit read once then stripped on persist.
 * - condition vs conditionExpr: if enum `condition` is set, clear redundant `conditionExpr`.
 */
const RADIUS_LIKE = new Set(['radius', 'aura', 'zone']);
function deepClone(x) {
    if (typeof structuredClone === 'function')
        return structuredClone(x);
    return JSON.parse(JSON.stringify(x));
}
/**
 * Normalize one special entry to canonical `{ key, rank?, ... }` (lowercase key; no type/value).
 */
export function normalizePowerSpecial(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const r = raw;
    const keySrc = r.key ?? r.type;
    if (keySrc === undefined || keySrc === null)
        return null;
    const key = String(keySrc).trim().toLowerCase();
    if (!key)
        return null;
    let rank;
    if (r.rank !== undefined && r.rank !== null && r.rank !== '') {
        const n = Number(r.rank);
        if (Number.isFinite(n))
            rank = n;
    }
    else if (r.value !== undefined && r.value !== null && r.value !== '') {
        const n = Number(r.value);
        if (Number.isFinite(n))
            rank = n;
    }
    const out = { key };
    if (rank !== undefined)
        out.rank = rank;
    if (typeof r.raiseCost === 'number' && Number.isFinite(r.raiseCost)) {
        out.raiseCost = r.raiseCost;
    }
    else if (typeof r.raiseCost === 'string' && r.raiseCost.trim() !== '') {
        const rc = Number(r.raiseCost);
        if (Number.isFinite(rc))
            out.raiseCost = rc;
    }
    if (typeof r.note === 'string' && r.note.trim())
        out.note = r.note.trim();
    if (typeof r.target === 'string' && r.target.trim())
        out.target = r.target.trim();
    if (typeof r.condition === 'string' && r.condition.trim())
        out.condition = r.condition.trim();
    if (typeof r.duration === 'string' && r.duration.trim())
        out.duration = r.duration.trim();
    if (typeof r.applyOn === 'string' && r.applyOn.trim())
        out.applyOn = r.applyOn.trim();
    return out;
}
/** Normalize an array of specials (drops nulls). */
export function normalizePowerSpecialArray(raw) {
    if (!Array.isArray(raw))
        return [];
    const out = [];
    for (const item of raw) {
        const n = normalizePowerSpecial(item);
        if (n)
            out.push(n);
    }
    return out;
}
/**
 * Collapse sizeM into radiusM for radius-like shapes; never persist both.
 */
export function normalizeAoeSpec(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const a = { ...raw };
    const shape = a.shape;
    if (!shape)
        return a;
    if (RADIUS_LIKE.has(shape)) {
        const rm = typeof a.radiusM === 'number' && Number.isFinite(a.radiusM) ? a.radiusM : undefined;
        const sm = typeof a.sizeM === 'number' && Number.isFinite(a.sizeM) ? a.sizeM : undefined;
        if (rm !== undefined && sm !== undefined) {
            delete a.sizeM;
        }
        else if (sm !== undefined && rm === undefined) {
            a.radiusM = sm;
            delete a.sizeM;
        }
        else if (sm !== undefined) {
            delete a.sizeM;
        }
    }
    else if (typeof a.sizeM === 'number') {
        delete a.sizeM;
    }
    return a;
}
/**
 * Prepare a mechanics object for persistence: limits, gates, nested specials.
 * Returns a deep-cloned, normalized copy (safe for JSON.parse results).
 */
export function persistPowerMechanics(input) {
    const m = deepClone(input);
    const ul = m.usageLimit;
    const tl = m.triggerLimit;
    if ((!ul || ul.max === undefined) && tl?.per && typeof tl.max === 'number') {
        m.usageLimit = { per: tl.per, max: tl.max };
    }
    delete m.triggerLimit;
    const cond = m.condition;
    const condTrim = cond !== undefined && cond !== null && String(cond).trim() !== '' ? String(cond).trim() : '';
    if (condTrim) {
        m.condition = condTrim;
        delete m.conditionExpr;
    }
    else {
        delete m.condition;
        const ex = m.conditionExpr;
        if (typeof ex === 'string' && !ex.trim())
            delete m.conditionExpr;
    }
    const gnh = m.grantNextHitEffect;
    if (gnh && typeof gnh === 'object' && Array.isArray(gnh.specials)) {
        gnh.specials = normalizePowerSpecialArray(gnh.specials);
    }
    const ms = m.modifySpecial;
    if (ms && typeof ms === 'object' && typeof ms.type === 'string') {
        ms.type = String(ms.type).trim().toLowerCase();
    }
    return m;
}
//# sourceMappingURL=power-spec-normalize.js.map