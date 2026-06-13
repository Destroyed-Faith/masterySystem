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
export declare function syncLegacyDialogContentHeight(root: JQuery): void;
export declare function attachLegacyDialogResizeHandle(root: JQuery, options?: LegacyDialogResizeOptions): void;
export interface PowerCatalogDialogChromeOptions {
    minWidth?: number;
    minHeight?: number;
    initialWidth?: number;
    initialHeight?: number;
    extraClasses?: string;
}
export declare function setupPowerCatalogDialogChrome(html: JQuery, options?: PowerCatalogDialogChromeOptions): void;
//# sourceMappingURL=legacy-dialog-resize.d.ts.map