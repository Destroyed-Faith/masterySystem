/**
 * Round-based deterministic encounter simulator — party offense direction.
 *
 * Computes the expected round-by-round damage the selected party deals to a
 * concrete enemy body configuration, respecting the canonical resolution
 * pipeline (parry strip -> to-hit vs Evade / Casting TN -> phasing -> ward ->
 * damage roll -> penetration -> armor -> DR% -> natural-8 floor) and the
 * canonical Special rules (application cap, tick, natural recovery, decay).
 *
 * Player Specials escalate later rounds: Corrode lowers the body's Armor,
 * Expose lowers Evade, Sundered/Hex add damage dice, Ruin ticks. This is why
 * phase Health cannot be "party DPR × rounds" — the cumulative curve is
 * genuinely non-linear.
 *
 * All quantities are expected values; no Math.random anywhere.
 */
import type { PartyProfile } from './party-analyzer.js';
/** Solved defensive values of one enemy body in one phase. */
export interface SolvedDefenses {
    evade: number;
    armor: number;
    /** Attack dice stripped per round from the strongest incoming attack. */
    parryStrip: number;
    /** Incoming special values reduced by this amount (Ward). */
    ward: number;
    /** Damage dice removed per round from the strongest incoming damage roll. */
    damageNegationDice: number;
    drPct: number;
    spellResistance: number;
    /** Hits negated outright over the phase (Phasing charges). */
    phasingCharges: number;
}
export declare function emptySolvedDefenses(): SolvedDefenses;
/** One enemy body as the durability simulation sees it. */
export interface BodyDurabilityConfig {
    id: string;
    name: string;
    mr: number;
    defenses: SolvedDefenses;
    /** Movement reliably escapes melee pressure (teleport/flight vs ground party). */
    meleeEscape: boolean;
    /** Expected voluntary moves per round (Lacerate/Slow interaction). */
    movesPerRound: number;
}
/** Hits the party must spend clearing adds, arriving at a given round. */
export interface AddClearWave {
    round: number;
    hits: number;
}
export interface PartyDamageOptions {
    /** Party output scale (favorable/unfavorable bands). */
    outputFactor?: number;
    /** Burst mode: round-1 stone spending (extra attacks + bonus damage dice). */
    burst?: boolean;
    /** Per-round dice-pool penalty fraction per member (injury feedback). */
    poolPenaltyByRound?: number[][];
    addWaves?: AddClearWave[];
    maxRounds?: number;
}
export interface BodyDamageCurve {
    bodyId: string;
    /** Expected damage dealt to this body per round while it is the focus. */
    roundDamage: number[];
    cumulative: number[];
    /** Peak negative special stack total observed (diagnostics). */
    peakSpecialStacks: number;
}
/**
 * Simulate the party focusing ONE body for up to `maxRounds`, returning the
 * expected damage curve including Special escalation. Fresh special stacks —
 * callers model pre-stacking via focus windows (see solveFocusTimeline).
 */
export declare function simulateFocusDamageCurve(party: PartyProfile, body: BodyDurabilityConfig, options?: PartyDamageOptions): BodyDamageCurve;
export interface FocusTimelineResult {
    /** Rounds until each body drops (cumulative timeline, fractional). */
    killTimes: number[];
    /** Total expected phase duration in rounds. */
    phaseRounds: number;
    /** Rounds until the FIRST body drops. */
    timeToFirstDrop: number;
}
/**
 * Walk the focus-fire timeline: the party focuses bodies in order, each body
 * takes `focusFireEfficiency` of the party output while focused; the
 * remainder pre-damages the next body. Returns fractional kill times.
 */
export declare function solveFocusTimeline(party: PartyProfile, bodies: BodyDurabilityConfig[], healths: number[], options?: PartyDamageOptions): FocusTimelineResult;
//# sourceMappingURL=encounter-simulator.d.ts.map