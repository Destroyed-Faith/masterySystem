/**
 * Resize handle for legacy Foundry `Dialog` windows (.window-app.dialog).
 * ApplicationV2 has built-in resizing; legacy Dialog does not expose a visible grip.
 *
 * IMPORTANT: never set `position: relative` on `.window-app` — that pulls the
 * dialog into document flow, shifts Foundry's whole UI (black bar / layout
 * jump), and breaks dragging. Keep `position: fixed` (or absolute) + left/top.
 */
export interface LegacyDialogResizeOptions {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    onResize?: () => void;
}
export declare function syncLegacyDialogContentHeight(root: JQuery): void;
/** Keep a legacy dialog as a floating overlay and (re)center it in the viewport. */
export declare function placeLegacyDialogOverlay(root: JQuery, width: number, height: number): void;
export declare function attachLegacyDialogResizeHandle(root: JQuery, options?: LegacyDialogResizeOptions): void;
export interface PowerCatalogDialogChromeOptions {
    minWidth?: number;
    minHeight?: number;
    initialWidth?: number;
    initialHeight?: number;
    extraClasses?: string;
    /** When false, skip re-centering (caller places the window). Default true. */
    center?: boolean;
}
export declare function setupPowerCatalogDialogChrome(html: JQuery, options?: PowerCatalogDialogChromeOptions): void;
//# sourceMappingURL=legacy-dialog-resize.d.ts.map