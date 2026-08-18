/**
 * PIXI overlay for suggestions, hints, handles and previews.
 * Native walls stay on Foundry's wall layer; we only draw editor chrome.
 */

import { SCENE_EDITOR_COLORS } from './colors.js';
import { distance, midpoint, rectFromPoints } from './geometry.js';
import type { AnalysisDebug, AnalysisLayerVisibility, EditorWallView, Hint, Point, Segment, Suggestion } from './types.js';

type Gfx = any;

export interface OverlayDrawState {
  walls: EditorWallView[];
  suggestions: Suggestion[];
  hints: Hint[];
  selectedIds: string[];
  selectedSuggestionIds: string[];
  selectedHintIds: string[];
  preview: Segment | null;
  snap: Point | null;
  hoverOpening: Segment | null;
  layers: AnalysisLayerVisibility;
  debug: AnalysisDebug | null;
  handleRadius: number;
}

export class SceneEditorOverlay {
  private root: any = null;
  private gfx: Gfx = null;
  private maskSprite: any = null;

  get attached(): boolean {
    return !!this.root;
  }

  attach(): void {
    this.detach();
    const PIXI = (globalThis as any).PIXI;
    const canvas = (globalThis as any).canvas;
    if (!PIXI || !canvas?.stage) return;
    this.root = new PIXI.Container();
    this.root.eventMode = 'none';
    this.root.zIndex = 800;
    this.gfx = new PIXI.Graphics();
    this.root.addChild(this.gfx);
    const parent = canvas.interface ?? canvas.stage;
    parent.addChild(this.root);
    if (typeof parent.sortChildren === 'function') parent.sortChildren();
  }

  detach(): void {
    this.clearMask();
    if (this.root?.parent) this.root.parent.removeChild(this.root);
    this.root?.destroy?.({ children: true });
    this.root = null;
    this.gfx = null;
  }

  private clearMask(): void {
    if (this.maskSprite?.parent) this.maskSprite.parent.removeChild(this.maskSprite);
    this.maskSprite?.destroy?.();
    this.maskSprite = null;
  }

  draw(state: OverlayDrawState): void {
    const g = this.gfx;
    if (!g || !this.root) return;
    g.clear();
    if (state.layers.mask && state.debug?.mask) this.drawMask(state);
    else this.clearMask();

    if (state.layers.lines && state.debug?.lines) {
      for (const line of state.debug.lines) this.stroke(g, line.a, line.b, 0x90a4ae, 1, [4, 4], 0.45);
    }
    if (state.layers.hints) {
      for (const hint of state.hints) this.drawHint(g, hint, state.selectedHintIds.includes(hint.id));
    }
    if (state.layers.suggestions) {
      for (const sug of state.suggestions) {
        if (sug.rejected) continue;
        const color = sug.uncertain
          ? SCENE_EDITOR_COLORS.uncertain
          : sug.kind === 'door'
            ? SCENE_EDITOR_COLORS.suggestionDoor
            : sug.kind === 'window'
              ? SCENE_EDITOR_COLORS.suggestionWindow
              : SCENE_EDITOR_COLORS.suggestionWall;
        this.stroke(g, sug.a, sug.b, color, 2, [8, 6], 0.85);
        if (state.selectedSuggestionIds.includes(sug.id)) {
          this.stroke(g, sug.a, sug.b, SCENE_EDITOR_COLORS.selected, 3, [8, 6], 1);
          this.handles(g, sug.a, sug.b, state.handleRadius);
        }
      }
    }
    if (state.layers.confirmed) {
      for (const wall of state.walls) {
        const selected = state.selectedIds.includes(wall.id);
        const color = selected
          ? SCENE_EDITOR_COLORS.selected
          : wall.kind === 'door'
            ? SCENE_EDITOR_COLORS.confirmedDoor
            : wall.kind === 'window'
              ? SCENE_EDITOR_COLORS.confirmedWindow
              : SCENE_EDITOR_COLORS.confirmedWall;
        const dash = wall.kind === 'window' ? [10, 4] : wall.kind === 'door' ? [2, 0] : [];
        this.stroke(g, wall.a, wall.b, color, selected ? 4 : 3, dash, 0.95);
        this.drawKindMark(g, wall);
        if (selected) this.handles(g, wall.a, wall.b, state.handleRadius);
      }
    }
    if (state.hoverOpening) {
      this.stroke(g, state.hoverOpening.a, state.hoverOpening.b, SCENE_EDITOR_COLORS.confirmedDoor, 5, [], 0.9);
    }
    if (state.preview) {
      this.stroke(g, state.preview.a, state.preview.b, SCENE_EDITOR_COLORS.preview, 2, [6, 4], 0.95);
    }
    if (state.snap) this.dot(g, state.snap, SCENE_EDITOR_COLORS.snap, 6);
  }

