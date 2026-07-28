/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */
/**
 * After stone powers: Round 1 runs the full initiative phase (dice + CR + Initiative Shop
 * for PCs, `setupTurns`, Mastery first-actor sync). Rounds 2+ keep the existing Initiative —
 * per the Players Guide, Initiative is NOT rolled again each round and the Initiative Shop
 * does not reopen automatically (only effects like Wits Stone Powers may allow it). We only
 * re-sync the turn pointer to the highest remaining Initiative. Idempotent per round via
 * `initiativePhaseDoneByRound`.
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
export declare function initializeStonePowersFlow(): void;
//# sourceMappingURL=stone-powers-flow.d.ts.map