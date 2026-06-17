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
 * Six health levels:
 *   Healthy → Bruised → Injured → Wounded → Broken → Incapacitated.
 * Each non-Incapacitated bar holds `Vitality × 2` boxes; Incapacitated is a
 * single-box "you go down at 0" state. The legacy `penalty` field stores the
 * flat dice penalty for the rare callers that still want a per-step value;
 * the canonical penalty is the percentage table in `HEALTH_PENALTY_FRACTIONS`.
 */
export declare function initializeHealthBars(vitality: number): HealthBar[];
/**
 * Update health bars when vitality changes.
 *
 * Bars 0–4 carry `Vitality × 2` boxes; the final bar (Incapacitated) is a
 * single box and never scales with Vitality. Older actors created before the
 * 6-bar migration may still have four or five bars — in that case we insert
 * the missing levels (Broken before Incapacitated, then Incapacitated).
 */
export declare function updateHealthBars(bars: HealthBar[], vitality: number): void;
/**
 * Get the current active health bar penalty.
 *
 * The dice penalty is **a fraction of the rolled pool**, applied late in the
 * stack and floored (never below 0). The fractions per broken bar live in
 * `HEALTH_PENALTY_FRACTIONS` (0%, 10%, 20%, 40%, 50%, and Incapacitated which
 * zeroes the pool). Pre-migration callers without a `pool` argument get the
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
 * Maximum skill rank a character may reach at a given Mastery Rank.
 *
 * Rule: **MR × 4** (MR 2 → 8, MR 3 → 12, MR 4 → 16, …).
 * Applies to XP upgrades (including Free XP) and general skill validation.
 */
export declare function calculateMaxSkillRank(masteryRank: number): number;
/**
 * Validate skill value against the skill cap.
 */
export declare function validateSkillValue(skillValue: number, masteryRank: number): number;
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
export declare function calculateMaxPowerLevel(masteryRank: number): number;
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