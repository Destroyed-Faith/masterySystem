/**
 * Roll & Keep d8 System for Mastery System
 *
 * Core dice rolling mechanic:
 * - Roll X d8 (pool = Attribute)
 * - Keep K dice (keep = Mastery Rank)
 * - 8s explode (roll again and add)
 * - Advantage: reroll 1s once
 * - Disadvantage: only highest die explodes
 * - Raises: declared before roll, each adds +4 to TN
 */
/**
 * Roll a single d8 with explosion handling
 * @param explode - Whether this die can explode on 8
 * @returns Array of rolls (initial + explosions)
 */
function rollSingleD8(explode = true) {
    const rolls = [];
    let keepRolling = true;
    while (keepRolling) {
        const roll = Math.floor(Math.random() * 8) + 1; // 1-8
        rolls.push(roll);
        // Check if it explodes
        if (roll === 8 && explode) {
            keepRolling = true; // Continue rolling
        }
        else {
            keepRolling = false;
        }
    }
    return rolls;
}
/**
 * Roll & Keep d8 with exploding dice, advantage/disadvantage, and TN evaluation
 *
 * @param actor - The actor making the roll (for context)
 * @param options - Roll configuration
 * @returns Roll result with all details
 */
export async function rollKeepD8(actor, options) {
    const { dice, keep, flat = 0, advantage = false, disadvantage = false, tn, declaredRaises = 0, label: _label = "Roll", flavor: _flavor = "" } = options;
    // Validate
    const actualDice = Math.min(Math.max(1, dice), 40); // Cap at 40
    const actualKeep = Math.min(Math.max(1, keep), Math.min(actualDice, 8)); // Cap at k8
    console.log(`Mastery System | Rolling ${actualDice}k${actualKeep} + ${flat} for ${actor?.name || 'Unknown'}`);
    // Roll all dice
    const allDice = [];
    for (let i = 0; i < actualDice; i++) {
        let rolls = [];
        let rerolled = false;
        // Initial roll
        const canExplode = true; // All dice can explode initially
        rolls = rollSingleD8(canExplode);
        // Advantage: reroll 1s once
        if (advantage && rolls[0] === 1) {
            console.log(`  Die ${i}: rolled 1, rerolling (advantage)`);
            rolls = rollSingleD8(canExplode);
            rerolled = true;
        }
        const total = rolls.reduce((sum, r) => sum + r, 0);
        const exploded = rolls.length > 1;
        allDice.push({
            index: i,
            rolls,
            total,
            exploded,
            rerolled
        });
    }
    // Handle Disadvantage: only highest die can explode, others are flat 8
    if (disadvantage) {
        // Find the highest die
        let highestIndex = 0;
        let highestTotal = allDice[0].total;
        for (let i = 1; i < allDice.length; i++) {
            if (allDice[i].total > highestTotal) {
                highestTotal = allDice[i].total;
                highestIndex = i;
            }
        }
        // For all other dice that exploded, set them to flat 8
        for (let i = 0; i < allDice.length; i++) {
            if (i !== highestIndex && allDice[i].exploded) {
                allDice[i].rolls = [8]; // Flat 8, no explosion
                allDice[i].total = 8;
                allDice[i].exploded = false;
            }
        }
    }
    // Sort dice by total (highest first) and keep top K
    const sortedDice = [...allDice].sort((a, b) => b.total - a.total);
    const keptDice = sortedDice.slice(0, actualKeep).map(d => d.total);
    const droppedDice = sortedDice.slice(actualKeep).map(d => d.total);
    // Calculate totals
    const keptSum = keptDice.reduce((sum, val) => sum + val, 0);
    const total = keptSum + flat;
    // Calculate TN and success
    const baseTN = tn;
    const effectiveTN = baseTN !== undefined ? baseTN + (declaredRaises * 4) : undefined;
    const success = effectiveTN !== undefined ? total >= effectiveTN : undefined;
    const margin = effectiveTN !== undefined ? total - effectiveTN : undefined;
    // Build formula string
    const explodedCount = allDice.filter(d => d.exploded).length;
    let formula = `${actualDice}k${actualKeep}`;
    if (flat !== 0) {
        formula += ` + ${flat}`;
    }
    if (advantage) {
        formula += " (Advantage)";
    }
    if (disadvantage) {
        formula += " (Disadvantage)";
    }
    const result = {
        allDice,
        keptDice,
        droppedDice,
        total,
        keptSum,
        flatBonus: flat,
        tn: effectiveTN,
        baseTN,
        declaredRaises,
        success,
        margin,
        formula,
        explodedCount,
        advantageUsed: advantage,
        disadvantageUsed: disadvantage
    };
    console.log(`Mastery System | Roll result: ${total} (kept: ${keptSum} + flat: ${flat})`);
    if (effectiveTN !== undefined) {
        console.log(`  vs TN ${effectiveTN} → ${success ? 'SUCCESS' : 'FAILURE'} (margin: ${margin})`);
    }
    return result;
}
/**
 * Roll damage dice (non-exploding)
 * @param formula - Damage formula (e.g., "2d8" or "3d8+4")
 * @param bonusDice - Extra damage dice from Raises
 * @returns Object with rolls and total
 */
export async function rollDamage(formula, bonusDice = 0) {
    // Parse base formula (e.g., "2d8", "1d8+4")
    const match = formula.match(/(\d+)d8(?:\+(\d+))?/i);
    if (!match) {
        console.warn(`Mastery System | Invalid damage formula: ${formula}`);
        return { rolls: [], total: 0, formula };
    }
    const baseDice = parseInt(match[1]);
    const flatBonus = match[2] ? parseInt(match[2]) : 0;
    const totalDice = baseDice + bonusDice;
    // Roll damage dice (NO EXPLOSIONS)
    const rolls = [];
    for (let i = 0; i < totalDice; i++) {
        const roll = Math.floor(Math.random() * 8) + 1;
        rolls.push(roll);
    }
    const total = rolls.reduce((sum, r) => sum + r, 0) + flatBonus;
    const finalFormula = bonusDice > 0
        ? `${baseDice}d8 + ${bonusDice}d8${flatBonus > 0 ? ' + ' + flatBonus : ''}`
        : formula;
    console.log(`Mastery System | Damage roll: ${finalFormula} = ${total}`);
    return { rolls, total, formula: finalFormula };
}
/**
 * Calculate how many 8s were rolled in damage (for armor penetration rule)
 * "If damage ≤ 0 after armor, still take 1 damage per 8 rolled"
 */
export function count8sInDamage(rolls) {
    return rolls.filter(r => r === 8).length;
}
//# sourceMappingURL=rollKeep.js.map