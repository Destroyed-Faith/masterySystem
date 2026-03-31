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
 * Initialize health bars with proper max HP values
 * 4 bars: Healthy (0 penalty), Bruised (-1 penalty), Injured (-2 penalty), Wounded (-4 penalty)
 * Each bar = Vitality × 2 boxes
 */
export declare function initializeHealthBars(vitality: number): HealthBar[];
/**
 * Update health bars when vitality changes
 */
export declare function updateHealthBars(bars: HealthBar[], vitality: number): void;
/**
 * Get the current active health bar penalty
 * Penalty applies when a health bar is broken (current < max)
 * Returns the penalty value from the first broken bar (checking from bar 0 upwards)
 *
 * Rules:
 * - Healthy (bar 0): No penalty (penalty = 0)
 * - Bruised (bar 1): -1 penalty if current < max
 * - Injured (bar 2): -2 penalty if current < max
 * - Wounded (bar 3): -4 penalty if current < max
 *
 * The penalty applies as soon as a bar is broken (current < max).
 * We check from bar 0 upwards to find the first broken bar.
 */
export declare function getCurrentPenalty(bars: HealthBar[], currentBar: number): number;
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