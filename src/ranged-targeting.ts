/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";
import { gridStepsFromMeters, isWithinRangeMeters } from "./utils/grid-range";
import { filterPerceivableTargetIds } from "./combat/perception-gate.js";

import { log } from './utils/logger.js';
interface RangedTargetingState {
  attackerToken: any;
  option: RadialCombatOption;
  rangeMeters: number;
  rangeGridUnits: number;
  highlightId: string;
  rings: Map<string, PIXI.Graphics>;
  overlays: Map<string, PIXI.Container>;
  originalTokenAlphas: Map<string, number>;
  validTargetIds: Set<string>;
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

let active: RangedTargetingState | null = null;
let confirming = false;

function getRangedMaxMeters(option: RadialCombatOption): number {
  if (typeof option.range === "number" && option.range > 0) return option.range;
  return 30;
}

function computeValidTargets(attackerToken: any, rangeMeters: number): Set<string> {
  const inRange = new Set<string>();
  const tokens = canvas.tokens?.placeables ?? [];
  const attackerCenter = attackerToken?.center;
  if (!attackerCenter) return inRange;

  for (const token of tokens) {
    if (!token?.id || token.id === attackerToken.id) continue;
    if (!token.actor) continue;

    const targetCenter = token.center;
    if (isWithinRangeMeters(attackerCenter, targetCenter, rangeMeters)) {
      inRange.add(token.id);
    }
  }

  const attackerActor = attackerToken.actor;
  if (!attackerActor) return inRange;
  return filterPerceivableTargetIds(attackerActor, inRange, attackerToken);
}

function drawRangeArea(state: RangedTargetingState): void {
  const grid = canvas.grid;
  if (!grid) return;

  const attackerId = state.attackerToken?.document?.id ?? state.attackerToken?.id;
  if (!attackerId) return;

  const RANGE = gridStepsFromMeters(state.rangeMeters);

  if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
    highlightHexesInRange(attackerId, RANGE, state.highlightId, 0xff8833, 0.35);
  } else {
    log.debug("Mastery System | [RANGED TARGETING] Gridless maps not yet supported for range preview");
  }
}

function createTargetRing(token: any): PIXI.Graphics {
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

function createTargetOverlay(token: any, tokenId: string, onClick: (tokenId: string) => void): PIXI.Container {
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
  hit.on("pointerdown", (ev: PIXI.FederatedPointerEvent) => {
    ev.preventDefault?.();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    onClick(tokenId);
  });
  hit.on("pointerover", () => (overlay.alpha = 0.85));
  hit.on("pointerout", () => (overlay.alpha = 1.0));
  overlay.addChild(hit);
  overlay.eventMode = "passive";
  (overlay as any).targetTokenId = tokenId;
  return overlay;
}

function restoreTargetVisuals(state: RangedTargetingState): void {
  for (const [targetId, alpha] of state.originalTokenAlphas.entries()) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;
    token.alpha = alpha;
  }
  state.originalTokenAlphas.clear();
}

function markValidTargets(state: RangedTargetingState): void {
  for (const ring of state.rings.values()) {
    if (ring.parent) ring.parent.removeChild(ring);
    ring.destroy(true);
  }
  state.rings.clear();

  for (const overlay of state.overlays.values()) {
    if (overlay.parent) overlay.parent.removeChild(overlay);
    overlay.destroy({ children: true });
  }
  state.overlays.clear();

  const layer: any = canvas.effects ?? canvas.foreground ?? canvas.tokens;
  const container: any = layer?.container ?? layer;
  if (!container?.addChild) return;

  const handleOverlayClick = (targetId: string) => {
    if (confirming) return;
    const targetToken = canvas.tokens?.get(targetId);
    if (!targetToken) return;

    confirming = true;
    try {
      Hooks.call("masterySystem.rangedTargetSelected", {
        attackerTokenId: state.attackerToken.id,
        targetTokenId: targetId,
        option: state.option
      });
      endRangedTargeting(true);
    } catch (err) {
      console.error("Mastery System | [RANGED TARGETING] Overlay click failed", err);
      ui.notifications?.error?.("Failed to select target");
      endRangedTargeting(false);
    } finally {
      confirming = false;
    }
  };

  for (const targetId of state.validTargetIds) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;

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

function findClickedTokenInRange(state: RangedTargetingState, ev: PIXI.FederatedPointerEvent): any | null {
  const pos = ev.data.getLocalPosition(canvas.stage);
  const tokens = canvas.tokens?.placeables ?? [];
  if (!tokens.length) return null;

  for (const token of tokens) {
    if (!token?.bounds) continue;
    if (token.bounds.contains(pos.x, pos.y) && state.validTargetIds.has(token.id)) {
      return token;
    }
  }

  let best: any = null;
  let bestDist = Infinity;
  for (const targetId of state.validTargetIds) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;
    const r = (token.w ?? 50) / 2 + 15;
    const d = Math.hypot(pos.x - token.center.x, pos.y - token.center.y);
    if (d <= r && d < bestDist) {
      best = token;
      bestDist = d;
    }
  }
  return best;
}

