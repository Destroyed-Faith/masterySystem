/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */

import { MasteryRollResult } from '../types';
import { EXPLODE_VALUE, RAISE_INCREMENT } from '../utils/constants';

export interface RollOptions {
  numDice: number;          // Number of dice to roll (Attribute value)
  keepDice: number;         // Number of dice to keep (Mastery Rank)
  skill: number;            // Skill bonus (flat addition)
  tn?: number;              // Target Number (optional)
  label?: string;           // Label for the roll
  flavor?: string;          // Flavor text
  actorId?: string;         // Actor making the roll
}

/**
 * Roll a single exploding d8
 * Returns the total value including any explosions
 */
function rollExplodingDie(): { value: number; exploded: boolean } {
  let value = Math.floor(Math.random() * 8) + 1;
  let exploded = false;
  
  // Keep rolling while we get 8s
  while (value % EXPLODE_VALUE === 0) {
    exploded = true;
    const nextRoll = Math.floor(Math.random() * 8) + 1;
    value += nextRoll;
  }
  
  return { value, exploded };
}

/**
 * Roll multiple exploding d8s
 * Returns array of die values (including explosions)
 */
function rollDice(numDice: number): { dice: number[]; exploded: number[] } {
  const dice: number[] = [];
  const exploded: number[] = [];
  
  for (let i = 0; i < numDice; i++) {
    const { value, exploded: didExplode } = rollExplodingDie();
    dice.push(value);
    if (didExplode) {
      exploded.push(i);
    }
  }
  
  return { dice, exploded };
}

/**
 * Select the highest K dice from an array
 * Returns indices of kept dice
 */
function selectHighestDice(dice: number[], keepDice: number): number[] {
  // Create array of [value, originalIndex] pairs
  const indexed = dice.map((value, index) => ({ value, index }));
  
  // Sort by value descending
  indexed.sort((a, b) => b.value - a.value);
  
  // Take the top K dice
  const kept = indexed.slice(0, keepDice);
  
  // Return the original indices, sorted
  return kept.map(d => d.index).sort((a, b) => a - b);
}

/**
 * Calculate total from kept dice
 */
function calculateTotal(dice: number[], keptIndices: number[]): number {
  return keptIndices.reduce((sum, index) => sum + dice[index], 0);
}

/**
 * Calculate number of raises achieved
 * Each +4 above TN = 1 Raise
 */
function calculateRaises(total: number, tn: number): number {
  if (total < tn) return 0;
  return Math.floor((total - tn) / RAISE_INCREMENT);
}

/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export async function masteryRoll(options: RollOptions): Promise<MasteryRollResult> {
  const { numDice, keepDice, skill, tn = 0, label = 'Roll', flavor = '' } = options;
  
  console.log('Mastery System | DEBUG: masteryRoll called', {
    numDice,
    keepDice,
    skill,
    tn,
    label,
    flavor
  });
  
  // Roll the dice
  const { dice, exploded } = rollDice(numDice);
  console.log('Mastery System | DEBUG: Dice rolled', {
    numDice,
    dice,
    exploded,
    diceCount: dice.length
  });
  
  // Select highest dice to keep
  const keptIndices = selectHighestDice(dice, keepDice);
  const keptValues = keptIndices.map(i => dice[i]);
  console.log('Mastery System | DEBUG: Dice selection', {
    keptIndices,
    keptValues,
    allDice: dice
  });
  
  // Calculate total from kept dice
  const diceTotal = calculateTotal(dice, keptIndices);
  console.log('Mastery System | DEBUG: Dice total calculated', {
    diceTotal,
    skill,
    totalBeforeSkill: diceTotal
  });
  
  // Add skill bonus
  const total = diceTotal + skill;
  
  // Calculate success and raises
  const success = tn > 0 ? total >= tn : true;
  const raises = tn > 0 ? calculateRaises(total, tn) : 0;
  
  console.log('Mastery System | DEBUG: Roll result calculated', {
    total,
    tn,
    success,
    raises,
    diceTotal,
    skill
  });
  
  // Create result object
  const result: MasteryRollResult & { keptIndices?: number[] } = {
    total,
    dice,
    kept: keptValues,
    keptIndices: keptIndices,  // Store indices for proper dice display
    skill,
    tn,
    raises,
    success,
    exploded
  };
  
  console.log('Mastery System | DEBUG: Sending roll to chat', {
    result,
    label,
    flavor
  });
  
  // Send to chat
  await sendRollToChat(result, label, flavor, options.actorId);
  
  console.log('Mastery System | DEBUG: Roll complete, returning result', result);
  
  return result;
}

