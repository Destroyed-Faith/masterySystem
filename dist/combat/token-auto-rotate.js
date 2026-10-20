/**
 * Foundry v13+ auto-rotates tokens to face the movement direction.
 * DF uses portrait/pog art (not top-down), so that reads as a wrong 90°/180° flip.
 * Disable auto-rotate on every move; manual Ctrl+scroll rotation still works.
 */
/** Foundry TokenPreMovementOperation — only autoRotate / showRuler are writable. */
export function disableMovementAutoRotate(movement) {
    if (!movement || typeof movement !== 'object')
        return;
    movement.autoRotate = false;
}
export function registerTokenAutoRotateHooks() {
    Hooks.on('preMoveToken', (_tokenDoc, movement) => {
        disableMovementAutoRotate(movement);
    });
}
//# sourceMappingURL=token-auto-rotate.js.map