/**
 * Melee Targeting – Foundry VTT v13 ONLY
 * - Draws reach highlight area (hex highlight on grid, circle on gridless)
 * - Shows interactive overlay for each valid target within reach
 * - When user clicks any valid target (token OR ring/overlay area), fires hook with attacker/target ids + option, then ends targeting
 * - Does NOT create chat messages, roll dice, or execute attacks directly
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";
import { gridStepsFromMeters, isWithinRangeMeters } from "./utils/grid-range";
import { tokenIsHostileTo } from "./combat/threatened-ranged.js";
import { filterPerceivableTargetIds } from "./combat/perception-gate.js";
import {
  pickTokenFromPointerEvent,
  pointerEventIsOnToken,
  type TokenPickDebug,
} from "./utils/token-pick.js";

interface MeleeTargetingState {
  attackerToken: any;
  option: RadialCombatOption;
  reachMeters: number;
  reachGridUnits: number;
  highlightId: string;
  
  // Visuals
  rings: Map<string, PIXI.Graphics>; // Red rings around targets (non-interactive)
  overlays: Map<string, PIXI.Container>; // Interactive overlays for clicking
  originalTokenAlphas: Map<string, number>;
  
  // Valid target ids
  validTargetIds: Set<string>;
  
  // Event handlers
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

let active: MeleeTargetingState | null = null;
let confirming = false;

/* -------------------------------------------- */
/*  Helpers                                     */
/* -------------------------------------------- */

export function getMeleeReachMeters(option: RadialCombatOption): number {
  if (typeof option.range === "number") return option.range;
  // Default melee range
  return 2;
}

/**
 * Hostile token ids within a melee burst AoE: distance from attacker center
 * ≤ min(melee reach, template burst radius). Reach caps how far a melee strike can reach.
 */
export function collectMeleeBurstHostileTokenIds(
  attackerToken: any,
  option: RadialCombatOption
): string[] {
  const reachM = getMeleeReachMeters(option);
  const burstM =
    typeof option.burstMeleeRadiusMeters === "number" && option.burstMeleeRadiusMeters > 0
      ? option.burstMeleeRadiusMeters
      : reachM;
  const hitRadiusM = Math.min(reachM, burstM);
  const attackerCenter = attackerToken?.center;
  if (!attackerCenter) return [];

  const out: string[] = [];
  const tokens = canvas.tokens?.placeables ?? [];
  for (const token of tokens) {
    if (!token?.id || token.id === attackerToken.id || !token.actor) continue;
    if (!tokenIsHostileTo(attackerToken, token)) continue;
    const targetCenter = token.center;
    if (!targetCenter) continue;
    if (isWithinRangeMeters(attackerCenter, targetCenter, hitRadiusM)) {
      out.push(token.id);
    }
  }
  return out;
}

/**
 * Find valid targets by distance
 * Uses Foundry measurement where possible
 */
function computeValidTargets(attackerToken: any, reachMeters: number): Set<string> {
  const out = new Set<string>();
  const tokens = canvas.tokens?.placeables ?? [];
  const attackerCenter = attackerToken?.center;
  if (!attackerCenter) return out;

  const inRange = new Set<string>();
  for (const token of tokens) {
    if (!token?.id || token.id === attackerToken.id) continue;
    if (!token.actor) continue;

    const targetCenter = token.center;
    if (isWithinRangeMeters(attackerCenter, targetCenter, reachMeters)) {
      inRange.add(token.id);
    }
  }

  const attackerActor = attackerToken.actor;
  if (!attackerActor) return inRange;

  return filterPerceivableTargetIds(attackerActor, inRange, attackerToken);
}

/* -------------------------------------------- */
/*  Visuals                                     */
/* -------------------------------------------- */

/**
 * Draw reach area highlight
 * For gridded (hex/square): use hex highlighting
 * For gridless: draw circle
 */
function drawReachArea(state: MeleeTargetingState): void {
  const grid = canvas.grid;
  if (!grid) return;

  const attackerId = state.attackerToken?.document?.id ?? state.attackerToken?.id;
  if (!attackerId) return;

  const RANGE = gridStepsFromMeters(state.reachMeters);

  // Hex / square grids → highlight layer (v13 interface)
  if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
    highlightHexesInRange(attackerId, RANGE, state.highlightId, 0xff6666, 0.5);
  } else {
    // Gridless: draw circle with PIXI.Graphics
    // This would need to be stored in state.previewGraphics for cleanup
    // For now, we'll just use hex highlighting for gridded maps
  }
}

/**
 * Create a red ring around a token (non-interactive visual)
 */
