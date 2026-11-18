/**
 * Read access to the printed PL 1–16 tables of docs/Rules/Canonical/Actives.md
 * (generated into canonical-actives.generated.ts).
 */
import { CANONICAL_ACTIVES } from './canonical-actives.generated.js';
function clampLevel(level) {
    const n = Math.floor(Number(level) || 0);
    return Math.max(1, Math.min(16, n));
}
export function canonicalActiveRow(canonId, level) {
    const table = CANONICAL_ACTIVES[canonId];
    if (!table)
        return null;
    return table.rows[clampLevel(level) - 1] ?? null;
}
/** Printed Special(X) for one Power Level; `undefined` when not printed. */
export function canonicalSpecialRank(canonId, key, level) {
    const v = canonicalActiveRow(canonId, level)?.specials?.[String(key).toLowerCase()];
    return typeof v === 'number' ? v : undefined;
}
export function canonicalRadiusM(canonId, level) {
    return canonicalActiveRow(canonId, level)?.radiusM;
}
/** PL 1–16 series of one printed Special (0 where the PL is unavailable or unprinted). */
export function canonicalSpecialSeries(canonId, key) {
    return Array.from({ length: 16 }, (_, i) => canonicalSpecialRank(canonId, key, i + 1) ?? 0);
}
/** PL 1–16 radius series (0 where the PL is unavailable or has no radius). */
export function canonicalRadiusSeries(canonId) {
    return Array.from({ length: 16 }, (_, i) => canonicalRadiusM(canonId, i + 1) ?? 0);
}
export function singleTargetSpecialCanonId(flavour, key) {
    return `${flavour}-single-target-special-${String(key).toLowerCase()}`;
}
export function aoeSpecialCanonId(flavour, key) {
    return `${flavour}-aoe-special-${String(key).toLowerCase()}`;
}
/** Printed Ranged Persistent Special Zone table per Special tier. */
export const ZONE_CANON_ID_BY_TIER = {
    3: 'ranged-persistent-zone-blight',
    4: 'ranged-persistent-zone-standard-diminishing-special',
    5: 'ranged-persistent-zone-heavy-diminishing-special',
    6: 'ranged-persistent-zone-pool-reduction-special',
};
//# sourceMappingURL=canonical-active-lookup.js.map