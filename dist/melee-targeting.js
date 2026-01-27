/**
 * Melee Targeting – Foundry VTT v13 ONLY
 * - Draws reach highlight area (hex highlight on grid, circle on gridless)
 * - Shows interactive overlay for each valid target within reach
 * - When user clicks any valid target (token OR ring/overlay area), fires hook with attacker/target ids + option, then ends targeting
 * - Does NOT create chat messages, roll dice, or execute attacks directly
 */
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";
let active = null;
let confirming = false;
/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */
function metersToGridUnits(meters) {
    const grid = canvas.grid;
    if (!grid)
        return meters;
    const distance = grid.distance ?? 1;
    return meters / distance;
}
function getMeleeReachMeters(option) {
    if (typeof option.range === "number")
        return option.range;
    // Default melee range
    return 2;
}
function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}
/**
 * Find valid targets by distance
 * Uses Foundry measurement where possible
 */
function computeValidTargets(attackerToken, reachMeters) {
    const out = new Set();
    const tokens = canvas.tokens?.placeables ?? [];
    const attackerCenter = attackerToken?.center;
    if (!attackerCenter)
        return out;
    for (const token of tokens) {
        if (!token?.id || token.id === attackerToken.id)
            continue;
        if (!token.actor)
            continue;
        const targetCenter = token.center;
        // Try to use Foundry grid measurement if available
        let distanceMeters;
        const grid = canvas.grid;
        if (grid && typeof grid.measurePath === 'function') {
            try {
                const path = grid.measurePath([attackerCenter, targetCenter], {});
                distanceMeters = path.distance ?? (path.total ?? 0);
            }
            catch {
                // Fallback to pixel distance
                const distPx = distance(attackerCenter, targetCenter);
                const gridSize = grid.size ?? 100;
                const gridUnits = distPx / gridSize;
                distanceMeters = gridUnits * (grid.distance ?? 1);
            }
        }
        else {
            // Fallback to pixel distance
            const distPx = distance(attackerCenter, targetCenter);
            const gridSize = grid?.size ?? 100;
            const gridUnits = distPx / gridSize;
            distanceMeters = gridUnits * (grid?.distance ?? 1);
        }
        if (distanceMeters <= reachMeters) {
            out.add(token.id);
        }
    }
    return out;
}
/* -------------------------------------------- */
/*  Visuals                                     */
/* -------------------------------------------- */
/**
 * Draw reach area highlight
 * For gridded (hex/square): use hex highlighting
 * For gridless: draw circle
 */
function drawReachArea(state) {
    const grid = canvas.grid;
    if (!grid)
        return;
    const attackerId = state.attackerToken?.document?.id ?? state.attackerToken?.id;
    if (!attackerId)
        return;
    const RANGE = Math.max(0, Math.floor(Number(state.reachGridUnits) || 0));
    // Hex / square grids → highlight layer (v13 interface)
    if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
        highlightHexesInRange(attackerId, RANGE, state.highlightId, 0xff6666, 0.5);
    }
    else {
        // Gridless: draw circle with PIXI.Graphics
        // This would need to be stored in state.previewGraphics for cleanup
        // For now, we'll just use hex highlighting for gridded maps
        console.log("Mastery System | [MELEE TARGETING] Gridless maps not yet supported for reach preview");
    }
}
/**
 * Create a red ring around a token (non-interactive visual)
 */
function createTargetRing(token) {
    const ring = new PIXI.Graphics();
    const radius = (token.w ?? token.width ?? 50) / 2 + 10; // Token radius + padding
    ring.lineStyle(3, 0xff0000, 0.9);
    ring.drawCircle(0, 0, radius);
    ring.position.set(token.center.x, token.center.y);
    // Critical: do NOT intercept clicks
    ring.eventMode = "none";
    ring.interactive = false;
    ring.hitArea = null;
    return ring;
}
/**
 * Create an interactive overlay for clicking on targets
 */
