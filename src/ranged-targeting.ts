/**
 * Ranged attack targeting (Foundry v13) — same interaction model as melee-targeting,
 * but uses option.range (meters) and fires masterySystem.rangedTargetSelected.
 *
 * Players Guide: Short band ("Min" on NPC sheet) is the gifted full-pool range —
 * NOT a hard minimum. Any target within Long (max) may be selected. Closer than
 * Short still works at full Short pool; Threatened Ranged applies separately when
 * enemies are in melee reach.
 *
 * Click model (v0.9.274+):
 * - Per-target stage hit-pads bound to a concrete token id (no coordinate guessing).
 * - Visual rings are non-interactive so they cannot steal clicks.
 * - Stage capture never auto-confirms a guessed nearby token; it only cancels
 *   empty clicks / warns out-of-range using client→canvas coordinates.
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";
import {
  gridStepsFromMeters,
  isWithinRangeMeters,
  measureSceneDistanceBetweenPoints,
} from "./utils/grid-range";
import { filterPerceivableTargetIds } from "./combat/perception-gate.js";
import {
  pickTokenFromPointerEvent,
  pointerEventIsOnToken,
  tokenFromEventTarget,
  type TokenPickDebug,
} from "./utils/token-pick.js";

interface RangedTargetingState {
  attackerToken: any;
  option: RadialCombatOption;
  rangeMeters: number;
  /** Short-band ceiling (gifted full pool). Informational only for targeting. */
  shortBandMeters: number;
  rangeGridUnits: number;
  highlightId: string;
  rings: Map<string, PIXI.Graphics>;
  /** Stage-level click pads keyed by target token id. */
  hitPads: Map<string, PIXI.Graphics>;
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

/** Visual-only ring — must not steal pointer events from hit-pads/tokens. */
function createTargetRing(token: any): PIXI.Graphics {
  const ring = new PIXI.Graphics();
  const radius = (token.w ?? token.width ?? 50) / 2 + 10;
  ring.lineStyle(3, 0xff6600, 0.9);
  ring.drawCircle(0, 0, radius);
  ring.position.set(token.center.x, token.center.y);
  ring.eventMode = "none";
  (ring as any).interactive = false;
  (ring as any).interactiveChildren = false;
  canvas.stage.addChild(ring);
  return ring;
}

/**
 * Stage-level hit pad bound to a concrete target id.
 * Lives above the token layer so distant tokens remain clickable even when
 * hex highlights / other stage graphics would otherwise swallow the event.
 */
function createStageHitPad(token: any, targetId: string, onClick: (id: string) => void): PIXI.Graphics {
  const pad = new PIXI.Graphics();
  const w = token.w ?? 50;
  const h = token.h ?? 50;
  // Slightly larger than the token so edge clicks still count.
  const padW = w + 16;
  const padH = h + 16;
  pad.beginFill(0xff6600, 0.001);
  pad.drawRect(-padW / 2, -padH / 2, padW, padH);
  pad.endFill();
  pad.position.set(token.center.x, token.center.y);
  pad.eventMode = "static";
  pad.cursor = "pointer";
  (pad as any).msTargetTokenId = targetId;
  pad.on("pointerdown", (ev: PIXI.FederatedPointerEvent) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    ev.stopImmediatePropagation?.();
    console.log("[MS NPC Targeting] RANGED hit-pad pointerdown", {
      targetId,
      name: token.name,
    });
    onClick(targetId);
  });
  canvas.stage.addChild(pad);
  return pad;
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

function handleTargetClick(targetId: string, via: string): void {
  const state = active;
  if (!state || confirming) return;
  if (!state.validTargetIds.has(targetId)) {
    console.warn("[MS NPC Targeting] RANGED target click on non-valid id", { targetId, via });
    return;
  }
  const tok = canvas.tokens?.get(targetId);
  if (!tok) {
    console.warn("[MS NPC Targeting] RANGED target token missing", { targetId, via });
    return;
  }
  confirmRangedTarget(state, tok, via);
}

function markValidTargets(state: RangedTargetingState): void {
  for (const targetId of state.validTargetIds) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;

    if (!state.originalTokenAlphas.has(targetId)) {
      state.originalTokenAlphas.set(targetId, token.alpha ?? 1.0);
    }
    token.alpha = Math.min(1.0, (token.alpha ?? 1.0) * 1.05);

    const ring = createTargetRing(token);
    state.rings.set(targetId, ring);

    // Stage hit-pad is the authoritative click target (bound id, no guessing).
    const pad = createStageHitPad(token, targetId, (id) => handleTargetClick(id, "stage-hit-pad"));
    state.hitPads.set(targetId, pad);

    // Token-child overlay as secondary path.
    const overlay = createTargetOverlay(token, targetId, (id) => handleTargetClick(id, "token-overlay"));
    state.overlays.set(targetId, overlay);
    token.sortableChildren = true;
    overlay.zIndex = 999999;
    token.addChild(overlay);
    token.sortChildren();
  }
}

function measureMetersBetweenTokens(a: any, b: any): number | null {
  const from = a?.center;
  const to = b?.center;
  if (!from || !to) return null;
  const dScene = measureSceneDistanceBetweenPoints(from, to);
  return Number.isFinite(dScene) ? dScene : null;
}

function logNearbyTokenDistances(attackerToken: any, shortM: number, maxM: number, validIds: Set<string>): void {
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
      selectable: validIds.has(token.id),
      center: { x: Math.round(token.center.x), y: Math.round(token.center.y) },
    });
  }
  rows.sort((a: any, b: any) => (a.distScene ?? 99) - (b.distScene ?? 99));
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

