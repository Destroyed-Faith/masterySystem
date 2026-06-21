/**
 * Encounter Generator — balance model.
 *
 * Derives boss/minion stat blocks from analysed party metrics + a difficulty
 * setting. Pure and Foundry-free (unit-testable). Randomness (the Roll & Keep
 * simulator) is injectable via `rng`.
 *
 * The model is built on the engine reality documented in
 * encounter-generator-types.ts: NPC evade = MR*4 + floor(agility/8), NPC armor
 * = MR, NPC HP = explicit bars, per-phase attack/damage dice are honored.
 */
import { type Rng } from './encounter-generator-analysis.js';
import type { CompositionSelection, Difficulty, EncounterPlan, PartyMetrics } from './encounter-generator-types.js';
export interface DifficultyParams {
    /** Target rounds for the party to drop one boss (focus-fire equivalent). */
    bossTTKRounds: number;
    /** Target fraction of party attacks that should hit the boss. */
    partyHitRateVsBoss: number;
    /** Target fraction of boss attacks that should hit the party. */
    bossHitRateVsParty: number;
    /** Boss hit damage as a fraction of average PC HP (after mitigation). */
    bossHitDamageFrac: number;
    /** Percentile of party single-hit damage used as minion HP (higher = tougher). */
    minionHpPercentile: number;
    /** Minion hit damage as a fraction of average PC HP (after mitigation). */
    minionDamageFrac: number;
    /** Added to the party median MR for the boss MR. */
    bossMrOffset: number;
    /** Boss attack actions ≈ partySize * this (split across bosses). */
    bossSlotFactor: number;
    /** Recommended minion respawn cadence in rounds. */
    respawnCadence: number;
    /** Recommended minions-per-wave as a fraction of party clear rate. */
    respawnPressure: number;
}
export declare const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams>;
/** Escalation multiplier for phase `i` (0-based) on attack/damage dice. */
export declare function escalationFactor(phaseIndex: number): number;
/** Split a HP total across N phases (equal-ish; remainder on the last phase). */
export declare function splitHpAcrossPhases(totalHp: number, phases: number): number[];
/**
 * Choose MR so that MR×4 meets or exceeds targetEvade, keeping MR at least `minMr`.
 */
export declare function evadeToMrAgility(targetEvade: number, minMr: number): {
    mr: number;
    agility: number;
    realizedEvade: number;
};
/** Number of d8 whose exploding mean is closest to `targetRawDamage`. */
export declare function damageDiceForTarget(targetRawDamage: number, lo?: number, hi?: number): number;
/**
 * Search dice pool size (lo..hi) whose hit rate vs `targetEvade` (keeping
 * `keepMr` dice) is closest to `targetRate`.
 */
export declare function solveAttackDiceForHitRate(targetEvade: number, keepMr: number, targetRate: number, lo?: number, hi?: number, samples?: number, rng?: Rng): number;
/** Recommended respawn settings for the chosen difficulty + party size. */
export declare function recommendRespawn(party: PartyMetrics, params: DifficultyParams): {
    perWave: number;
    cadence: number;
};
/** Derive a full, editable encounter plan. */
export declare function deriveEncounterPlan(party: PartyMetrics, difficulty: Difficulty, composition: CompositionSelection, rng?: Rng): EncounterPlan;
//# sourceMappingURL=encounter-generator-balance.d.ts.map