/**
 * Pick the token the user most likely meant under a canvas point.
 *
 * Foundry `placeables` order is not paint/z order. Returning the first
 * `bounds.contains` hit often selects a token behind another when they
 * overlap — classic "I clicked Sjossfur but got Alaris" bug.
 *
 * Preference:
 * 1. Tokens whose bounds contain the point
 * 2. Among those, closest click → token center
 * 3. Higher zIndex / later placeables index as tie-break (topmost)
 * 4. Optional fallback: nearest center within a small pad radius
 */
function tokenCenterDist(token, x, y) {
    const c = token?.center;
    if (!c)
        return Infinity;
    return Math.hypot(x - c.x, y - c.y);
}
function tokenZ(token, placeableIndex) {
    const z = Number(token?.zIndex ?? token?.document?.sort ?? placeableIndex);
    return Number.isFinite(z) ? z : placeableIndex;
}
/**
 * Best token under canvas-stage local coordinates `(x, y)`.
 */
export function pickTokenAtPoint(x, y, options = {}) {
    const tokens = (canvas.tokens?.placeables ?? []);
    if (!tokens.length)
        return null;
    const exclude = new Set(options.excludeIds ? [...options.excludeIds] : []);
    const only = options.onlyIds == null
        ? null
        : options.onlyIds instanceof Set
            ? options.onlyIds
            : new Set(options.onlyIds);
    const boundsHits = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token?.id || exclude.has(token.id))
            continue;
        if (only && !only.has(token.id))
            continue;
        if (!token.bounds?.contains?.(x, y))
            continue;
        boundsHits.push({
            token,
            dist: tokenCenterDist(token, x, y),
            z: tokenZ(token, i),
            index: i,
        });
    }
    const rank = (a, b) => {
        if (a.dist !== b.dist)
            return a.dist - b.dist;
        if (a.z !== b.z)
            return b.z - a.z;
        return b.index - a.index;
    };
    if (boundsHits.length) {
        boundsHits.sort(rank);
        return boundsHits[0].token;
    }
    if (options.noCenterFallback)
        return null;
    const pad = Math.max(0, Number(options.centerPadPx ?? 15) || 0);
    let best = null;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token?.id || exclude.has(token.id))
            continue;
        if (only && !only.has(token.id))
            continue;
        if (!token.center)
            continue;
        const r = (token.w ?? token.width ?? 50) / 2 + pad;
        const dist = tokenCenterDist(token, x, y);
        if (dist > r)
            continue;
        const cand = { token, dist, z: tokenZ(token, i), index: i };
        if (!best || rank(cand, best) < 0)
            best = cand;
    }
    return best?.token ?? null;
}
/** Convenience: resolve stage-local point from a FederatedPointerEvent, then pick. */
export function pickTokenFromPointerEvent(ev, options = {}) {
    const stage = canvas.stage;
    if (!stage)
        return null;
    const pos = typeof ev?.getLocalPosition === 'function'
        ? ev.getLocalPosition(stage)
        : ev.data?.getLocalPosition?.(stage);
    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y))
        return null;
    return pickTokenAtPoint(pos.x, pos.y, options);
}
//# sourceMappingURL=token-pick.js.map