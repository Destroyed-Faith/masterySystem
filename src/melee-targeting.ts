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
  // Use option.range if available (new unified range system)
  if (option.range !== undefined) {
    console.log('Mastery System | [MELEE TARGETING] Using option.range:', option.range, {
      optionId: option.id,
      optionName: option.name,
      slot: option.slot,
      source: option.source
    });
    return option.range;
  }
  
  // Fallback to meleeReachMeters if set (legacy support)
  if (option.meleeReachMeters !== undefined) {
    console.log('Mastery System | [MELEE TARGETING] Using option.meleeReachMeters (legacy):', option.meleeReachMeters);
    return option.meleeReachMeters;
  }
  
  // Default fallback
  console.warn('Mastery System | [MELEE TARGETING] No range found, using default 2m', {
    optionId: option.id,
    optionName: option.name,
    hasRange: option.range !== undefined,
    hasMeleeReachMeters: option.meleeReachMeters !== undefined
  });
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
  console.log('Mastery System | [MELEE TARGETING] startMeleeTargeting called', {
    tokenId: token?.id,
    tokenName: token?.name,
    optionId: option.id,
    optionName: option.name,
    optionRange: option.range,
    optionMeleeReachMeters: option.meleeReachMeters,
    slot: option.slot,
    source: option.source
  });
  
  endMeleeTargeting(false);

  token.control({ releaseOthers: false });

  const reachMeters = getMeleeReachMeters(option);
  const reachGridUnits = metersToGridUnits(reachMeters);
  
  console.log('Mastery System | [MELEE TARGETING] Calculated reach', {
    reachMeters,
    reachGridUnits,
    gridDistance: canvas.grid?.distance,
    gridType: canvas.grid?.type
  });

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
  if (!state) {
    console.log('Mastery System | [MELEE TARGETING] handlePointerDown: No active targeting state');
    return;
  }

  console.log('Mastery System | [MELEE TARGETING] handlePointerDown', {
    button: ev.button,
    targetType: ev.target?.constructor?.name,
    targetDocumentType: (ev.target as any)?.document?.type,
    targetId: (ev.target as any)?.id,
    stateTokenId: state.token?.document?.id
  });

  if (ev.button !== 0) {
    console.log('Mastery System | [MELEE TARGETING] Non-left click, cancelling');
    endMeleeTargeting(false);
    return;
  }

  const target = ev.target as any;
  if (!target?.document || target.document.type !== "Token") {
    console.log('Mastery System | [MELEE TARGETING] Clicked on non-token, cancelling', {
      hasTarget: !!target,
      hasDocument: !!target?.document,
      documentType: target?.document?.type
    });
    endMeleeTargeting(false);
    return;
  }

  if (target.id === state.token.document?.id) {
    console.log('Mastery System | [MELEE TARGETING] Clicked on own token, ignoring');
    return;
  }

  console.log('Mastery System | [MELEE TARGETING] Valid target clicked', {
    targetId: target.id,
    targetName: target.document?.name,
    attackerId: state.token.document?.id,
    attackerName: state.token.document?.name,
    reachMeters: state.reachMeters,
    reachGridUnits: state.reachGridUnits
  });

  // TODO: validate target distance / hostility here if needed

  ev.stopPropagation();
  ev.stopImmediatePropagation();

  endMeleeTargeting(true);
}

export function isMeleeTargetingActive(): boolean {
  return activeMeleeTargeting !== null;
}
