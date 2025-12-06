/**
 * Combat Integration for Mastery System
 * Handles custom initiative rolling, Initiative Shop, and round management
 *
 * Initiative is rolled each round:
 * - NPCs roll automatically
 * - PCs roll and then access the Initiative Shop
 */
/**
 * Initialize combat hooks
 */
export declare function initializeCombatHooks(): void;
/**
 * Get initiative data for a combatant
 */
export declare function getCombatantInitiativeData(combatant: any): any;
/**
 * Check if a combatant has purchased Initiative Swap
 */
export declare function canSwapInitiative(combatant: any): boolean;
//# sourceMappingURL=initiative.d.ts.map