  private drawKindMark(g: Gfx, wall: EditorWallView): void {
    const mid = midpoint(wall.a, wall.b);
    if (wall.kind === 'door') {
      this.dot(g, mid, SCENE_EDITOR_COLORS.confirmedDoor, 5);
      if (wall.doorState === 'locked') this.dot(g, mid, 0x4a148c, 2);
      if (wall.doorState === 'open') this.dot(g, mid, 0xffffff, 2);
    } else if (wall.kind === 'window') {
      this.dot(g, mid, SCENE_EDITOR_COLORS.confirmedWindow, 4);
    }
  }

  private drawHint(g: Gfx, hint: Hint, selected: boolean): void {
    if (hint.kind === 'ignore') {
      const r = rectFromPoints(hint.a, hint.b);
      this.rect(g, r, SCENE_EDITOR_COLORS.hintIgnore, 0.18, selected);
      return;
    }
    const color =
      hint.kind === 'door'
        ? SCENE_EDITOR_COLORS.hintDoor
        : hint.kind === 'window'
          ? SCENE_EDITOR_COLORS.hintWindow
          : SCENE_EDITOR_COLORS.hintWall;
    this.stroke(g, hint.a, hint.b, color, selected ? 4 : 3, [3, 6], 0.8);
  }

  private drawMask(state: OverlayDrawState): void {
    const debug = state.debug;
    if (!debug?.mask) return;
    const canvas = (globalThis as any).canvas;
    const PIXI = (globalThis as any).PIXI;
    const origin = canvas?.dimensions;
    if (!origin || !PIXI) return;
    const off = document.createElement('canvas');
    off.width = debug.width;
    off.height = debug.height;
    const ctx = off.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(debug.width, debug.height);
    for (let i = 0; i < debug.mask.length; i += 1) {
      const on = debug.mask[i];
      img.data[i * 4] = 77;
      img.data[i * 4 + 1] = 208;
      img.data[i * 4 + 2] = 225;
      img.data[i * 4 + 3] = on ? 90 : 0;
    }
    ctx.putImageData(img, 0, 0);
    const tex = PIXI.Texture.from(off);
    if (!this.maskSprite) {
      this.maskSprite = new PIXI.Sprite(tex);
      this.root.addChildAt(this.maskSprite, 0);
    } else {
      this.maskSprite.texture = tex;
    }
    this.maskSprite.x = Number(origin.sceneX) || 0;
    this.maskSprite.y = Number(origin.sceneY) || 0;
    this.maskSprite.width = Number(origin.sceneWidth) || debug.width;
    this.maskSprite.height = Number(origin.sceneHeight) || debug.height;
  }

  private stroke(g: Gfx, a: Point, b: Point, color: number, width: number, dash: number[], alpha: number): void {
    if (typeof g.setStrokeStyle === 'function') {
      g.setStrokeStyle({ width, color, alpha, cap: 'round' });
      if (dash.length && typeof g.setDash === 'function') g.setDash(dash);
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
      if (typeof g.setDash === 'function') g.setDash([]);
      return;
    }
    g.lineStyle(width, color, alpha);
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
  }

  private handles(g: Gfx, a: Point, b: Point, r: number): void {
    this.dot(g, a, SCENE_EDITOR_COLORS.handle, r);
    this.dot(g, b, SCENE_EDITOR_COLORS.handle, r);
  }

  private dot(g: Gfx, p: Point, color: number, r: number): void {
    if (typeof g.circle === 'function' && typeof g.fill === 'function') {
      g.circle(p.x, p.y, r);
      g.fill({ color, alpha: 1 });
      return;
    }
    g.beginFill(color, 1);
    g.drawCircle(p.x, p.y, r);
    g.endFill();
  }

  private rect(
    g: Gfx,
    r: { x: number; y: number; width: number; height: number },
    color: number,
    alpha: number,
    selected: boolean,
  ): void {
    if (typeof g.rect === 'function') {
      g.rect(r.x, r.y, r.width, r.height);
      g.fill({ color, alpha });
      g.setStrokeStyle?.({ width: selected ? 3 : 1, color, alpha: 0.9 });
      g.stroke?.();
      return;
    }
    g.beginFill(color, alpha);
    g.lineStyle(selected ? 3 : 1, color, 0.9);
    g.drawRect(r.x, r.y, r.width, r.height);
    g.endFill();
  }
}

export function screenHandleRadius(): number {
  const scale = Number((globalThis as any).canvas?.stage?.scale?.x) || 1;
  return Math.max(6, 10 / Math.max(0.25, scale));
}

export function worldFromEvent(event: PointerEvent | MouseEvent): Point | null {
  const canvas = (globalThis as any).canvas;
  const PIXI = (globalThis as any).PIXI;
  if (!canvas?.stage) return null;
  const global = new PIXI.Point(event.clientX, event.clientY);
  if (typeof canvas.stage.toLocal === 'function') {
    const local = canvas.stage.toLocal(global);
    return { x: local.x, y: local.y };
  }
  return null;
}

export function hitHandle(p: Point, a: Point, b: Point, radius: number): 'a' | 'b' | null {
  if (distance(p, a) <= radius * 1.4) return 'a';
  if (distance(p, b) <= radius * 1.4) return 'b';
  return null;
}
