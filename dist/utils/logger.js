/**
 * Central Mastery System logger.
 *
 * Verbose `debug` / `info` output is disabled by default.
 * Enable via:
 *   - Foundry client setting **Debug Mode** (`mastery-system.debugMode`), or
 *   - `CONFIG.masterySystemDebug = true` in the browser console
 *
 * `warn` and `error` always emit.
 */
const PREFIX = 'Mastery System |';
function debugEnabled() {
    try {
        const cfg = globalThis.CONFIG;
        if (cfg?.masterySystemDebug === true)
            return true;
        if (cfg?.masterySystemDebug === false)
            return false;
    }
    catch {
        /* ignore */
    }
    try {
        const g = globalThis.game;
        if (g?.settings?.get) {
            return g.settings.get('mastery-system', 'debugMode') === true;
        }
    }
    catch {
        /* ignore */
    }
    return false;
}
export const log = {
    debug(...args) {
        if (!debugEnabled())
            return;
        console.debug(PREFIX, ...args);
    },
    info(...args) {
        if (!debugEnabled())
            return;
        console.log(PREFIX, ...args);
    },
    warn(...args) {
        console.warn(PREFIX, ...args);
    },
    error(...args) {
        console.error(PREFIX, ...args);
    },
    /** Whether verbose logging is currently enabled. */
    isDebug: debugEnabled,
};
//# sourceMappingURL=logger.js.map