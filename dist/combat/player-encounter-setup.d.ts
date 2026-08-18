/**
 * Player-side encounter setup: Passives → Stones (Initiative Exchange).
 * Opens on first scene/combat load after the GM started the encounter.
 * Closing with ✕ leaves the step pending; it does not lock or confirm.
 * A per-session dismiss set prevents the same dialog from immediately
 * reopening after ✕; Join Game As / reload starts a new session.
 */
export declare function clearPlayerEncounterSetupSession(): void;
/**
 * Resume pending setup for every locally owned PC in the active encounter.
 */
export declare function resumePlayerEncounterSetup(combat?: Combat | null): Promise<void>;
//# sourceMappingURL=player-encounter-setup.d.ts.map