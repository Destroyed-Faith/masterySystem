/**
 * Forced movement targeting — Push (away from source) / Pull (toward source).
 *
 * Highlights only legal destination cells within N m of the moved token:
 *   Push → farther from the reference token than the current cell
 *   Pull → closer to the reference token than the current cell
 *
 * Click a highlighted cell to move; Escape / right-click skips (damage already applied).
 */
import { clearHexHighlight, collectHexKeysInRangeForToken, } from '../utils/hex-highlighting.js';
import { gridStepsBetweenCenters, gridStepsFromMeters, measureSceneDistanceBetweenPoints, metersToSceneDistance, } from '../utils/grid-range.js';
import { eventWorldPoint, resolveOverlayContainer, snapWorldTopLeft } from '../utils/grid-snap.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
let active = null;
/** Pure distance rule: Push only farther, Pull only closer. Equal distance is illegal. */
export function isForcedMoveDistanceLegal(mode, originDist, destDist) {
    if (!Number.isFinite(originDist) || !Number.isFinite(destDist))
        return false;
    if (mode === 'push')
        return destDist > originDist + 1e-6;
    return destDist < originDist - 1e-6;
}
/** Parse a single Push(N) / Pull(N) label (optionally with trailing notes). */
export function parsePushPullMetersFromLine(line) {
    let push = 0;
    let pull = 0;
    const text = String(line || '');
    for (const m of text.matchAll(/\b(push|pull)\s*\(\s*(\d+)\s*\)/gi)) {
        const n = Math.max(0, Math.floor(Number(m[2]) || 0));
        if (m[1].toLowerCase() === 'push')
            push = Math.max(push, n);
        else
            pull = Math.max(pull, n);
    }
    return { push, pull };
}
/** Read Push/Pull metres from damage-card `specialsUsed` lines. */
export function readPushPullMetersFromSpecialLines(lines) {
    let push = 0;
    let pull = 0;
    if (!Array.isArray(lines))
        return { push, pull };
    for (const line of lines) {
        const parsed = parsePushPullMetersFromLine(String(line || ''));
        push = Math.max(push, parsed.push);
        pull = Math.max(pull, parsed.pull);
    }
    return { push, pull };
}
/** Read Push/Pull metres from a power item (levels / specials objects / "push(2)" strings). */
export function readPushPullMetersFromPower(power) {
    let push = 0;
    let pull = 0;
    const consider = (list) => {
        if (!Array.isArray(list))
            return;
        for (const entry of list) {
            if (typeof entry === 'string') {
                const parsed = parsePushPullMetersFromLine(entry);
                push = Math.max(push, parsed.push);
                pull = Math.max(pull, parsed.pull);
                continue;
            }
            const key = String(entry?.key || entry?.id || '').toLowerCase();
            const n = Math.max(0, Math.floor(Number(entry?.rank ?? entry?.value) || 0));
            if (key === 'push')
                push = Math.max(push, n);
            if (key === 'pull')
                pull = Math.max(pull, n);
        }
    };
    const sys = power?.system ?? {};
    consider(sys.specials);
    consider(sys.levelData?.specials);
    consider(power?.specials);
    const rank = Math.max(1, Math.floor(Number(sys.rank ?? sys.level) || 1));
    const levels = sys.levels;
    if (levels && typeof levels === 'object') {
        consider(levels[String(rank)]?.specials);
        consider(levels[rank]?.specials);
    }
    return { push, pull };
}
/**
 * Control powers often grant Push and Pull at the same rank — the attacker
 * chooses one axis, not both in sequence.
 */
