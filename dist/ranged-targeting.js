/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 */
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting.js";
import { gridStepsFromMeters, isWithinRangeMeters, measureSceneDistanceBetweenPoints, metersToSceneDistance, } from "./utils/grid-range.js";
import { filterPerceivableTargetIds } from "./combat/perception-gate.js";
let active = null;
let confirming = false;
function getRangedMaxMeters(option) {
    if (typeof option.range === "number" && option.range > 0)
        return option.range;
    return 30;
}
function getRangedMinMeters(option) {
    const min = Math.floor(Number(option.rangeMinMeters));
    return Number.isFinite(min) && min > 0 ? min : 0;
}
function isAtOrBeyondMinMeters(from, to, minMeters) {
    if (!(minMeters > 0))
        return true;
    const minScene = metersToSceneDistance(minMeters);
    const dPath = measureSceneDistanceBetweenPoints(from, to);
    return Number.isFinite(dPath) && dPath + 0.01 >= minScene;
}
function computeValidTargets(attackerToken, rangeMeters, rangeMinMeters = 0) {
    const inRange = new Set();
    const tokens = canvas.tokens?.placeables ?? [];
    const attackerCenter = attackerToken?.center;
    if (!attackerCenter)
        return inRange;
    for (const token of tokens) {
        if (!token?.id || token.id === attackerToken.id)
            continue;
        if (!token.actor)
            continue;
        const targetCenter = token.center;
        if (!isWithinRangeMeters(attackerCenter, targetCenter, rangeMeters))
            continue;
        if (!isAtOrBeyondMinMeters(attackerCenter, targetCenter, rangeMinMeters))
            continue;
        inRange.add(token.id);
    }
    const attackerActor = attackerToken.actor;
    if (!attackerActor)
        return inRange;
    return filterPerceivableTargetIds(attackerActor, inRange, attackerToken);
}
function drawRangeArea(state) {
    const grid = canvas.grid;
    if (!grid)
        return;
    const attackerId = state.attackerToken?.document?.id ?? state.attackerToken?.id;
    if (!attackerId)
        return;
    const RANGE = gridStepsFromMeters(state.rangeMeters);
    if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
        highlightHexesInRange(attackerId, RANGE, state.highlightId, 0xff8833, 0.35);
    }
    else {
    }
}
function createTargetRing(token) {
    const ring = new PIXI.Graphics();
    const radius = (token.w ?? token.width ?? 50) / 2 + 10;
    ring.lineStyle(3, 0xff6600, 0.9);
    ring.drawCircle(0, 0, radius);
    ring.position.set(token.center.x, token.center.y);
    ring.eventMode = "none";
    ring.interactive = false;
    ring.hitArea = null;
    return ring;
}
function createTargetOverlay(token, tokenId, onClick) {
    const overlay = new PIXI.Container();
    overlay.name = `ms-ranged-overlay-${tokenId}`;
    const cx = (token.w ?? token.width ?? 100) / 2;
    const cy = (token.h ?? token.height ?? 100) / 2;
    const radius = Math.max(cx, cy) + 18;
    const hit = new PIXI.Graphics();
    hit.beginFill(0xffffff, 0.001);
    hit.drawCircle(0, 0, radius);
    hit.endFill();
    hit.position.set(cx, cy);
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
    overlay.eventMode = "passive";
    overlay.targetTokenId = tokenId;
    return overlay;
}
function restoreTargetVisuals(state) {
    for (const [targetId, alpha] of state.originalTokenAlphas.entries()) {
        const token = canvas.tokens?.get(targetId);
        if (!token)
            continue;
        token.alpha = alpha;
    }
    state.originalTokenAlphas.clear();
}
function markValidTargets(state) {
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
    const handleOverlayClick = (targetId) => {
        if (confirming)
            return;
        const targetToken = canvas.tokens?.get(targetId);
        if (!targetToken)
            return;
        confirming = true;
        try {
            Hooks.call("masterySystem.rangedTargetSelected", {
                attackerTokenId: state.attackerToken.id,
                targetTokenId: targetId,
                option: state.option
            });
            endRangedTargeting(true);
        }
        catch (err) {
            console.error("Mastery System | [RANGED TARGETING] Overlay click failed", err);
            ui.notifications?.error?.("Failed to select target");
            endRangedTargeting(false);
        }
        finally {
            confirming = false;
        }
    };
    for (const targetId of state.validTargetIds) {
        const token = canvas.tokens?.get(targetId);
        if (!token)
            continue;
        if (!state.originalTokenAlphas.has(targetId)) {
            state.originalTokenAlphas.set(targetId, token.alpha);
        }
        token.alpha = Math.min(1.0, (token.alpha ?? 1.0) * 1.05);
        const ring = createTargetRing(token);
        state.rings.set(targetId, ring);
        container.addChild(ring);
        const overlay = createTargetOverlay(token, targetId, handleOverlayClick);
        state.overlays.set(targetId, overlay);
        token.sortableChildren = true;
        overlay.zIndex = 999999;
        token.addChild(overlay);
        token.sortChildren();
    }
}
/** Pixel hit-test any token under the pointer (not limited to valid targets). */
function findClickedTokenAny(ev) {
    const pos = ev.data.getLocalPosition(canvas.stage);
    const tokens = canvas.tokens?.placeables ?? [];
    if (!tokens.length)
        return null;
    for (const token of tokens) {
        if (!token?.bounds)
            continue;
        if (token.bounds.contains(pos.x, pos.y))
            return token;
    }
    let best = null;
    let bestDist = Infinity;
    for (const token of tokens) {
        if (!token?.center)
            continue;
        const r = (token.w ?? 50) / 2 + 15;
        const d = Math.hypot(pos.x - token.center.x, pos.y - token.center.y);
        if (d <= r && d < bestDist) {
            best = token;
            bestDist = d;
        }
    }
    return best;
}
function measureMetersBetweenTokens(a, b) {
    const from = a?.center;
    const to = b?.center;
    if (!from || !to)
        return null;
    const dScene = measureSceneDistanceBetweenPoints(from, to);
    return Number.isFinite(dScene) ? dScene : null;
}
function explainRangedInvalidTarget(state, targetToken) {
    const attacker = state.attackerToken;
    const distM = measureMetersBetweenTokens(attacker, targetToken);
    const distLabel = distM != null ? `${distM.toFixed(1)} m` : "? m";
    const minM = state.rangeMinMeters;
    const maxM = state.rangeMeters;
    if (distM != null && minM > 0 && distM + 0.01 < metersToSceneDistance(minM)) {
        return `Target too close (${distLabel}). Range band is ${minM}–${maxM} m.`;
    }
    if (distM != null && !isWithinRangeMeters(attacker.center, targetToken.center, maxM)) {
        return `Target too far (${distLabel}). Range band is ${minM > 0 ? `${minM}–` : ""}${maxM} m.`;
    }
    return `Target not valid for ranged attack (${distLabel}; band ${minM > 0 ? `${minM}–` : ""}${maxM} m).`;
}
function logNearbyTokenDistances(attackerToken, minM, maxM) {
    const attackerCenter = attackerToken?.center;
    if (!attackerCenter)
        return;
    const rows = [];
    for (const token of canvas.tokens?.placeables ?? []) {
        if (!token?.id || token.id === attackerToken.id || !token.center)
            continue;
        const dScene = measureSceneDistanceBetweenPoints(attackerCenter, token.center);
        const withinMax = isWithinRangeMeters(attackerCenter, token.center, maxM);
        const beyondMin = isAtOrBeyondMinMeters(attackerCenter, token.center, minM);
        rows.push({
            name: token.name,
            id: token.id,
            distScene: Number.isFinite(dScene) ? Number(dScene.toFixed(2)) : null,
            withinMax,
            beyondMin,
            validBand: withinMax && beyondMin,
        });
    }
    console.log("[MS NPC Targeting] RANGED nearby token distances", {
        minM,
        maxM,
        attacker: attackerToken.name,
        tokens: rows,
    });
}
function onKeyDown(ev) {
    if (ev.key === "Escape") {
        endRangedTargeting(false);
    }
}
function onPointerDown(ev) {
    const state = active;
    if (!state)
        return;
    if (ev.button !== 0) {
        endRangedTargeting(false);
        return;
    }
    if (confirming)
        return;
    const clicked = findClickedTokenAny(ev);
    // Empty canvas → cancel.
    if (!clicked) {
        endRangedTargeting(false);
        return;
    }
    if (clicked.id === state.attackerToken.id) {
        return;
    }
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    // Clicked a token outside the Range band → keep targeting, explain why.
    if (!state.validTargetIds.has(clicked.id)) {
        const msg = explainRangedInvalidTarget(state, clicked);
        ui.notifications?.warn?.(msg);
        console.warn("[MS NPC Targeting] RANGED click rejected", {
            target: clicked.name,
            reason: msg,
            minM: state.rangeMinMeters,
            maxM: state.rangeMeters,
        });
        return;
    }
    confirming = true;
    try {
        console.log("[MS NPC Targeting] RANGED target confirmed → creating attack card", {
            attacker: state.attackerToken.name,
            target: clicked.name,
            option: state.option?.name,
        });
        Hooks.call("masterySystem.rangedTargetSelected", {
            attackerTokenId: state.attackerToken.id,
            targetTokenId: clicked.id,
            option: state.option,
        });
        endRangedTargeting(true);
    }
    catch (err) {
        console.error("Mastery System | [RANGED TARGETING] Token click failed", err);
        ui.notifications?.error?.("Failed to select target");
        endRangedTargeting(false);
    }
    finally {
        confirming = false;
    }
}
export function startRangedTargeting(attackerToken, option) {
    endRangedTargeting(false);
    attackerToken?.control?.({ releaseOthers: false });
    const rangeMeters = getRangedMaxMeters(option);
    const rangeMinMeters = getRangedMinMeters(option);
    const state = {
        attackerToken,
        option,
        rangeMeters,
        rangeMinMeters,
        rangeGridUnits: gridStepsFromMeters(rangeMeters),
        highlightId: "mastery-ranged",
        rings: new Map(),
        overlays: new Map(),
        originalTokenAlphas: new Map(),
        validTargetIds: new Set(),
        onPointerDown,
        onKeyDown
    };
    active = state;
    drawRangeArea(state);
    state.validTargetIds = computeValidTargets(attackerToken, rangeMeters, rangeMinMeters);
    markValidTargets(state);
    logNearbyTokenDistances(attackerToken, rangeMinMeters, rangeMeters);
    canvas.stage.on("pointerdown", state.onPointerDown, true);
    window.addEventListener("keydown", state.onKeyDown);
    const rangeLabel = rangeMinMeters > 0 ? `${rangeMinMeters}–${rangeMeters}m` : `${rangeMeters}m`;
    if (state.validTargetIds.size) {
        ui.notifications?.info?.(`Ranged targeting: ${rangeLabel}. Click a highlighted target.`);
    }
    else {
        ui.notifications?.warn?.(`Ranged targeting: ${rangeLabel}. No targets in that band` +
            (rangeMinMeters > 0
                ? ` (need ≥ ${rangeMinMeters} m — move farther or lower Min).`
                : "."));
        console.warn("Mastery System | [RADIAL FLOW] ranged targeting: zero valid targets — Esc or click empty to cancel (no action spent until confirm)");
    }
}
export function endRangedTargeting(success) {
    const state = active;
    if (!state)
        return;
    canvas.stage.off("pointerdown", state.onPointerDown, true);
    window.removeEventListener("keydown", state.onKeyDown);
    clearHexHighlight(state.highlightId);
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
    restoreTargetVisuals(state);
    active = null;
    confirming = false;
    if (!success) {
        ui.notifications?.info?.("Ranged targeting cancelled");
    }
}
export function isRangedTargetingActive() {
    return !!active;
}
//# sourceMappingURL=ranged-targeting.js.map