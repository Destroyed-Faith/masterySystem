/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */
import { EXPLODE_VALUE, RAISE_INCREMENT } from '../utils/constants';
/**
 * Roll a single exploding d8
 * Returns the total value including any explosions
 */
function rollExplodingDie() {
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
function rollDice(numDice) {
    const dice = [];
    const exploded = [];
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
function selectHighestDice(dice, keepDice) {
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
function calculateTotal(dice, keptIndices) {
    return keptIndices.reduce((sum, index) => sum + dice[index], 0);
}
/**
 * Calculate number of raises achieved
 * Each +4 above TN = 1 Raise
 */
function calculateRaises(total, tn) {
    if (total < tn)
        return 0;
    return Math.floor((total - tn) / RAISE_INCREMENT);
}
/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export async function masteryRoll(options) {
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
    const result = {
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
async function sendRollToChat(result, label, flavor, actorId) {
    try {
        // Get actor if available
        let actor = null;
        if (actorId && game.actors) {
            actor = game.actors.get(actorId);
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
        for (const term of roll.terms) {
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
                    term.options.explode = true;
                }
                dieIndex++;
            }
        }
        // Update the total
        roll._total = result.total;
        // Dice So Nice integration - show 3D dice if module is installed and enabled
        if (game.dice3d?.showForRoll) {
            try {
                await game.dice3d.showForRoll(roll, game.user, true);
            }
            catch (dice3dError) {
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
        // Create chat message with serialized Roll object (Foundry v13 expects serialized rolls)
        // Use roll.toJSON() to serialize the roll properly
        const chatData = {
            user: game.user?.id,
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
    }
    catch (error) {
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
export async function quickRoll(actor, attributeName, skillName, tn, label, modifier) {
    const actorData = actor.system;
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
        actorId: actor.id
    });
}
// Export functions
export default {
    masteryRoll,
    quickRoll
};
//# sourceMappingURL=roll-handler.js.map