export async function chooseForcedMoveAxis(pushM, pullM) {
    const push = Math.max(0, Math.floor(Number(pushM) || 0));
    const pull = Math.max(0, Math.floor(Number(pullM) || 0));
    if (push > 0 && pull <= 0)
        return 'push';
    if (pull > 0 && push <= 0)
        return 'pull';
    if (push <= 0 && pull <= 0)
        return null;
    const DialogCtor = globalThis.Dialog;
    if (typeof DialogCtor !== 'function') {
        // No UI — prefer Push when both are present.
        return 'push';
    }
    return new Promise((resolve) => {
        let settled = false;
        const finish = (mode) => {
            if (settled)
                return;
            settled = true;
            resolve(mode);
        };
        try {
            new DialogCtor({
                title: 'Forced Movement',
                content: `<p>Choose <strong>Push ${push} m</strong> (away) or <strong>Pull ${pull} m</strong> (toward).</p>`,
                buttons: {
                    push: {
                        icon: '<i class="fas fa-arrow-right"></i>',
                        label: `Push ${push} m`,
                        callback: () => finish('push'),
                    },
                    pull: {
                        icon: '<i class="fas fa-arrow-left"></i>',
                        label: `Pull ${pull} m`,
                        callback: () => finish('pull'),
                    },
                    skip: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Skip',
                        callback: () => finish(null),
                    },
                },
                default: 'push',
                close: () => finish(null),
            }).render(true);
        }
        catch (err) {
            console.warn('Mastery System | chooseForcedMoveAxis dialog failed', err);
            finish('push');
        }
    });
}
/**
 * After a hit's specials resolve: parse Push/Pull from special lines and open
 * the canvas destination picker (Push-vs-Pull choice lives in
 * `offerForcedMovementFromActors` when both metre values are present).
 */
export async function resolveForcedMovementFromSpecials(params) {
    const { push, pull } = readPushPullMetersFromSpecialLines(params.specialLines);
    if (push <= 0 && pull <= 0)
        return [];
    return offerForcedMovementFromActors({
        movedActor: params.movedActor,
        referenceActor: params.referenceActor,
        pushM: push,
        pullM: pull,
        labelPrefix: params.labelPrefix,
    });
}
/** Yellow highlight shared with radial / guided movement range previews. */
export const FORCED_MOVE_LEGAL_COLOR = 0xffe066;
export const FORCED_MOVE_HOVER_OK = 0xffe066;
export const FORCED_MOVE_HOVER_BAD = 0xff4444;
export const FORCED_MOVE_REF_COLOR = 0xffcc44;
/**
 * True when a move ray from `from` → `to` is blocked by a wall (type move).
 * Inject `testCollision` for unit tests; otherwise uses Foundry wall APIs.
 */
export function isMoveRayBlockedByWall(from, to, testCollision) {
    if (typeof testCollision === 'function') {
        try {
            return !!testCollision(from, to);
        }
        catch {
            return false;
        }
    }
    const g = globalThis;
    try {
        const backend = g.CONFIG?.Canvas?.polygonBackends?.move;
        if (typeof backend?.testCollision === 'function') {
            return !!backend.testCollision(from, to, { type: 'move', mode: 'any' });
        }
    }
    catch {
        /* fall through */
    }
    try {
        const walls = g.canvas?.walls;
        if (typeof walls?.checkCollision === 'function') {
            const Ray = g.foundry?.canvas?.geometry?.Ray ?? g.Ray;
            if (typeof Ray === 'function') {
                const ray = new Ray(from, to);
                return !!walls.checkCollision(ray, { type: 'move', mode: 'any' });
            }
        }
    }
    catch {
        /* no walls API */
    }
    return false;
}
/**
 * Drop candidate keys whose center is wall-blocked from the origin center.
 * Pure aside from the optional collision predicate.
 */
export function filterKeysBlockedByWalls(params) {
    const out = new Set();
    for (const key of params.candidateKeys) {
        const c = params.cellCenterFromKey(key);
        if (!c)
            continue;
        if (isMoveRayBlockedByWall(params.originCenter, c, params.testCollision))
            continue;
        out.add(key);
    }
    return out;
}
function tokenCenter(token) {
    return token?.center || { x: Number(token?.x) || 0, y: Number(token?.y) || 0 };
}
function tokenCenterFromTopLeft(token, tl) {
    const w = Number(token.w) || 0;
    const h = Number(token.h) || 0;
    return { x: tl.x + w / 2, y: tl.y + h / 2 };
}
function hexKeyAtCenter(center) {
    const grid = globalThis.canvas?.grid;
    if (!grid?.getOffset)
        return null;
    const o = grid.getOffset(center);
    if (o?.i === undefined || o?.j === undefined)
        return null;
    return `${o.i},${o.j}`;
}
function hexKeyUnderTokenAtTopLeft(token, topLeft) {
    return hexKeyAtCenter(tokenCenterFromTopLeft(token, topLeft));
}
function collectBlockedHexKeys(movingToken) {
    const keys = new Set();
    const grid = globalThis.canvas?.grid;
    const placeables = globalThis.canvas?.tokens?.placeables ?? [];
    if (!grid?.getOffset)
        return keys;
    const myId = movingToken?.id;
    for (const t of placeables) {
        if (!t || t.id === myId)
            continue;
        if (!t.actor)
            continue;
        const o = grid.getOffset(t.center);
        if (o?.i !== undefined && o?.j !== undefined)
            keys.add(`${o.i},${o.j}`);
    }
    return keys;
}
function cellCenterFromKey(key) {
    const grid = globalThis.canvas?.grid;
    if (!grid)
        return null;
    const parts = key.split(',');
    const i = Number(parts[0]);
    const j = Number(parts[1]);
    if (!Number.isFinite(i) || !Number.isFinite(j))
        return null;
    if (typeof grid.getCenterPoint === 'function') {
        try {
            const c = grid.getCenterPoint({ i, j });
            if (c && Number.isFinite(c.x) && Number.isFinite(c.y))
                return { x: c.x, y: c.y };
        }
        catch {
            /* fall through */
        }
    }
    const tl = grid.getTopLeftPoint?.({ i, j });
    if (!tl)
        return null;
    const size = Number(grid.size) || 100;
    return { x: tl.x + size / 2, y: tl.y + size / 2 };
}
/**
 * Build the set of legal destination hex keys for Push/Pull.
 * Exported for tests when a fake grid is injected via params.
 */
