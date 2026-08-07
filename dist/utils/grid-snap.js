/**
 * Foundry v12+ grid snapping helpers.
 *
 * `BaseGrid#getSnappedPosition` was removed after its deprecation window.
 * Prefer `getCenterPoint` / `getSnappedPoint` / `getTopLeftPoint`.
 */
function asPoint(raw) {
    if (!raw)
        return null;
    const x = Number(raw.x);
    const y = Number(raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return null;
    return { x, y };
}
/** Snap a world point to the center of the containing grid space (AoE placement). */
export function snapWorldCenter(x, y) {
    const grid = globalThis.canvas?.grid;
    if (!grid)
        return { x, y };
    if (typeof grid.getCenterPoint === 'function') {
        try {
            const c = asPoint(grid.getCenterPoint({ x, y }));
            if (c)
                return c;
        }
        catch {
            /* fall through */
        }
    }
    if (typeof grid.getSnappedPoint === 'function') {
        try {
            const modes = globalThis.CONST?.GRID_SNAPPING_MODES;
            const mode = modes?.CENTER ?? 1;
            const p = asPoint(grid.getSnappedPoint({ x, y }, { mode }));
            if (p)
                return p;
        }
        catch {
            /* fall through */
        }
    }
    // Legacy Foundry ≤12
    if (typeof grid.getSnappedPosition === 'function') {
        try {
            const p = asPoint(grid.getSnappedPosition(x, y, 1));
            if (p)
                return p;
        }
        catch {
            /* fall through */
        }
    }
    return { x, y };
}
/** Snap a world point to the top-left of the containing grid space (token moves). */
export function snapWorldTopLeft(x, y) {
    const grid = globalThis.canvas?.grid;
    if (!grid)
        return { x, y };
    if (typeof grid.getOffset === 'function' && typeof grid.getTopLeftPoint === 'function') {
        try {
            const offset = grid.getOffset({ x, y });
            const tl = asPoint(grid.getTopLeftPoint(offset));
            if (tl)
                return tl;
        }
        catch {
            /* fall through */
        }
    }
    if (typeof grid.getSnappedPoint === 'function') {
        try {
            const modes = globalThis.CONST?.GRID_SNAPPING_MODES;
            const mode = modes?.TOP_LEFT_CORNER ?? modes?.CORNER ?? modes?.CENTER ?? 1;
            const p = asPoint(grid.getSnappedPoint({ x, y }, { mode }));
            if (p)
                return p;
        }
        catch {
            /* fall through */
        }
    }
    if (typeof grid.getSnappedPosition === 'function') {
        try {
            const p = asPoint(grid.getSnappedPosition(x, y, 1));
            if (p)
                return p;
        }
        catch {
            /* fall through */
        }
    }
    return { x, y };
}
/** Resolve pointer event → canvas world coordinates (Pixi FederatedEvent safe). */
export function eventWorldPoint(ev) {
    const stage = globalThis.canvas?.stage ?? globalThis.canvas?.app?.stage;
    if (ev && typeof ev.getLocalPosition === 'function' && stage) {
        const p = asPoint(ev.getLocalPosition(stage));
        if (p)
            return p;
    }
    if (ev?.data && typeof ev.data.getLocalPosition === 'function' && stage) {
        const p = asPoint(ev.data.getLocalPosition(stage));
        if (p)
            return p;
    }
    const x = Number(ev?.global?.x ?? ev?.clientX ?? 0);
    const y = Number(ev?.global?.y ?? ev?.clientY ?? 0);
    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}
/** Best-effort PIXI container for temporary targeting overlays. */
export function resolveOverlayContainer() {
    const canvas = globalThis.canvas;
    if (!canvas)
        return null;
    const candidates = [canvas.effects, canvas.foreground, canvas.tokens, canvas.stage];
    for (const layer of candidates) {
        if (!layer)
            continue;
        if (layer.container && typeof layer.container.addChild === 'function')
            return layer.container;
        if (typeof layer.addChild === 'function')
            return layer;
    }
    return null;
}
//# sourceMappingURL=grid-snap.js.map