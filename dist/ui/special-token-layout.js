/**
 * Pure layout helpers for the diminishing-special token HUD.
 * Actor stack values stay on the actor; this only places token *views*.
 */
import { specialTokenAsset } from './special-token-assets.js';
/** Max tokens stacked in one tower. Flip to 4 when testing shorter piles. */
export const SPECIAL_TOKEN_STACK_MAX = 8;
export const TOKEN_DRAG_THRESHOLD_PX = 5;
export function tokenInstanceId(specialId, index) {
    return `${specialId}:${index}`;
}
export function parseTokenInstanceId(id) {
    const i = String(id || '').lastIndexOf(':');
    if (i <= 0)
        return null;
    const index = Number(id.slice(i + 1));
    if (!Number.isInteger(index) || index < 0)
        return null;
    return { specialId: id.slice(0, i), index };
}
function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.min(1, Math.max(0, n));
}
function nextZ(layout) {
    let max = 0;
    for (const pos of Object.values(layout)) {
        const z = Math.floor(Number(pos?.z) || 0);
        if (z > max)
            max = z;
    }
    return max + 1;
}
/** Auto-arrange into per-special towers (relative 0–1 coords). */
export function autoArrangeTokens(specials, stackMax = SPECIAL_TOKEN_STACK_MAX) {
    const max = Math.max(1, Math.floor(Number(stackMax) || SPECIAL_TOKEN_STACK_MAX));
    const layout = {};
    const groups = specials.filter((s) => s.value > 0);
    const groupCount = Math.max(1, groups.length);
    let z = 1;
    groups.forEach((spec, groupIndex) => {
        const towers = Math.max(1, Math.ceil(spec.value / max));
        for (let i = 0; i < spec.value; i++) {
            const tower = Math.floor(i / max);
            const height = i % max;
            const x = (groupIndex + 0.12 + tower * 0.18) / (groupCount + towers * 0.15);
            const y = 0.62 - height * 0.07;
            layout[tokenInstanceId(spec.id, i)] = {
                x: clamp01(x),
                y: clamp01(y),
                z: z++,
            };
        }
    });
    return layout;
}
function placeNewToken(specialId, index, layout, spec, stackMax) {
    const prev = layout[tokenInstanceId(specialId, index - 1)];
    if (prev) {
        return {
            x: clamp01(prev.x + 0.018),
            y: clamp01(prev.y - 0.045),
            z: nextZ(layout),
        };
    }
    const arranged = autoArrangeTokens([spec], stackMax);
    return arranged[tokenInstanceId(specialId, index)] ?? { x: 0.08, y: 0.55, z: nextZ(layout) };
}
/**
 * Rebuild views from actor values + stored positions.
 * Keeps existing tokens; drops highest indices when the value shrinks;
 * parks new tokens next to the same Special.
 */
export function syncSpecialTokenViews(specials, stored, stackMax = SPECIAL_TOKEN_STACK_MAX) {
    const prev = {};
    for (const [id, pos] of Object.entries(stored ?? {})) {
        if (!pos || typeof pos !== 'object')
            continue;
        prev[id] = {
            x: clamp01(Number(pos.x)),
            y: clamp01(Number(pos.y)),
            z: Math.max(0, Math.floor(Number(pos.z) || 0)),
        };
    }
    const liveIds = new Set();
    const layout = {};
    const tokens = [];
    for (const spec of specials) {
        const value = Math.max(0, Math.floor(Number(spec.value) || 0));
        const label = spec.label || spec.id;
        const asset = specialTokenAsset(spec.id);
        for (let i = 0; i < value; i++) {
            const id = tokenInstanceId(spec.id, i);
            liveIds.add(id);
            const kept = prev[id];
            const pos = kept ?? placeNewToken(spec.id, i, { ...prev, ...layout }, spec, stackMax);
            layout[id] = pos;
            tokens.push({
                id,
                specialId: spec.id,
                index: i,
                label,
                asset,
                x: pos.x,
                y: pos.y,
                z: pos.z,
            });
        }
    }
    tokens.sort((a, b) => a.z - b.z || a.specialId.localeCompare(b.specialId) || a.index - b.index);
    return { tokens, layout };
}
export function moveTokenInLayout(layout, tokenId, x, y) {
    const next = { ...layout };
    const prev = next[tokenId] ?? { x: 0, y: 0, z: 0 };
    next[tokenId] = {
        x: clamp01(x),
        y: clamp01(y),
        z: nextZ(next),
    };
    if (!layout[tokenId]) {
        next[tokenId] = { ...next[tokenId], z: Math.max(prev.z, next[tokenId].z) };
    }
    return next;
}
export function clampTokenToArea(xPx, yPx, areaW, areaH, tokenPx = 36) {
    const w = Math.max(1, areaW);
    const h = Math.max(1, areaH);
    const maxX = Math.max(0, w - tokenPx);
    const maxY = Math.max(0, h - tokenPx);
    return {
        x: clamp01(Math.min(maxX, Math.max(0, xPx)) / w),
        y: clamp01(Math.min(maxY, Math.max(0, yPx)) / h),
    };
}
//# sourceMappingURL=special-token-layout.js.map