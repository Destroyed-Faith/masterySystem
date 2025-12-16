/**
 * Melee Targeting – Foundry VTT v13 ONLY
 * - Hex-safe reach preview (via Grid Highlight Layer)
 * - Deterministic target clicking (token OR ring area)
 * - No per-target interactive overlays (avoids Pixi layer/eventMode pitfalls)
 * - Static import for attack execution (no dynamic import / 404)
 */
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting.js";
// IMPORTANT: Use .js extension for Foundry runtime in dist
import { handleChosenCombatOption } from "./token-action-selector.js";
let active = null;
let confirming = false;
/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */
function metersToGridUnits(meters) {
    const d = canvas.grid?.distance ?? 1;
    return meters / d;
}
function getMeleeReachMeters(option) {
    // Unified range system
    if (typeof option.range === "number")
        return option.range;
    // Legacy
    if (typeof option.meleeReachMeters === "number")
        return option.meleeReachMeters;
    // Default
    return 2;
}
function getTokenLayerForCoords() {
    // In v13, token coords/bounds are best tested in the token layer space
    return canvas.tokens.container ?? canvas.tokens;
}
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}
/**
 * Find valid targets by distance. (Simple + deterministic)
 * You can swap this to grid measurePath later, but this works reliably.
 */
function computeValidTargets(attackerToken, reachMeters) {
    const out = new Set();
    const tokens = canvas.tokens?.placeables ?? [];
    const a = attackerToken?.center;
    if (!a)
        return out;
    for (const t of tokens) {
        if (!t?.id || t.id === attackerToken.id)
            continue;
        if (!t.actor)
            continue;
        const b = t.center;
        const distPx = distance(a, b);
        const gridSize = canvas.grid?.size ?? 100;
        const gridUnits = distPx / gridSize;
        const meters = gridUnits * (canvas.grid?.distance ?? 1);
        if (meters <= reachMeters)
            out.add(t.id);
    }
    return out;
}
function makeRingForToken(token, color = 0xff0000, alpha = 0.95, pad = 15) {
    const g = new PIXI.Graphics();
    const radius = (token.w ?? token.width ?? 50) / 2 + pad;
    g.msRadius = radius;
    g.msTargetTokenId = token.id;
    g.lineStyle(3, color, alpha);
    g.drawCircle(0, 0, radius);
    g.position.set(token.center.x, token.center.y);
    // critical: do NOT intercept clicks
    g.eventMode = "none";
    g.interactive = false;
    g.hitArea = null;
    return g;
}
/* -------------------------------------------- */
/*  Visuals                                     */
/* -------------------------------------------- */
function drawReachArea(state) {
    const grid = canvas.grid;
    if (!grid)
        return;
    const RANGE = Math.max(0, Math.floor(Number(state.reachGridUnits) || 0));
    const attackerId = state.attackerToken?.document?.id ?? state.attackerToken?.id;
    if (!attackerId)
        return;
    // Hex / square grids → highlight layer
    if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
        highlightHexesInRange(attackerId, RANGE, state.highlightId, 0xff6666, 0.5);
    }
}
function markValidTargets(state) {
    // clear existing rings
    for (const ring of state.rings.values()) {
        if (ring.parent)
            ring.parent.removeChild(ring);
        ring.destroy(true);
    }
    state.rings.clear();
    const ids = state.validTargetIds;
    const layer = canvas.effects ?? canvas.foreground ?? canvas.tokens;
    const container = layer?.container ?? layer;
    if (!container?.addChild)
        return;
    for (const id of ids) {
        const t = canvas.tokens?.get(id);
        if (!t)
            continue;
        // store original visuals once
        if (!state.originalTokenAlpha.has(id))
            state.originalTokenAlpha.set(id, t.alpha);
        if (!state.originalTokenTint.has(id))
            state.originalTokenTint.set(id, t.tint ?? 0xffffff);
        // optional: subtle emphasis (keep this mild)
        t.alpha = Math.min(1.0, (t.alpha ?? 1.0) * 1.05);
        // tint is optional; comment out if you dislike it
        t.tint = 0xffaaaa;
        const ring = makeRingForToken(t, 0xff0000, 0.9, 15);
        state.rings.set(id, ring);
        container.addChild(ring);
    }
}
function restoreTargetVisuals(state) {
    for (const id of state.originalTokenAlpha.keys()) {
        const t = canvas.tokens?.get(id);
        if (!t)
            continue;
        const a = state.originalTokenAlpha.get(id);
        if (typeof a === "number")
            t.alpha = a;
        const tint = state.originalTokenTint.get(id);
        if (typeof tint === "number")
            t.tint = tint;
    }
    state.originalTokenAlpha.clear();
    state.originalTokenTint.clear();
}
/* -------------------------------------------- */
/*  Click Detection                              */
/* -------------------------------------------- */
function findClickedTokenInReachArea(state, ev) {
    const tokenLayer = getTokenLayerForCoords();
    const pos = ev.data.getLocalPosition(tokenLayer);
    const tokens = canvas.tokens?.placeables ?? [];
    if (!tokens.length)
        return null;
    // 1) direct bounds check (most precise)
    for (const t of tokens) {
        if (!t?.bounds)
            continue;
        if (t.bounds.contains(pos.x, pos.y))
            return t;
    }
    // 2) nearest valid target within "ring radius" (token radius + padding)
    let best = null;
    let bestDist = Infinity;
    for (const id of state.validTargetIds) {
        const t = canvas.tokens?.get(id);
        if (!t)
            continue;
        const r = (t.w ?? 50) / 2 + 15; // must match ring pad
        const d = Math.hypot(pos.x - t.center.x, pos.y - t.center.y);
        if (d <= r && d < bestDist) {
            best = t;
            bestDist = d;
        }
    }
    return best;
}
/* -------------------------------------------- */
/*  Attack Execution                             */
/* -------------------------------------------- */
async function executeAttack(attackerToken, targetToken, option) {
    // Provide a hook so you can listen elsewhere
    Hooks.call("masterySystem.meleeTargetSelected", {
        attackerTokenId: attackerToken?.id,
        targetTokenId: targetToken?.id,
        optionId: option?.id,
        optionName: option?.name,
        option: option // Include full option object for handlers
    });
    // Pass target info to your normal handler
    const optionWithTarget = {
        ...option,
        targetToken,
        targetActor: targetToken?.actor
    };
    await handleChosenCombatOption(attackerToken, optionWithTarget);
}
/* -------------------------------------------- */
/*  Input Handlers                               */
/* -------------------------------------------- */
function onKeyDown(ev) {
    if (ev.key === "Escape")
        endMeleeTargeting(false);
}
function onPointerDown(ev) {
    const state = active;
    if (!state)
        return;
    // right/middle click cancels
    if (ev.button !== 0) {
        endMeleeTargeting(false);
        return;
    }
    // ignore if already confirming
    if (confirming)
        return;
    const clicked = findClickedTokenInReachArea(state, ev);
    // click on empty space cancels
    if (!clicked) {
        endMeleeTargeting(false);
        return;
    }
    // ignore attacker self
    if (clicked.id === state.attackerToken.id)
        return;
    // must be in valid list
    if (!state.validTargetIds.has(clicked.id)) {
        ui.notifications?.warn?.(`Target out of range (${state.reachMeters}m)`);
        return;
    }
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    confirming = true;
    Promise.resolve()
        .then(() => executeAttack(state.attackerToken, clicked, state.option))
        .then(() => endMeleeTargeting(true))
        .catch((err) => {
        console.error("Mastery System | [MELEE TARGETING] Attack failed", err);
        ui.notifications?.error?.(`Attack failed: ${String(err)}`);
        endMeleeTargeting(false);
    })
        .finally(() => {
        confirming = false;
    });
}
/* -------------------------------------------- */
/*  Public API                                   */
/* -------------------------------------------- */
export function startMeleeTargeting(attackerToken, option) {
    endMeleeTargeting(false);
    attackerToken?.control?.({ releaseOthers: false });
    const reachMeters = getMeleeReachMeters(option);
    const reachGridUnits = metersToGridUnits(reachMeters);
    const state = {
        attackerToken,
        option,
        reachMeters,
        reachGridUnits,
        highlightId: "mastery-melee",
        rings: new Map(),
        originalTokenAlpha: new Map(),
        originalTokenTint: new Map(),
        validTargetIds: new Set(),
        onPointerDown,
        onKeyDown
    };
    active = state;
    // Draw reach first
    drawReachArea(state);
    // Compute + mark targets
    state.validTargetIds = computeValidTargets(attackerToken, reachMeters);
    markValidTargets(state);
    // Capture phase to beat other handlers
    canvas.stage.on("pointerdown", state.onPointerDown, true);
    const tokenLayer = canvas.tokens.layer ?? canvas.tokens;
    tokenLayer?.on?.("pointerdown", state.onPointerDown, true);
    window.addEventListener("keydown", state.onKeyDown);
    ui.notifications?.info?.(state.validTargetIds.size
        ? `Melee targeting: ${reachMeters}m. Click an enemy in range.`
        : `Melee targeting: ${reachMeters}m. No targets in range.`);
    console.log("Mastery System | [MELEE TARGETING] started", {
        attacker: attackerToken?.name,
        reachMeters,
        reachGridUnits,
        validTargets: Array.from(state.validTargetIds)
    });
}
export function endMeleeTargeting(success) {
    const state = active;
    if (!state)
        return;
    canvas.stage.off("pointerdown", state.onPointerDown, true);
    const tokenLayer = canvas.tokens.layer ?? canvas.tokens;
    tokenLayer?.off?.("pointerdown", state.onPointerDown, true);
    window.removeEventListener("keydown", state.onKeyDown);
    // clear reach highlight
    clearHexHighlight(state.highlightId);
    // remove rings
    for (const ring of state.rings.values()) {
        if (ring.parent)
            ring.parent.removeChild(ring);
        ring.destroy(true);
    }
    state.rings.clear();
    // restore token visuals
    restoreTargetVisuals(state);
    active = null;
    if (!success)
        ui.notifications?.info?.("Melee targeting cancelled");
    console.log("Mastery System | [MELEE TARGETING] ended", { success });
}
export function isMeleeTargetingActive() {
    return !!active;
}
//# sourceMappingURL=melee-targeting.js.map