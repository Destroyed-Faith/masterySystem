/**
 * Foundry v13+ auto-rotates tokens to face the movement direction.
 * DF uses portrait/pog art (not top-down), so that reads as a wrong 90°/180° flip.
 * Disable auto-rotate on every move; manual Ctrl+scroll rotation still works.
 */
/** Foundry TokenPreMovementOperation — only autoRotate / showRuler are writable. */
export declare function disableMovementAutoRotate(movement: {
    autoRotate?: boolean;
} | null | undefined): void;
export declare function registerTokenAutoRotateHooks(): void;
//# sourceMappingURL=token-auto-rotate.d.ts.map