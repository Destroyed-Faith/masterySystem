/**
 * Player-side encounter setup: apply default Passives, then open Stones
 * (Initiative Exchange + Passives button). Closing Stones with ✕ leaves
 * that step pending. A per-session dismiss set prevents the same dialog
 * from immediately reopening after ✕; Join Game As / reload starts a new session.
 */
export declare function clearPlayerEncounterSetupSession(): void;
/**
 * Resume pending setup for every locally owned PC in the active encounter.
 */
export declare function resumePlayerEncounterSetup(combat?: Combat | null): Promise<void>;
/** @internal Exported for pipeline tests. */
export declare function runPlayerSetupForCombatant(combat: Combat, combatant: Combatant): Promise<void>;
//# sourceMappingURL=player-encounter-setup.d.ts.map