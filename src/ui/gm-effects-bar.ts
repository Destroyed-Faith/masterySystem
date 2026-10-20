/**
 * Floating GM Manage Effects panel — opened from the carousel hand button.
 * Same chrome as Healing / Important NPCs (grip handle, collapsible).
 */

import {
  clampGmEffectsBarPosition,
  readGmEffectsBarCollapsed,
  readGmEffectsBarPosition,
  setGmEffectsBarCollapsed,
  setGmEffectsBarPosition,
} from '../system/gm-effects-bar.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const APP_ID = 'mastery-gm-effects-bar';

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(key);
  return raw && raw !== key ? raw : fallback;
}

async function carouselApi(): Promise<typeof import('./combat-carousel.js')> {
  return import('./combat-carousel.js');
}

export class GmEffectsBar extends BaseBar {
  private static _instance: GmEffectsBar | null = null;

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ['mastery-system', 'known-npcs-bar', 'gm-effects-bar'],
    position: { width: 'auto' },
    window: {
      title: 'Manage Effects',
      frame: false,
      positioned: false,
      resizable: false,
      minimizable: false,
    },
    actions: {
      toggle: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#toggleCollapsed();
      },
      selectAll: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#run((api) => api.CombatCarouselApp.selectAllForEffects());
      },
      clearSelection: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#run((api) => api.CombatCarouselApp.clearEffectSelection());
      },
      selectSide: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        const btn = (event.target as HTMLElement | null)?.closest?.('[data-action="selectSide"]') as HTMLElement | null;
        const side = String(btn?.dataset?.side || 'all');
        void this.#run((api) => api.CombatCarouselApp.selectSideForEffects(side));
      },
      applySpecial: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#dialogAction('apply');
      },
      removeSpecial: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#dialogAction('remove');
      },
      adjustSpecial: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#dialogAction('adjust');
      },
      undoLast: function (this: GmEffectsBar, event: Event) {
        event.preventDefault();
        void this.#dialogAction('undo');
      },
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/gm-effects-bar.hbs' },
  };

  static get instance(): GmEffectsBar | null {
    return GmEffectsBar._instance;
  }

  static async refresh(): Promise<void> {
    const g = globalThis as any;
    if (!g.game?.user?.isGM) {
      await GmEffectsBar.closeInstance();
      return;
    }
    const { CombatCarouselApp } = await carouselApi();
    const show = CombatCarouselApp.isManageEffectsMode();
    const existing = foundry.applications.instances.get(APP_ID) as GmEffectsBar | undefined;
    if (!show) {
      await GmEffectsBar.closeInstance();
      return;
    }
    if (existing) {
      GmEffectsBar._instance = existing;
      if ((existing as any).rendered) {
        await (existing as any).render({ force: true, focus: false });
        return;
      }
    }
    GmEffectsBar._instance = existing ?? new GmEffectsBar();
    await (GmEffectsBar._instance as any).render({ force: true, focus: false });
  }

  static async closeInstance(): Promise<void> {
    const existing = foundry.applications.instances.get(APP_ID) as GmEffectsBar | undefined;
    if (existing) await (existing as any).close();
    GmEffectsBar._instance = null;
  }

  async _prepareContext(_options: any): Promise<any> {
    const { CombatCarouselApp } = await carouselApi();
    const selectedCount = CombatCarouselApp.selectedEffectCount();
    return {
      selectedCount,
      hasSelection: selectedCount > 0,
      collapsed: readGmEffectsBarCollapsed(),
      title: loc('MASTERY.gmEffectsBar.title', 'Manage Effects'),
      expandLabel: loc('MASTERY.gmEffectsBar.expand', 'Show Manage Effects'),
      collapseLabel: loc('MASTERY.gmEffectsBar.collapse', 'Hide Manage Effects'),
      dragLabel: loc('MASTERY.gmEffectsBar.drag', 'Drag to move'),
    };
  }

  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender?.(context, options);
    this.applyStoredPosition();
    this.#bindDragHandle();
  }

  applyStoredPosition(): void {
    const el = this.#rootElement();
    if (!el) return;
    const apply = () => {
      const next = clampGmEffectsBarPosition(
        readGmEffectsBarPosition(),
        { width: window.innerWidth, height: window.innerHeight },
        { width: el.offsetWidth, height: el.offsetHeight },
      );
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
    };
    apply();
    if (!el.offsetWidth || !el.offsetHeight) requestAnimationFrame(apply);
  }

  #rootElement(): HTMLElement | null {
    return ((this as any).element as HTMLElement | null) ?? null;
  }

  #bindDragHandle(): void {
    const handle = this.#rootElement()?.querySelector?.('.known-npcs-handle') as HTMLElement | null;
    if (!handle) return;
    handle.onpointerdown = (event) => this.#onDragPointerDown(event);
  }

  #onDragPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const el = this.#rootElement();
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = el.getBoundingClientRect();
    const handle = event.currentTarget as HTMLElement | null;
    try {
      handle?.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    el.classList.add('is-dragging');
    const move = (ev: PointerEvent) => {
      const next = clampGmEffectsBarPosition(
        { x: origin.left + ev.clientX - startX, y: origin.top + ev.clientY - startY },
        { width: window.innerWidth, height: window.innerHeight },
        { width: el.offsetWidth, height: el.offsetHeight },
      );
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
    };
    const stop = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      el.classList.remove('is-dragging');
      try {
        handle?.releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      const box = el.getBoundingClientRect();
      void setGmEffectsBarPosition(
        clampGmEffectsBarPosition(
          { x: box.left, y: box.top },
          { width: window.innerWidth, height: window.innerHeight },
          { width: el.offsetWidth, height: el.offsetHeight },
        ),
      );
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  async #toggleCollapsed(): Promise<void> {
    await setGmEffectsBarCollapsed(!readGmEffectsBarCollapsed());
    await (this as any).render({ force: true, focus: false });
  }

  async #run(fn: (api: typeof import('./combat-carousel.js')) => void): Promise<void> {
    const api = await carouselApi();
    fn(api);
  }

  async #dialogAction(kind: 'apply' | 'remove' | 'adjust' | 'undo'): Promise<void> {
    const { CombatCarouselApp } = await carouselApi();
    const targets = CombatCarouselApp.selectedEffectRefs();
    const dialogs = await import('./gm-effect-dialogs.js');
    if (kind === 'undo') {
      await dialogs.requestUndoLastGmEffect();
    } else if (kind === 'apply') {
      await dialogs.openGmApplySpecialDialog(targets);
    } else if (kind === 'remove') {
      await dialogs.openGmRemoveSpecialDialog(targets);
    } else if (kind === 'adjust') {
      await dialogs.openGmAdjustSpecialDialog(targets);
    }
    CombatCarouselApp.refresh();
  }
}

export function initializeGmEffectsBar(): void {
  const Hooks = (globalThis as any).Hooks;
  window.addEventListener('resize', () => {
    GmEffectsBar.instance?.applyStoredPosition();
  });
  Hooks?.on?.('deleteCombat', () => {
    void GmEffectsBar.closeInstance();
  });
}
