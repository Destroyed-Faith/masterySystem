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
 */
export declare function initializeHealthBars(vitality: number): HealthBar[];
/**
 * Update health bars when vitality changes
 */
export declare function updateHealthBars(bars: HealthBar[], vitality: number): void;
/**
 * Get the current active health bar penalty
 */
export declare function getCurrentPenalty(bars: HealthBar[], currentBar: number): number;
/**
 * Apply damage to health bars
 * Returns the new current bar index
 */
export declare function applyDamage(bars: HealthBar[], currentBar: number, damage: number): number;
/**
 * Heal HP in the current health bar
 * Healing never moves you to a higher bar
 */
export declare function healDamage(bars: HealthBar[], currentBar: number, healing: number): void;
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