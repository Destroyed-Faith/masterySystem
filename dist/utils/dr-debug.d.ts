/**
 * Optional diagnostics for Damage Reduction (sheet strip, carousel, mitigation).
 *
 * Enable any of:
 * - World setting **Debug: Damage Reduction** (module settings), or
 * - Client setting **Debug Mode** (verbose), or
 * - Browser console: `globalThis.MSY_DEBUG_DR = true` then reload / re-open sheet.
 */
export declare function isDrDebugEnabled(): boolean;
export declare function logDrDebug(phase: string, payload: Record<string, unknown>): void;
//# sourceMappingURL=dr-debug.d.ts.map