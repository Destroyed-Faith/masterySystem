/**
 * Forced movement targeting — Push (away from source) / Pull (toward source).
 *
 * Highlights only legal destination cells within N m of the moved token:
 *   Push → farther from the reference token than the current cell
 *   Pull → closer to the reference token than the current cell
 *
 * Click a highlighted cell to move; Escape / right-click skips (damage already applied).
 */

import {
  clearHexHighlight,
  collectHexKeysInRangeForToken,
} from '../utils/hex-highlighting.js';
import {
  gridStepsBetweenCenters,
  gridStepsFromMeters,
  measureSceneDistanceBetweenPoints,
  metersToSceneDistance,
} from '../utils/grid-range.js';
import { eventWorldPoint, resolveOverlayContainer, snapWorldTopLeft } from '../utils/grid-snap.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';

export type ForcedMoveMode = 'push' | 'pull';

export interface ForcedMoveRequest {
  /** Token that is relocated. */
  movedToken: any;
  /** Source of the force (defender for Counter Damage Push). */
  referenceToken: any;
  meters: number;
  mode: ForcedMoveMode;
  label?: string;
}

export type ForcedMoveOutcome = 'moved' | 'skipped' | 'unavailable';

type ForcedMoveState = {
  movedToken: any;
  referenceToken: any;
  meters: number;
  maxSteps: number;
  mode: ForcedMoveMode;
  label: string;
  originCenter: { x: number; y: number };
  refCenter: { x: number; y: number };
  originDistSteps: number | null;
  originDistScene: number;
  legalKeys: Set<string>;
  blockedKeys: Set<string>;
  originalAlpha: number;
  previewGraphics: any;
  highlightIdRange: string;
  highlightIdHover: string;
  onMove: (ev: any) => void;
  onDown: (ev: any) => void;
  onKeyDown: (ev: KeyboardEvent) => void;
  resolve: (outcome: ForcedMoveOutcome) => void;
};

let active: ForcedMoveState | null = null;

/** Pure distance rule: Push only farther, Pull only closer. Equal distance is illegal. */
export function isForcedMoveDistanceLegal(
  mode: ForcedMoveMode,
  originDist: number,
  destDist: number,
): boolean {
  if (!Number.isFinite(originDist) || !Number.isFinite(destDist)) return false;
  if (mode === 'push') return destDist > originDist + 1e-6;
  return destDist < originDist - 1e-6;
}

/** Read Push/Pull metres from a power item (levels / specials objects / "push(2)" strings). */
export function readPushPullMetersFromPower(power: any): { push: number; pull: number } {
  let push = 0;
  let pull = 0;
  const consider = (list: any) => {
    if (!Array.isArray(list)) return;
    for (const entry of list) {
      if (typeof entry === 'string') {
        const m = entry.trim().match(/^(push|pull)\s*\(\s*(\d+)\s*\)$/i);
        if (!m) continue;
        const n = Math.max(0, Math.floor(Number(m[2]) || 0));
        if (m[1].toLowerCase() === 'push') push = Math.max(push, n);
        else pull = Math.max(pull, n);
        continue;
      }
      const key = String(entry?.key || entry?.id || '').toLowerCase();
      const n = Math.max(0, Math.floor(Number(entry?.rank ?? entry?.value) || 0));
      if (key === 'push') push = Math.max(push, n);
      if (key === 'pull') pull = Math.max(pull, n);
    }
  };

  const sys = power?.system ?? {};
  consider(sys.specials);
  consider(sys.levelData?.specials);
  consider((power as any)?.specials);

  const rank = Math.max(1, Math.floor(Number(sys.rank ?? sys.level) || 1));
  const levels = sys.levels;
  if (levels && typeof levels === 'object') {
    consider(levels[String(rank)]?.specials);
    consider(levels[rank]?.specials);
  }

  return { push, pull };
}

function tokenCenter(token: any): { x: number; y: number } {
  return token?.center || { x: Number(token?.x) || 0, y: Number(token?.y) || 0 };
}

function tokenCenterFromTopLeft(token: any, tl: { x: number; y: number }): { x: number; y: number } {
  const w = Number(token.w) || 0;
  const h = Number(token.h) || 0;
  return { x: tl.x + w / 2, y: tl.y + h / 2 };
}

function hexKeyAtCenter(center: { x: number; y: number }): string | null {
  const grid: any = (globalThis as any).canvas?.grid;
  if (!grid?.getOffset) return null;
  const o = grid.getOffset(center);
  if (o?.i === undefined || o?.j === undefined) return null;
  return `${o.i},${o.j}`;
}

