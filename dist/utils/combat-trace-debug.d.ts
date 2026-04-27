/**
 * Optional diagnostics for combat rounds, turn order, and initiative values.
 *
 * Enable any of:
 * - World setting **Debug: Combat turns & initiative** (`debugCombatTurns`)
 * - Client setting **Debug Mode** (`debugMode`)
 * - Console: `globalThis.MSY_DEBUG_COMBAT = true` then reload.
 *
 * Initiative / Karussell / `turns` vs. `combatants` (extra detail):
 * - Console: `globalThis.MSY_DEBUG_INITIATIVE = true` (reload optional if hooks miss it)
 * - Or enable any of the flags above — then `logInitiativeOrderDebug` also fires.
 */
export declare function isCombatTraceDebugEnabled(): boolean;
/** Verbose initiative / `combat.turns` / carousel alignment (console). */
export declare function isInitiativeOrderDebugEnabled(): boolean;
/**
 * `combat.combatants` iteration order (often encounter / sheet order — not necessarily `turns`).
 * Compare to `buildCombatTurnSnapshot().turnOrder` to spot mismatches.
 */
export declare function buildCombatantsIteratorOrder(combat: any): unknown[];
export declare function logInitiativeOrderDebug(phase: string, payload: Record<string, unknown>): void;
/** Serialize `combat.turns` + current pointer for console diagnosis (init order, ini 0 vs 42, etc.). */
export declare function buildCombatTurnSnapshot(combat: any): Record<string, unknown>;
export declare function logCombatTrace(phase: string, payload: Record<string, unknown>): void;
//# sourceMappingURL=combat-trace-debug.d.ts.map