/**
 * Encounter Generator — concept-driven design ("Kampfidee → Werte").
 *
 * Pure and Foundry-free. Takes an EncounterConcept (what the enemy should DO)
 * plus analysed party metrics and derives:
 *   - a boss stat block whose damage budget is SPLIT across boss actions,
 *     adds and environment mechanics (they share one encounter budget),
 *   - a power cycle built from real catalog power templates,
 *   - per-phase plans with real changes (not just bigger dice),
 *   - an adds plan using  Add Threat = expected actions until death × threat
 *     per action,
 *   - an environment plan for environmental encounters.
 *
 * Engine reality (see encounter-generator-types.ts): NPC evade = MR*4 +
 * floor(agility/8), NPC armor = MR, per-phase attack rows are honored.
 */
import { type Rng } from './encounter-generator-analysis.js';
import type { AddsConcept, AddsPlan, CombatStyle, CyclePowerEntry, Difficulty, EncounterConcept, EncounterProjectPlan, EnemyRank, PartyMetrics, SecondaryStyle, TargetingMode } from './encounter-generator-types.js';
export declare const RANK_TO_DIFFICULTY: Record<EnemyRank, Difficulty>;
/** Multiplier on the encounter's per-round damage budget and total HP. */
export declare const RANK_BUDGET_FACTOR: Record<EnemyRank, number>;
export declare function specialLabel(specialId: string | null): string;
/**
 * Group damage per round of the FULL add population, expressed in party
 * health levels: Harassment ≈ irrelevant single add, Noticeable ≈ ½ level,
 * Dangerous in Groups ≈ 1 level, Lethal if Ignored ≈ a PC down in 2 rounds.
 */
export declare function addPressureTargetHL(pressure: AddsConcept['pressure'], avgBarCount: number): number;
export declare function avgHealthLevelSize(party: PartyMetrics): number;
export declare function avgBarCount(party: PartyMetrics): number;
export declare function deriveAddsPlan(party: PartyMetrics, concept: EncounterConcept, rng?: Rng): AddsPlan | null;
/**
 * Build the power cycle for one phase. `perActionBudget` is the after-
 * mitigation damage one action should deal; specials are paid from it.
 */
export declare function buildPowerCycle(party: PartyMetrics, concept: EncounterConcept, perActionBudget: number, bossMr: number, options?: {
    phaseIndex?: number;
    damageFactor?: number;
    specialBonus?: number;
    hitRateTarget?: number;
}, rng?: Rng): CyclePowerEntry[];
export declare function deriveConceptPlan(party: PartyMetrics, concept: EncounterConcept, rng?: Rng): EncounterProjectPlan;
export interface ArchetypePreset {
    id: string;
    label: string;
    description: string;
    concept: EncounterConcept;
}
export declare function defaultConcept(): EncounterConcept;
export declare const ARCHETYPE_PRESETS: ArchetypePreset[];
export declare const STYLE_OPTIONS: Array<{
    value: CombatStyle;
    label: string;
}>;
export declare const SECONDARY_STYLE_OPTIONS: Array<{
    value: SecondaryStyle;
    label: string;
}>;
export declare const TARGETING_OPTIONS: Array<{
    value: TargetingMode;
    label: string;
}>;
export declare const RANK_OPTIONS: Array<{
    value: EnemyRank;
    label: string;
}>;
export declare const CYCLE_STYLE_OPTIONS: Array<{
    value: EncounterConcept['cycleStyle'];
    label: string;
}>;
export declare function primarySpecialOptions(): Array<{
    value: string;
    label: string;
}>;
//# sourceMappingURL=encounter-generator-concept.d.ts.map