/**
 * Resize handle for legacy Foundry `Dialog` windows (.window-app.dialog).
 * ApplicationV2 has built-in resizing; legacy Dialog does not expose a visible grip.
 */

export interface LegacyDialogResizeOptions {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    onResize?: () => void;
}

export function syncLegacyDialogContentHeight(root: JQuery): void {
    if (!root?.length) return;
    const appEl = root[0] as HTMLElement;
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

export function attachLegacyDialogResizeHandle(
    root: JQuery,
    options: LegacyDialogResizeOptions = {},
): void {
    if (!root?.length) return;
    if (root.find('> .window-resizable-handle').length) return;

    const minWidth = options.minWidth ?? 720;
    const minHeight = options.minHeight ?? 520;
    const maxWidth = options.maxWidth ?? Math.min(1200, window.innerWidth - 24);
    const maxHeight = options.maxHeight ?? Math.min(920, window.innerHeight - 24);

    root.css({ position: 'relative' });
    root.addClass('ms-legacy-resizable-dialog');

    const sync = () => {
        syncLegacyDialogContentHeight(root);
        options.onResize?.();
    };

    const handle = $(
        '<div class="window-resizable-handle" title="Drag to resize" role="presentation">'
        + '<i inert class="fa-solid fa-up-right-and-down-left-from-center"></i>'
        + '</div>',
    );
    root.append(handle);

    handle.on('mousedown.msDialogResize', (e: JQuery.MouseDownEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const appEl = root[0] as HTMLElement;
        const rect = appEl.getBoundingClientRect();
        const startW = rect.width;
        const startH = rect.height;

        const onMove = (move: MouseEvent) => {
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

export interface PowerCatalogDialogChromeOptions {
    minWidth?: number;
    minHeight?: number;
    initialWidth?: number;
    initialHeight?: number;
    extraClasses?: string;
}

export function setupPowerCatalogDialogChrome(
    html: JQuery,
    options: PowerCatalogDialogChromeOptions = {},
): void {
    const dialogElement = html.closest('.window-app.dialog');
    if (!dialogElement.length) return;

    dialogElement.addClass('mastery-system power-creation-dialog power-catalog-dialog ms-power-catalog-dialog');
    if (options.extraClasses) {
        for (const cls of options.extraClasses.split(/\s+/)) {
            if (cls) dialogElement.addClass(cls);
        }
    }

    const minWidth = options.minWidth ?? 720;
    const minHeight = options.minHeight ?? 520;
    const initialWidth = options.initialWidth ?? 920;
    const initialHeight = options.initialHeight ?? 720;

    dialogElement.css({
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: `${initialWidth}px`,
        height: `${initialHeight}px`,
        minWidth: `${minWidth}px`,
        minHeight: `${minHeight}px`,
        maxWidth: '95vw',
        maxHeight: '92vh',
    });

    attachLegacyDialogResizeHandle(dialogElement, { minWidth, minHeight });
}
