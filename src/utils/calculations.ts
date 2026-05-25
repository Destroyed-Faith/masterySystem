/**
 * Calculation utilities for Mastery System
 * Handles Stones, Health Bars, and other derived values
 */

import { AttributeData, HealthBar } from '../types';
import { HEALTH_PENALTY_FRACTIONS, MAX_ATTRIBUTE, MAX_POWER_LEVEL } from './constants.js';

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
 * Initialize health bars with proper max HP values.
 *
 * Players Guide ~6499–6513 — five health levels:
 *   Healthy → Bruised → Injured → Wounded → Incapacitated.
 * Each non-Incapacitated bar holds `Vitality × 2` boxes; Incapacitated is a
 * single-box "you go down at 0" state. The legacy `penalty` field stores the
 * flat dice penalty for the rare callers that still want a per-step value;
 * the canonical penalty is the percentage table in `HEALTH_PENALTY_FRACTIONS`.
 */
export function initializeHealthBars(vitality: number): HealthBar[] {
  const maxHP = calculateHealthBarMax(vitality);
  return [
    { name: 'Healthy', max: maxHP, current: maxHP, penalty: 0 },
    { name: 'Bruised', max: maxHP, current: maxHP, penalty: -1 },
    { name: 'Injured', max: maxHP, current: maxHP, penalty: -2 },
    { name: 'Wounded', max: maxHP, current: maxHP, penalty: -4 },
    { name: 'Incapacitated', max: 1, current: 1, penalty: -6 },
  ];
}

/**
 * Update health bars when vitality changes.
 *
 * Bars 0–3 carry `Vitality × 2` boxes; the fifth bar (Incapacitated) is a
 * single box and never scales with Vitality (Players Guide ~6510). Older
 * actors created before the 5-bar migration may still have only four bars
 * — in that case we append the Incapacitated bar in place.
 */
export function updateHealthBars(bars: HealthBar[], vitality: number): void {
  const maxHP = calculateHealthBarMax(vitality);

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const isIncap = bar.name === 'Incapacitated' || i === 4;
    if (isIncap) {
      bar.max = 1;
      bar.current = Math.min(bar.current, 1);
      continue;
    }
    const ratio = bar.max > 0 ? bar.current / bar.max : 1;
    bar.max = maxHP;
    bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
  }

  // Migrate legacy 4-bar actors so the Incapacitated bar exists.
  if (bars.length === 4) {
    bars.push({ name: 'Incapacitated', max: 1, current: 1, penalty: -6 });
  }
}

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
export function getCurrentPenalty(bars: HealthBar[], _currentBar: number, pool?: number): number {
  if (!bars || bars.length === 0) {
    return 0;
  }

  let brokenIndex = -1;
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (bar.current < bar.max) {
      brokenIndex = i;
      break;
    }
  }
  if (brokenIndex < 0) return 0;

  if (typeof pool === 'number' && Number.isFinite(pool)) {
    const fraction = HEALTH_PENALTY_FRACTIONS[brokenIndex] ?? 0;
    if (fraction <= 0) return 0;
    const penalty = -Math.floor(pool * fraction);
    return penalty;
  }

  // Legacy fallback: flat per-bar dice penalty (kept until all callers
  // pass `pool`).
  return bars[brokenIndex].penalty;
}

/**
 * Apply damage to health bars
 * Returns the new current bar index (clamped to max bars - 1)
 * Damage flows through bars: when a bar is depleted, overflow goes to next bar
 */