export function filterLegalForcedMoveKeys(params) {
    const legal = new Set();
    for (const key of params.candidateKeys) {
        if (params.blockedKeys.has(key))
            continue;
        const d = params.distFromRefSteps(key);
        if (d == null)
            continue;
        if (isForcedMoveDistanceLegal(params.mode, params.originDistSteps, d)) {
            legal.add(key);
        }
    }
    return legal;
}
function paintLegalKeys(state) {
    const g = globalThis;
    const grid = g.canvas?.grid;
    const gridUI = g.canvas?.interface?.grid;
    if (!grid || !gridUI || grid.type === g.CONST?.GRID_TYPES?.GRIDLESS)
        return;
    gridUI.addHighlightLayer?.(state.highlightIdRange);
    gridUI.clearHighlightLayer?.(state.highlightIdRange);
    for (const key of state.legalKeys) {
        const parts = key.split(',');
        const i = Number(parts[0]);
        const j = Number(parts[1]);
        if (!Number.isFinite(i) || !Number.isFinite(j))
            continue;
        const tl = grid.getTopLeftPoint({ i, j });
        if (!tl)
            continue;
        gridUI.highlightPosition?.(state.highlightIdRange, {
            x: tl.x,
            y: tl.y,
            color: FORCED_MOVE_LEGAL_COLOR,
            alpha: 0.42,
        });
    }
}
function refreshHover(state, destTL) {
    const g = globalThis;
    const grid = g.canvas?.grid;
    const gridUI = g.canvas?.interface?.grid;
    if (state.previewGraphics)
        state.previewGraphics.clear();
    const destCenter = tokenCenterFromTopLeft(state.movedToken, destTL);
    const destKey = hexKeyUnderTokenAtTopLeft(state.movedToken, destTL);
    const isValid = !!destKey && state.legalKeys.has(destKey);
    if (grid && gridUI && grid.type !== g.CONST?.GRID_TYPES?.GRIDLESS) {
        clearHexHighlight(state.highlightIdHover);
        gridUI.addHighlightLayer?.(state.highlightIdHover);
        gridUI.clearHighlightLayer?.(state.highlightIdHover);
        if (destKey) {
            const parts = destKey.split(',');
            const i = Number(parts[0]);
            const j = Number(parts[1]);
            if (Number.isFinite(i) && Number.isFinite(j)) {
                const tl = grid.getTopLeftPoint({ i, j });
                if (tl) {
                    gridUI.highlightPosition?.(state.highlightIdHover, {
                        x: tl.x,
                        y: tl.y,
                        color: isValid ? FORCED_MOVE_HOVER_OK : FORCED_MOVE_HOVER_BAD,
                        alpha: 0.5,
                    });
                }
            }
        }
    }
    else {
        // Gridless: validate by scene distance + away/toward.
        const moveDist = measureSceneDistanceBetweenPoints(state.originCenter, destCenter);
        const maxScene = metersToSceneDistance(state.meters);
        const destRef = measureSceneDistanceBetweenPoints(state.refCenter, destCenter);
        const dirOk = isForcedMoveDistanceLegal(state.mode, state.originDistScene, destRef);
        const validGridless = moveDist <= maxScene + 0.01 && dirOk;
        drawPreviewLine(state, destCenter, validGridless);
        return;
    }
    drawPreviewLine(state, destCenter, isValid);
}
function drawPreviewLine(state, destCenter, isValid) {
    if (!state.previewGraphics)
        return;
    const cellSize = Number(globalThis.canvas?.grid?.size) || 100;
    const lineColor = isValid ? FORCED_MOVE_HOVER_OK : FORCED_MOVE_HOVER_BAD;
    state.previewGraphics.lineStyle(3, lineColor, 0.88);
    state.previewGraphics.moveTo(state.originCenter.x, state.originCenter.y);
    state.previewGraphics.lineTo(destCenter.x, destCenter.y);
    // Reference marker (source of the force)
    state.previewGraphics.lineStyle(2, FORCED_MOVE_REF_COLOR, 0.9);
    state.previewGraphics.beginFill(FORCED_MOVE_REF_COLOR, 0.25);
    state.previewGraphics.drawCircle(state.refCenter.x, state.refCenter.y, cellSize * 0.22);
    state.previewGraphics.endFill();
    // Destination yellow point
    state.previewGraphics.lineStyle(2, FORCED_MOVE_LEGAL_COLOR, 0.95);
    state.previewGraphics.beginFill(FORCED_MOVE_LEGAL_COLOR, isValid ? 0.45 : 0.15);
    state.previewGraphics.drawCircle(destCenter.x, destCenter.y, cellSize * 0.28);
    state.previewGraphics.endFill();
}
function endForcedMovement(outcome) {
    const state = active;
    if (!state)
        return;
    active = null;
    const canvas = globalThis.canvas;
    try {
        canvas?.stage?.off?.('pointermove', state.onMove);
        canvas?.stage?.off?.('pointerdown', state.onDown);
    }
    catch {
        /* ignore */
    }
    window.removeEventListener('keydown', state.onKeyDown);
    try {
        clearHexHighlight(state.highlightIdRange);
        clearHexHighlight(state.highlightIdHover);
    }
    catch {
        /* ignore */
    }
    if (state.previewGraphics?.parent) {
        state.previewGraphics.parent.removeChild(state.previewGraphics);
        state.previewGraphics.clear();
    }
    try {
        state.movedToken.alpha = state.originalAlpha;
    }
    catch {
        /* ignore */
    }
    state.resolve(outcome);
}
/** True while interactive Push/Pull placement is listening on the canvas. */
export function isForcedMovementActive() {
    return active !== null;
}
/** Cancel interactive Push/Pull (Esc / stuck-overlay cleanup). No-ops if idle. */
export function cancelForcedMovementMode() {
    if (!active)
        return;
    endForcedMovement('skipped');
}
async function commitForcedMove(state, destTL) {
    const g = globalThis;
    const grid = g.canvas?.grid;
    const gridless = !grid || grid.type === g.CONST?.GRID_TYPES?.GRIDLESS;
    const destCenter = tokenCenterFromTopLeft(state.movedToken, destTL);
    if (!gridless) {
        const destKey = hexKeyUnderTokenAtTopLeft(state.movedToken, destTL);
        if (!destKey || !state.legalKeys.has(destKey)) {
            g.ui?.notifications?.warn?.(state.mode === 'push'
                ? 'Push: choose a highlighted cell farther from the source.'
                : 'Pull: choose a highlighted cell closer to the source.');
            return;
        }
    }
    else {
        const moveDist = measureSceneDistanceBetweenPoints(state.originCenter, destCenter);
        const maxScene = metersToSceneDistance(state.meters);
        const destRef = measureSceneDistanceBetweenPoints(state.refCenter, destCenter);
        if (moveDist > maxScene + 0.01 ||
            !isForcedMoveDistanceLegal(state.mode, state.originDistScene, destRef)) {
            g.ui?.notifications?.warn?.('Destination is not a legal Push/Pull cell.');
            return;
        }
    }
    try {
        await state.movedToken.document.setFlag?.('mastery-system', 'movementTraversal', 'forced');
        await state.movedToken.document.update({ x: destTL.x, y: destTL.y }, { animate: true });
        await state.movedToken.document.unsetFlag?.('mastery-system', 'movementTraversal');
        const dir = state.mode === 'push' ? 'away from' : 'toward';
        g.ui?.notifications?.info?.(`${state.label}: moved ${String(state.movedToken.name)} ${state.meters} m ${dir} ${String(state.referenceToken.name)}.`);
        endForcedMovement('moved');
    }
    catch (err) {
        console.warn('Mastery System | Forced movement update failed', err);
        await state.movedToken.document.unsetFlag?.('mastery-system', 'movementTraversal');
        g.ui?.notifications?.error?.('Failed to move token.');
        endForcedMovement('skipped');
    }
}
/**
 * Interactive Push/Pull placement. Resolves when the token is moved or the mode is cancelled.
 */