function confirmRangedTarget(state: RangedTargetingState, clicked: any, via: string): void {
  if (confirming) return;
  confirming = true;
  try {
    const distM = measureMetersBetweenTokens(state.attackerToken, clicked);
    console.log("[MS NPC Targeting] RANGED target confirmed → creating attack card", {
      via,
      attacker: state.attackerToken.name,
      target: clicked.name,
      targetId: clicked.id,
      option: state.option?.name,
      distM,
      shortBandM: state.shortBandMeters,
      maxM: state.rangeMeters,
      inShortBand:
        distM != null && state.shortBandMeters > 0
          ? distM <= state.shortBandMeters
          : true,
      validIds: [...state.validTargetIds].map((id) => {
        const t = canvas.tokens?.get(id);
        return t ? `${t.name}(${id})` : id;
      }),
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

/**
 * Stage capture: cancel / out-of-range warn only.
 * Never confirm a "guessed" nearby token — that was selecting Fynn for far clicks.
 * Selection happens exclusively via stage hit-pads / token overlays.
 */
function onPointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = active;
  if (!state) return;

  if (ev.button !== 0) {
    console.log("[MS NPC Targeting] RANGED pointer cancel (non-left button)", { button: ev.button });
    endRangedTargeting(false);
    return;
  }

  if (confirming) return;

  // Hit-pad / overlay already handled this click.
  const padId = (ev.target as any)?.msTargetTokenId;
  if (padId) {
    console.log("[MS NPC Targeting] RANGED stage capture sees hit-pad target — defer", { padId });
    return;
  }

  const exclude = state.attackerToken?.id ? [state.attackerToken.id] : [];
  const debug: TokenPickDebug = {
    world: { x: 0, y: 0 },
    fromClient: null,
    stageLocal: null,
    mousePosition: null,
    fromEventTarget: null,
    boundsHits: [],
    nearestAll: [],
    picked: null,
    pickReason: '',
  };
  const clicked = pickTokenFromPointerEvent(ev, { excludeIds: exclude }, debug);
  const eventTok = tokenFromEventTarget(ev);

  console.log("[MS NPC Targeting] RANGED stage pointerdown (no confirm from guess)", {
    button: ev.button,
    eventTargetType: (ev.target as any)?.constructor?.name ?? typeof ev.target,
    eventToken: eventTok ? `${eventTok.name} (${eventTok.id})` : null,
    pick: debug,
    clicked: clicked ? `${clicked.name} (${clicked.id})` : null,
    validCount: state.validTargetIds.size,
    note: "Selection only via hit-pads; this handler cancels/warns only",
  });

  // If the click is on a token / our pad path, let that path finish.
  if (pointerEventIsOnToken(ev) || eventTok) {
    return;
  }

  if (clicked && !state.validTargetIds.has(clicked.id)) {
    const distM = measureMetersBetweenTokens(state.attackerToken, clicked);
    const distLabel = distM != null ? `${distM.toFixed(1)} m` : "? m";
    ui.notifications?.warn?.(
      `Target out of range (${distLabel}). Max range is ${state.rangeMeters} m.`,
    );
    console.warn("[MS NPC Targeting] RANGED click rejected (beyond Long / not selectable)", {
      target: clicked.name,
      targetId: clicked.id,
      distM,
      maxM: state.rangeMeters,
      pick: debug,
    });
    return;
  }

  if (!clicked) {
    console.log("[MS NPC Targeting] RANGED empty-canvas click → cancel");
    endRangedTargeting(false);
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
    hitPads: new Map(),
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
  logNearbyTokenDistances(attackerToken, shortBandMeters, rangeMeters, state.validTargetIds);
  console.log("[MS NPC Targeting] RANGED targeting started", {
    attacker: attackerToken.name,
    attackerId: attackerToken.id,
    option: option.name,
    shortBandMeters,
    rangeMeters,
    validTargets: [...state.validTargetIds].map((id) => {
      const t = canvas.tokens?.get(id);
      return t
        ? {
            id,
            name: t.name,
            center: t.center
              ? { x: Math.round(t.center.x), y: Math.round(t.center.y) }
              : null,
          }
        : { id, name: "?" };
    }),
    hitPadCount: state.hitPads.size,
  });

  // Bubble phase (not capture): hit-pads receive the event first when on stage above.
  canvas.stage.on("pointerdown", state.onPointerDown);
  window.addEventListener("keydown", state.onKeyDown);

  const bandHint =
    shortBandMeters > 0
      ? `Short ≤${shortBandMeters} m (full pool), Long ≤${rangeMeters} m`
      : `Long ≤${rangeMeters} m`;
  if (state.validTargetIds.size) {
    ui.notifications?.info?.(
      `Ranged targeting: ${bandHint}. Click any highlighted target within Long range.`,
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

  canvas.stage.off("pointerdown", state.onPointerDown);
  canvas.stage.off("pointerdown", state.onPointerDown, true);
  window.removeEventListener("keydown", state.onKeyDown);

  clearHexHighlight(state.highlightId);

  for (const ring of state.rings.values()) {
    if (ring.parent) ring.parent.removeChild(ring);
    ring.destroy(true);
  }
  state.rings.clear();

  for (const pad of state.hitPads.values()) {
    if (pad.parent) pad.parent.removeChild(pad);
    pad.destroy(true);
  }
  state.hitPads.clear();

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