function hexKeyUnderTokenAtTopLeft(token: any, topLeft: { x: number; y: number }): string | null {
  return hexKeyAtCenter(tokenCenterFromTopLeft(token, topLeft));
}

function collectBlockedHexKeys(movingToken: any): Set<string> {
  const keys = new Set<string>();
  const grid: any = (globalThis as any).canvas?.grid;
  const placeables = (globalThis as any).canvas?.tokens?.placeables ?? [];
  if (!grid?.getOffset) return keys;
  const myId = movingToken?.id;
  for (const t of placeables) {
    if (!t || t.id === myId) continue;
    if (!t.actor) continue;
    const o = grid.getOffset(t.center);
    if (o?.i !== undefined && o?.j !== undefined) keys.add(`${o.i},${o.j}`);
  }
  return keys;
}

function cellCenterFromKey(key: string): { x: number; y: number } | null {
  const grid: any = (globalThis as any).canvas?.grid;
  if (!grid) return null;
  const parts = key.split(',');
  const i = Number(parts[0]);
  const j = Number(parts[1]);
  if (!Number.isFinite(i) || !Number.isFinite(j)) return null;
  if (typeof grid.getCenterPoint === 'function') {
    try {
      const c = grid.getCenterPoint({ i, j });
      if (c && Number.isFinite(c.x) && Number.isFinite(c.y)) return { x: c.x, y: c.y };
    } catch {
      /* fall through */
    }
  }
  const tl = grid.getTopLeftPoint?.({ i, j });
  if (!tl) return null;
  const size = Number(grid.size) || 100;
  return { x: tl.x + size / 2, y: tl.y + size / 2 };
}

/**
 * Build the set of legal destination hex keys for Push/Pull.
 * Exported for tests when a fake grid is injected via params.
 */
export function filterLegalForcedMoveKeys(params: {
  mode: ForcedMoveMode;
  candidateKeys: Iterable<string>;
  blockedKeys: Set<string>;
  originDistSteps: number;
  /** Map key → distance-in-steps from the reference token. */
  distFromRefSteps: (key: string) => number | null;
}): Set<string> {
  const legal = new Set<string>();
  for (const key of params.candidateKeys) {
    if (params.blockedKeys.has(key)) continue;
    const d = params.distFromRefSteps(key);
    if (d == null) continue;
    if (isForcedMoveDistanceLegal(params.mode, params.originDistSteps, d)) {
      legal.add(key);
    }
  }
  return legal;
}

function paintLegalKeys(state: ForcedMoveState): void {
  const g = globalThis as any;
  const grid: any = g.canvas?.grid;
  const gridUI: any = g.canvas?.interface?.grid;
  if (!grid || !gridUI || grid.type === g.CONST?.GRID_TYPES?.GRIDLESS) return;

  gridUI.addHighlightLayer?.(state.highlightIdRange);
  gridUI.clearHighlightLayer?.(state.highlightIdRange);

  const color = state.mode === 'push' ? 0x44aaff : 0xaa66ff;
  for (const key of state.legalKeys) {
    const parts = key.split(',');
    const i = Number(parts[0]);
    const j = Number(parts[1]);
    if (!Number.isFinite(i) || !Number.isFinite(j)) continue;
    const tl = grid.getTopLeftPoint({ i, j });
    if (!tl) continue;
    gridUI.highlightPosition?.(state.highlightIdRange, {
      x: tl.x,
      y: tl.y,
      color,
      alpha: 0.4,
    });
  }
}

