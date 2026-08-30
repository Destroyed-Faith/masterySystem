/**
 * Encounter Forge orchestrator.
 *
 * Runs the full pipeline for a GM design against the selected party:
 *
 *   Party analysis -> per-phase: Defense Solver -> Health Solver (residual)
 *   -> Action Economy Solver -> Offense Solver (per-PC matrix) -> NPC offense
 *   simulation -> injury feedback pass -> phase report.
 *
 * Everything is deterministic: the same design + the same party always
 * produces the identical solution (no Math.random anywhere downstream).
 *
 * NPC Mastery Rank is set to the party's median MR — its only roles are the
 * legitimate system ones (keep dice, NPC spell TN, natural recovery). It is
 * NOT a balancing lever; all balancing derives from the solvers.
 */
import type { EncounterDesign } from './encounter-model.js';
import { type PartyProfile } from './party-analyzer.js';
import { type HealthSolveResult, type SolvedDefensePackage } from './defense-solver.js';
import { type ActionEconomyRecommendation, type OffenseSimulationResult, type SolvedAttack } from './offense-solver.js';
export interface SolvedEnemyPhase {
    enemyId: string;
    enemyName: string;
    phaseIndex: number;
    mr: number;
    defensePackage: SolvedDefensePackage;
    /** Solved phase health for THIS phase pool. */
    health: number;
    offensiveActions: number;
    attacks: SolvedAttack[];
    /** True when the enemy pays an attack action to summon in this phase. */
    paysSummonAction: boolean;
}
export interface SolvedAddGroup {
    groupId: string;
    name: string;
    count: number;
    arrivalRound: number;
    attacks: SolvedAttack | null;
    /** Health per add body (from hits-to-kill vs this party). */
    healthPerAdd: number;
}
export interface SolvedPhase {
    phaseIndex: number;
    enemies: SolvedEnemyPhase[];
    adds: SolvedAddGroup[];
    actionEconomy: ActionEconomyRecommendation;
    durability: HealthSolveResult;
    offense: OffenseSimulationResult;
    /** Hostile offensive actions remaining after the first body drops. */
    hostileActionsAfterFirstDrop: number;
}
export interface EncounterSolution {
    party: PartyProfile;
    phases: SolvedPhase[];
    totalExpectedRounds: number;
    /** Developer-facing derivation notes (diagnostics, not GM UI). */
    diagnostics: string[];
}
export declare function solveEncounter(design: EncounterDesign, partyActors: any[]): EncounterSolution;
export declare function solveEncounterForParty(design: EncounterDesign, party: PartyProfile): EncounterSolution;
//# sourceMappingURL=solve-encounter.d.ts.map