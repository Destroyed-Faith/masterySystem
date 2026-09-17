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
/** Capture-phase unlock for Foundry chrome + sidebar directory create buttons. */
export declare function installFadedUiUnlock(): void;
/**
 * Remove a leftover epic-roll full-screen root that blocks the UI, and end
 * any Mastery targeting / guided / forced-move listeners that are still live.
 */
export declare function clearStuckMasteryOverlays(): Promise<void>;
/** Clear stuck overlays on `ready` and Escape. */
export declare function installStuckOverlayCleanup(): void;
//# sourceMappingURL=foundry-chrome.d.ts.map