/** Players never see/use Next Turn on NPCs — it only confuses them. */
export declare function canViewerSeeEndTurn(actor: any, user: any): boolean;
/**
 * Request to advance the active encounter one turn (same as Foundry's next turn).
 * If user is GM or owns the current combatant, advance turn.
 */
export declare function requestEndTurn(): Promise<void>;
//# sourceMappingURL=end-turn.d.ts.map