function createTargetOverlay(token, tokenId, onClick) {
    const overlay = new PIXI.Container();
    overlay.name = `ms-melee-overlay-${tokenId}`;
    const cx = (token.w ?? token.width ?? 100) / 2;
    const cy = (token.h ?? token.height ?? 100) / 2;
    const radius = Math.max(cx, cy) + 18;
    const hit = new PIXI.Graphics();
    hit.beginFill(0xffffff, 0.001);
    hit.drawCircle(0, 0, radius);
    hit.endFill();
    hit.position.set(cx, cy);
    // ✅ IMPORTANT: hit is the interactive object
    hit.eventMode = "static";
    hit.cursor = "pointer";
    hit.on("pointerdown", (ev) => {
        ev.preventDefault?.();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        onClick(tokenId);
    });
    hit.on("pointerover", () => (overlay.alpha = 0.85));
    hit.on("pointerout", () => (overlay.alpha = 1.0));
    overlay.addChild(hit);
    // overlay itself should NOT steal events
    overlay.eventMode = "passive";
    overlay.targetTokenId = tokenId;
    return overlay;
}
/**
 * Mark valid targets with rings and overlays
 */
function markValidTargets(state) {
    // Clear existing visuals
    for (const ring of state.rings.values()) {
        if (ring.parent)
            ring.parent.removeChild(ring);
        ring.destroy(true);
    }
    state.rings.clear();
    for (const overlay of state.overlays.values()) {
        if (overlay.parent)
            overlay.parent.removeChild(overlay);
        overlay.destroy({ children: true });
    }
    state.overlays.clear();
    const layer = canvas.effects ?? canvas.foreground ?? canvas.tokens;
    const container = layer?.container ?? layer;
    if (!container?.addChild)
        return;
    // Handler for overlay clicks
    const handleOverlayClick = (targetId) => {
        if (confirming)
            return;
        const targetToken = canvas.tokens?.get(targetId);
        if (!targetToken)
            return;
        confirming = true;
        try {
            // Fire hook with attacker/target ids + option
            Hooks.call("masterySystem.meleeTargetSelected", {
                attackerTokenId: state.attackerToken.id,
                targetTokenId: targetId,
                option: state.option
            });
            // End targeting
            endMeleeTargeting(true);
        }
        catch (err) {
            console.error("Mastery System | [MELEE TARGETING] Overlay click failed", err);
            ui.notifications?.error?.("Failed to select target");
            endMeleeTargeting(false);
        }
        finally {
            confirming = false;
        }
    };
    for (const targetId of state.validTargetIds) {
        const token = canvas.tokens?.get(targetId);
        if (!token)
            continue;
        // original alpha speichern
        if (!state.originalTokenAlphas.has(targetId)) {
            state.originalTokenAlphas.set(targetId, token.alpha);
        }
        token.alpha = Math.min(1.0, (token.alpha ?? 1.0) * 1.05);
        // Ring bleibt im effects/foreground container (rein visuell)
        const ring = createTargetRing(token);
        state.rings.set(targetId, ring);
        container.addChild(ring);
        // Overlay muss IN den Token
        const overlay = createTargetOverlay(token, targetId, handleOverlayClick);
        state.overlays.set(targetId, overlay);
        token.sortableChildren = true;
        overlay.zIndex = 999999;
        token.addChild(overlay);
        token.sortChildren();
    }
}
/**
 * Restore token visuals
 */
function restoreTargetVisuals(state) {
    for (const [targetId, alpha] of state.originalTokenAlphas.entries()) {
        const token = canvas.tokens?.get(targetId);
        if (!token)
            continue;
        token.alpha = alpha;
    }
    state.originalTokenAlphas.clear();
}
/* -------------------------------------------- */
/*  Click Detection                             */
/* -------------------------------------------- */
/**
 * Find clicked token in reach area
 * This handles clicks on tokens themselves (not just overlays)
 */
