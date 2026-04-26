/**
 * Optional diagnostics for Damage Reduction (sheet strip, carousel, mitigation).
 *
 * Enable any of:
 * - World setting **Debug: Damage Reduction** (module settings), or
 * - Client setting **Debug Mode** (verbose), or
 * - Browser console: `globalThis.MSY_DEBUG_DR = true` then reload / re-open sheet.
 */
export function isDrDebugEnabled() {
    try {
        if (globalThis.MSY_DEBUG_DR === true)
            return true;
        const g = globalThis.game;
        if (!g?.settings?.get)
            return false;
        if (g.settings.get('mastery-system', 'debugDamageReduction') === true)
            return true;
        return g.settings.get('mastery-system', 'debugMode') === true;
    }
    catch {
        return false;
    }
}
export function logDrDebug(phase, payload) {
    if (!isDrDebugEnabled())
        return;
    try {
        console.warn(`Mastery System | [DR-DEBUG] ${phase}`, payload);
    }
    catch {
        /* ignore */
    }
}
//# sourceMappingURL=dr-debug.js.map