/**
 * Melee Targeting – Foundry VTT v13
 * Clean, deterministic, hex-safe implementation
 */

import type { RadialCombatOption } from "./token-radial-menu";
import { highlightHexesInRange, clearHexHighlight } from "./utils/hex-highlighting";

interface MeleeTargetingState {
  token: any;
  option: RadialCombatOption;
  reachMeters: number;
  reachGridUnits: number;
  highlightId: string;
  previewGraphics: PIXI.Graphics | null;
  originalTokenAlphas: Map<any, number>;
  onPointerDown: (ev: PIXI.FederatedPointerEvent) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
}

let activeMeleeTargeting: MeleeTargetingState | null = null;

/* -------------------------------------------- */
/*  Utilities                                   */
/* -------------------------------------------- */

function metersToGridUnits(meters: number): number {
  const d = canvas.grid?.distance ?? 1;
  return meters / d;
}

function getMeleeReachMeters(option: RadialCombatOption): number {
  if (option.meleeReachMeters !== undefined) return option.meleeReachMeters;
  return 2; // default melee reach
}

/* -------------------------------------------- */
/*  Highlight Reach Area                        */
/* -------------------------------------------- */

function highlightReachArea(state: MeleeTargetingState): void {
  const grid = canvas.grid;
  if (!grid) return;

  const RANGE = Math.max(0, Math.floor(state.reachGridUnits));
  const tokenId = state.token?.document?.id;
  if (!tokenId) return;

  // HEX GRID → Grid Highlight Layer ONLY
  if (grid.type !== CONST.GRID_TYPES.GRIDLESS) {
    highlightHexesInRange(
      tokenId,
      RANGE,
      state.highlightId,
      0xff6666,
      0.5
    );
    return;
  }

  // GRIDLESS fallback → previewGraphics
  if (!state.previewGraphics) return;

  state.previewGraphics.clear();
  const c = state.token.center;
  const radiusPx = RANGE * (grid.size || 100);

  state.previewGraphics.lineStyle(3, 0xff6666, 1);
  state.previewGraphics.beginFill(0xff6666, 0.25);
  state.previewGraphics.drawCircle(0, 0, radiusPx);
  state.previewGraphics.endFill();
  state.previewGraphics.position.set(c.x, c.y);
  state.previewGraphics.visible = true;
}

/* -------------------------------------------- */
/*  Start / End Targeting                       */
/* -------------------------------------------- */

export function startMeleeTargeting(token: any, option: RadialCombatOption): void {
  endMeleeTargeting(false);

  token.control({ releaseOthers: false });

  const reachMeters = getMeleeReachMeters(option);
  const reachGridUnits = metersToGridUnits(reachMeters);

  const previewGraphics =
    canvas.grid?.type === CONST.GRID_TYPES.GRIDLESS
      ? new PIXI.Graphics()
      : null;

  if (previewGraphics) {
    canvas.stage.addChild(previewGraphics);
  }

  const state: MeleeTargetingState = {
    token,
    option,
    reachMeters,
    reachGridUnits,
    highlightId: "mastery-melee",
    previewGraphics,
    originalTokenAlphas: new Map(),
    onPointerDown: handlePointerDown,
    onKeyDown: handleKeyDown
  };

  activeMeleeTargeting = state;

  canvas.stage.on("pointerdown", state.onPointerDown, true);
  window.addEventListener("keydown", state.onKeyDown);

  highlightReachArea(state);
}

export function endMeleeTargeting(success: boolean): void {
  const state = activeMeleeTargeting;
  if (!state) return;

  canvas.stage.off("pointerdown", state.onPointerDown, true);
  window.removeEventListener("keydown", state.onKeyDown);

  // CLEAR GRID HIGHLIGHT (IMPORTANT)
  clearHexHighlight(state.highlightId);

  // Clear preview graphics
  if (state.previewGraphics) {
    state.previewGraphics.destroy(true);
  }

  // Restore target visuals
  for (const [token, alpha] of state.originalTokenAlphas) {
    token.alpha = alpha;
    if ((token as any).msOriginalTint !== undefined) {
      token.tint = (token as any).msOriginalTint;
      delete (token as any).msOriginalTint;
    }
  }

  activeMeleeTargeting = null;

  if (!success) {
    ui.notifications?.info("Melee targeting cancelled");
  }
}

/* -------------------------------------------- */
/*  Input Handling                              */
/* -------------------------------------------- */

function handleKeyDown(ev: KeyboardEvent): void {
  if (ev.key === "Escape") {
    endMeleeTargeting(false);
  }
}

function handlePointerDown(ev: PIXI.FederatedPointerEvent): void {
  const state = activeMeleeTargeting;
  if (!state) return;

  if (ev.button !== 0) {
    endMeleeTargeting(false);
    return;
  }

  const target = ev.target as any;
  if (!target?.document || target.document.type !== "Token") {
    endMeleeTargeting(false);
    return;
  }

  if (target.id === state.token.document?.id) return;

  // TODO: validate target distance / hostility here if needed

  ev.stopPropagation();
  ev.stopImmediatePropagation();

  endMeleeTargeting(true);
}

export function isMeleeTargetingActive(): boolean {
  return activeMeleeTargeting !== null;
}
