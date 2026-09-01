/**
 * Foundry chrome (`#sidebar-tabs`, `#scene-controls`) uses faded-ui:
 * child buttons stay `inert` + `pointer-events: none` until the parent
 * `menu` receives hover. When `#tooltip` / an overlay steals hover, those
 * buttons never unlock and clicks are ignored (tooltips may still show).
 *
 * Capture-phase unlock restores clickability; stuck Mastery overlays are
 * cleared on ready / Escape so they cannot sit above the chrome forever.
 */
/** Capture-phase unlock for Foundry sidebar tabs and scene controls. */
export declare function installFadedUiUnlock(): void;
/**
 * Remove a leftover epic-roll full-screen root that blocks the UI, and end
 * any Mastery targeting / guided / forced-move listeners that are still live.
 */
export declare function clearStuckMasteryOverlays(): Promise<void>;
/** Clear stuck overlays on `ready` and Escape. */
export declare function installStuckOverlayCleanup(): void;
//# sourceMappingURL=foundry-chrome.d.ts.map