export function startForcedMovementMode(req) {
    return new Promise((resolve) => {
        const g = globalThis;
        if (active)
            endForcedMovement('skipped');
        const moved = req.movedToken;
        const reference = req.referenceToken;
        const meters = Math.max(0, Math.floor(Number(req.meters) || 0));
        if (!moved || !reference || meters <= 0) {
            resolve('unavailable');
            return;
        }
        if (!g.canvas?.grid || !g.canvas?.stage) {
            g.ui?.notifications?.warn?.(`${req.mode === 'push' ? 'Push' : 'Pull'} ${meters} m — move ${String(moved.name)} manually (${req.mode === 'push' ? 'away from' : 'toward'} ${String(reference.name)}).`);
            resolve('unavailable');
            return;
        }
        const maxSteps = gridStepsFromMeters(meters);
        const originCenter = tokenCenter(moved);
        const refCenter = tokenCenter(reference);
        const originDistSteps = gridStepsBetweenCenters(refCenter, originCenter, 64);
        const originDistScene = measureSceneDistanceBetweenPoints(refCenter, originCenter);
        const blockedKeys = collectBlockedHexKeys(moved);
        // Also block the reference cell (cannot end on the source).
        const refKey = hexKeyAtCenter(refCenter);
        if (refKey)
            blockedKeys.add(refKey);
        const rawCandidates = collectHexKeysInRangeForToken(moved.id, maxSteps) ?? new Set();
        // Walls block destination cells whose center cannot be reached by a move ray
        // from the token's current center (cannot shove through walls).
        const candidates = filterKeysBlockedByWalls({
            candidateKeys: rawCandidates,
            originCenter,
            cellCenterFromKey,
        });
        const legalKeys = filterLegalForcedMoveKeys({
            mode: req.mode,
            candidateKeys: candidates,
            blockedKeys,
            originDistSteps: originDistSteps ?? 0,
            distFromRefSteps: (key) => {
                const c = cellCenterFromKey(key);
                if (!c)
                    return null;
                // Cap search generously so Pull/Push cells past current ring still measure.
                return gridStepsBetweenCenters(refCenter, c, Math.max(64, maxSteps + (originDistSteps ?? 0) + 8));
            },
        });
        if (legalKeys.size === 0 && g.canvas.grid.type !== g.CONST?.GRID_TYPES?.GRIDLESS) {
            g.ui?.notifications?.info?.(`${req.mode === 'push' ? 'Push' : 'Pull'} ${meters} m: no legal cell (blocked or no farther/closer space). Damage still applies.`);
            resolve('unavailable');
            return;
        }
        const highlightIdRange = `mastery-forced-${req.mode}-range`;
        const highlightIdHover = `mastery-forced-${req.mode}-hover`;
        const originalAlpha = moved.alpha;
        try {
            moved.alpha = 0.65;
            moved.control?.({ releaseOthers: false });
        }
        catch {
            /* ignore */
        }
        let previewGraphics = { clear() { }, parent: null };
        try {
            const PIXI = g.PIXI;
            if (PIXI?.Graphics) {
                previewGraphics = new PIXI.Graphics();
                const overlay = resolveOverlayContainer();
                overlay?.addChild?.(previewGraphics);
            }
        }
        catch {
            previewGraphics = { clear() { }, parent: null };
        }
        const label = req.label ||
            (req.mode === 'push' ? `Push ${meters} m` : `Pull ${meters} m`);
        const onMove = (ev) => {
            if (!active)
                return;
            const world = eventWorldPoint(ev);
            const snapped = snapWorldTopLeft(world.x, world.y);
            refreshHover(active, snapped);
        };
        const onDown = (ev) => {
            if (!active)
                return;
            if (ev.button === 2 || ev.button === 1) {
                g.ui?.notifications?.info?.(`${active.label}: skipped.`);
                endForcedMovement('skipped');
                return;
            }
            if (ev.button === 0) {
                const world = eventWorldPoint(ev);
                const snapped = snapWorldTopLeft(world.x, world.y);
                void commitForcedMove(active, snapped);
            }
        };
        const onKeyDown = (ev) => {
            if (ev.key === 'Escape' && active) {
                g.ui?.notifications?.info?.(`${active.label}: skipped.`);
                endForcedMovement('skipped');
            }
        };
        const state = {
            movedToken: moved,
            referenceToken: reference,
            meters,
            maxSteps,
            mode: req.mode,
            label,
            originCenter,
            refCenter,
            originDistSteps,
            originDistScene,
            legalKeys,
            blockedKeys,
            originalAlpha,
            previewGraphics,
            highlightIdRange,
            highlightIdHover,
            onMove,
            onDown,
            onKeyDown,
            resolve,
        };
        active = state;
        paintLegalKeys(state);
        g.canvas.stage.on('pointermove', onMove);
        g.canvas.stage.on('pointerdown', onDown);
        window.addEventListener('keydown', onKeyDown);
        const dir = req.mode === 'push' ? 'away from' : 'toward';
        g.ui?.notifications?.info?.(`${label}: click a highlighted cell ${dir} ${String(reference.name)} (Esc/RMB = skip).`);
        refreshHover(state, { x: Number(moved.x) || 0, y: Number(moved.y) || 0 });
    });
}
/**
 * Resolve actor tokens and start Push and/or Pull (Push first if both).
 */
