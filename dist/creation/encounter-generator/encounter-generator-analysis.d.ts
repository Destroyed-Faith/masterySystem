/**
 * Encounter Generator — party analysis + Roll & Keep simulator.
 *
 * Pure, Foundry-free helpers (so they are unit-testable). `extractPartyMember`
 * reads from a Foundry actor's prepared `system` but is tolerant of partial
 * data and never throws.
 */
import type { PartyMemberMetrics, PartyMetrics } from './encounter-generator-types.js';
/** Mean of an exploding d8 (each natural 8 rerolls and adds): 36/7 ≈ 5.1429. */
export declare const EXPLODING_D8_MEAN: number;
export type Rng = () => number;
/** One exploding d8 result (face + chained explosions on natural 8s). */
export declare function rollExplodingD8(rng?: Rng): number;
/**
 * Roll `numDice` exploding d8, keep the `keep` highest die-totals, return the
 * sum. Mirrors the system's Roll & Keep engine (src/dice/roll-handler.ts).
 */
export declare function rollKeepSample(numDice: number, keep: number, rng?: Rng): number;
/**
 * Monte-Carlo sample of `numDice` keep `keep` totals, sorted ascending.
 */
export declare function simulateAttackTotals(numDice: number, keep: number, samples?: number, rng?: Rng): number[];
/** Value at quantile `q` (0..1) of a sorted-ascending array. */
export declare function quantile(sortedAsc: number[], q: number): number;
/** Fraction of samples >= tn. */
export declare function hitRate(sortedAsc: number[], tn: number): number;
/** Mean number of raises (floor((total - tn)/4)) over samples that hit. */
export declare function meanRaisesOnHit(sortedAsc: number[], tn: number): number;
/** Parse a weapon's damage into an expected mean (exploding d8 assumed). */
export declare function estimateWeaponDamageMean(weaponSystem: any): number;
/**
 * Extract a combat profile from a Foundry `character` actor.
 * `samples` controls the Monte-Carlo size for this member's attack roll.
 */
export declare function extractPartyMember(actor: any, samples?: number, rng?: Rng): PartyMemberMetrics;
/** Aggregate a list of member metrics into party-level metrics. */
export declare function buildPartyMetrics(members: PartyMemberMetrics[]): PartyMetrics;
/** Convenience: extract metrics for a list of actors and aggregate. */
export declare function analyzeParty(actors: any[], samples?: number, rng?: Rng): PartyMetrics;
//# sourceMappingURL=encounter-generator-analysis.d.ts.map