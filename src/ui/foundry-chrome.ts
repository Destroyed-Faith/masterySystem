/**
 * Foundry chrome (`#sidebar-tabs`, `#scene-controls`) uses faded-ui:
 * child buttons stay `inert` + `pointer-events: none` until the parent
 * `menu` receives hover. When `#tooltip` / an overlay steals hover, those
 * buttons never unlock and clicks are ignored (tooltips may still show).
 *
 * Capture-phase unlock restores clickability; stuck Mastery overlays are
 * cleared on ready / Escape so they cannot sit above the chrome forever.
 */

import { makeFoundryTooltipInert } from './tooltip-passthrough.js';

const CHROME_SELECTORS = ['#sidebar-tabs', '#scene-controls'] as const;

let fadedUnlockInstalled = false;
let overlayCleanupInstalled = false;

function unlockFadedControls(root: ParentNode): void {
  const nodes = root.querySelectorAll<HTMLElement>(
    '[inert], [aria-hidden="true"], button, .control-tool, [data-tool], a.item, li',
  );
  nodes.forEach((el) => {
    if (el.hasAttribute('inert')) el.removeAttribute('inert');
    if (el.getAttribute('aria-hidden') === 'true' && el.matches('button, .control-tool, [data-tool], a.item')) {
      el.removeAttribute('aria-hidden');
    }
    if (el.style.pointerEvents === 'none') el.style.pointerEvents = '';
  });
  if (root instanceof HTMLElement) {
    if (root.hasAttribute('inert')) root.removeAttribute('inert');
    if (root.style.pointerEvents === 'none') root.style.pointerEvents = '';
  }
}

function findChromeMenuAtPoint(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    const menu = el.closest('menu');
    if (menu instanceof HTMLElement && menu.closest(CHROME_SELECTORS.join(','))) {
      return menu;
    }
  }

  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!chrome) continue;
    for (const menu of Array.from(chrome.querySelectorAll('menu'))) {
      if (!(menu instanceof HTMLElement)) continue;
      const r = menu.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return menu;
      }
    }
  }
  return null;
}

function unlockChromeAtPoint(x: number, y: number): void {
  makeFoundryTooltipInert();
  const menu = findChromeMenuAtPoint(x, y);
  if (menu) {
    unlockFadedControls(menu);
    return;
  }
  for (const sel of CHROME_SELECTORS) {
    const chrome = document.querySelector(sel);
    if (!chrome) continue;
    const r = (chrome as HTMLElement).getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      unlockFadedControls(chrome);
    }
  }
}

function onChromePointerDown(ev: PointerEvent): void {
  if (typeof ev.button === 'number' && ev.button !== 0) return;
  unlockChromeAtPoint(ev.clientX, ev.clientY);

  // After unlock, hit-testing can see the real control. If this event was
  // aimed at something behind a previously-inert button, forward activation.
  const stack = document.elementsFromPoint(ev.clientX, ev.clientY);
  const control = stack.find(
    (el): el is HTMLElement =>
      el instanceof HTMLElement &&
      el.matches(
        '#sidebar-tabs button, #sidebar-tabs .item, #sidebar-tabs a, #sidebar-tabs [data-tab], #scene-controls button, #scene-controls .control-tool, #scene-controls [data-tool], #scene-controls li',
      ),
  );
  if (!control) return;

  const target = ev.target;
  const alreadyOnControl =
    target instanceof Node && (control === target || control.contains(target));
  if (alreadyOnControl) return;

  // Unlock landed under the cursor; synthesize a click so the tool fires.
  ev.preventDefault();
  ev.stopPropagation();
  control.click();
}

function onChromePointerOver(ev: PointerEvent): void {
  unlockChromeAtPoint(ev.clientX, ev.clientY);
}

function bindChromeRoot(el: Element): void {
  const node = el as HTMLElement & { __msFadedUnlock?: boolean };
  if (node.__msFadedUnlock) return;
  node.__msFadedUnlock = true;
  node.addEventListener('pointerdown', onChromePointerDown, true);
  node.addEventListener('pointerover', onChromePointerOver, true);
}

function bindAllChromeRoots(): void {
  for (const sel of CHROME_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) bindChromeRoot(el);
  }
}

/** Capture-phase unlock for Foundry sidebar tabs and scene controls. */
export function installFadedUiUnlock(): void {
  bindAllChromeRoots();
  if (fadedUnlockInstalled) return;
  fadedUnlockInstalled = true;

  const g = globalThis as any;
  g.Hooks?.on?.('renderSidebarTab', () => bindAllChromeRoots());
  g.Hooks?.on?.('renderSidebar', () => bindAllChromeRoots());
  g.Hooks?.on?.('renderSceneControls', () => bindAllChromeRoots());
  g.Hooks?.on?.('collapseSidebar', () => bindAllChromeRoots());
  g.Hooks?.on?.('expandSidebar', () => bindAllChromeRoots());

  // Sidebar / scene-controls may mount after `ready`.
  if (typeof MutationObserver !== 'undefined' && document.body) {
    let scheduled = false;
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of Array.from(m.addedNodes)) {
          if (!(n instanceof Element)) continue;
          if (
            n.id === 'sidebar-tabs' ||
            n.id === 'scene-controls' ||
            n.querySelector?.('#sidebar-tabs, #scene-controls')
          ) {
            if (scheduled) return;
            scheduled = true;
            queueMicrotask(() => {
              scheduled = false;
              bindAllChromeRoots();
            });
            return;
          }
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
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
