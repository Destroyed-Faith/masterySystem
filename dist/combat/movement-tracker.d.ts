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
 * Handle a token move during combat.
 *
 * Batch 8.1: Persistent Zones + Special Auras react to **any** moved token
 * (not only the active combatant). Turn-economy tracking (moved meters,
 * Lacerate stages, Safe Movement notes) remains current-combatant-only.
 */
export declare function handleTokenMovement(tokenDoc: any, changes: any): Promise<void>;
/**
 * End-of-turn Slow check for the creature whose turn just ended: if it did not
 * voluntarily move at least 1 m, it takes Slow(X) damage.
 */
export declare function processTurnEndMovement(actor: any): Promise<void>;
//# sourceMappingURL=movement-tracker.d.ts.map