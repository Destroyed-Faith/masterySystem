/**
 * Optional diagnostics for combat rounds, turn order, and initiative values.
 *
 * Enable any of:
 * - World setting **Debug: Combat turns & initiative** (`debugCombatTurns`)
 * - Client setting **Debug Mode** (`debugMode`)
 * - Console: `globalThis.MSY_DEBUG_COMBAT = true` then reload.
 */
export declare function isCombatTraceDebugEnabled(): boolean;
/** Serialize `combat.turns` + current pointer for console diagnosis (init order, ini 0 vs 42, etc.). */
export declare function buildCombatTurnSnapshot(combat: any): Record<string, unknown>;
export declare function logCombatTrace(phase: string, payload: Record<string, unknown>): void;
//# sourceMappingURL=combat-trace-debug.d.ts.map