function findClickedTokenInReachArea(state, ev) {
    const pos = ev.data.getLocalPosition(canvas.stage);
    const tokens = canvas.tokens?.placeables ?? [];
    if (!tokens.length)
        return null;
    // Direct bounds check
    for (const token of tokens) {
        if (!token?.bounds)
            continue;
        if (token.bounds.contains(pos.x, pos.y)) {
            // Check if it's a valid target
            if (state.validTargetIds.has(token.id)) {
                return token;
            }
        }
    }
    // Fallback: nearest valid target within ring radius
    let best = null;
    let bestDist = Infinity;
    for (const targetId of state.validTargetIds) {
        const token = canvas.tokens?.get(targetId);
        if (!token)
            continue;
        const r = (token.w ?? 50) / 2 + 15; // Must match ring pad
        const d = Math.hypot(pos.x - token.center.x, pos.y - token.center.y);
        if (d <= r && d < bestDist) {
            best = token;
            bestDist = d;
        }
    }
    return best;
}
/* -------------------------------------------- */
/*  Input Handlers                               */
/* -------------------------------------------- */
function onKeyDown(ev) {
    if (ev.key === "Escape") {
        endMeleeTargeting(false);
    }
}
function onPointerDown(ev) {
    const state = active;
    if (!state)
        return;
    // Right/middle click cancels
    if (ev.button !== 0) {
        endMeleeTargeting(false);
        return;
    }
    // Ignore if already confirming
    if (confirming)
        return;
    // Check if click is on a valid target (token itself, not overlay)
    const clicked = findClickedTokenInReachArea(state, ev);
    if (clicked && clicked.id !== state.attackerToken.id && state.validTargetIds.has(clicked.id)) {
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        confirming = true;
        try {
            // Fire hook with attacker/target ids + option
            Hooks.call("masterySystem.meleeTargetSelected", {
                attackerTokenId: state.attackerToken.id,
                targetTokenId: clicked.id,
                option: state.option
            });
            // End targeting
            endMeleeTargeting(true);
        }
        catch (err) {
            console.error("Mastery System | [MELEE TARGETING] Token click failed", err);
            ui.notifications?.error?.("Failed to select target");
            endMeleeTargeting(false);
        }
        finally {
            confirming = false;
        }
        return;
    }
    // Click on empty space cancels
    if (!clicked) {
        endMeleeTargeting(false);
        return;
    }
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
        overlays: new Map(),
        originalTokenAlphas: new Map(),
        validTargetIds: new Set(),
        onPointerDown,
        onKeyDown
    };
    active = state;
    // Draw reach area
    drawReachArea(state);
    // Compute valid targets
    state.validTargetIds = computeValidTargets(attackerToken, reachMeters);
    markValidTargets(state);
    // Register event handlers
    canvas.stage.on("pointerdown", state.onPointerDown, true);
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
    // Remove event handlers
    canvas.stage.off("pointerdown", state.onPointerDown, true);
    window.removeEventListener("keydown", state.onKeyDown);
    // Clear reach highlight
    clearHexHighlight(state.highlightId);
    // Remove rings
    for (const ring of state.rings.values()) {
        if (ring.parent)
            ring.parent.removeChild(ring);
        ring.destroy(true);
    }
    state.rings.clear();
    // Remove overlays
    for (const overlay of state.overlays.values()) {
        if (overlay.parent)
            overlay.parent.removeChild(overlay);
        overlay.destroy({ children: true });
    }
    state.overlays.clear();
    // Restore token visuals
    restoreTargetVisuals(state);
    active = null;
    confirming = false;
    if (!success) {
        ui.notifications?.info?.("Melee targeting cancelled");
    }
    console.log("Mastery System | [MELEE TARGETING] ended", { success });
}
export function isMeleeTargetingActive() {
    return !!active;
}
//# sourceMappingURL=melee-targeting.js.map