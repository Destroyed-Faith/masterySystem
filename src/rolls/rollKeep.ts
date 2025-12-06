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
 * Individual die result with explosion tracking
 */
export interface RollDieResult {
  index: number;                 // Original die index (0-based)
  rolls: number[];               // All rolls for this die (initial + explosions)
  total: number;                 // Sum of all rolls for this die
  exploded: boolean;             // Did this die explode?
  rerolled: boolean;             // Was this die rerolled (advantage)?
}

/**
 * Options for Roll&Keep d8 roll
 */
export interface RollKeepOptions {
  // Dice configuration
  dice: number;                  // Number of d8 to roll (pool)
  keep: number;                  // Number of dice to keep (Mastery Rank)
  
  // Optional modifiers
  flat?: number;                 // Flat bonus added to total (e.g., skill bonus)
  advantage?: boolean;           // Advantage: reroll 1s once
  disadvantage?: boolean;        // Disadvantage: only highest die explodes
  
  // Target & Raises
  tn?: number;                   // Base Target Number to beat
  declaredRaises?: number;       // Raises declared before roll (adds +4 × raises to TN)
  
  // Context
  label?: string;                // Label for chat card
  flavor?: string;               // Flavor text for the roll
}

/**
 * Result of a Roll&Keep d8 roll
 */
export interface RollKeepResult {
  // Dice details
  allDice: RollDieResult[];      // All rolled dice with explosion chains
  keptDice: number[];            // The K highest dice values (sorted desc)
  droppedDice: number[];         // Dice that weren't kept
  
  // Totals
  total: number;                 // Sum of kept dice + flat bonus
  keptSum: number;               // Sum of kept dice only (before flat)
  flatBonus: number;             // Flat bonus applied
  
  // Success evaluation
  tn?: number;                   // Effective TN (including declared raises)
  baseTN?: number;               // Original TN before raises
  declaredRaises: number;        // Raises declared before roll
  success?: boolean;             // Did we meet/exceed TN?
  margin?: number;               // How much over/under TN (can be negative)
  
  // Metadata
  formula: string;               // Formula used (e.g., "8k3 + 4")
  explodedCount: number;         // Number of dice that exploded
  advantageUsed: boolean;        // Whether advantage was active
  disadvantageUsed: boolean;     // Whether disadvantage was active
}

/**
 * Roll a single d8 with explosion handling
 * @param explode - Whether this die can explode on 8
 * @returns Array of rolls (initial + explosions)
 */
function rollSingleD8(explode: boolean = true): number[] {
  const rolls: number[] = [];
  let keepRolling = true;
  
  while (keepRolling) {
    const roll = Math.floor(Math.random() * 8) + 1; // 1-8
    rolls.push(roll);
    
    // Check if it explodes
    if (roll === 8 && explode) {
      keepRolling = true; // Continue rolling
    } else {
      keepRolling = false;
    }
  }
  
  return rolls;
}

/**
 * Roll & Keep d8 with exploding dice, advantage/disadvantage, and TN evaluation
 * 
 * @param actor - The actor making the roll (for context and wound penalties)
 * @param options - Roll configuration
 * @returns Roll result with all details
 */
export async function rollKeepD8(
  actor: any,
  options: RollKeepOptions
): Promise<RollKeepResult> {
  
  const {
    dice,
    keep,
    flat = 0,
    advantage = false,
    disadvantage = false,
    tn,
    declaredRaises = 0,
    label: _label = "Roll",
    flavor: _flavor = ""
  } = options;
  
  // Apply wound penalty (reduces dice pool)
  const { getWoundPenalty } = await import('../combat/health.js');
  const woundPenalty = getWoundPenalty(actor);
  const actualDice = Math.max(1, Math.min(Math.max(1, dice - woundPenalty), 40)); // Cap at 40, min 1
  const actualKeep = Math.min(Math.max(1, keep), Math.min(actualDice, 8)); // Cap at k8
  
  if (woundPenalty > 0) {
    console.log(`Mastery System | Wound penalty: -${woundPenalty} dice (${dice} → ${actualDice})`);
  }
  
  console.log(`Mastery System | Rolling ${actualDice}k${actualKeep} + ${flat} for ${actor?.name || 'Unknown'}`);
  
  // Roll all dice
  const allDice: RollDieResult[] = [];
  
  for (let i = 0; i < actualDice; i++) {
    let rolls: number[] = [];
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
  
  const result: RollKeepResult = {
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
export async function rollDamage(
  formula: string,
  bonusDice: number = 0
): Promise<{ rolls: number[]; total: number; formula: string }> {
  
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
  const rolls: number[] = [];
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
export function count8sInDamage(rolls: number[]): number {
  return rolls.filter(r => r === 8).length;
}

