/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 *
 * Players Guide: Short band ("Min" on NPC sheet) is the gifted full-pool range —
 * NOT a hard minimum. Any target within Long (max) may be selected. Closer than
 * Short still works at full Short pool; Threatened Ranged applies separately when
 * enemies are in melee reach.
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";
import {
  gridStepsFromMeters,
  isWithinRangeMeters,
  measureSceneDistanceBetweenPoints,
} from "./utils/grid-range";
import { filterPerceivableTargetIds } from "./combat/perception-gate.js";

interface RangedTargetingState {
  attackerToken: any;
  option: RadialCombatOption;
  rangeMeters: number;
  /** Short-band ceiling (gifted full pool). Informational only for targeting. */
  shortBandMeters: number;
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

function getRangedShortMeters(option: RadialCombatOption): number {
  const min = Math.floor(Number(option.rangeMinMeters));
  return Number.isFinite(min) && min > 0 ? min : 0;
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
    // Only Long/max is a hard targeting limit. Short band is never an exclusion.
    if (!isWithinRangeMeters(attackerCenter, targetCenter, rangeMeters)) continue;
    inRange.add(token.id);
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
  }
}

function createTargetRing(token: any): PIXI.Graphics {
  const ring = new PIXI.Graphics();
  const radius = (token.w ?? token.width ?? 50) / 2 + 10;
  ring.lineStyle(3, 0xff6600, 0.9);
  ring.drawCircle(0, 0, radius);
  ring.position.set(token.center.x, token.center.y);
  canvas.stage.addChild(ring);
  return ring;
}

function createTargetOverlay(
  token: any,
  targetId: string,
  onClick: (id: string) => void
): PIXI.Container {
  const overlay = new PIXI.Container();
  const hit = new PIXI.Graphics();
  const w = token.w ?? 50;
  const h = token.h ?? 50;
  hit.beginFill(0xff6600, 0.001);
  hit.drawRect(-w / 2, -h / 2, w, h);
  hit.endFill();
  hit.eventMode = "static";
  hit.cursor = "pointer";
  hit.on("pointerdown", (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    onClick(targetId);
  });
  overlay.addChild(hit);
  return overlay;
}

function restoreTargetVisuals(state: RangedTargetingState): void {
  for (const [tokenId, alpha] of state.originalTokenAlphas) {
    const token = canvas.tokens?.get(tokenId);
    if (token) token.alpha = alpha;
  }
  state.originalTokenAlphas.clear();
}

function handleOverlayClick(targetId: string): void {
  const state = active;
  if (!state || confirming) return;
  if (!state.validTargetIds.has(targetId)) return;

  confirming = true;
  try {
    console.log("[MS NPC Targeting] RANGED overlay confirm → attack card", {
      attacker: state.attackerToken.name,
      targetId,
      option: state.option?.name,
      shortBand: state.shortBandMeters,
      max: state.rangeMeters,
    });
    Hooks.call("masterySystem.rangedTargetSelected", {
      attackerTokenId: state.attackerToken.id,
      targetTokenId: targetId,
      option: state.option,
    });
    endRangedTargeting(true);
  } catch (err) {
    console.error("Mastery System | [RANGED TARGETING] Overlay click failed", err);
    ui.notifications?.error?.("Failed to select target");
    endRangedTargeting(false);
  } finally {
    confirming = false;
  }
}

