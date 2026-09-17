/**
 * Foundry faded-ui locks chrome and directory controls with CSS/inline
 * `pointer-events: none`, `inert`, and `aria-hidden` until hover. When hover
 * never sticks (tooltip steal, or the faded root itself ignores pointers),
 * clicks fall through — window drag cursor (hand) is all that remains.
 *
 * Unlock runs on `document` capture by geometry so it works even when the
 * faded node cannot receive events. Covers:
 *   - #scene-controls / #sidebar-tabs
 *   - Sidebar directory create buttons (Actors / Scenes / Items / …)
 *   - Per-folder header create buttons
 *   - Application .window-header controls (close / UUID / ⋮)
 */

import { makeFoundryTooltipInert } from './tooltip-passthrough.js';

const CHROME_SELECTORS = ['#sidebar-tabs', '#scene-controls'] as const;

const DIRECTORY_CREATE_SELECTOR = [
  '#sidebar button.create-folder',
  '#sidebar button.create-entry',
  '#sidebar button.create-document',
  '#sidebar button[data-action="createFolder"]',
  '#sidebar button[data-action="createEntry"]',
  '#sidebar button[data-action="createDocument"]',
  '#sidebar button[data-action="createItem"]',
  '#sidebar .folder-header button',
  '#sidebar .directory-header button',
  '#sidebar .header-actions button',
  '#sidebar .action-buttons button',
].join(', ');

const WINDOW_HEADER_CONTROL_SELECTOR = [
  '.application .window-header button.header-control',
  '.application .window-header button[data-action="close"]',
  '.application .window-header button[data-action="toggleControls"]',
  '.application .window-header button[data-action="copyUuid"]',
  '.window-app .window-header button.header-control',
  '.window-app .window-header button[data-action="close"]',
  '.window-app .window-header button[data-action="toggleControls"]',
  '.window-app .window-header button[data-action="copyUuid"]',
].join(', ');

const CONTROL_CLICK_SELECTOR = [
  '#sidebar-tabs button',
  '#sidebar-tabs .item',
  '#sidebar-tabs a',
  '#sidebar-tabs [data-tab]',
  '#scene-controls button',
  '#scene-controls .control-tool',
  '#scene-controls [data-tool]',
  '#scene-controls li',
  DIRECTORY_CREATE_SELECTOR,
  WINDOW_HEADER_CONTROL_SELECTOR,
].join(', ');

let fadedUnlockInstalled = false;
let overlayCleanupInstalled = false;
/** Roots we forced pe:auto on — cleared when the pointer leaves them. */
const unlockedRoots = new Set<HTMLElement>();
let lastMoveUnlockAt = 0;

function forceClickable(el: HTMLElement): void {
  if (el.hasAttribute('inert')) el.removeAttribute('inert');
  if (
    el.getAttribute('aria-hidden') === 'true' &&
    el.matches(
      'button, .control-tool, [data-tool], a.item, .create-button, .create-folder, .create-entry, .header-control',
    )
  ) {
    el.removeAttribute('aria-hidden');
  }
  el.style.setProperty('pointer-events', 'auto', 'important');
}

function unlockFadedControls(root: ParentNode): void {
  const nodes = root.querySelectorAll<HTMLElement>(
    '[inert], [aria-hidden="true"], button, .control-tool, [data-tool], a.item, li, menu, .create-button, .header-control',
  );
  nodes.forEach((el) => forceClickable(el));
  if (root instanceof HTMLElement) forceClickable(root);
}

function pointInRect(x: number, y: number, r: DOMRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function releaseUnlock(el: HTMLElement): void {
  el.style.removeProperty('pointer-events');
  el.querySelectorAll<HTMLElement>(
    'menu, button, .control-tool, [data-tool], a.item, li, .create-button, .header-control',
  ).forEach((child) => {
    child.style.removeProperty('pointer-events');
  });
  unlockedRoots.delete(el);
}

function trackUnlock(root: HTMLElement): void {
  unlockFadedControls(root);
  unlockedRoots.add(root);
}

function chromeAtPoint(x: number, y: number): HTMLElement | null {
  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!(chrome instanceof HTMLElement)) continue;
    if (pointInRect(x, y, chrome.getBoundingClientRect())) return chrome;
  }
  return null;
}

function directoryHeadersAtPoint(x: number, y: number): HTMLElement[] {
  const sidebar = document.getElementById('sidebar') ?? document.querySelector('#sidebar');
  if (!sidebar) return [];
  const hits: HTMLElement[] = [];
  for (const header of Array.from(
    sidebar.querySelectorAll<HTMLElement>('.folder-header, .directory-header, .header-actions, .action-buttons'),
  )) {
    if (pointInRect(x, y, header.getBoundingClientRect())) hits.push(header);
  }
  return hits;
}

function windowHeadersAtPoint(x: number, y: number): HTMLElement[] {
  const hits: HTMLElement[] = [];
  for (const header of Array.from(
    document.querySelectorAll<HTMLElement>('.application .window-header, .window-app .window-header'),
  )) {
    if (pointInRect(x, y, header.getBoundingClientRect())) hits.push(header);
  }
  return hits;
}

function controlUnderPoint(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  const hit = stack.find(
    (el): el is HTMLElement => el instanceof HTMLElement && el.matches(CONTROL_CLICK_SELECTOR),
  );
  if (hit) return hit;

  for (const btn of Array.from(document.querySelectorAll<HTMLElement>(CONTROL_CLICK_SELECTOR))) {
    if (pointInRect(x, y, btn.getBoundingClientRect())) return btn;
  }
  return null;
}

