/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */
export { arePlayerStonesReadyForRound, isStonePowersDone, warnIfPlayerStonesPending } from './stone-round-gate.js';
/**
 * Register a finished Stone Recovery for the round. Mirrors
 * `confirmStonePowersForCombatant`: the combatant step is written locally so it
 * survives without a GM client, the Combat flag stays GM-owned.
 */
export declare function confirmStoneRecoveryForCombatant(combat: Combat | null | undefined, combatant: Combatant | null | undefined): Promise<void>;
export declare function handleStoneRecoveryComplete(combat: Combat, combatantId: string, round: number): Promise<void>;
/**
 * Join Game As / no GM client: reset + regen owned actors, then open stone dialogs.
 * The GM path (`runMasteryCombatRoundAdvancePipeline`) already covers this when a GM is present.
 */
export declare function runPlayerOwnedRoundAdvance(combat: Combat, newRound: number): Promise<void>;
/**
 * After stone powers: leftover NPC rolls + sort by remaining Initiative.
 * PCs already rolled (and maybe converted) inside the Stone Powers dialog.
 * Idempotent per round via `initiativePhaseDoneByRound`.
 */
export declare function runInitiativePhaseAfterStones(combat: Combat, round: number): Promise<void>;
/**
 * Bei `updateCombat` mit neuem `round`: Locks für Stone-Powers-UI leeren, RoundState aller
 * Combatants zurücksetzen; ab Runde 2 zuerst Regen-Dialoge, dann Stone Powers + Initiative
 * (sofern `combat.started`). Runde 1: nur Reset — Stone Powers übernimmt `combatStart` /
 * Encounter-Flow.
 */
export declare function runMasteryCombatRoundAdvancePipeline(combat: Combat, newRound: number): Promise<void>;
export declare function openStonePowersForAllCombatants(combat: Combat, round: number): Promise<void>;
/**
 * Register a confirmed stone assignment, whichever way the dialog was opened
 * (player pipeline, GM fill, setup status row, forced dialog). Writes the
 * combatant step so it survives without a GM client, then lets the GM own the
 * Combat flag. Round 0 (prepare phase) counts as round 1, matching
 * `encounterStartBlockers`.
 */
export declare function confirmStonePowersForCombatant(combat: Combat | null | undefined, combatant: Combatant | null | undefined): Promise<void>;
/**
 * "Start Round N" from the carousel. Re-opens Stone Powers for every PC that
 * still owes an assignment (locally for the GM's own actors, over the socket for
 * the owning players) and runs the initiative phase as soon as nobody is left.
 * The round advance already does this once; a GM needs a way to repeat it when a
 * player closed the dialog or joined late.
 */
export declare function promptPendingStoneAssignments(combat: Combat): Promise<void>;
export declare function handleStonePowersComplete(combat: Combat, combatantId: string, round: number): Promise<void>;
export declare function initializeStonePowersFlow(): void;
//# sourceMappingURL=stone-powers-flow.d.ts.map