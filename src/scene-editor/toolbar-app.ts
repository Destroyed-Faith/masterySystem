/**
 * Compact GM toolbar for the scene editor. Frameless ApplicationV2, like the
 * combat carousel — CSS places it, Foundry does not own a window chrome.
 */

import type { SceneEditorController } from './controller.js';
import { t } from './i18n.js';
import type { AnalysisLayerVisibility, EditorTool, SnapMode } from './types.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseToolbar = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const TOOLBAR_POS_KEY = 'mastery-system.sceneEditor.toolbarPos';

type ToolbarPos = { left: number; top: number };

function readToolbarPos(): ToolbarPos | null {
  try {
    const raw = localStorage.getItem(TOOLBAR_POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ToolbarPos>;
    const left = Number(parsed.left);
    const top = Number(parsed.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
    return { left, top };
  } catch {
    return null;
  }
}

function writeToolbarPos(pos: ToolbarPos): void {
  localStorage.setItem(TOOLBAR_POS_KEY, JSON.stringify(pos));
}

function clampToolbarPos(el: HTMLElement, left: number, top: number): ToolbarPos {
  const pad = 8;
  const w = el.offsetWidth || 240;
  const h = el.offsetHeight || 120;
  return {
    left: Math.max(pad, Math.min(left, window.innerWidth - w - pad)),
    top: Math.max(pad, Math.min(top, window.innerHeight - h - pad)),
  };
}

const TOOLS: Array<{ id: EditorTool; icon: string; labelKey: string; fallback: string }> = [
  { id: 'select', icon: 'fa-arrow-pointer', labelKey: 'toolSelect', fallback: 'Select' },
  { id: 'wall', icon: 'fa-minus', labelKey: 'toolWall', fallback: 'Wall' },
  { id: 'door', icon: 'fa-door-closed', labelKey: 'toolDoor', fallback: 'Door' },
  { id: 'window', icon: 'fa-window-maximize', labelKey: 'toolWindow', fallback: 'Window' },
  { id: 'hint', icon: 'fa-highlighter', labelKey: 'toolHint', fallback: 'Hint' },
  { id: 'ignore', icon: 'fa-eye-slash', labelKey: 'toolIgnore', fallback: 'Ignore' },
];

export class SceneEditorToolbarApp extends BaseToolbar {
  #pos: ToolbarPos | null = readToolbarPos();
  #dragging = false;

  constructor(private readonly editor: SceneEditorController) {
    super({});
  }

  static DEFAULT_OPTIONS = {
    id: 'mastery-scene-editor-toolbar',
    classes: ['mastery-system', 'scene-editor-toolbar'],
    position: { width: 'auto' },
    window: {
      title: 'Scene Editor',
      frame: false,
      positioned: false,
      resizable: false,
      minimizable: false,
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/scene-editor-toolbar.hbs' },
  };

  refresh(): void {
    if (this.#dragging) return;
    if ((this as any).rendered) void (this as any).render({ force: false });
  }

  protected async _prepareContext(): Promise<any> {
    const ed = this.editor;
    const wall = ed.selectedWall();
    const sug = ed.selectedSuggestion();
    return {
      tools: TOOLS.map((tool) => ({
        ...tool,
        label: t(tool.labelKey, tool.fallback),
        active: ed.tool === tool.id,
      })),
      snapModes: (['magnetic', 'grid', 'free'] as SnapMode[]).map((id) => ({
        id,
        label: t(`snap.${id}`, id),
        active: ed.snapMode === id,
      })),
      status: t(`status.${ed.status}`, ed.status),
      statusKey: ed.status,
      canUndo: ed.commands.canUndo,
      canRedo: ed.commands.canRedo,
      analyzing: ed.status === 'analyzing',
      layers: (Object.keys(ed.layers) as Array<keyof AnalysisLayerVisibility>).map((id) => ({
        id,
        label: t(`layer.${id}`, id),
        on: ed.layers[id],
      })),
      context: wall
        ? {
            show: true,
            isDoor: wall.kind === 'door',
            isWindow: wall.kind === 'window',
            isWall: wall.kind === 'wall',
            kind: wall.kind,
          }
        : { show: false },
      suggestion: sug
        ? {
            show: true,
            kind: sug.kind,
            confidence: Math.round(sug.confidence * 100),
            origin: sug.origin,
          }
        : { show: false },
    };
  }

  protected async _onRender(_context: any, _options: any): Promise<void> {
    const root = (this as any).element as HTMLElement;
    if (!root) return;
    this.#applySavedPosition(root);
    this.#bindDrag(root);
    root.querySelectorAll<HTMLElement>('[data-tool]').forEach((btn) => {
      btn.onclick = () => this.editor.setTool(btn.dataset.tool as EditorTool);
    });
    root.querySelectorAll<HTMLElement>('[data-snap]').forEach((btn) => {
      btn.onclick = () => this.editor.setSnap(btn.dataset.snap as SnapMode);
    });
    root.querySelectorAll<HTMLInputElement>('[data-layer]').forEach((input) => {
      input.onchange = () => {
        const key = input.dataset.layer as keyof AnalysisLayerVisibility;
        this.editor.setLayer(key, input.checked);
      };
    });
    this.bind(root, '.js-undo', () => this.editor.undo());
    this.bind(root, '.js-redo', () => this.editor.redo());
    this.bind(root, '.js-analyze', () => this.editor.analyze());
    this.bind(root, '.js-analyze-region', () => this.editor.setTool('region-analyze'));
    this.bind(root, '.js-cancel-analyze', () => this.editor.cancelAnalyze());
    this.bind(root, '.js-save', () => this.editor.saveNow());
    this.bind(root, '.js-export', () => this.editor.exportJson());
    this.bind(root, '.js-import', () => this.editor.importJson());
    this.bind(root, '.js-to-wall', () => this.editor.convertSelection('wall'));
    this.bind(root, '.js-to-door', () => this.editor.convertSelection('door'));
    this.bind(root, '.js-to-window', () => this.editor.convertSelection('window'));
    this.bind(root, '.js-door-open', () => this.editor.setDoorState('open'));
    this.bind(root, '.js-door-close', () => this.editor.setDoorState('closed'));
    this.bind(root, '.js-door-lock', () => this.editor.setDoorState('locked'));
    this.bind(root, '.js-delete', () => this.editor.deleteSelection());
    this.bind(root, '.js-advanced', () => this.editor.openAdvanced());
    this.bind(root, '.js-accept', () => {
      const id = this.editor.selectedSuggestionIds[0];
      if (id) void this.editor.acceptSuggestions([id]);
    });
    this.bind(root, '.js-reject', () => {
      const id = this.editor.selectedSuggestionIds[0];
      if (id) void this.editor.rejectSuggestions([id]);
    });
    this.bind(root, '.js-accept-all', () => this.editor.acceptAll());
  }

  #applySavedPosition(root: HTMLElement): void {
    if (!this.#pos) return;
    const pos = clampToolbarPos(root, this.#pos.left, this.#pos.top);
    this.#pos = pos;
    root.classList.add('is-placed');
    root.style.left = `${pos.left}px`;
    root.style.top = `${pos.top}px`;
    root.style.right = 'auto';
  }

  #bindDrag(root: HTMLElement): void {
    const handle = root.querySelector<HTMLElement>('.js-se-drag');
    if (!handle || (handle as any)._msSeDragBound) return;
    (handle as any)._msSeDragBound = true;

    let offsetX = 0;
    let offsetY = 0;

    const onMove = (ev: PointerEvent) => {
      if (!this.#dragging) return;
      this.#pos = clampToolbarPos(root, ev.clientX - offsetX, ev.clientY - offsetY);
      root.classList.add('is-placed');
      root.style.left = `${this.#pos.left}px`;
      root.style.top = `${this.#pos.top}px`;
      root.style.right = 'auto';
    };

    const onUp = (ev: PointerEvent) => {
      if (!this.#dragging) return;
      this.#dragging = false;
      handle.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (this.#pos) writeToolbarPos(this.#pos);
    };

    handle.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      const box = root.getBoundingClientRect();
      this.#dragging = true;
      offsetX = ev.clientX - box.left;
      offsetY = ev.clientY - box.top;
      handle.setPointerCapture?.(ev.pointerId);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });

    handle.addEventListener('dblclick', (ev) => {
      ev.preventDefault();
      this.#pos = null;
      localStorage.removeItem(TOOLBAR_POS_KEY);
      root.classList.remove('is-placed');
      root.style.left = '';
      root.style.top = '';
      root.style.right = '';
    });
  }

  private bind(root: HTMLElement, sel: string, fn: () => unknown): void {
    const el = root.querySelector<HTMLElement>(sel);
    if (el) el.onclick = (ev) => {
      ev.preventDefault();
      void fn();
    };
  }
}
