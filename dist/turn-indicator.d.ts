/**
 * Turn Indicator - Blue Ring around Active Combatant
 *
 * Replaces the big d20 turn indicator with a subtle blue ring around the active token
 * Integrates with the radial menu to adjust size when menu is open
 */
/**
 * Clear the turn ring
 */
export declare function clearTurnRing(): void;
/**
 * Show turn ring for a token
 */
export declare function showTurnRingForToken(token: any, radius?: number): void;
/**
 * Update turn ring when radial menu opens/closes
 */
export declare function updateTurnRingForRadialMenu(token: any, radialOpen: boolean): void;
/**
 * Initialize turn indicator hooks
 */
export declare function initializeTurnIndicator(): void;
//# sourceMappingURL=turn-indicator.d.ts.map