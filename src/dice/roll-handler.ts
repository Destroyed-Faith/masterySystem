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
  const result: MasteryRollResult = {
    total,
    dice,
    kept: keptValues,
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
  // Get actor if available
  let actor = null;
  if (actorId && (game as any).actors) {
    actor = (game as any).actors.get(actorId);
  }
  
  // Create a Foundry Roll object to display dice visually
  const diceSum = result.total - result.skill;
  
  // Create roll formula
  const formula = `${result.dice.length}d8${result.skill !== 0 ? ` + ${result.skill}` : ''}`;
  const roll = new Roll(formula);
  
  // Evaluate the roll asynchronously (required in Foundry VTT v13)
  await roll.evaluate();
  
  // Now replace the dice results with our actual rolled values
  // We need to modify the dice terms to show our actual results
  let dieIndex = 0;
  for (const term of roll.terms as any[]) {
    if (term instanceof foundry.dice.terms.Die) {
      // Replace the results with our actual dice values
      const actualValue = result.dice[dieIndex];
      const isKept = result.kept.includes(actualValue);
      const isExploded = result.exploded.includes(dieIndex);
      
      // Update the die results
      term.results = [{
        result: actualValue,
        active: isKept,
        discarded: !isKept,
        rerolled: false
      }];
      
      // Mark as exploded if needed (stored in flags)
      if (isExploded) {
        (term as any).options.explode = true;
      }
      
      dieIndex++;
    }
  }
  
  // Update the total
  (roll as any)._total = result.total;
  
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
            <span>Dice Total:</span>
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
  
  // Create chat message with the Roll object (use rolls array instead of type in v13)
  const chatData: any = {
    user: (game as any).user?.id,
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    content,
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    rolls: [roll],
    sound: CONFIG.sounds.dice,
    flags: {
      'mastery-system': {
        rollResult: result,
        canReroll: true
      }
    }
  };
  
  await ChatMessage.create(chatData);
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
  const numDice = actorData.attributes?.[attributeName]?.value || 0;
  
  // Get mastery rank (number to keep)
  const keepDice = actorData.mastery?.rank || 1;
  
  // Get skill bonus or use provided modifier
  const skill = modifier !== undefined ? modifier : (skillName ? (actorData.skills?.[skillName] || 0) : 0);
  
  // Build label
  const rollLabel = label || `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`;
  const flavorText = skillName ? `with ${skillName} skill` : (modifier !== undefined ? `modifier: ${modifier >= 0 ? '+' : ''}${modifier}` : '');
  
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

