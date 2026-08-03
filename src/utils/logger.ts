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

function debugEnabled(): boolean {
  try {
    const cfg = (globalThis as any).CONFIG;
    if (cfg?.masterySystemDebug === true) return true;
    if (cfg?.masterySystemDebug === false) return false;
  } catch {
    /* ignore */
  }
  try {
    const g = (globalThis as any).game;
    if (g?.settings?.get) {
      return g.settings.get('mastery-system', 'debugMode') === true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export const log = {
  debug(...args: unknown[]): void {
    if (!debugEnabled()) return;
    console.debug(PREFIX, ...args);
  },
  info(...args: unknown[]): void {
    if (!debugEnabled()) return;
    console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    console.error(PREFIX, ...args);
  },
  /** Whether verbose logging is currently enabled. */
  isDebug: debugEnabled,
};
