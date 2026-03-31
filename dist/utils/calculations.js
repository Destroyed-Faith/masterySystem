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
 * 4 bars: Healthy (0 penalty), Bruised (-1 penalty), Injured (-2 penalty), Wounded (-4 penalty)
 * Each bar = Vitality × 2 boxes
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
export function getCurrentPenalty(bars, currentBar) {
    if (!bars || bars.length === 0) {
        return 0;
    }
    // Clamp currentBar to valid range
    if (currentBar < 0)
        currentBar = 0;
    if (currentBar >= bars.length)
        currentBar = bars.length - 1;
    // Check all bars from 0 to currentBar to find the first broken one
    // Once a bar is broken (current < max), that penalty applies
    for (let i = 0; i <= currentBar && i < bars.length; i++) {
        const bar = bars[i];
        // If this bar is broken (current < max), return its penalty
        if (bar.current < bar.max) {
            return bar.penalty;
        }
    }
    // No bars are broken, no penalty
    return 0;
}
/**
 * Apply damage to health bars
 * Returns the new current bar index (clamped to max bars - 1)
 * Damage flows through bars: when a bar is depleted, overflow goes to next bar
 */
export function applyDamage(bars, currentBar, damage) {
    let remainingDamage = damage;
    let barIndex = currentBar;
    // Clamp starting bar index
    if (barIndex < 0)
        barIndex = 0;
    if (barIndex >= bars.length)
        barIndex = bars.length - 1;
    while (remainingDamage > 0 && barIndex < bars.length) {
        const bar = bars[barIndex];
        if (bar.current >= remainingDamage) {
            // This bar can absorb all remaining damage
            bar.current -= remainingDamage;
            remainingDamage = 0;
        }
        else {
            // This bar is depleted, overflow to next bar
            remainingDamage -= bar.current;
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
export function healDamage(bars, currentBar, healing) {
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
export function calculateStressBarMax(resolve, intellect) {
    return resolve + intellect;
}
/**
 * Initialize stress bars with proper max values
 * 4 bars: Healthy, Stressed, Not Well, Breaking
 * Each bar = Resolve + Intellect boxes
 */
export function initializeStressBars(resolve, intellect) {
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
export function updateStressBars(bars, resolve, intellect) {
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
export function applyStress(bars, currentBar, stress) {
    let remainingStress = stress;
    let barIndex = currentBar;
    while (remainingStress > 0 && barIndex < bars.length) {
        const bar = bars[barIndex];
        if (bar.current >= remainingStress) {
            bar.current -= remainingStress;
            remainingStress = 0;
        }
        else {
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
export function healStressFromBars(bars, currentBar, amount) {
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
        if (remaining > 0)
            i--;
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
// ============================================================
// Attribute Scaling Passives (Player's Guide)
// ============================================================
/**
 * Might Scaling: Melee Damage bonus = 2 * floor(Might / 8)
 * Flat bonus applied per successful melee/unarmed hit.
 */
export function calculateMightDamageBonus(might) {
    return 2 * Math.floor(might / 8);
}
/**
 * Agility Scaling: Evade bonus = floor(Agility / 8)
 */
export function calculateAgilityEvadeBonus(agility) {
    return Math.floor(agility / 8);
}
/**
 * Agility Scaling: Range band extensions
 * Short: +floor(Agility/8) m
 * Medium: +2*floor(Agility/8) m
 * Long: +floor(Agility/8) m
 */
export function calculateAgilityRangeBonus(agility) {
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
export function calculateIntellectSaveTNBonus(intellect) {
    return Math.floor(intellect / 8);
}
/**
 * Resolve Scaling: Stress Armor = floor(Resolve / 8)
 * Reduces incoming stress by this amount (min 0).
 * Does not apply to voluntary stress costs.
 */
export function calculateResolveStressArmor(resolve) {
    return Math.floor(resolve / 8);
}
/**
 * Influence Scaling: +floor(Influence/8) bonus to two chosen skill rolls
 */
export function calculateInfluenceSkillBonus(influence) {
    return Math.floor(influence / 8);
}
/**
 * Wits Scaling: Initiative bonus = floor(Wits / 8)
 */
export function calculateWitsInitiativeBonus(wits) {
    return Math.floor(wits / 8);
}
/**
 * Armor Breaker (Might): Penetration = floor(Might / 8)
 * Stacks with weapon penetration and power penetration.
 */
export function calculateArmorBreaker(might) {
    return Math.floor(might / 8);
}
/**
 * Evade formula: MR * 4 + size mod + shield bonus + passives + agility scaling
 */
export function calculateBaseEvade(masteryRank) {
    return masteryRank * 4;
}
//# sourceMappingURL=calculations.js.map