/**
 * Pick the token the user most likely meant under a canvas point / pointer event.
 *
 * Coordinate priority (Foundry v13):
 * 1. PIXI event-target Token (walk parents)
 * 2. `canvas.canvasCoordinatesFromClient(clientX/Y)` from the real click
 * 3. `event.getLocalPosition(canvas.stage)` / stage.toLocal(global)
 *
 * Do **not** prefer `canvas.mousePosition` — it can lag behind the click when the
 * event was captured by a stage overlay (rings/highlights), which caused distant
 * clicks to resolve as a nearby token (e.g. always Fynn).
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
function clientPointFromEvent(ev) {
    const src = ev?.nativeEvent ?? ev?.data?.originalEvent ?? ev;
    const x = Number(src?.clientX ?? ev?.clientX);
    const y = Number(src?.clientY ?? ev?.clientY);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return null;
    return { x, y };
}
/** Best canvas-space point for a pointer event (never trusts stale mousePosition alone). */
export function pointerEventCanvasPoint(ev) {
    const mouse = canvas?.mousePosition;
    const mousePosition = mouse && Number.isFinite(mouse.x) && Number.isFinite(mouse.y)
        ? { x: Number(mouse.x), y: Number(mouse.y) }
        : null;
    let fromClient = null;
    const client = clientPointFromEvent(ev);
    if (client) {
        try {
            const fn = canvas?.canvasCoordinatesFromClient;
            if (typeof fn === 'function') {
                const p = fn.call(canvas, client);
                if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
                    fromClient = { x: Number(p.x), y: Number(p.y) };
                }
            }
        }
        catch {
            fromClient = null;
        }
        if (!fromClient) {
            try {
                const stage = canvas.stage;
                const PIXI = globalThis.PIXI;
                if (stage && typeof stage.toLocal === 'function' && PIXI?.Point) {
                    const p = stage.toLocal(new PIXI.Point(client.x, client.y));
                    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
                        fromClient = { x: Number(p.x), y: Number(p.y) };
                    }
                }
            }
            catch {
                /* ignore */
            }
        }
    }
    let stageLocal = null;
    try {
        if (ev) {
            const p = eventWorldPoint(ev);
            if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
                stageLocal = { x: p.x, y: p.y };
            }
        }
    }
    catch {
        stageLocal = null;
    }
    // Prefer click-derived client→canvas. mousePosition is last resort only.
    if (fromClient) {
        return { world: fromClient, fromClient, stageLocal, mousePosition, source: 'client' };
    }
    if (stageLocal) {
        return { world: stageLocal, fromClient, stageLocal, mousePosition, source: 'stageLocal' };
    }
    if (mousePosition) {
        return { world: mousePosition, fromClient, stageLocal, mousePosition, source: 'mousePosition-fallback' };
    }
    return { world: { x: 0, y: 0 }, fromClient, stageLocal, mousePosition, source: 'zero' };
}
function pointInTokenBounds(token, x, y) {
    try {
        if (token.bounds?.contains?.(x, y))
            return true;
    }
    catch {
        /* ignore */
    }
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
    const resolved = pointerEventCanvasPoint(ev);
    const { world, fromClient, stageLocal, mousePosition } = resolved;
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
        const hit = pickTokenAtPoint(world.x, world.y, options);
        if (hit) {
            picked = hit;
            pickReason = `bounds:${resolved.source}`;
        }
    }
    if (outDebug) {
        const tokens = (canvas.tokens?.placeables ?? []);
        const boundsHits = [];
        const nearestAll = [];
        for (const token of tokens) {
            if (!token?.id || !token.center)
                continue;
            const dist = Number(tokenCenterDist(token, world.x, world.y).toFixed(1));
            nearestAll.push({ id: String(token.id), name: String(token.name ?? '?'), dist });
            if (!isEligible(token, exclude, only))
                continue;
            if (!pointInTokenBounds(token, world.x, world.y))
                continue;
            boundsHits.push({
                id: String(token.id),
                name: String(token.name ?? '?'),
                dist,
            });
        }
        boundsHits.sort((a, b) => a.dist - b.dist);
        nearestAll.sort((a, b) => a.dist - b.dist);
        outDebug.world = world;
        outDebug.fromClient = fromClient;
        outDebug.stageLocal = stageLocal;
        outDebug.mousePosition = mousePosition;
        outDebug.fromEventTarget = fromTarget ? String(fromTarget.name ?? fromTarget.id) : null;
        outDebug.boundsHits = boundsHits;
        outDebug.nearestAll = nearestAll.slice(0, 8);
        outDebug.picked = picked ? String(picked.name ?? picked.id) : null;
        outDebug.pickReason = pickReason;
    }
    return picked;
}
//# sourceMappingURL=token-pick.js.map