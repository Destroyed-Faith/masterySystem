/**
 * Calculation utilities for Mastery System
 * Handles Stones, Health Bars, and other derived values
 */

import { AttributeData, HealthBar } from '../types';

/**
 * Calculate the number of Stones from an attribute value
 * Every 8 attribute points = 1 Stone
 */
export function calculateStones(attributeValue: number): number {
  return Math.floor(attributeValue / 8);
}

/**
 * Calculate total Stones from all attributes
 */
export function calculateTotalStones(attributes: Record<string, AttributeData>): number {
  let total = 0;
  for (const attr of Object.values(attributes)) {
    total += calculateStones(attr.value);
  }
  return total;
}

/**
 * Update stones for a single attribute
 */
export function updateAttributeStones(attribute: AttributeData): void {
  attribute.stones = calculateStones(attribute.value);
}

/**
 * Calculate Health Bar maximum HP
 * Each bar = Vitality × 2
 */
export function calculateHealthBarMax(vitality: number): number {
  return vitality * 2;
}

/**
 * Initialize health bars with proper max HP values
 */
export function initializeHealthBars(vitality: number): HealthBar[] {
  const maxHP = calculateHealthBarMax(vitality);
  
  return [
    {
      name: 'Healthy',
      max: maxHP,
      current: maxHP,
      penalty: 0
    },
    {
      name: 'Bruised',
      max: maxHP,
      current: maxHP,
      penalty: -1
    },
    {
      name: 'Injured',
      max: maxHP,
      current: maxHP,
      penalty: -2
    },
    {
      name: 'Wounded',
      max: maxHP,
      current: maxHP,
      penalty: -4
    }
  ];
}

/**
 * Update health bars when vitality changes
 */
export function updateHealthBars(bars: HealthBar[], vitality: number): void {
  const maxHP = calculateHealthBarMax(vitality);
  
  for (const bar of bars) {
    const ratio = bar.max > 0 ? bar.current / bar.max : 1;
    bar.max = maxHP;
    bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
  }
}

/**
 * Get the current active health bar penalty
 */
export function getCurrentPenalty(bars: HealthBar[], currentBar: number): number {
  if (currentBar < 0 || currentBar >= bars.length) {
    return 0;
  }
  return bars[currentBar].penalty;
}

/**
 * Apply damage to health bars
 * Returns the new current bar index
 */
export function applyDamage(
  bars: HealthBar[],
  currentBar: number,
  damage: number
): number {
  let remainingDamage = damage;
  let barIndex = currentBar;
  
  while (remainingDamage > 0 && barIndex < bars.length) {
    const bar = bars[barIndex];
    
    if (bar.current >= remainingDamage) {
      bar.current -= remainingDamage;
      remainingDamage = 0;
    } else {
      remainingDamage -= bar.current;
      bar.current = 0;
      barIndex++;
    }
  }
  
  return barIndex;
}

/**
 * Heal HP in the current health bar
 * Healing never moves you to a higher bar
 */
export function healDamage(
  bars: HealthBar[],
  currentBar: number,
  healing: number
): void {
  if (currentBar < 0 || currentBar >= bars.length) {
    return;
  }
  
  const bar = bars[currentBar];
  bar.current = Math.min(bar.current + healing, bar.max);
}

/**
 * Calculate maximum skill rank based on Mastery Rank
 * Max skill = 4 × Mastery Rank
 */
export function calculateMaxSkillRank(masteryRank: number): number {
  return masteryRank * 4;
}

/**
 * Validate skill value against mastery rank
 */
export function validateSkillValue(skillValue: number, masteryRank: number): number {
  const maxSkill = calculateMaxSkillRank(masteryRank);
  return Math.min(skillValue, maxSkill);
}






























