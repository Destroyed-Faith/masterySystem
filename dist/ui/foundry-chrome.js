/**
 * Foundry faded-ui locks chrome and directory controls with CSS/inline
 * `pointer-events: none`, `inert`, and `aria-hidden` until hover. When hover
 * never sticks (tooltip steal, or the faded root itself ignores pointers),
 * clicks fall through to the canvas / header toggle only.
 *
 * Unlock runs on `document` capture by geometry so it works even when the
 * faded node cannot receive events. Covers:
 *   - #scene-controls / #sidebar-tabs
 *   - Sidebar directory create buttons (Actors / Scenes / Items / …)
 *   - Per-folder header create buttons
 */
import { makeFoundryTooltipInert } from './tooltip-passthrough.js';
const CHROME_SELECTORS = ['#sidebar-tabs', '#scene-controls'];
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
].join(', ');
let fadedUnlockInstalled = false;
let overlayCleanupInstalled = false;
/** Roots we forced pe:auto on — cleared when the pointer leaves them. */
const unlockedRoots = new Set();
let lastMoveUnlockAt = 0;
function forceClickable(el) {
    if (el.hasAttribute('inert'))
        el.removeAttribute('inert');
    if (el.getAttribute('aria-hidden') === 'true' &&
        el.matches('button, .control-tool, [data-tool], a.item, .create-button, .create-folder, .create-entry')) {
        el.removeAttribute('aria-hidden');
    }
    el.style.setProperty('pointer-events', 'auto', 'important');
}
function unlockFadedControls(root) {
    const nodes = root.querySelectorAll('[inert], [aria-hidden="true"], button, .control-tool, [data-tool], a.item, li, menu, .create-button');
    nodes.forEach((el) => forceClickable(el));
    if (root instanceof HTMLElement)
        forceClickable(root);
}
function pointInRect(x, y, r) {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}
function releaseUnlock(el) {
    el.style.removeProperty('pointer-events');
    el.querySelectorAll('menu, button, .control-tool, [data-tool], a.item, li, .create-button').forEach((child) => {
        child.style.removeProperty('pointer-events');
    });
    unlockedRoots.delete(el);
}
function trackUnlock(root) {
    unlockFadedControls(root);
    unlockedRoots.add(root);
}
function chromeAtPoint(x, y) {
    for (const sel of CHROME_SELECTORS) {
        const chrome = document.querySelector(sel);
        if (!(chrome instanceof HTMLElement))
            continue;
        if (pointInRect(x, y, chrome.getBoundingClientRect()))
            return chrome;
    }
    return null;
}
function directoryHeadersAtPoint(x, y) {
    const sidebar = document.getElementById('sidebar') ?? document.querySelector('#sidebar');
    if (!sidebar)
        return [];
    const hits = [];
    for (const header of Array.from(sidebar.querySelectorAll('.folder-header, .directory-header, .header-actions, .action-buttons'))) {
        if (pointInRect(x, y, header.getBoundingClientRect()))
            hits.push(header);
    }
    return hits;
}
function controlUnderPoint(x, y) {
    const stack = document.elementsFromPoint(x, y);
    const hit = stack.find((el) => el instanceof HTMLElement && el.matches(CONTROL_CLICK_SELECTOR));
    if (hit)
        return hit;
    for (const btn of Array.from(document.querySelectorAll(CONTROL_CLICK_SELECTOR))) {
        if (pointInRect(x, y, btn.getBoundingClientRect()))
            return btn;
    }
    return null;
}
function unlockAtPoint(x, y) {
    makeFoundryTooltipInert();
    const active = new Set();
    const chrome = chromeAtPoint(x, y);
    if (chrome) {
        trackUnlock(chrome);
        active.add(chrome);
    }
    for (const header of directoryHeadersAtPoint(x, y)) {
        trackUnlock(header);
        active.add(header);
    }
    // Direct hit on a create button whose header rect is odd / zero-sized.
    const control = controlUnderPoint(x, y);
    if (control) {
        const host = control.closest('.folder-header, .directory-header, .header-actions, .action-buttons') ??
            control;
        trackUnlock(host);
        forceClickable(control);
        active.add(host);
    }
    for (const root of Array.from(unlockedRoots)) {
        if (!active.has(root))
            releaseUnlock(root);
    }
    return Array.from(active);
}
function onDocumentPointerMove(ev) {
    const now = performance.now();
    if (now - lastMoveUnlockAt < 32)
        return;
    lastMoveUnlockAt = now;
    unlockAtPoint(ev.clientX, ev.clientY);
}
function onDocumentPointerDown(ev) {
    if (typeof ev.button === 'number' && ev.button !== 0)
        return;
    const active = unlockAtPoint(ev.clientX, ev.clientY);
    if (!active.length)
        return;
    const control = controlUnderPoint(ev.clientX, ev.clientY);
    if (!control)
        return;
    const target = ev.target;
    const alreadyOnControl = target instanceof Node && (control === target || control.contains(target));
    if (alreadyOnControl)
        return;
    // Click landed on canvas/header while a faded create/tool button sits under
    // the pointer — fire the real control.
    ev.preventDefault();
    ev.stopPropagation();
    control.click();
}
/** Capture-phase unlock for Foundry chrome + sidebar directory create buttons. */
export function installFadedUiUnlock() {
    if (fadedUnlockInstalled)
        return;
    fadedUnlockInstalled = true;
    document.addEventListener('pointermove', onDocumentPointerMove, true);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    const g = globalThis;
    g.Hooks?.on?.('renderSidebarTab', () => undefined);
    g.Hooks?.on?.('renderSidebar', () => undefined);
    g.Hooks?.on?.('renderSceneControls', () => undefined);
}
/**
 * Remove a leftover epic-roll full-screen root that blocks the UI, and end
 * any Mastery targeting / guided / forced-move listeners that are still live.
 */