export async function offerForcedMovementFromActors(params) {
    const outcomes = [];
    // Immovable: immune to Push, Pull and forced movement (Players Guide).
    try {
        const { hasActiveSpecial } = await import('../system/active-specials.js');
        if (params.movedActor && hasActiveSpecial(params.movedActor, 'immovable')) {
            globalThis.ui?.notifications?.info?.(`${params.movedActor.name} is Immovable — Push/Pull has no effect.`);
            return ['unavailable'];
        }
    }
    catch {
        /* active-specials unavailable — proceed */
    }
    const movedTok = params.movedActor ? getPrimaryTokenForActor(params.movedActor) : null;
    const refTok = params.referenceActor ? getPrimaryTokenForActor(params.referenceActor) : null;
    if (!movedTok || !refTok) {
        const g = globalThis;
        const pushM = Math.max(0, Math.floor(Number(params.pushM) || 0));
        const pullM = Math.max(0, Math.floor(Number(params.pullM) || 0));
        if (pushM > 0 || pullM > 0) {
            g.ui?.notifications?.warn?.(`Forced move: could not resolve tokens — move manually (Push ${pushM} m / Pull ${pullM} m).`);
        }
        return ['unavailable'];
    }
    let pushM = Math.max(0, Math.floor(Number(params.pushM) || 0));
    let pullM = Math.max(0, Math.floor(Number(params.pullM) || 0));
    try {
        const { reduceForcedMeters } = await import('./growth-form.js');
        const nextPush = reduceForcedMeters(params.movedActor, pushM);
        const nextPull = reduceForcedMeters(params.movedActor, pullM);
        if ((pushM > 0 && nextPush < pushM) || (pullM > 0 && nextPull < pullM)) {
            globalThis.ui?.notifications?.info?.(`${params.movedActor?.name ?? 'Target'} Growth Form reduces forced movement.`);
        }
        pushM = nextPush;
        pullM = nextPull;
        if (pushM <= 0 && pullM <= 0)
            return ['skipped'];
    }
    catch {
        /* growth form unavailable */
    }
    const prefix = params.labelPrefix ? `${params.labelPrefix} — ` : '';
    // Dual-axis powers: pick one direction, do not run Push then Pull.
    if (pushM > 0 && pullM > 0) {
        const axis = await chooseForcedMoveAxis(pushM, pullM);
        if (!axis)
            return ['skipped'];
        if (axis === 'push')
            pullM = 0;
        else
            pushM = 0;
    }
    if (pushM > 0) {
        outcomes.push(await startForcedMovementMode({
            movedToken: movedTok,
            referenceToken: refTok,
            meters: pushM,
            mode: 'push',
            label: `${prefix}Push ${pushM} m`,
        }));
    }
    if (pullM > 0) {
        outcomes.push(await startForcedMovementMode({
            movedToken: movedTok,
            referenceToken: refTok,
            meters: pullM,
            mode: 'pull',
            label: `${prefix}Pull ${pullM} m`,
        }));
    }
    return outcomes;
}
//# sourceMappingURL=forced-movement.js.map