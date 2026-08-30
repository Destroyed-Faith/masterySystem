/**
 * Defense Solver + Health Solver.
 *
 * Answers: "What defense values let this enemy/phase survive ~2–3 rounds
 * against THIS party — while actually feeling like its chosen defensive
 * identity?"
 *
 * Method (no hardcoded 60/30/10 outcomes):
 *  1. Build a baseline body (Evade at the no-identity baseline, nothing else)
 *     and measure the party's expected per-round output via the round
 *     simulator (includes Specials escalation, spells vs Casting TN, ...).
 *  2. Give each selected defense slot a prevention target: its identity
 *     share × the total mitigation budget (both central tuning values).
 *  3. Binary-search each defense's magnitude until its MEASURED prevented
 *     damage per round (marginal, simulator-evaluated against the real
 *     per-PC profiles) matches its target. Defenses that cannot reach their
 *     target against this party (e.g. Spell Resistance vs a spell-less
 *     party) get the minimal value and are reported for the validator.
 *  4. Health is solved LAST as the residual durability value: the cumulative
 *     expected damage curve, evaluated at the target phase duration.
 *
 * Absorption and Damage Negation cannot be represented on generated NPCs
 * (no NPC stone pools; DN is not consumed by the live damage pipeline) —
 * they are reported as unsupported instead of silently redefined.
 */
import type { DefenseKind, DefenseSelection } from './encounter-model.js';
import type { PartyProfile } from './party-analyzer.js';
import { type AddClearWave, type BodyDurabilityConfig, type SolvedDefenses } from './encounter-simulator.js';
/** Whether a defense can be legally represented on a generated NPC. */
export declare const NPC_DEFENSE_SUPPORT: Record<DefenseKind, {
    supported: boolean;
    note: string;
}>;
export interface DefenseContribution {
    kind: DefenseKind;
    slot: 'primary' | 'secondary' | 'tertiary';
    value: number;
    /** Damage per round this defense actually prevents vs this party (measured). */
    preventedPerRound: number;
    /** Share of the total measured prevention. */
    share: number;
    supported: boolean;
}
export interface SolvedDefensePackage {
    defenses: SolvedDefenses;
    contributions: DefenseContribution[];
    /** Party expected output per round vs the fully solved configuration. */
    netOutputPerRound: number;
    /** Party expected output per round vs the undefended baseline. */
    baselineOutputPerRound: number;
    notes: string[];
}
export interface HealthSolveResult {
    /** Health per body (index-aligned with the bodies array). */
    healths: number[];
    expectedPhaseRounds: number;
    favorableRounds: number;
    unfavorableRounds: number;
    burstRounds: number;
    timeToFirstDrop: number;
    /** Expected party damage per round (round-indexed) vs the first body. */
    roundDamage: number[];
    cumulativeDamage: number[];
}
export interface DefenseSolveInput {
    party: PartyProfile;
    selection: DefenseSelection;
    /** NPC Mastery Rank (keep / spell TN / natural recovery — not a balance lever). */
    mr: number;
    meleeEscape: boolean;
    /** Add-clearing pressure in this phase (affects measured party output). */
    addWaves?: AddClearWave[];
}
export declare function solveDefenses(input: DefenseSolveInput): SolvedDefensePackage;
export interface HealthSolveInput {
    party: PartyProfile;
    bodies: BodyDurabilityConfig[];
    /** Relative durability weight per body (default equal). */
    weights?: number[];
    addWaves?: AddClearWave[];
    /** Injury feedback: per-member per-round pool penalty fractions. */
    poolPenaltyByRound?: number[][];
    /** Explicit GM health overrides per body (null = solve). */
    healthOverrides?: (number | null)[];
}
/**
 * Solve per-body phase Health so the ENCOUNTER PHASE completes at the target
 * duration under focus fire, then report expected/favorable/unfavorable and
 * burst durations for the solved (or overridden) values.
 */
export declare function solvePhaseHealth(input: HealthSolveInput): HealthSolveResult;
//# sourceMappingURL=defense-solver.d.ts.map