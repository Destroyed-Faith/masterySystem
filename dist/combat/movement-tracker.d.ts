/**
 * Movement-based Special-Effect enforcement (Lacerate + Slow).
 *
 *   Lacerate(X): the first time each turn you voluntarily move > 0 m, take X.
 *                Moving > half your Speed adds +X; exceeding your Speed (Dash /
 *                Sprint) adds +X again.
 *   Slow(X):     if you do not voluntarily move at least 1 m during your turn,
 *                take X damage at the end of your turn.
 *
 * Movement is tracked per-turn on the acting creature via actor flags. Token
 * drags/animations are treated as voluntary movement. GM-side only.
 */
/** Reset per-turn movement tracking for the creature whose turn is starting. */
export declare function resetMovementForTurn(actor: any): Promise<void>;
/**
 * Handle a token move: accumulate meters and apply Lacerate thresholds. Only
 * processes the token belonging to the current combatant.
 */
export declare function handleTokenMovement(tokenDoc: any, changes: any): Promise<void>;
/**
 * End-of-turn Slow check for the creature whose turn just ended: if it did not
 * voluntarily move at least 1 m, it takes Slow(X) damage.
 */
export declare function processTurnEndMovement(actor: any): Promise<void>;
//# sourceMappingURL=movement-tracker.d.ts.map