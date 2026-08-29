/**
 * Personal diminishing-special token tray, left of the Foundry hotbar.
 * Visualizes `system.statusEffects` — it never stores a second stack value.
 */
export declare function registerSpecialTokenAreaSettings(): void;
export declare function combatIsActive(combat: any): boolean;
export declare function sameHudActor(a: any, b: any): boolean;
export declare function resolveCombatantActor(combatant: any, actors?: any): any | null;
export declare function actorInCombat(actor: any, combat: any, actors?: any): boolean;
/** The personal coin tray is for that user's creature — never a player character on the GM client. */
export declare function isGmTokenHudActor(actor: any): boolean;
export declare function resolveSpecialTokenHudActor(): any | null;
export declare function refreshSpecialTokenArea(): Promise<void>;
export declare function initializeSpecialTokenArea(): void;
//# sourceMappingURL=special-token-area.d.ts.map