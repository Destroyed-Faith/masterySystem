/**
 * Weapon Specials shared by artifacts, raise options, and the damage pipeline.
 *
 * Catalog Specials (Penetration, Precision, …) ride the wielded weapon as a
 * printed rank. They are off until a Raise turns that rank on. The same
 * Special must not be applied twice.
 */
import { resolveArtifactBaseType } from './artifact-base-type-catalog.js';
import { getEffectById, parseEffectString } from './special-effects.js';
export function specialKeyFromLabel(label) {
    return String(label || '')
        .trim()
        .toLowerCase()
        .replace(/\(.*$/, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
function catalogKey(key) {
    const id = specialKeyFromLabel(key);
    if (!id || !getEffectById(id))
        return null;
    return id;
}
/** Parse a weapon special string or `{ specialId, value }` into a raisable catalog Special. */
export function parseWeaponSpecialRaw(raw) {
    if (raw && typeof raw === 'object') {
        const ref = raw;
        const key = catalogKey(String(ref.specialId || ''));
        const rank = Math.floor(Number(ref.value) || 0);
        if (!key || rank <= 0)
            return null;
        return { key, rank };
    }
    const text = String(raw ?? '').trim();
    if (!text || text === '—' || text === '-')
        return null;
    const parsed = parseEffectString(text);
    if (parsed?.specialId) {
        const key = catalogKey(parsed.specialId);
        const rank = Math.floor(Number(parsed.value) || 0);
        if (!key || rank <= 0)
            return null;
        return { key, rank };
    }
    const match = text.match(/^([^(]+)\((\d+)\)$/);
    if (!match)
        return null;
    const key = catalogKey(match[1]);
    const rank = parseInt(match[2], 10);
    if (!key || rank <= 0)
        return null;
    return { key, rank };
}
export function weaponSpecialEntries(weapon) {
    const raw = weapon?.system?.specials;
    if (!Array.isArray(raw))
        return [];
    const out = [];
    const seen = new Set();
    for (const row of raw) {
        const entry = parseWeaponSpecialRaw(row);
        if (!entry || seen.has(entry.key))
            continue;
        seen.add(entry.key);
        out.push(entry);
    }
    return out;
}
/**
 * Add weapon Specials that the power snapshot does not already list.
 * Existing power ranks are left alone so a chosen Special is not doubled.
 */
/**
 * Power Specials stay on the hit. Weapon Specials stay off until a Raise.
 */
export function parkWeaponSpecialsForRaises(snapshot, onHitKeys) {
    const keepKeys = new Set([...onHitKeys].map((k) => String(k || '').trim().toLowerCase()).filter(Boolean));
    const keep = snapshot.specials.filter((sp) => keepKeys.has(sp.key));
    const latent = snapshot.specials.filter((sp) => !keepKeys.has(sp.key));
    return {
        onHit: { ...snapshot, specials: keep },
        raiseSource: { ...snapshot, specials: latent },
    };
}
export function mergeWeaponSpecialsIntoSnapshot(snapshot, entries) {
    const specials = snapshot.specials.map((sp) => ({ ...sp }));
    const seen = new Set(specials.map((sp) => sp.key));
    for (const entry of entries) {
        if (seen.has(entry.key))
            continue;
        specials.push({ key: entry.key, rank: entry.rank });
        seen.add(entry.key);
    }
    return { ...snapshot, specials };
}
function numericSpecialRank(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
        return Math.floor(value);
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text))
        return null;
    const n = parseInt(text, 10);
    return n > 0 ? n : null;
}
/** Base Value rows of type `weaponSpecial` with a positive numeric rank. */
export function specialRefsFromBaseValueRows(rows) {
    if (!Array.isArray(rows))
        return [];
    const out = [];
    const seen = new Set();
    for (const row of rows) {
        if (!row || typeof row !== 'object')
            continue;
        const rec = row;
        if (String(rec.type || '') !== 'weaponSpecial')
            continue;
        const key = catalogKey(String(rec.specialId || rec.label || ''));
        const rank = numericSpecialRank(rec.value);
        if (!key || rank == null || seen.has(key))
            continue;
        seen.add(key);
        out.push({ specialId: key, value: rank });
    }
    return out;
}
/**
 * When an artifact weapon blob has no Specials, recover them from its Base
 * Values, then from the chosen mundane base type (`weapon:heavy-crossbow`, …).
 */
export function backfillArtifactWeaponSpecials(sys, existing) {
    const list = Array.isArray(existing) ? existing : [];
    if (list.length > 0)
        return list;
    const fromRows = specialRefsFromBaseValueRows(sys?.baseValues);
    if (fromRows.length)
        return fromRows;
    const prefill = resolveArtifactBaseType(String(sys?.baseTypeKey || ''));
    if (prefill?.kind === 'weapon' && prefill.specials.length)
        return prefill.specials;
    return list;
}
function effectKey(text) {
    return parseWeaponSpecialRaw(text)?.key ?? null;
}
/**
 * On-hit Specials are the ones the resolved power snapshot already lists.
 * A printed weapon Special stays off until a Raise turns that rank on.
 */
export function selectOnHitSpecialEffects(available) {
    const used = [];
    const covered = new Set();
    for (const special of available) {
        if (special.type !== 'power-special' || !special.effect)
            continue;
        const key = effectKey(special.effect);
        if (key && covered.has(key))
            continue;
        used.push(special.effect);
        if (key)
            covered.add(key);
    }
    return used;
}
//# sourceMappingURL=weapon-specials.js.map