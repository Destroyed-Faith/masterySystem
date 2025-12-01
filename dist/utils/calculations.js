/**
 * Calculation utilities for Mastery System
 * Handles Stones, Health Bars, and other derived values
 */
/**
 * Calculate the number of Stones from an attribute value
 * Every 8 attribute points = 1 Stone
 */
export function calculateStones(attributeValue) {
    return Math.floor(attributeValue / 8);
}
/**
 * Calculate total Stones from all attributes
 */
export function calculateTotalStones(attributes) {
    let total = 0;
    for (const attr of Object.values(attributes)) {
        total += calculateStones(attr.value);
    }
    return total;
}
/**
 * Update stones for a single attribute
 */
export function updateAttributeStones(attribute) {
    attribute.stones = calculateStones(attribute.value);
}
/**
 * Calculate Health Bar maximum HP
 * Each bar = Vitality × 2
 */
export function calculateHealthBarMax(vitality) {
    return vitality * 2;
}
/**
 * Initialize health bars with proper max HP values
 */
export function initializeHealthBars(vitality) {
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
export function updateHealthBars(bars, vitality) {
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
export function getCurrentPenalty(bars, currentBar) {
    if (currentBar < 0 || currentBar >= bars.length) {
        return 0;
    }
    return bars[currentBar].penalty;
}
/**
 * Apply damage to health bars
 * Returns the new current bar index
 */
export function applyDamage(bars, currentBar, damage) {
    let remainingDamage = damage;
    let barIndex = currentBar;
    while (remainingDamage > 0 && barIndex < bars.length) {
        const bar = bars[barIndex];
        if (bar.current >= remainingDamage) {
            bar.current -= remainingDamage;
            remainingDamage = 0;
        }
        else {
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
export function healDamage(bars, currentBar, healing) {
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
export function calculateMaxSkillRank(masteryRank) {
    return masteryRank * 4;
}
/**
 * Validate skill value against mastery rank
 */
export function validateSkillValue(skillValue, masteryRank) {
    const maxSkill = calculateMaxSkillRank(masteryRank);
    return Math.min(skillValue, maxSkill);
}
//# sourceMappingURL=calculations.js.map