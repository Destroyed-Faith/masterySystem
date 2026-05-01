/**
 * Calculation utilities for Mastery System
 * Handles Stones, Health Bars, and other derived values
 */
import { AttributeData, HealthBar } from '../types';
/**
 * Calculate the number of Stones from an attribute value
 * Every 8 attribute points = 1 Stone
 */
export declare function calculateStones(attributeValue: number): number;
/**
 * Calculate total Stones from all attributes
 */
export declare function calculateTotalStones(attributes: Record<string, AttributeData>): number;
/**
 * Update stones for a single attribute
 */
export declare function updateAttributeStones(attribute: AttributeData): void;
/**
 * Calculate Health Bar maximum HP
 * Each bar = Vitality × 2
 */
export declare function calculateHealthBarMax(vitality: number): number;
/**
 * Initialize health bars with proper max HP values.
 *
 * Players Guide ~6499–6513 — five health levels:
 *   Healthy → Bruised → Injured → Wounded → Incapacitated.
 * Each non-Incapacitated bar holds `Vitality × 2` boxes; Incapacitated is a
 * single-box "you go down at 0" state. The legacy `penalty` field stores the
 * flat dice penalty for the rare callers that still want a per-step value;
 * the canonical penalty is the percentage table in `HEALTH_PENALTY_FRACTIONS`.
 */
export declare function initializeHealthBars(vitality: number): HealthBar[];
/**
 * Update health bars when vitality changes.
 *
 * Bars 0–3 carry `Vitality × 2` boxes; the fifth bar (Incapacitated) is a
 * single box and never scales with Vitality (Players Guide ~6510). Older
 * actors created before the 5-bar migration may still have only four bars
 * — in that case we append the Incapacitated bar in place.
 */
export declare function updateHealthBars(bars: HealthBar[], vitality: number): void;
/**
 * Get the current active health bar penalty.
 *
 * Players Guide ~6518–6544: the dice penalty is **a fraction of the rolled
 * pool**, applied late in the stack and floored (never below 0). The
 * fractions per broken bar live in `HEALTH_PENALTY_FRACTIONS` (0%, 10%,
 * 20%, 30%, 40%). Pre-migration callers without a `pool` argument get the
 * legacy flat dice penalty so existing code paths keep working until they
 * are switched over to the percentage-aware variant.
 *
 * @param bars        actor health bars
 * @param _currentBar legacy index — ignored; we always use the first broken bar
 * @param pool        optional pre-penalty dice pool (Attribute, MR, etc.)
 */
export declare function getCurrentPenalty(bars: HealthBar[], _currentBar: number, pool?: number): number;
/**
 * Apply damage to health bars
 * Returns the new current bar index (clamped to max bars - 1)
 * Damage flows through bars: when a bar is depleted, overflow goes to next bar
 */
export declare function applyDamage(bars: HealthBar[], currentBar: number, damage: number): number;
/**
 * Heal HP in the current health bar
 * Healing never moves you to a higher bar
 */
export declare function healDamage(bars: HealthBar[], currentBar: number, healing: number): void;
/**
 * Calculate Stress Bar maximum
 * Each bar = Resolve + Intellect
 */
export declare function calculateStressBarMax(resolve: number, intellect: number): number;
/**
 * Initialize stress bars with proper max values
 * 4 bars: Healthy, Stressed, Not Well, Breaking
 * Each bar = Resolve + Intellect boxes
 */
export declare function initializeStressBars(resolve: number, intellect: number): HealthBar[];
/**
 * Update stress bars when resolve or intellect changes
 */
export declare function updateStressBars(bars: HealthBar[], resolve: number, intellect: number): void;
/**
 * Apply stress damage to stress bars
 * Returns the new current bar index
 */
export declare function applyStress(bars: HealthBar[], currentBar: number, stress: number): number;
/**
 * Heal (remove) stress from stress bars: fill capacity from the current bar backward.
 */
export declare function healStressFromBars(bars: HealthBar[], currentBar: number, amount: number): {
    bars: HealthBar[];
    currentBar: number;
};
/**
 * Calculate maximum skill rank based on Mastery Rank
 * Max skill = 4 × Mastery Rank
 */
export declare function calculateMaxSkillRank(masteryRank: number): number;
/**
 * Validate skill value against mastery rank
 */
export declare function validateSkillValue(skillValue: number, masteryRank: number): number;
/**
 * Might Scaling: Melee Damage bonus = 2 * floor(Might / 8)
 * Flat bonus applied per successful melee/unarmed hit.
 */
export declare function calculateMightDamageBonus(might: number): number;
/**
 * Agility Scaling: Evade bonus = floor(Agility / 8)
 */
export declare function calculateAgilityEvadeBonus(agility: number): number;
/**
 * Agility Scaling: Range band extensions
 * Short: +floor(Agility/8) m
 * Medium: +2*floor(Agility/8) m
 * Long: +floor(Agility/8) m
 */
export declare function calculateAgilityRangeBonus(agility: number): {
    short: number;
    medium: number;
    long: number;
};
/**
 * Intellect Scaling: Saving throw TN increase against your spells = floor(Intellect / 8)
 */
export declare function calculateIntellectSaveTNBonus(intellect: number): number;
/**
 * Resolve Scaling: Stress Armor = floor(Resolve / 8)
 * Reduces incoming stress by this amount (min 0).
 * Does not apply to voluntary stress costs.
 */
export declare function calculateResolveStressArmor(resolve: number): number;
/**
 * Influence Scaling: +floor(Influence/8) bonus to two chosen skill rolls
 */
export declare function calculateInfluenceSkillBonus(influence: number): number;
/**
 * Wits Scaling: Initiative bonus = floor(Wits / 8)
 */
export declare function calculateWitsInitiativeBonus(wits: number): number;
/**
 * Armor Breaker (Might): Penetration = floor(Might / 8)
 * Stacks with weapon penetration and power penetration.
 */
export declare function calculateArmorBreaker(might: number): number;
/**
 * Evade formula: MR * 4 + size mod + shield bonus + passives + agility scaling
 */
export declare function calculateBaseEvade(masteryRank: number): number;
//# sourceMappingURL=calculations.d.ts.map