/**
 * Pick the token the user most likely meant under a canvas point.
 *
 * Foundry `placeables` order is not paint/z order. Returning the first
 * `bounds.contains` hit often selects a token behind another when they
 * overlap.
 *
 * Preference:
 * 1. Token recovered by walking the PIXI event target tree (most reliable)
 * 2. Tokens whose bounds contain the point — closest center, then topmost
 * 3. Soft center-radius fallback
 */
import { eventWorldPoint } from './grid-snap.js';
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
function asIdSet(ids) {
    if (ids == null)
        return null;
    return ids instanceof Set ? ids : new Set(ids);
}
function isEligible(token, exclude, only) {
    if (!token?.id || exclude.has(token.id))
        return false;
    if (only && !only.has(token.id))
        return false;
    return true;
}
/** Walk PIXI parent chain from the event target to find a Token placeable. */
export function tokenFromEventTarget(ev) {
    const placeables = (canvas.tokens?.placeables ?? []);
    const byId = new Map(placeables.map((t) => [t.id, t]));
    let obj = ev?.target ?? ev?.currentTarget ?? null;
    let depth = 0;
    while (obj && depth < 24) {
        if (obj.id && byId.has(obj.id) && (obj.actor != null || obj.document?.documentName === 'Token')) {
            return byId.get(obj.id);
        }
        // Overlay/hit child sometimes stores the placeable on `.token` / `.object`
        if (obj.token?.id && byId.has(obj.token.id))
            return byId.get(obj.token.id);
        if (obj.object?.id && byId.has(obj.object.id))
            return byId.get(obj.object.id);
        obj = obj.parent;
        depth += 1;
    }
    return null;
}
/** True when the pointer event landed on (or inside) a Token placeable. */
export function pointerEventIsOnToken(ev) {
    return !!tokenFromEventTarget(ev);
}
function resolveWorldPoint(ev) {
    const mouse = canvas?.mousePosition;
    const mousePosition = mouse && Number.isFinite(mouse.x) && Number.isFinite(mouse.y)
        ? { x: Number(mouse.x), y: Number(mouse.y) }
        : null;
    let stageLocal = null;
    try {
        const stage = canvas.stage;
        if (stage && ev) {
            const p = typeof ev.getLocalPosition === 'function'
                ? ev.getLocalPosition(stage)
                : ev.data?.getLocalPosition?.(stage);
            if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
                stageLocal = { x: Number(p.x), y: Number(p.y) };
            }
        }
    }
    catch {
        stageLocal = null;
    }
    // Prefer Foundry's tracked mouse position (canvas space), then eventWorldPoint.
    const fromEvent = ev ? eventWorldPoint(ev) : null;
    const world = mousePosition ?? fromEvent ?? stageLocal ?? { x: 0, y: 0 };
    return { world, mousePosition, stageLocal };
}
function pointInTokenBounds(token, x, y) {
    try {
        if (token.bounds?.contains?.(x, y))
            return true;
    }
    catch {
        /* ignore */
    }
    // Fallback: axis-aligned box from center + w/h (canvas pixels).
    const c = token?.center;
    const w = Number(token?.w ?? token?.width ?? 0);
    const h = Number(token?.h ?? token?.height ?? 0);
    if (!c || !(w > 0) || !(h > 0))
        return false;
    return Math.abs(x - c.x) <= w / 2 && Math.abs(y - c.y) <= h / 2;
}
/**
 * Best token under canvas coordinates `(x, y)`.
 */
export function pickTokenAtPoint(x, y, options = {}) {
    const tokens = (canvas.tokens?.placeables ?? []);
    if (!tokens.length)
        return null;
    const exclude = new Set(options.excludeIds ? [...options.excludeIds] : []);
    const only = asIdSet(options.onlyIds);
    const boundsHits = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!isEligible(token, exclude, only))
            continue;
        if (!pointInTokenBounds(token, x, y))
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
        if (!isEligible(token, exclude, only))
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
/**
 * Resolve pointer → token with debug metadata.
 * Prefers the PIXI event-target token when eligible.
 */
export function pickTokenFromPointerEvent(ev, options = {}, outDebug) {
    const { world, mousePosition, stageLocal } = resolveWorldPoint(ev);
    const exclude = new Set(options.excludeIds ? [...options.excludeIds] : []);
    const only = asIdSet(options.onlyIds);
    const fromTarget = tokenFromEventTarget(ev);
    let picked = null;
    let pickReason = 'none';
    if (fromTarget && isEligible(fromTarget, exclude, only)) {
        picked = fromTarget;
        pickReason = 'event-target';
    }
    else {
        // Try mousePosition and stage-local independently — they can diverge when
        // the canvas is panned/zoomed and FederatedEvent coords are stale in capture.
        const candidates = [];
        if (mousePosition)
            candidates.push({ label: 'mousePosition', p: mousePosition });
        if (stageLocal)
            candidates.push({ label: 'stageLocal', p: stageLocal });
        candidates.push({ label: 'world', p: world });
        for (const c of candidates) {
            const hit = pickTokenAtPoint(c.p.x, c.p.y, options);
            if (hit) {
                picked = hit;
                pickReason = `bounds:${c.label}`;
                break;
            }
        }
    }
    if (outDebug) {
        const tokens = (canvas.tokens?.placeables ?? []);
        const boundsHits = [];
        for (const token of tokens) {
            if (!isEligible(token, exclude, only))
                continue;
            if (!pointInTokenBounds(token, world.x, world.y))
                continue;
            boundsHits.push({
                id: String(token.id),
                name: String(token.name ?? '?'),
                dist: Number(tokenCenterDist(token, world.x, world.y).toFixed(1)),
            });
        }
        boundsHits.sort((a, b) => a.dist - b.dist);
        outDebug.world = world;
        outDebug.mousePosition = mousePosition;
        outDebug.stageLocal = stageLocal;
        outDebug.fromEventTarget = fromTarget ? String(fromTarget.name ?? fromTarget.id) : null;
        outDebug.boundsHits = boundsHits;
        outDebug.picked = picked ? String(picked.name ?? picked.id) : null;
        outDebug.pickReason = pickReason;
    }
    return picked;
}
//# sourceMappingURL=token-pick.js.map