function refreshHover(state: ForcedMoveState, destTL: { x: number; y: number }): void {
  const g = globalThis as any;
  const grid: any = g.canvas?.grid;
  const gridUI: any = g.canvas?.interface?.grid;
  if (state.previewGraphics) state.previewGraphics.clear();

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
            color: isValid ? 0x66dd66 : 0xff4444,
            alpha: 0.45,
          });
        }
      }
    }
  } else {
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

function drawPreviewLine(
  state: ForcedMoveState,
  destCenter: { x: number; y: number },
  isValid: boolean,
): void {
  if (!state.previewGraphics) return;
  const cellSize = Number((globalThis as any).canvas?.grid?.size) || 100;
  const lineColor = isValid ? 0x66ff99 : 0xff6666;
  state.previewGraphics.lineStyle(3, lineColor, 0.88);
  state.previewGraphics.moveTo(state.originCenter.x, state.originCenter.y);
  state.previewGraphics.lineTo(destCenter.x, destCenter.y);
  // Reference marker
  state.previewGraphics.lineStyle(2, 0xffcc44, 0.9);
  state.previewGraphics.beginFill(0xffcc44, 0.25);
  state.previewGraphics.drawCircle(state.refCenter.x, state.refCenter.y, cellSize * 0.22);
  state.previewGraphics.endFill();
  state.previewGraphics.lineStyle(2, lineColor, 0.9);
  state.previewGraphics.beginFill(lineColor, 0.26);
  state.previewGraphics.drawCircle(destCenter.x, destCenter.y, cellSize * 0.26);
  state.previewGraphics.endFill();
}

function endForcedMovement(outcome: ForcedMoveOutcome): void {
  const state = active;
  if (!state) return;
  active = null;

  const canvas = (globalThis as any).canvas;
  try {
    canvas?.stage?.off?.('pointermove', state.onMove);
    canvas?.stage?.off?.('pointerdown', state.onDown);
  } catch {
    /* ignore */
  }
  window.removeEventListener('keydown', state.onKeyDown);

  try {
    clearHexHighlight(state.highlightIdRange);
    clearHexHighlight(state.highlightIdHover);
  } catch {
    /* ignore */
  }

  if (state.previewGraphics?.parent) {
    state.previewGraphics.parent.removeChild(state.previewGraphics);
    state.previewGraphics.clear();
  }
  try {
    state.movedToken.alpha = state.originalAlpha;
  } catch {
    /* ignore */
  }

  state.resolve(outcome);
}

async function commitForcedMove(state: ForcedMoveState, destTL: { x: number; y: number }): Promise<void> {
  const g = globalThis as any;
  const grid: any = g.canvas?.grid;
  const gridless = !grid || grid.type === g.CONST?.GRID_TYPES?.GRIDLESS;
  const destCenter = tokenCenterFromTopLeft(state.movedToken, destTL);

  if (!gridless) {
    const destKey = hexKeyUnderTokenAtTopLeft(state.movedToken, destTL);
    if (!destKey || !state.legalKeys.has(destKey)) {
      g.ui?.notifications?.warn?.(
        state.mode === 'push'
          ? 'Push: choose a highlighted cell farther from the source.'
          : 'Pull: choose a highlighted cell closer to the source.',
      );
      return;
    }
  } else {
    const moveDist = measureSceneDistanceBetweenPoints(state.originCenter, destCenter);
    const maxScene = metersToSceneDistance(state.meters);
    const destRef = measureSceneDistanceBetweenPoints(state.refCenter, destCenter);
    if (
      moveDist > maxScene + 0.01 ||
      !isForcedMoveDistanceLegal(state.mode, state.originDistScene, destRef)
    ) {
      g.ui?.notifications?.warn?.('Destination is not a legal Push/Pull cell.');
      return;
    }
  }

  try {
    await state.movedToken.document.update({ x: destTL.x, y: destTL.y }, { animate: true });
    const dir = state.mode === 'push' ? 'away from' : 'toward';
    g.ui?.notifications?.info?.(
      `${state.label}: moved ${String(state.movedToken.name)} ${state.meters} m ${dir} ${String(state.referenceToken.name)}.`,
    );
    endForcedMovement('moved');
  } catch (err) {
    console.warn('Mastery System | Forced movement update failed', err);
    g.ui?.notifications?.error?.('Failed to move token.');
    endForcedMovement('skipped');
  }
}

/**
 * Interactive Push/Pull placement. Resolves when the token is moved or the mode is cancelled.
 */
export function startForcedMovementMode(req: ForcedMoveRequest): Promise<ForcedMoveOutcome> {
  return new Promise((resolve) => {
    const g = globalThis as any;
    if (active) endForcedMovement('skipped');

    const moved = req.movedToken;
    const reference = req.referenceToken;
    const meters = Math.max(0, Math.floor(Number(req.meters) || 0));
    if (!moved || !reference || meters <= 0) {
      resolve('unavailable');
      return;
    }
    if (!g.canvas?.grid || !g.canvas?.stage) {
      g.ui?.notifications?.warn?.(
        `${req.mode === 'push' ? 'Push' : 'Pull'} ${meters} m — move ${String(moved.name)} manually (${req.mode === 'push' ? 'away from' : 'toward'} ${String(reference.name)}).`,
      );
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
    if (refKey) blockedKeys.add(refKey);

    const candidates = collectHexKeysInRangeForToken(moved.id, maxSteps) ?? new Set<string>();
    const legalKeys = filterLegalForcedMoveKeys({
      mode: req.mode,
      candidateKeys: candidates,
      blockedKeys,
      originDistSteps: originDistSteps ?? 0,
      distFromRefSteps: (key) => {
        const c = cellCenterFromKey(key);
        if (!c) return null;
        // Cap search generously so Pull/Push cells past current ring still measure.
        return gridStepsBetweenCenters(refCenter, c, Math.max(64, maxSteps + (originDistSteps ?? 0) + 8));
      },
    });

    if (legalKeys.size === 0 && g.canvas.grid.type !== g.CONST?.GRID_TYPES?.GRIDLESS) {
      g.ui?.notifications?.info?.(
        `${req.mode === 'push' ? 'Push' : 'Pull'} ${meters} m: no legal cell (blocked or no farther/closer space). Damage still applies.`,
      );
      resolve('unavailable');
      return;
    }

    const highlightIdRange = `mastery-forced-${req.mode}-range`;
    const highlightIdHover = `mastery-forced-${req.mode}-hover`;
    const originalAlpha = moved.alpha;
    try {
      moved.alpha = 0.65;
      moved.control?.({ releaseOthers: false });
    } catch {
      /* ignore */
    }

    let previewGraphics: any = { clear() {}, parent: null };
    try {
      const PIXI = g.PIXI;
      if (PIXI?.Graphics) {
        previewGraphics = new PIXI.Graphics();
        const overlay = resolveOverlayContainer();
        overlay?.addChild?.(previewGraphics);
      }
    } catch {
      previewGraphics = { clear() {}, parent: null };
    }

    const label =
      req.label ||
      (req.mode === 'push' ? `Push ${meters} m` : `Pull ${meters} m`);

    const onMove = (ev: any) => {
      if (!active) return;
      const world = eventWorldPoint(ev);
      const snapped = snapWorldTopLeft(world.x, world.y);
      refreshHover(active, snapped);
    };
    const onDown = (ev: any) => {
      if (!active) return;
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
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && active) {
        g.ui?.notifications?.info?.(`${active.label}: skipped.`);
        endForcedMovement('skipped');
      }
    };

    const state: ForcedMoveState = {
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
    g.ui?.notifications?.info?.(
      `${label}: click a highlighted cell ${dir} ${String(reference.name)} (Esc/RMB = skip).`,
    );
    refreshHover(state, { x: Number(moved.x) || 0, y: Number(moved.y) || 0 });
  });
}

/**
 * Resolve actor tokens and start Push and/or Pull (Push first if both).
 */
export async function offerForcedMovementFromActors(params: {
  movedActor: Actor | null | undefined;
  referenceActor: Actor | null | undefined;
  pushM?: number;
  pullM?: number;
  labelPrefix?: string;
}): Promise<ForcedMoveOutcome[]> {
  const outcomes: ForcedMoveOutcome[] = [];
  const movedTok = params.movedActor ? getPrimaryTokenForActor(params.movedActor as any) : null;
  const refTok = params.referenceActor ? getPrimaryTokenForActor(params.referenceActor as any) : null;
  if (!movedTok || !refTok) {
    const g = globalThis as any;
    const pushM = Math.max(0, Math.floor(Number(params.pushM) || 0));
    const pullM = Math.max(0, Math.floor(Number(params.pullM) || 0));
    if (pushM > 0 || pullM > 0) {
      g.ui?.notifications?.warn?.(
        `Forced move: could not resolve tokens — move manually (Push ${pushM} m / Pull ${pullM} m).`,
      );
    }
    return ['unavailable'];
  }

  const pushM = Math.max(0, Math.floor(Number(params.pushM) || 0));
  const pullM = Math.max(0, Math.floor(Number(params.pullM) || 0));
  const prefix = params.labelPrefix ? `${params.labelPrefix} — ` : '';

  if (pushM > 0) {
    outcomes.push(
      await startForcedMovementMode({
        movedToken: movedTok,
        referenceToken: refTok,
        meters: pushM,
        mode: 'push',
        label: `${prefix}Push ${pushM} m`,
      }),
    );
  }
  if (pullM > 0) {
    outcomes.push(
      await startForcedMovementMode({
        movedToken: movedTok,
        referenceToken: refTok,
        meters: pullM,
        mode: 'pull',
        label: `${prefix}Pull ${pullM} m`,
      }),
    );
  }
  return outcomes;
}
