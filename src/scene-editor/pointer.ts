/**
 * One set of canvas listeners for the editor session. Always torn down on
 * deactivate or canvas tear-down so nothing leaks into the next scene.
 */

import type { SceneEditorController } from './controller.js';

export class SceneEditorPointer {
  private bound = false;
  private onMove = (ev: PointerEvent) => this.controller.onPointerMove(ev);
  private onDown = (ev: PointerEvent) => {
    void this.controller.onPointerDown(ev);
  };
  private onUp = (ev: PointerEvent) => {
    void this.controller.onPointerUp(ev);
  };
  private onDbl = () => {
    void this.controller.onDoubleClick();
  };
  private onKey = (ev: KeyboardEvent) => this.controller.onKey(ev);
  private onKeyUp = (ev: KeyboardEvent) => this.controller.onKeyUp(ev);

  constructor(private readonly controller: SceneEditorController) {}

  bind(): void {
    this.unbind();
    const canvas = (globalThis as any).canvas;
    const el: HTMLElement | null = canvas?.app?.view ?? canvas?.element ?? document.getElementById('board');
    if (!el) return;
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerdown', this.onDown, true);
    window.addEventListener('pointerup', this.onUp);
    el.addEventListener('dblclick', this.onDbl);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    this.bound = true;
  }

  unbind(): void {
    if (!this.bound) return;
    const canvas = (globalThis as any).canvas;
    const el: HTMLElement | null = canvas?.app?.view ?? canvas?.element ?? document.getElementById('board');
    el?.removeEventListener('pointermove', this.onMove);
    el?.removeEventListener('pointerdown', this.onDown, true);
    window.removeEventListener('pointerup', this.onUp);
    el?.removeEventListener('dblclick', this.onDbl);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
    this.bound = false;
  }
}
