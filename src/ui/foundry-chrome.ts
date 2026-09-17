/**
 * Foundry chrome (`#sidebar-tabs`, `#scene-controls`) uses faded-ui:
 * the chrome root often has CSS `pointer-events: none` + low opacity until
 * hover. Listeners bound ON that root never fire while it is faded — the
 * canvas under it receives the event instead. Unlock must be geometric on
 * `document` (capture), and must override stylesheet pe with an inline value.
 *
 * Stuck Mastery overlays are cleared on ready / Escape.
 */

import { makeFoundryTooltipInert } from './tooltip-passthrough.js';

const CHROME_SELECTORS = ['#sidebar-tabs', '#scene-controls'] as const;

let fadedUnlockInstalled = false;
let overlayCleanupInstalled = false;
let unlockedChrome: HTMLElement | null = null;
let lastMoveUnlockAt = 0;

function forceClickable(el: HTMLElement): void {
  if (el.hasAttribute('inert')) el.removeAttribute('inert');
  if (el.getAttribute('aria-hidden') === 'true' && el.matches('button, .control-tool, [data-tool], a.item')) {
    el.removeAttribute('aria-hidden');
  }
  // Inline override beats Foundry's faded-ui stylesheet `pointer-events: none`.
  el.style.setProperty('pointer-events', 'auto', 'important');
}

function unlockFadedControls(root: ParentNode): void {
  const nodes = root.querySelectorAll<HTMLElement>(
    '[inert], [aria-hidden="true"], button, .control-tool, [data-tool], a.item, li, menu',
  );
  nodes.forEach((el) => forceClickable(el));
  if (root instanceof HTMLElement) forceClickable(root);
}

function pointInRect(x: number, y: number, r: DOMRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function chromeAtPoint(x: number, y: number): HTMLElement | null {
  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!(chrome instanceof HTMLElement)) continue;
    if (pointInRect(x, y, chrome.getBoundingClientRect())) return chrome;
  }
  return null;
}

function findChromeMenuAtPoint(x: number, y: number): HTMLElement | null {
  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!chrome) continue;
    for (const menu of Array.from(chrome.querySelectorAll('menu'))) {
      if (!(menu instanceof HTMLElement)) continue;
      if (pointInRect(x, y, menu.getBoundingClientRect())) return menu;
    }
  }
  return null;
}

function releaseChromeUnlock(el: HTMLElement): void {
  el.style.removeProperty('pointer-events');
  el.querySelectorAll<HTMLElement>('menu, button, .control-tool, [data-tool], a.item, li').forEach((child) => {
    child.style.removeProperty('pointer-events');
  });
}

function unlockChromeAtPoint(x: number, y: number): HTMLElement | null {
  makeFoundryTooltipInert();
  const chrome = chromeAtPoint(x, y);
  if (!chrome) {
    if (unlockedChrome) {
      releaseChromeUnlock(unlockedChrome);
      unlockedChrome = null;
    }
    return null;
  }

  if (unlockedChrome && unlockedChrome !== chrome) {
    releaseChromeUnlock(unlockedChrome);
  }

  const menu = findChromeMenuAtPoint(x, y);
  unlockFadedControls(menu ?? chrome);
  unlockedChrome = chrome;
  return chrome;
}

function controlUnderPoint(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  const hit = stack.find(
    (el): el is HTMLElement =>
      el instanceof HTMLElement &&
      el.matches(
        '#sidebar-tabs button, #sidebar-tabs .item, #sidebar-tabs a, #sidebar-tabs [data-tab], #scene-controls button, #scene-controls .control-tool, #scene-controls [data-tool], #scene-controls li',
      ),
  );
  if (hit) return hit;

  // Geometric fallback while pe was just restored (hit-test may lag one frame).
  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!chrome) continue;
    for (const btn of Array.from(chrome.querySelectorAll<HTMLElement>('button, .control-tool, [data-tool], a.item'))) {
      if (pointInRect(x, y, btn.getBoundingClientRect())) return btn;
    }
  }
  return null;
}

function onDocumentPointerMove(ev: PointerEvent): void {
  const now = performance.now();
  if (now - lastMoveUnlockAt < 32) return;
  lastMoveUnlockAt = now;
  unlockChromeAtPoint(ev.clientX, ev.clientY);
}

function onDocumentPointerDown(ev: PointerEvent): void {
  if (typeof ev.button === 'number' && ev.button !== 0) return;
  const chrome = unlockChromeAtPoint(ev.clientX, ev.clientY);
  if (!chrome) return;

  const control = controlUnderPoint(ev.clientX, ev.clientY);
  if (!control) return;

  const target = ev.target;
  const alreadyOnControl =
    target instanceof Node && (control === target || control.contains(target));
  if (alreadyOnControl) return;

  // Event hit the canvas (or other layer) while the control sits under the
  // pointer geometrically — activate the real control.
  ev.preventDefault();
  ev.stopPropagation();
  control.click();
}

/** Capture-phase unlock for Foundry sidebar tabs and scene controls. */
export function installFadedUiUnlock(): void {
  if (fadedUnlockInstalled) return;
  fadedUnlockInstalled = true;

  // Document capture is required: while chrome has CSS pe:none, listeners on
  // #scene-controls never run because the canvas receives the event instead.
  document.addEventListener('pointermove', onDocumentPointerMove, true);
  document.addEventListener('pointerdown', onDocumentPointerDown, true);

  const g = globalThis as any;
  g.Hooks?.on?.('renderSidebarTab', () => unlockChromeAtPoint(0, 0));
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
