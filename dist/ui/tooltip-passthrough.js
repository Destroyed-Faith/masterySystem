/**
 * Foundry parks `#tooltip` under the cursor. If that node can receive
 * pointer events, the hovered button loses :hover (active/inactive flicker)
 * and the click lands on the tooltip instead of the control.
 *
 * Hover text may still appear. It must never steal the pointer.
 *
 * This also covers Foundry chrome (sidebar / scene-controls): when the
 * tooltip steals hover, faded-ui buttons stay `inert` + `pointer-events: none`.
 */
const TOOLTIP_SELECTORS = [
    '#tooltip',
    'aside#tooltip',
    '.locked-tooltip',
    '#tooltip.locked-tooltip',
    '.toolclip',
    '#toolclip',
];
let tooltipObserver = null;
let documentObserverInstalled = false;
let applyingInert = false;
function isTooltipSurface(el) {
    if (!(el instanceof HTMLElement))
        return false;
    return (el.id === 'tooltip' ||
        el.id === 'toolclip' ||
        el.classList.contains('locked-tooltip') ||
        el.classList.contains('toolclip') ||
        el.matches('aside#tooltip'));
}
function inertTooltipNode(node) {
    if (node.style.pointerEvents !== 'none')
        node.style.pointerEvents = 'none';
    if (!node.hasAttribute('inert'))
        node.setAttribute('inert', '');
    if (node.getAttribute('aria-hidden') !== 'true')
        node.setAttribute('aria-hidden', 'true');
}
/** Make every known Foundry tooltip / toolclip surface ignore the pointer. */
export function makeFoundryTooltipInert() {
    if (applyingInert)
        return;
    applyingInert = true;
    try {
        const mgr = globalThis.game?.tooltip;
        const fromMgr = (mgr?.element ?? mgr?.tooltip);
        if (fromMgr instanceof HTMLElement)
            inertTooltipNode(fromMgr);
        if (typeof document !== 'undefined') {
            for (const sel of TOOLTIP_SELECTORS) {
                document.querySelectorAll(sel).forEach((el) => {
                    if (el instanceof HTMLElement)
                        inertTooltipNode(el);
                });
            }
        }
        mgr?.unlock?.();
    }
    finally {
        applyingInert = false;
    }
}
function ensureTooltipObserver() {
    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined')
        return;
    if (!tooltipObserver) {
        tooltipObserver = new MutationObserver((mutations) => {
            if (applyingInert)
                return;
            let needsInert = false;
            for (const m of mutations) {
                if (m.type === 'childList') {
                    m.addedNodes.forEach((n) => {
                        if (!(n instanceof HTMLElement))
                            return;
                        if (isTooltipSurface(n))
                            needsInert = true;
                        else if (n.querySelector?.('#tooltip, aside#tooltip, .locked-tooltip, #toolclip, .toolclip')) {
                            needsInert = true;
                        }
                    });
                }
                else if (m.type === 'attributes' && m.target instanceof HTMLElement && isTooltipSurface(m.target)) {
                    // Foundry may re-enable pointer-events when activating the tooltip.
                    if (m.target.style.pointerEvents !== 'none' || !m.target.hasAttribute('inert')) {
                        needsInert = true;
                    }
                }
            }
            if (needsInert)
                makeFoundryTooltipInert();
        });
    }
    const tip = document.getElementById('tooltip') ?? document.querySelector('aside#tooltip');
    if (tip) {
        tooltipObserver.observe(tip, {
            attributes: true,
            attributeFilter: ['style', 'class', 'inert', 'aria-hidden'],
            childList: true,
            subtree: true,
        });
    }
    if (!documentObserverInstalled && document.body) {
        documentObserverInstalled = true;
        // Only watch for tooltip nodes being (re)inserted — not every attribute tweak.
        tooltipObserver.observe(document.body, { childList: true, subtree: true });
    }
}
function patchTooltipManager(mgr) {
    if (!mgr || mgr.__msPassthrough)
        return;
    mgr.__msPassthrough = true;
    if (typeof mgr.activate === 'function') {
        const orig = mgr.activate.bind(mgr);
        mgr.activate = function (...args) {
            const result = orig(...args);
            makeFoundryTooltipInert();
            return result;
        };
    }
    if (typeof mgr.lockTooltip === 'function') {
        mgr.lockTooltip = function () {
            makeFoundryTooltipInert();
            return this;
        };
    }
    if (typeof mgr.deactivate === 'function') {
        const origDeactivate = mgr.deactivate.bind(mgr);
        mgr.deactivate = function (...args) {
            const result = origDeactivate(...args);
            makeFoundryTooltipInert();
            return result;
        };
    }
}
/**
 * Install / refresh tooltip passthrough. Safe to call again after `canvasReady`
 * in case Foundry replaced `game.tooltip`.
 */
export function installTooltipPassthrough() {
    makeFoundryTooltipInert();
    ensureTooltipObserver();
    const mgr = globalThis.game?.tooltip;
    if (mgr)
        patchTooltipManager(mgr);
}
/**
 * Fire the action on pointerdown so a Foundry tooltip appearing between
 * mousedown and mouseup cannot swallow the click. A leftover click is ignored.
 */
export function bindReliableControlClick(root, selector, handler) {
    root
        .off('pointerdown.msReliable', selector)
        .off('click.msReliable', selector)
        .on('pointerdown.msReliable', selector, (event) => {
        const pe = event.originalEvent;
        if (pe && typeof pe.button === 'number' && pe.button !== 0)
            return;
        event.preventDefault();
        event.stopPropagation();
        makeFoundryTooltipInert();
        const el = event.currentTarget;
        if (el)
            el.dataset.msReliableArmed = '1';
        handler(event);
    })
        .on('click.msReliable', selector, (event) => {
        const el = event.currentTarget;
        if (el?.dataset.msReliableArmed === '1') {
            delete el.dataset.msReliableArmed;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        makeFoundryTooltipInert();
        handler(event);
    });
}
//# sourceMappingURL=tooltip-passthrough.js.map