function onKeyDown(ev: KeyboardEvent): void {
  if (ev.key === "Escape") {
    endRangedTargeting(false);
  }
}

function onPointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = active;
  if (!state) return;

  if (ev.button !== 0) {
    endRangedTargeting(false);
    return;
  }

  if (confirming) return;

  const clicked = findClickedTokenInRange(state, ev);

  if (clicked && clicked.id !== state.attackerToken.id && state.validTargetIds.has(clicked.id)) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    confirming = true;
    try {
      Hooks.call("masterySystem.rangedTargetSelected", {
        attackerTokenId: state.attackerToken.id,
        targetTokenId: clicked.id,
        option: state.option
      });
      endRangedTargeting(true);
    } catch (err) {
      console.error("Mastery System | [RANGED TARGETING] Token click failed", err);
      ui.notifications?.error?.("Failed to select target");
      endRangedTargeting(false);
    } finally {
      confirming = false;
    }
    return;
  }

  if (!clicked) {
    endRangedTargeting(false);
  }
}

export function startRangedTargeting(attackerToken: any, option: RadialCombatOption): void {
  endRangedTargeting(false);

  attackerToken?.control?.({ releaseOthers: false });

  const rangeMeters = getRangedMaxMeters(option);

  const state: RangedTargetingState = {
    attackerToken,
    option,
    rangeMeters,
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
  state.validTargetIds = computeValidTargets(attackerToken, rangeMeters);
  markValidTargets(state);

  canvas.stage.on("pointerdown", state.onPointerDown, true);
  window.addEventListener("keydown", state.onKeyDown);

  ui.notifications?.info?.(
    state.validTargetIds.size
      ? `Ranged targeting: ${rangeMeters}m. Click a target.`
      : `Ranged targeting: ${rangeMeters}m. No targets in range.`
  );

  log.debug("Mastery System | [RANGED TARGETING] started", {
    attacker: attackerToken?.name,
    rangeMeters,
    validTargets: Array.from(state.validTargetIds)
  });
  if (state.validTargetIds.size === 0) {
    console.warn(
      "Mastery System | [RADIAL FLOW] ranged targeting: zero valid targets — Esc or click empty to cancel (no action spent until confirm)"
    );
  }
}

export function endRangedTargeting(success: boolean): void {
  const state = active;
  if (!state) return;

  canvas.stage.off("pointerdown", state.onPointerDown, true);
  window.removeEventListener("keydown", state.onKeyDown);

  clearHexHighlight(state.highlightId);

  for (const ring of state.rings.values()) {
    if (ring.parent) ring.parent.removeChild(ring);
    ring.destroy(true);
  }
  state.rings.clear();

  for (const overlay of state.overlays.values()) {
    if (overlay.parent) overlay.parent.removeChild(overlay);
    overlay.destroy({ children: true });
  }
  state.overlays.clear();

  restoreTargetVisuals(state);

  active = null;
  confirming = false;

  if (!success) {
    ui.notifications?.info?.("Ranged targeting cancelled");
    log.debug("Mastery System | [RADIAL FLOW] ranged targeting cancelled — no attack spent until target confirm");
  }

  log.debug("Mastery System | [RANGED TARGETING] ended", { success });
}

export function isRangedTargetingActive(): boolean {
  return !!active;
}
