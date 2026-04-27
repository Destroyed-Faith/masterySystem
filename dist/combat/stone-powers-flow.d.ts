/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 *
 * Round advance (Runde 2+): Regeneration muss vor Stone Powers laufen — siehe
 * `runMasteryCombatRoundAdvancePipeline` (ein Hook-Pfad, keine Race mit zweitem updateCombat).
 */
/**
 * After stone powers for a round: full initiative phase (dice + CR + Initiative Shop for PCs,
 * `setupTurns`, Mastery first-actor sync) for **every** round. Idempotent per round via
 * `initiativePhaseDoneByRound`. Carousel alignment uses Foundry `combat.turns` + existing sync.
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