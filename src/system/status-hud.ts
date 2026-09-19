/**
 * Token HUD "Assign Status Effects".
 *
 * Left click toggles. Right click and double click always put the status
 * on the token status bar and into `system.statusEffects`, for PCs and NPCs.
 * Core only toggles an ActiveEffect, and a double click toggles it back off.
 */

import { isAssignableStatusId, setActorCatalogStatus, tokenHasStatus } from './assign-status.js';
import { hasActiveSpecial } from './active-specials.js';

const CLICK_DELAY_MS = 240;
const pendingClicks = new Map<string, number>();

export function statusIdFromHudTarget(target: any): string {
  if (!target || typeof target.closest !== 'function') return '';
  const el = target.closest('[data-status-id], [data-action="effect"]');
  if (!el?.dataset) return '';
  const raw = String(el.dataset.statusId || el.dataset.status || '').trim().toLowerCase();
  if (isAssignableStatusId(raw)) return raw;
  if (el.dataset.action === 'effect') {
    const fallback = String(el.dataset.id || '').trim().toLowerCase();
    if (isAssignableStatusId(fallback)) return fallback;
  }
  return '';
}

function hudRoot(html: any): HTMLElement | null {
  if (!html) return null;
  if (typeof HTMLElement !== 'undefined' && html instanceof HTMLElement) return html;
  const first = html?.[0];
  if (typeof HTMLElement !== 'undefined' && first instanceof HTMLElement) return first;
  return null;
}

function paletteToggle(target: any): HTMLElement | null {
  if (!target || typeof target.closest !== 'function') return null;
  const el = target.closest(
    '[data-action="effects"], [data-action="statusEffects"], [data-palette="effects"]',
  ) as HTMLElement | null;
  if (!el) return null;
  if (el.dataset?.statusId || el.dataset?.action === 'effect') return null;
  return el;
}

function openStatusPalette(app: any): void {
  if (typeof app?.togglePalette !== 'function') return;
  for (const name of ['effects', 'statusEffects', 'status']) {
    try {
      app.togglePalette(name, true);
      return;
    } catch {
      // try the next palette id
    }
  }
}

function clickKey(actor: any, statusId: string): string {
  return `${String(actor?.id || '')}:${statusId}`;
}

function cancelPending(actor: any, statusId: string): void {
  const key = clickKey(actor, statusId);
  const timer = pendingClicks.get(key);
  if (timer == null) return;
  clearTimeout(timer);
  pendingClicks.delete(key);
}

/**
 * Bind status-palette gestures. Capture phase runs before Foundry's toggle,
 * so a double click cannot turn the icon straight back off.
 */
export function bindStatusHudGestures(root: HTMLElement, actor: any, app?: any): void {
  if (!root || !actor || root.dataset.msStatusHud === '1') return;
  root.dataset.msStatusHud = '1';

  const stop = (ev: Event) => {
    ev.preventDefault();
    ev.stopPropagation();
    (ev as any).stopImmediatePropagation?.();
  };

  const assign = (statusId: string) => {
    cancelPending(actor, statusId);
    void setActorCatalogStatus(actor, statusId, true);
  };

  root.addEventListener(
    'contextmenu',
    (ev) => {
      if (paletteToggle(ev.target)) {
        stop(ev);
        openStatusPalette(app);
        return;
      }
      const id = statusIdFromHudTarget(ev.target);
      if (!id) return;
      stop(ev);
      assign(id);
    },
    true,
  );

  root.addEventListener(
    'pointerup',
    (ev) => {
      if (ev.button !== 2) return;
      const id = statusIdFromHudTarget(ev.target);
      if (!id) return;
      stop(ev);
      assign(id);
    },
    true,
  );

  root.addEventListener(
    'dblclick',
    (ev) => {
      const id = statusIdFromHudTarget(ev.target);
      if (id) {
        stop(ev);
        assign(id);
        return;
      }
      if (paletteToggle(ev.target)) {
        stop(ev);
        openStatusPalette(app);
      }
    },
    true,
  );

  root.addEventListener(
    'click',
    (ev) => {
      if (ev.button !== 0) return;
      const id = statusIdFromHudTarget(ev.target);
      if (!id) return;
      stop(ev);
      const key = clickKey(actor, id);
      cancelPending(actor, id);
      const timer = window.setTimeout(() => {
        pendingClicks.delete(key);
        const on = hasActiveSpecial(actor, id) || tokenHasStatus(actor, id);
        void setActorCatalogStatus(actor, id, !on);
      }, CLICK_DELAY_MS);
      pendingClicks.set(key, timer);
    },
    true,
  );
}

export function registerStatusHud(): void {
  const HooksApi = (globalThis as any).Hooks;
  if (!HooksApi?.on) return;
  HooksApi.on('renderTokenHUD', (app: any, html: any) => {
    const root = hudRoot(html);
    const actor = app?.object?.actor;
    if (!root || !actor) return;
    bindStatusHudGestures(root, actor, app);
  });
}
