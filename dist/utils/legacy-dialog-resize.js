/**
 * Resize handle for legacy Foundry `Dialog` windows (.window-app.dialog).
 * ApplicationV2 has built-in resizing; legacy Dialog does not expose a visible grip.
 *
 * IMPORTANT: never set `position: relative` on `.window-app` — that pulls the
 * dialog into document flow, shifts Foundry's whole UI (black bar / layout
 * jump), and breaks dragging. Keep `position: fixed` (or absolute) + left/top.
 */
export function syncLegacyDialogContentHeight(root) {
    if (!root?.length)
        return;
    const appEl = root[0];
    const header = root.find('.window-header').outerHeight() ?? 0;
    const buttons = root.find('.dialog-buttons').outerHeight() ?? 0;
    const total = appEl.getBoundingClientRect().height;
    const contentH = Math.max(160, total - header - buttons - 4);
    root.find('.window-content').css({
        flex: '1 1 auto',
        minHeight: '0',
        height: `${contentH}px`,
        maxHeight: `${contentH}px`,
        overflowY: 'auto',
    });
}
/** Keep a legacy dialog as a floating overlay and (re)center it in the viewport. */
export function placeLegacyDialogOverlay(root, width, height) {
    if (!root?.length)
        return;
    const w = Math.min(width, Math.max(320, window.innerWidth - 24));
    const h = Math.min(height, Math.max(240, window.innerHeight - 24));
    const left = Math.max(8, Math.round((window.innerWidth - w) / 2));
    const top = Math.max(8, Math.round((window.innerHeight - h) / 2));
    root.css({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${w}px`,
        height: `${h}px`,
        margin: '0',
    });
}
export function attachLegacyDialogResizeHandle(root, options = {}) {
    if (!root?.length)
        return;
    if (root.find('> .window-resizable-handle').length)
        return;
    const minWidth = options.minWidth ?? 720;
    const minHeight = options.minHeight ?? 520;
    const maxWidth = options.maxWidth ?? Math.min(1200, window.innerWidth - 24);
    const maxHeight = options.maxHeight ?? Math.min(920, window.innerHeight - 24);
    // Do not touch `position` here — caller / Foundry owns overlay placement.
    root.addClass('ms-legacy-resizable-dialog');
    const sync = () => {
        syncLegacyDialogContentHeight(root);
        options.onResize?.();
    };
    const handle = $('<div class="window-resizable-handle" title="Drag to resize" role="presentation">'
        + '<i inert class="fa-solid fa-up-right-and-down-left-from-center"></i>'
        + '</div>');
    root.append(handle);
    handle.on('mousedown.msDialogResize', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const appEl = root[0];
        const rect = appEl.getBoundingClientRect();
        const startW = rect.width;
        const startH = rect.height;
        const onMove = (move) => {
            const dw = move.clientX - startX;
            const dh = move.clientY - startY;
            const w = Math.min(maxWidth, Math.max(minWidth, startW + dw));
            const h = Math.min(maxHeight, Math.max(minHeight, startH + dh));
            appEl.style.width = `${w}px`;
            appEl.style.height = `${h}px`;
            sync();
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    sync();
}
export function setupPowerCatalogDialogChrome(html, options = {}) {
    const dialogElement = html.closest('.window-app.dialog');
    if (!dialogElement.length)
        return;
    dialogElement.addClass('mastery-system power-creation-dialog power-catalog-dialog ms-power-catalog-dialog');
    if (options.extraClasses) {
        for (const cls of options.extraClasses.split(/\s+/)) {
            if (cls)
                dialogElement.addClass(cls);
        }
    }
    const minWidth = options.minWidth ?? 720;
    const minHeight = options.minHeight ?? 520;
    const initialWidth = options.initialWidth ?? 920;
    const initialHeight = options.initialHeight ?? 720;
    dialogElement.css({
        display: 'flex',
        flexDirection: 'column',
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        maxWidth: '95vw',
        maxHeight: '92vh',
    });
    if (options.center !== false) {
        placeLegacyDialogOverlay(dialogElement, initialWidth, initialHeight);
    }
    else {
        dialogElement.css({
            width: `${initialWidth}px`,
            height: `${initialHeight}px`,
        });
    }
    attachLegacyDialogResizeHandle(dialogElement, { minWidth, minHeight });
}
//# sourceMappingURL=legacy-dialog-resize.js.map