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
 * Each bar = (Resolve + Wits) × 2
 */
export declare function calculateStressBarMax(resolve: number, wits: number): number;
/**
 * Initialize stress bars with proper max values
 * 5 bars: Healthy, Stressed, Not Well, Breaking, Breakdown
 * Each bar = (Resolve + Wits) × 2 boxes
 */
export declare function initializeStressBars(resolve: number, wits: number): HealthBar[];
/**
 * Update stress bars when resolve or wits changes
 */
export declare function updateStressBars(bars: HealthBar[], resolve: number, wits: number): void;
/**
 * Apply stress damage to stress bars
 * Returns the new current bar index
 */
export declare function applyStress(bars: HealthBar[], currentBar: number, stress: number): number;
/**
 * Calculate maximum skill rank based on Mastery Rank
 * Max skill = 4 × Mastery Rank
 */
export declare function calculateMaxSkillRank(masteryRank: number): number;
/**
 * Validate skill value against mastery rank
 */
export declare function validateSkillValue(skillValue: number, masteryRank: number): number;
//# sourceMappingURL=calculations.d.ts.map