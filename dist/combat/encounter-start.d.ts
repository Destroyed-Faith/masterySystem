/**
 * Encounter Start Flow
 *
 * Prepare Combat: mark setup started, show the carousel, notify players.
 * Player clients walk Passives → Stones. The fight does not start yet.
 * Start Combat (GM): sort by initiative and call Foundry startCombat.
 */
interface EncounterSetupState {
    started: boolean;
    combatId: string;
    passives: Record<string, {
        locked: boolean;
        data: any;
    }>;
    initiativeConfirmed: Record<string, boolean>;
    carouselShown: boolean;
}
/**
 * Get encounter setup state from combat flags
 */
export declare function getEncounterSetup(combat: Combat): EncounterSetupState;
/**
 * Handle passive selection completion for a combatant
 */
export declare function handlePassiveSelectionComplete(combat: Combat, actorId: string, data: any): Promise<void>;
/**
 * Handle initiative shop confirmation for a combatant
 */
export declare function handleInitiativeConfirmed(combat: Combat, combatantId: string, finalInitiative: number): Promise<void>;
export { encounterStartBlockers, isEncounterPreparing, isLaunchingLiveCombat, } from './stone-round-gate.js';
/** GM: roll leftover NPC initiative, sort, then actually start the fight. */
export declare function launchLiveCombat(combat: Combat): Promise<boolean>;
/** Native Foundry Start Combat during prepare is redirected or blocked. */
export declare function ensureEncounterSetupStarted(combat: Combat): Promise<void>;
/**
 * Begin encounter: mark started, show carousel, tell player owners to set up.
 * Passives / Stones auto-open only on the owning player. The GM opens them
 * from the character buttons when they need to step in.
 * NPCs do not roll initiative here — only via „Initiative würfeln“.
 */
export declare function beginEncounter(combat: Combat): Promise<void>;
/**
 * Initialize encounter start system
 */
export declare function initializeEncounterStart(): void;
//# sourceMappingURL=encounter-start.d.ts.map