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
declare function debugEnabled(): boolean;
export declare const log: {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    /** Whether verbose logging is currently enabled. */
    isDebug: typeof debugEnabled;
};
export {};
//# sourceMappingURL=logger.d.ts.map