function unlockAtPoint(x: number, y: number): HTMLElement[] {
  makeFoundryTooltipInert();
  const active = new Set<HTMLElement>();

  const chrome = chromeAtPoint(x, y);
  if (chrome) {
    trackUnlock(chrome);
    active.add(chrome);
  }

  for (const header of directoryHeadersAtPoint(x, y)) {
    trackUnlock(header);
    active.add(header);
  }

  for (const header of windowHeadersAtPoint(x, y)) {
    trackUnlock(header);
    active.add(header);
  }

  // Direct hit on a control whose host rect is odd / zero-sized.
  const control = controlUnderPoint(x, y);
  if (control) {
    const host =
      (control.closest(
        '.folder-header, .directory-header, .header-actions, .action-buttons, .window-header',
      ) as HTMLElement | null) ?? control;
    trackUnlock(host);
    forceClickable(control);
    active.add(host);
  }

  for (const root of Array.from(unlockedRoots)) {
    if (!active.has(root)) releaseUnlock(root);
  }

  return Array.from(active);
}

function onDocumentPointerMove(ev: PointerEvent): void {
  const now = performance.now();
  if (now - lastMoveUnlockAt < 32) return;
  lastMoveUnlockAt = now;
  unlockAtPoint(ev.clientX, ev.clientY);
}

function onDocumentPointerDown(ev: PointerEvent): void {
  if (typeof ev.button === 'number' && ev.button !== 0) return;
  const active = unlockAtPoint(ev.clientX, ev.clientY);
  if (!active.length) return;

  const control = controlUnderPoint(ev.clientX, ev.clientY);
  if (!control) return;

  const target = ev.target;
  const alreadyOnControl =
    target instanceof Node && (control === target || control.contains(target));
  if (alreadyOnControl) return;

  // Click landed on drag-chrome / canvas while a faded control sits under the
  // pointer — fire the real control.
  ev.preventDefault();
  ev.stopPropagation();
  control.click();
}

/** Capture-phase unlock for Foundry chrome, sidebar creates, window headers. */
export function installFadedUiUnlock(): void {
  if (fadedUnlockInstalled) return;
  fadedUnlockInstalled = true;

  document.addEventListener('pointermove', onDocumentPointerMove, true);
  document.addEventListener('pointerdown', onDocumentPointerDown, true);

  const g = globalThis as any;
  g.Hooks?.on?.('renderSidebarTab', () => undefined);
  g.Hooks?.on?.('renderSidebar', () => undefined);
  g.Hooks?.on?.('renderSceneControls', () => undefined);
}

/**
 * Remove a leftover epic-roll full-screen root that blocks the UI, and end
 * any Mastery targeting / guided / forced-move listeners that are still live.
 */
export async function clearStuckMasteryOverlays(): Promise<void> {
  try {
    const { getActiveEpicMasteryRollSession } = await import(
      '../epic-roll/epic-mastery-roll-session.js'
    );
    const { closeEpicMasteryRollApp } = await import('../epic-roll/epic-mastery-roll-app.js');
    const session = getActiveEpicMasteryRollSession();
    const root = document.getElementById('mastery-epic-roll-cinematic-root');
    const sessionLive = !!session && session.status === 'active';
    const emptyRoot =
      !!root &&
      (!root.querySelector('.emr-cinematic-overlay, .emr-cinematic-band, [data-action]') ||
        root.childElementCount === 0 ||
        !root.innerHTML.trim());

    if (root && (!sessionLive || emptyRoot)) {
      closeEpicMasteryRollApp();
      root.remove();
    }
  } catch (err) {
    console.warn('Mastery System | Stuck epic-roll overlay cleanup failed', err);
    document.getElementById('mastery-epic-roll-cinematic-root')?.remove();
  }

  try {
    const { isMeleeTargetingActive, endMeleeTargeting } = await import('../melee-targeting.js');
    if (isMeleeTargetingActive()) endMeleeTargeting(false);
  } catch {
    /* ignore */
  }

  try {
    const { isRangedTargetingActive, endRangedTargeting } = await import('../ranged-targeting.js');
    if (isRangedTargetingActive()) endRangedTargeting(false);
  } catch {
    /* ignore */
  }

  try {
    const { isUtilityTargetingActive, endUtilityTargeting } = await import('../utility-targeting.js');
    if (isUtilityTargetingActive()) endUtilityTargeting(false);
  } catch {
    /* ignore */
  }

  try {
    const { endGuidedMovement } = await import('../token-action-selector.js');
    endGuidedMovement(false);
  } catch {
    /* ignore */
  }

  try {
    const { cancelForcedMovementMode, isForcedMovementActive } = await import(
      '../combat/forced-movement.js'
    );
    if (isForcedMovementActive()) cancelForcedMovementMode();
  } catch {
    /* ignore */
  }
}

/** Clear stuck overlays on `ready` and Escape. */
export function installStuckOverlayCleanup(): void {
  if (overlayCleanupInstalled) return;
  overlayCleanupInstalled = true;

  void clearStuckMasteryOverlays();

  window.addEventListener(
    'keydown',
    (ev) => {
      if (ev.key !== 'Escape') return;
      void clearStuckMasteryOverlays();
    },
    true,
  );
}