export async function clearStuckMasteryOverlays() {
    try {
        const { getActiveEpicMasteryRollSession } = await import('../epic-roll/epic-mastery-roll-session.js');
        const { closeEpicMasteryRollApp } = await import('../epic-roll/epic-mastery-roll-app.js');
        const session = getActiveEpicMasteryRollSession();
        const root = document.getElementById('mastery-epic-roll-cinematic-root');
        const sessionLive = !!session && session.status === 'active';
        const emptyRoot = !!root &&
            (!root.querySelector('.emr-cinematic-overlay, .emr-cinematic-band, [data-action]') ||
                root.childElementCount === 0 ||
                !root.innerHTML.trim());
        if (root && (!sessionLive || emptyRoot)) {
            closeEpicMasteryRollApp();
            root.remove();
        }
    }
    catch (err) {
        console.warn('Mastery System | Stuck epic-roll overlay cleanup failed', err);
        document.getElementById('mastery-epic-roll-cinematic-root')?.remove();
    }
    try {
        const { isMeleeTargetingActive, endMeleeTargeting } = await import('../melee-targeting.js');
        if (isMeleeTargetingActive())
            endMeleeTargeting(false);
    }
    catch {
        /* ignore */
    }
    try {
        const { isRangedTargetingActive, endRangedTargeting } = await import('../ranged-targeting.js');
        if (isRangedTargetingActive())
            endRangedTargeting(false);
    }
    catch {
        /* ignore */
    }
    try {
        const { isUtilityTargetingActive, endUtilityTargeting } = await import('../utility-targeting.js');
        if (isUtilityTargetingActive())
            endUtilityTargeting(false);
    }
    catch {
        /* ignore */
    }
    try {
        const { endGuidedMovement } = await import('../token-action-selector.js');
        endGuidedMovement(false);
    }
    catch {
        /* ignore */
    }
    try {
        const { cancelForcedMovementMode, isForcedMovementActive } = await import('../combat/forced-movement.js');
        if (isForcedMovementActive())
            cancelForcedMovementMode();
    }
    catch {
        /* ignore */
    }
}
/** Clear stuck overlays on `ready` and Escape. */
export function installStuckOverlayCleanup() {
    if (overlayCleanupInstalled)
        return;
    overlayCleanupInstalled = true;
    void clearStuckMasteryOverlays();
    window.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Escape')
            return;
        void clearStuckMasteryOverlays();
    }, true);
}
//# sourceMappingURL=foundry-chrome.js.map