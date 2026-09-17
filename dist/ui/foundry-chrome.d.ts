/**
 * Foundry chrome (`#sidebar-tabs`, `#scene-controls`) uses faded-ui:
 * the chrome root often has CSS `pointer-events: none` + low opacity until
 * hover. Listeners bound ON that root never fire while it is faded — the
 * canvas under it receives the event instead. Unlock must be geometric on
 * `document` (capture), and must override stylesheet pe with an inline value.
 *
 * Stuck Mastery overlays are cleared on ready / Escape.
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