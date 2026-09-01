/**
 * Action Economy Solver + Offense Solver.
 *
 * Action economy: after structure and durability are known, recommend the
 * total hostile offensive actions per round from the PARTY's real action
 * economy (all active hostile bodies share ONE encounter pressure envelope —
 * multiple bosses never each get a full solo budget).
 *
 * Offense: for every NPC attack concept, simulate it against every selected
 * PC individually (attacker/defender matrix — no "average PC") and solve
 * fair Attack Dice, Damage Dice and Special magnitude so the encounter's
 * expected pressure matches the central tuning target. Martial attacks
 * resolve vs each PC's Evade (+ expected defensive reactions); Spells vs the
 * NPC Casting TN (8 × MR) + that PC's Spell Resistance. AoE evaluates
 * explicit occupancy cases instead of a hidden fixed target count.
 */
import type { AttackConcept } from './encounter-model.js';
import type { PartyProfile, PcCombatProfile } from './party-analyzer.js';
export interface PartyActionEconomy {
    /** Sustained offensive actions per round (1 per PC). Stone extras are Burst-only. */
    offensiveActionsPerRound: number;
    /** Always 0 — extra stone actions are not treated as permanently available. */
    sustainableExtraActions: number;
    /** Temporary extra attacks available in a Burst round. */
    burstExtraActions: number;
    reactionsPerRound: number;
}
export declare function analyzePartyActionEconomy(party: PartyProfile): PartyActionEconomy;
export interface ActionEconomyRecommendation {
    totalHostileActions: number;
    /** Recommended offensive actions per main-enemy body (index-aligned). */
    perBody: number[];
    /** Hostile actions consumed by attacking adds. */
    addActions: number;
    /** Party side, for the review. */
    party: PartyActionEconomy;
}
export declare function recommendActionEconomy(party: PartyProfile, bodyCount: number, attackingAdds: number): ActionEconomyRecommendation;
export interface AoeOccupancy {
    single: number;
    typical: number;
    dangerous: number;
}
export interface SolvedAttack {
    conceptId: string;
    name: string;
    resolution: 'martial' | 'spell';
    delivery: 'melee' | 'ranged';
    area: AttackConcept['area'];
    areaSize: number;
    range: number;
    attackPool: number;
    keep: number;
    damageDice: number;
    penetration: number;
    specialId: string | null;
    specialValue: number;
    stress: boolean;
    /** Uses per round (1 unless the GM assigned more actions than concepts). */
    usesPerRound: number;
    /** Explicit occupancy assumptions for AoE review lines. */
    occupancy: AoeOccupancy | null;
    /** True when pool 20 still cannot reach the target hit chance. */
    poolAtCap: boolean;
    /** Matrix-average connect chance the solver used (same TN as Review). */
    achievedHitChance: number;
}
/** Occupancy cases when map geometry is unknown (explicit, never hidden). */
export declare function aoeOccupancy(partySize: number): AoeOccupancy;
/**
 * Damage-equivalent pressure of ONE point of a special applied to a PC,
 * integrated over its lifetime (victim ticks, recovers MR, decays 1).
 *
 * Estimators follow the canonical special rules; control-type specials use
 * the equivalence "1 point of prevented/lost party output = 1 damage".
 * Unknown specials use a conservative 1 damage-equivalent per point-round.
 */
export declare function specialPressurePerPoint(id: string, pc: PcCombatProfile, avgNpcHitDamage: number, avgNpcConnect: number): number;
export interface AttackSolveContext {
    party: PartyProfile;
    npcMr: number;
    /** Total hostile attack instances per round in this phase (reaction spread). */
    totalHostileAttacks: number;
    /** HL-per-round pressure budget for this single attack instance. */
    hlBudget: number;
}
/** Solve pool, damage dice and special value for one attack concept. */
export declare function solveAttack(concept: AttackConcept, ctx: AttackSolveContext): SolvedAttack;
export interface PcAttackThreat {
    attackName: string;
    connectChance: number;
    expectedDamageOnHit: number;
    expectedHlOnHit: number;
}
export interface PcThreatReport {
    actorId: string;
    name: string;
    byAttack: PcAttackThreat[];
    expectedHlLostPerRound: number;
    expectedHlLostPerPhase: number;
    /** Peak accumulated negative special stack total during the phase. */
    peakSpecialStacks: number;
    /** Pool penalty fraction per round caused by expected injuries. */
    poolPenaltyByRound: number[];
}
export interface OffenseSimulationResult {
    perPc: PcThreatReport[];
    partyHlLostPerRound: number;
    partyHlLostPerPhase: number;
    highestRiskPcName: string;
    /** 90th-percentile single-hit damage of the hardest attack vs softest PC. */
    worstSingleHitQ90: number;
    worstSingleHitTargetName: string;
    worstSingleHitAttackName: string;
}
/**
 * Simulate the solved hostile attacks against every PC individually across
 * the expected phase duration. Uniform target spread for totals (single
 * target attacks pick each PC 1/partySize of the time; AoE hits the typical
 * occupancy); per-PC rows report the "when targeted" values. Tracks Special
 * accumulation with canonical tick/recovery/decay, expected Health-Level
 * loss and the resulting dice-pool penalties (injury feedback).
 */
export declare function simulateNpcOffense(party: PartyProfile, attacks: SolvedAttack[], npcMr: number, phaseRounds: number, 
/** Must match the hostile-attack count `solveAttack` used for the TN. */
solverHostileAttacks?: number): OffenseSimulationResult;
//# sourceMappingURL=offense-solver.d.ts.map