function markValidTargets(state: RangedTargetingState): void {
  const container = canvas.stage;
  if (!container) return;

  for (const targetId of state.validTargetIds) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;

    if (!state.originalTokenAlphas.has(targetId)) {
      state.originalTokenAlphas.set(targetId, token.alpha ?? 1.0);
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

/** Pixel hit-test any token under the pointer. */
function findClickedTokenAny(ev: PIXI.FederatedPointerEvent): any | null {
  const pos = ev.data.getLocalPosition(canvas.stage);
  const tokens = canvas.tokens?.placeables ?? [];
  if (!tokens.length) return null;

  for (const token of tokens) {
    if (!token?.bounds) continue;
    if (token.bounds.contains(pos.x, pos.y)) return token;
  }

  let best: any = null;
  let bestDist = Infinity;
  for (const token of tokens) {
    if (!token?.center) continue;
    const r = (token.w ?? 50) / 2 + 15;
    const d = Math.hypot(pos.x - token.center.x, pos.y - token.center.y);
    if (d <= r && d < bestDist) {
      best = token;
      bestDist = d;
    }
  }
  return best;
}

function measureMetersBetweenTokens(a: any, b: any): number | null {
  const from = a?.center;
  const to = b?.center;
  if (!from || !to) return null;
  const dScene = measureSceneDistanceBetweenPoints(from, to);
  return Number.isFinite(dScene) ? dScene : null;
}

function logNearbyTokenDistances(attackerToken: any, shortM: number, maxM: number): void {
  const attackerCenter = attackerToken?.center;
  if (!attackerCenter) return;
  const rows: Record<string, unknown>[] = [];
  for (const token of canvas.tokens?.placeables ?? []) {
    if (!token?.id || token.id === attackerToken.id || !token.center) continue;
    const dScene = measureSceneDistanceBetweenPoints(attackerCenter, token.center);
    const withinMax = isWithinRangeMeters(attackerCenter, token.center, maxM);
    const inShort =
      Number.isFinite(dScene) && shortM > 0 ? dScene <= shortM : withinMax;
    rows.push({
      name: token.name,
      id: token.id,
      distScene: Number.isFinite(dScene) ? Number(dScene.toFixed(2)) : null,
      withinMax,
      inShortBand: inShort,
      selectable: withinMax,
    });
  }
  console.log("[MS NPC Targeting] RANGED nearby token distances", {
    shortBandM: shortM,
    maxM,
    note: "Short band is gifted full pool — NOT a minimum distance to attack",
    attacker: attackerToken.name,
    tokens: rows,
  });
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

  const clicked = findClickedTokenAny(ev);

  if (!clicked) {
    endRangedTargeting(false);
    return;
  }
  if (clicked.id === state.attackerToken.id) {
    return;
  }

  ev.stopPropagation();
  ev.stopImmediatePropagation();

  if (!state.validTargetIds.has(clicked.id)) {
    const distM = measureMetersBetweenTokens(state.attackerToken, clicked);
    const distLabel = distM != null ? `${distM.toFixed(1)} m` : "? m";
    const msg = `Target out of range (${distLabel}). Max range is ${state.rangeMeters} m.`;
    ui.notifications?.warn?.(msg);
    console.warn("[MS NPC Targeting] RANGED click rejected (beyond Long)", {
      target: clicked.name,
      distM,
      maxM: state.rangeMeters,
      shortBandM: state.shortBandMeters,
    });
    return;
  }

  confirming = true;
  try {
    const distM = measureMetersBetweenTokens(state.attackerToken, clicked);
    console.log("[MS NPC Targeting] RANGED target confirmed → creating attack card", {
      attacker: state.attackerToken.name,
      target: clicked.name,
      option: state.option?.name,
      distM,
      shortBandM: state.shortBandMeters,
      maxM: state.rangeMeters,
      inShortBand:
        distM != null && state.shortBandMeters > 0
          ? distM <= state.shortBandMeters
          : true,
    });
    Hooks.call("masterySystem.rangedTargetSelected", {
      attackerTokenId: state.attackerToken.id,
      targetTokenId: clicked.id,
      option: state.option,
    });
    endRangedTargeting(true);
  } catch (err) {
    console.error("Mastery System | [RANGED TARGETING] Token click failed", err);
    ui.notifications?.error?.("Failed to select target");
    endRangedTargeting(false);
  } finally {
    confirming = false;
  }
}

export function startRangedTargeting(attackerToken: any, option: RadialCombatOption): void {
  endRangedTargeting(false);

  attackerToken?.control?.({ releaseOthers: false });

  const rangeMeters = getRangedMaxMeters(option);
  const shortBandMeters = getRangedShortMeters(option);

  const state: RangedTargetingState = {
    attackerToken,
    option,
    rangeMeters,
    shortBandMeters,
    rangeGridUnits: gridStepsFromMeters(rangeMeters),
    highlightId: "mastery-ranged",
    rings: new Map(),
    overlays: new Map(),
    originalTokenAlphas: new Map(),
    validTargetIds: new Set(),
    onPointerDown,
    onKeyDown,
  };

  active = state;

  drawRangeArea(state);
  state.validTargetIds = computeValidTargets(attackerToken, rangeMeters);
  markValidTargets(state);
  logNearbyTokenDistances(attackerToken, shortBandMeters, rangeMeters);

  canvas.stage.on("pointerdown", state.onPointerDown, true);
  window.addEventListener("keydown", state.onKeyDown);

  const bandHint =
    shortBandMeters > 0
      ? `Short ≤${shortBandMeters} m (full pool), Long ≤${rangeMeters} m`
      : `Long ≤${rangeMeters} m`;
  if (state.validTargetIds.size) {
    ui.notifications?.info?.(
      `Ranged targeting: ${bandHint}. Click any target within Long range.`,
    );
  } else {
    ui.notifications?.warn?.(
      `Ranged targeting: ${bandHint}. No targets within ${rangeMeters} m.`,
    );
    console.warn(
      "Mastery System | [RADIAL FLOW] ranged targeting: zero valid targets within Long range",
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
  }
}

export function isRangedTargetingActive(): boolean {
  return !!active;
}