/**
 * Send roll result to chat
 */
async function sendRollToChat(
  result: MasteryRollResult,
  label: string,
  flavor: string,
  actorId?: string
): Promise<void> {
  try {
    // Get actor if available
    let actor = null;
    if (actorId && (game as any).actors) {
      actor = (game as any).actors.get(actorId);
    }
    
    // Create a Foundry Roll object to display dice visually
    const diceSum = result.total - result.skill;
    
    // Create roll formula - use numDice for the pool (e.g., "8d8" for attribute 8)
    // Do NOT use keep modifiers (kh/kl) - we handle keep selection ourselves
    const numDice = result.dice.length;
    const formula = `${numDice}d8${result.skill !== 0 ? ` + ${result.skill}` : ''}`;
    const roll = new Roll(formula);
    
    // Evaluate the roll asynchronously (required in Foundry VTT v13)
    await roll.evaluate();
    
    // Now replace the dice results with our actual rolled values
    // IMPORTANT: Use keptIndices to properly identify which dice were kept
    // (multiple dice can have the same value, so we can't rely on values alone)
    const keptIndices = (result as any).keptIndices || [];
    
    // Find the Die term and replace ALL results
    // For "8d8", Foundry creates a single Die term with term.number = 8
    // We need to set term.results to an array with 8 entries (one per die)
    for (const term of roll.terms as any[]) {
      if (term instanceof foundry.dice.terms.Die) {
        // Replace term.results with ALL dice results
        // term.number should equal numDice (e.g., 8 for 8d8)
        const expectedDiceCount = term.number || numDice;
        
        // Build results array with ALL dice (not just kept ones)
        term.results = [];
        for (let i = 0; i < expectedDiceCount && i < result.dice.length; i++) {
          const actualValue = result.dice[i];
          const isKept = keptIndices.includes(i);
          const isExploded = result.exploded.includes(i);
          
          // ALL dice should be active and NOT discarded (so Dice So Nice shows them all)
          // Store kept/exploded status for HTML highlighting (not for Dice So Nice)
          const resultObj: any = {
            result: actualValue,
            active: true,
            discarded: false,  // DO NOT discard - we want Dice So Nice to show ALL dice
            rerolled: false
          };
          // Add custom properties for HTML highlighting
          if (isKept) {
            resultObj.kept = true;
          }
          if (isExploded) {
            resultObj.exploded = true;
          }
          term.results.push(resultObj);
        }
        
        // Ensure we have the correct number of results
        if (term.results.length !== expectedDiceCount) {
          console.warn('Mastery System | Die term results count mismatch', {
            expected: expectedDiceCount,
            actual: term.results.length,
            diceLength: result.dice.length
          });
        }
        
        break; // Only process the first Die term (should be the only one for "Nd8")
      }
    }
    
    // Update the total
    (roll as any)._total = result.total;
    
    // Debug log
    console.log('Mastery System | Roll display built', {
      numDice: numDice,
      keptDice: keptIndices.length,
      formula: formula,
      dieTermResults: roll.terms.find((t: any) => t instanceof foundry.dice.terms.Die)?.results?.length || 0
    });
    
    // Dice So Nice integration - show 3D dice if module is installed and enabled
    if ((game as any).dice3d?.showForRoll) {
      try {
        await (game as any).dice3d.showForRoll(roll, game.user, true);
      } catch (dice3dError) {
        console.warn('Mastery System | Dice So Nice integration failed:', dice3dError);
        // Continue without 3D dice - not critical
      }
    }
    
    // Build result display HTML
    const successClass = result.success ? 'success' : 'failure';
    
    let content = `
      <div class="mastery-roll">
        <div class="roll-header">
          <h3>${label}</h3>
          ${flavor ? `<div class="flavor">${flavor}</div>` : ''}
        </div>
        
        <div class="roll-details">
          <div class="roll-breakdown">
            <div class="breakdown-line">
              <span>Rolled ${result.dice.length}d8, kept ${result.kept.length}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Rolled:</span>
              <span class="value">${result.dice.map((d, i) => {
                const isKept = keptIndices.includes(i);
                return isKept ? `<strong>${d}</strong>` : d;
              }).join(', ')}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Total (kept):</span>
              <span class="value">${diceSum}</span>
            </div>
            ${result.skill > 0 ? `
              <div class="breakdown-line">
                <span>Skill Bonus:</span>
                <span class="value">+${result.skill}</span>
              </div>
            ` : ''}
            <div class="breakdown-line total">
              <span><strong>Final Total:</strong></span>
              <span class="value"><strong>${result.total}</strong></span>
            </div>
          </div>
          
          ${result.tn > 0 ? `
            <div class="roll-result ${successClass}">
              <div class="result-line">
                <span>Target Number:</span>
                <span class="value">${result.tn}</span>
              </div>
              <div class="result-line">
                <span><strong>Result:</strong></span>
                <span class="value"><strong>${result.success ? 'SUCCESS' : 'FAILURE'}</strong></span>
              </div>
              ${result.raises > 0 ? `
                <div class="result-line">
                  <span><strong>Raises:</strong></span>
                  <span class="value"><strong>${result.raises}</strong></span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Create chat message with serialized Roll object (Foundry v13 expects serialized rolls)
    // Use roll.toJSON() to serialize the roll properly
    const chatData: any = {
      user: (game as any).user?.id,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      // Do not force style to OTHER - let Foundry infer roll display from presence of rolls
      rolls: [roll.toJSON()],
      sound: CONFIG.sounds.dice,
      flags: {
        'mastery-system': {
          rollResult: result,
          canReroll: true
        }
      }
    };
    
    await ChatMessage.create(chatData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Mastery System | Error sending roll to chat:', error);
    ui.notifications.error(`Failed to send mastery roll to chat: ${errorMessage}`);
    throw error;
  }
}

/**
 * Quick roll from actor
 * Helper function to make rolling easier
 */
export async function quickRoll(
  actor: Actor,
  attributeName: string,
  skillName?: string,
  tn?: number,
  label?: string,
  modifier?: number
): Promise<MasteryRollResult> {
  const actorData = actor.system as any;
  
  // Get attribute value (number of dice)
  let numDice = actorData.attributes?.[attributeName]?.value || 0;
  
  // Get mastery rank (number to keep)
  const keepDice = actorData.mastery?.rank || 1;
  
  // Get skill bonus or use provided modifier
  const skill = modifier !== undefined ? modifier : (skillName ? (actorData.skills?.[skillName] || 0) : 0);
  
  // Apply health penalty (reduces dice pool)
  const { getCurrentPenalty } = await import('../utils/calculations.js');
  const healthBars = actorData.health?.bars || [];
  const currentBar = actorData.health?.currentBar ?? 0;
  const healthPenalty = getCurrentPenalty(healthBars, currentBar);
  
  // Health penalty reduces the dice pool (numDice)
  // Penalty is negative (e.g., -1, -2, -4), so we add it to reduce numDice
  numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
  
  // Build label
  const rollLabel = label || `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`;
  let flavorText = skillName ? `with ${skillName} skill` : (modifier !== undefined ? `modifier: ${modifier >= 0 ? '+' : ''}${modifier}` : '');
  
  // Add health penalty to flavor if applicable
  if (healthPenalty < 0) {
    const penaltyText = healthPenalty === -1 ? '1' : healthPenalty === -2 ? '2' : healthPenalty === -4 ? '4' : String(Math.abs(healthPenalty));
    flavorText = flavorText ? `${flavorText} (Health penalty: -${penaltyText} dice)` : `Health penalty: -${penaltyText} dice`;
  }
  
  console.log('Mastery System | quickRoll with health penalty', {
    attributeName,
    baseNumDice: actorData.attributes?.[attributeName]?.value || 0,
    healthPenalty,
    adjustedNumDice: numDice,
    currentBar,
    healthBars: healthBars.map((b: any, i: number) => ({ index: i, name: b.name, current: b.current, max: b.max, penalty: b.penalty }))
  });
  
  return await masteryRoll({
    numDice,
    keepDice,
    skill,
    tn,
    label: rollLabel,
    flavor: flavorText,
    actorId: (actor as any).id
  });
}

// Export functions
export default {
  masteryRoll,
  quickRoll
};