function createTargetRing(token: any): PIXI.Graphics {
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
function createTargetOverlay(
  token: any,
  tokenId: string,
  onClick: (tokenId: string) => void
): PIXI.Container {
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

  hit.on("pointerdown", (ev: PIXI.FederatedPointerEvent) => {
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

  (overlay as any).targetTokenId = tokenId;
  return overlay;
}


/**
 * Mark valid targets with rings and overlays
 */
function markValidTargets(state: MeleeTargetingState): void {
  // Clear existing visuals
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

  // Handler for overlay clicks
  const handleOverlayClick = (targetId: string) => {
    if (confirming) return;
    const targetToken = canvas.tokens?.get(targetId);
    if (!targetToken) return;

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
    } catch (err) {
      console.error("Mastery System | [MELEE TARGETING] Overlay click failed", err);
      ui.notifications?.error?.("Failed to select target");
      endMeleeTargeting(false);
    } finally {
      confirming = false;
    }
  };

  for (const targetId of state.validTargetIds) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;
  
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
function restoreTargetVisuals(state: MeleeTargetingState): void {
  for (const [targetId, alpha] of state.originalTokenAlphas.entries()) {
    const token = canvas.tokens?.get(targetId);
    if (!token) continue;
    token.alpha = alpha;
  }
  state.originalTokenAlphas.clear();
}

/* -------------------------------------------- */
/*  Click Detection                             */
/* -------------------------------------------- */

/* -------------------------------------------- */
/*  Input Handlers                               */
/* -------------------------------------------- */

function onKeyDown(ev: KeyboardEvent): void {
  if (ev.key === "Escape") {
    endMeleeTargeting(false);
  }
}

function onPointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = active;
  if (!state) return;

  // Right/middle click cancels
  if (ev.button !== 0) {
    endMeleeTargeting(false);
    return;
  }

  // Ignore if already confirming
  if (confirming) return;

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
  const clicked = pickTokenFromPointerEvent(
    ev,
    {
      excludeIds: state.attackerToken?.id ? [state.attackerToken.id] : [],
      onlyIds: state.validTargetIds,
      centerPadPx: 15,
    },
    debug,
  );
  console.log('[MS NPC Targeting] MELEE pointerdown', {
    chosen: clicked ? `${clicked.name} (${clicked.id})` : null,
    pick: debug,
    validCount: state.validTargetIds.size,
  });

  if (clicked && clicked.id !== state.attackerToken.id && state.validTargetIds.has(clicked.id)) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    confirming = true;
    try {
      Hooks.call("masterySystem.meleeTargetSelected", {
        attackerTokenId: state.attackerToken.id,
        targetTokenId: clicked.id,
        option: state.option
      });
      endMeleeTargeting(true);
    } catch (err) {
      console.error("Mastery System | [MELEE TARGETING] Token click failed", err);
      ui.notifications?.error?.("Failed to select target");
      endMeleeTargeting(false);
    } finally {
      confirming = false;
    }
    return;
  }

  // Capture miss must not cancel when the click is on a token (overlays still fire).
  if (!clicked) {
    if (pointerEventIsOnToken(ev)) {
      console.log('[MS NPC Targeting] MELEE pick miss on token — deferring to overlay');
      return;
    }
    endMeleeTargeting(false);
  }
}

/* -------------------------------------------- */
/*  Public API                                   */
/* -------------------------------------------- */

export function startMeleeTargeting(attackerToken: any, option: RadialCombatOption): void {
  endMeleeTargeting(false);

  attackerToken?.control?.({ releaseOthers: false });

  const reachMeters = getMeleeReachMeters(option);

  const state: MeleeTargetingState = {
    attackerToken,
    option,
    reachMeters,
    reachGridUnits: gridStepsFromMeters(reachMeters),
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

  ui.notifications?.info?.(
    state.validTargetIds.size
      ? `Melee targeting: ${reachMeters}m. Click an enemy in range.`
      : `Melee targeting: ${reachMeters}m. No targets in range.`
  );
  if (state.validTargetIds.size === 0) {
    console.warn("Mastery System | [RADIAL FLOW] melee targeting: zero valid targets in reach — click empty map or Esc to cancel (no action spent until you confirm a target)");
  }
}

export function endMeleeTargeting(success: boolean): void {
  const state = active;
  if (!state) return;

  // Remove event handlers
  canvas.stage.off("pointerdown", state.onPointerDown, true);
  window.removeEventListener("keydown", state.onKeyDown);

  // Clear reach highlight
  clearHexHighlight(state.highlightId);

  // Remove rings
  for (const ring of state.rings.values()) {
    if (ring.parent) ring.parent.removeChild(ring);
    ring.destroy(true);
  }
  state.rings.clear();

  // Remove overlays
  for (const overlay of state.overlays.values()) {
    if (overlay.parent) overlay.parent.removeChild(overlay);
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
}

export function isMeleeTargetingActive(): boolean {
  return !!active;
}