export function applyDamage(
  bars: HealthBar[],
  currentBar: number,
  damage: number
): number {
  let remainingDamage = Math.max(0, Math.floor(Number(damage) || 0));
  if (!Number.isFinite(remainingDamage)) remainingDamage = 0;
  let barIndex = currentBar;
  
  // Clamp starting bar index
  if (barIndex < 0) barIndex = 0;
  if (barIndex >= bars.length) barIndex = bars.length - 1;
  
  while (remainingDamage > 0 && barIndex < bars.length) {
    const bar = bars[barIndex];
    let cur = Math.floor(Number(bar.current) || 0);
    if (!Number.isFinite(cur)) cur = 0;
    const mx = Math.max(0, Math.floor(Number(bar.max) || 0));
    if (!Number.isFinite(mx)) {
      bar.current = 0;
      barIndex++;
      continue;
    }
    if (cur > mx) cur = mx;
    bar.current = cur;

    if (cur >= remainingDamage) {
      // This bar can absorb all remaining damage
      bar.current = cur - remainingDamage;
      remainingDamage = 0;
    } else {
      // This bar is depleted, overflow to next bar
      remainingDamage -= cur;
      bar.current = 0;
      barIndex++;
    }
  }
  
  // Clamp final bar index (don't go beyond last bar)
  if (barIndex >= bars.length) {
    barIndex = bars.length - 1;
    // If we're at the last bar and it's also depleted, keep it at 0
    if (bars[barIndex]) {
      bars[barIndex].current = 0;
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
 * Calculate Stress Bar maximum
 * Each bar = Resolve + Intellect
 */
export function calculateStressBarMax(resolve: number, intellect: number): number {
  return resolve + intellect;
}

/**
 * Initialize stress bars with proper max values
 * 4 bars: Healthy, Stressed, Not Well, Breaking
 * Each bar = Resolve + Intellect boxes
 */
export function initializeStressBars(resolve: number, intellect: number): HealthBar[] {
  const maxStress = calculateStressBarMax(resolve, intellect);
  
  return [
    {
      name: 'Healthy',
      max: maxStress,
      current: maxStress,
      penalty: 0
    },
    {
      name: 'Stressed',
      max: maxStress,
      current: maxStress,
      penalty: 0
    },
    {
      name: 'Not Well',
      max: maxStress,
      current: maxStress,
      penalty: 0
    },
    {
      name: 'Breaking',
      max: maxStress,
      current: maxStress,
      penalty: 0
    }
  ];
}

/**
 * Update stress bars when resolve or intellect changes
 */
export function updateStressBars(bars: HealthBar[], resolve: number, intellect: number): void {
  const maxStress = calculateStressBarMax(resolve, intellect);
  
  for (const bar of bars) {
    const ratio = bar.max > 0 ? bar.current / bar.max : 1;
    bar.max = maxStress;
    bar.current = Math.min(Math.floor(maxStress * ratio), maxStress);
  }
}

/**
 * Apply stress damage to stress bars
 * Returns the new current bar index
 */
export function applyStress(
  bars: HealthBar[],
  currentBar: number,
  stress: number
): number {
  let remainingStress = stress;
  let barIndex = currentBar;
  
  while (remainingStress > 0 && barIndex < bars.length) {
    const bar = bars[barIndex];
    
    if (bar.current >= remainingStress) {
      bar.current -= remainingStress;
      remainingStress = 0;
    } else {
      remainingStress -= bar.current;
      bar.current = 0;
      barIndex++;
    }
  }
  
  return barIndex;
}

/**
 * Heal (remove) stress from stress bars: fill capacity from the current bar backward.
 */
export function healStressFromBars(
  bars: HealthBar[],
  currentBar: number,
  amount: number
): { bars: HealthBar[]; currentBar: number } {
  const clone = bars.map((b) => ({ ...b }));
  let remaining = Math.max(0, amount);
  let i = Math.min(Math.max(0, currentBar), clone.length - 1);

  while (remaining > 0 && i >= 0) {
    const bar = clone[i];
    const headroom = bar.max - bar.current;
    if (headroom <= 0) {
      i--;
      continue;
    }
    const add = Math.min(headroom, remaining);
    bar.current += add;
    remaining -= add;
    if (remaining > 0) i--;
  }

  let newCurrentBar = 0;
  for (let j = 0; j < clone.length; j++) {
    if (clone[j].current < clone[j].max) {
      newCurrentBar = j;
      break;
    }
  }

  return { bars: clone, currentBar: newCurrentBar };
}

/**
 * Maximum skill rank a character may reach.
 *
 * The new XP spec uses the same banded cost table for Attributes and Skills
 * (1 / 2 / … / 10 XP per +1) up to 80, so the old `MR × 4` cap is dropped.
 * Skills are now bounded by the shared attribute cap (`MAX_ATTRIBUTE`, 80).
 *
 * The `masteryRank` parameter is kept for callers, but is intentionally
 * unused — we always return `MAX_ATTRIBUTE`.
 */
export function calculateMaxSkillRank(_masteryRank: number): number {
  return MAX_ATTRIBUTE;
}

/**
 * Validate skill value against the skill cap.
 */
export function validateSkillValue(skillValue: number, masteryRank: number): number {
  const maxSkill = calculateMaxSkillRank(masteryRank);
  return Math.min(skillValue, maxSkill);
}

/**
 * Maximum Power Level a character of the given Mastery Rank may purchase.
 *
 *   | MR    | Max Power Level |
 *   |-------|-----------------|
 *   | 1 – 2 | 4               |
 *   | 3     | 8               |
 *   | 4     | 12              |
 *   | 5+    | 16              |
 *
 * The hard ceiling is `MAX_POWER_LEVEL` (16) regardless of MR.
 */
export function calculateMaxPowerLevel(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  if (mr <= 2) return Math.min(4, MAX_POWER_LEVEL);
  if (mr === 3) return Math.min(8, MAX_POWER_LEVEL);
  if (mr === 4) return Math.min(12, MAX_POWER_LEVEL);
  return MAX_POWER_LEVEL;
}

// ============================================================
// Attribute Scaling Passives (Player's Guide)
// ============================================================

/**
 * Might Scaling: Melee Damage bonus = 2 * floor(Might / 8)
 * Flat bonus applied per successful melee/unarmed hit.
 */
export function calculateMightDamageBonus(might: number): number {
  return 2 * Math.floor(might / 8);
}

/**
 * Agility Scaling: Evade bonus = floor(Agility / 8)
 */
export function calculateAgilityEvadeBonus(agility: number): number {
  return Math.floor(agility / 8);
}

/**
 * Agility Scaling: Range band extensions
 * Short: +floor(Agility/8) m
 * Medium: +2*floor(Agility/8) m
 * Long: +floor(Agility/8) m
 */
export function calculateAgilityRangeBonus(agility: number): { short: number; medium: number; long: number } {
  const bonus = Math.floor(agility / 8);
  return {
    short: bonus,
    medium: bonus * 2,
    long: bonus
  };
}

/**
 * Intellect Scaling: Saving throw TN increase against your spells = floor(Intellect / 8)
 */
export function calculateIntellectSaveTNBonus(intellect: number): number {
  return Math.floor(intellect / 8);
}

/**
 * Resolve Scaling: Stress Armor = floor(Resolve / 8)
 * Reduces incoming stress by this amount (min 0).
 * Does not apply to voluntary stress costs.
 */
export function calculateResolveStressArmor(resolve: number): number {
  return Math.floor(resolve / 8);
}

/**
 * Influence Scaling: +floor(Influence/8) bonus to two chosen skill rolls
 */
export function calculateInfluenceSkillBonus(influence: number): number {
  return Math.floor(influence / 8);
}

/**
 * Wits Scaling: Initiative bonus = floor(Wits / 8)
 */
export function calculateWitsInitiativeBonus(wits: number): number {
  return Math.floor(wits / 8);
}

/**
 * Armor Breaker (Might): Penetration = floor(Might / 8)
 * Stacks with weapon penetration and power penetration.
 */
export function calculateArmorBreaker(might: number): number {
  return Math.floor(might / 8);
}

/**
 * Evade formula: MR * 4 + size mod + shield bonus + passives + agility scaling
 */
export function calculateBaseEvade(masteryRank: number): number {
  return masteryRank * 4;
}






































