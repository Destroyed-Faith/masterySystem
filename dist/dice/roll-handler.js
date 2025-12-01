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
    // Roll the dice
    const { dice, exploded } = rollDice(numDice);
    // Select highest dice to keep
    const keptIndices = selectHighestDice(dice, keepDice);
    const keptValues = keptIndices.map(i => dice[i]);
    // Calculate total from kept dice
    const diceTotal = calculateTotal(dice, keptIndices);
    // Add skill bonus
    const total = diceTotal + skill;
    // Calculate success and raises
    const success = tn > 0 ? total >= tn : true;
    const raises = tn > 0 ? calculateRaises(total, tn) : 0;
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
    // Send to chat
    await sendRollToChat(result, label, flavor, options.actorId);
    return result;
}
/**
 * Send roll result to chat
 */
async function sendRollToChat(result, label, flavor, actorId) {
    // Get actor if available
    let actor = null;
    if (actorId && game.actors) {
        actor = game.actors.get(actorId);
    }
    // Build dice display HTML
    const diceHTML = result.dice.map((value, index) => {
        const isKept = result.kept.includes(value) &&
            result.dice.indexOf(value, result.dice.indexOf(value) === index ? 0 : index + 1) === index;
        const isExploded = result.exploded.includes(index);
        let classes = 'die d8';
        if (isKept)
            classes += ' kept';
        if (isExploded)
            classes += ' exploded';
        return `<div class="${classes}">${value}</div>`;
    }).join('');
    // Build result display
    const diceSum = result.total - result.skill;
    const successClass = result.success ? 'success' : 'failure';
    let content = `
    <div class="mastery-roll">
      <div class="roll-header">
        <h3>${label}</h3>
        ${flavor ? `<div class="flavor">${flavor}</div>` : ''}
      </div>
      
      <div class="roll-details">
        <div class="dice-pool">
          <div class="label">Rolled ${result.dice.length}d8, kept ${result.kept.length}:</div>
          <div class="dice">${diceHTML}</div>
        </div>
        
        <div class="roll-breakdown">
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
    // Create chat message
    const chatData = {
        user: game.user?.id,
        speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
        content,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
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
export async function quickRoll(actor, attributeName, skillName, tn, label) {
    const actorData = actor.system;
    // Get attribute value (number of dice)
    const numDice = actorData.attributes?.[attributeName]?.value || 0;
    // Get mastery rank (number to keep)
    const keepDice = actorData.mastery?.rank || 1;
    // Get skill bonus
    const skill = skillName ? (actorData.skills?.[skillName] || 0) : 0;
    // Build label
    const rollLabel = label || `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`;
    const flavorText = skillName ? `with ${skillName} skill` : '';
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