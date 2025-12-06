/**
 * Attack Workflow for Mastery System
 * Handles attacks with weapons/powers, damage rolls, and condition application
 */
import { rollKeepD8, rollDamage, count8sInDamage } from '../rolls/rollKeep.js';
import { createAttackChatCard, createDamageChatCard } from './chatCards.js';
import { applyVitalityDamage } from '../combat/resources.js';
/**
 * Show dialog to configure and perform an attack
 * Player declares Raises before rolling
 *
 * @param attacker - The attacking actor
 * @param target - The target actor
 * @param item - The weapon/power/spell item
 * @returns Promise resolving when attack sequence is complete
 */
export async function performAttackWithDialog(attacker, target, item) {
    return new Promise((resolve) => {
        const itemSystem = item.system;
        // Determine attribute from item or default
        const attribute = itemSystem.roll?.attribute || 'might';
        const attributeValue = attacker.system.attributes?.[attribute]?.value || 2;
        const masteryRank = attacker.system.mastery?.rank || 2;
        // Determine skill if applicable
        let skill;
        let skillValue = 0;
        if (item.type === 'weapon') {
            const weaponType = itemSystem.weaponType;
            if (weaponType === 'melee') {
                skill = 'meleeWeapons';
            }
            else if (weaponType === 'ranged') {
                skill = 'rangedWeapons';
            }
            if (skill) {
                skillValue = attacker.system.skills?.[skill] || 0;
            }
        }
        // Get target's Evade
        const targetEvade = target.system.combat?.evade || 10;
        // Get base damage
        const baseDamage = itemSystem.damage || itemSystem.roll?.damage || '1d8';
        const dialog = new Dialog({
            title: `Attack: ${item.name}`,
            content: `
        <form class="mastery-attack-dialog">
          <div class="attack-summary">
            <div><strong>Attacker:</strong> ${attacker.name}</div>
            <div><strong>Target:</strong> ${target.name} (Evade: ${targetEvade})</div>
            <div><strong>Weapon:</strong> ${item.name}</div>
          </div>
          
          <div class="form-group">
            <label>Attack Pool:</label>
            <span><strong>${attributeValue}k${masteryRank}</strong> ${attribute.charAt(0).toUpperCase() + attribute.slice(1)}</span>
            ${skill ? `<span>+ ${skillValue} ${skill}</span>` : ''}
          </div>
          
          <div class="form-group">
            <label>Base Damage:</label>
            <span>${baseDamage}</span>
          </div>
          
          <div class="form-group">
            <label>Target Evade:</label>
            <span><strong>${targetEvade}</strong></span>
          </div>
          
          <div class="form-group">
            <label>Declared Raises:</label>
            <input type="number" name="raises" value="0" min="0" max="10"/>
            <small>Each Raise: +4 TN, grants +1d8 damage OR 1 Special effect on hit</small>
          </div>
          
          <div class="form-group">
            <label>Modifiers:</label>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" name="advantage"/> Advantage
              </label>
              <label>
                <input type="checkbox" name="disadvantage"/> Disadvantage
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Situational Bonus:</label>
            <input type="number" name="bonus" value="0" step="1"/>
          </div>
          
          <div class="effective-tn">
            <strong>Required Roll (TN):</strong> <span id="attack-tn-value">${targetEvade}</span>
          </div>
        </form>
      `,
            buttons: {
                attack: {
                    icon: '<i class="fas fa-khanda"></i>',
                    label: 'Attack',
                    callback: async (html) => {
                        const raises = parseInt(html.find('[name="raises"]').val() || '0');
                        const advantage = html.find('[name="advantage"]').is(':checked');
                        const disadvantage = html.find('[name="disadvantage"]').is(':checked');
                        const bonus = parseInt(html.find('[name="bonus"]').val() || '0');
                        const attackData = {
                            item,
                            target,
                            targetEvade,
                            attribute,
                            attributeValue,
                            skill,
                            skillValue,
                            declaredRaises: raises,
                            advantage,
                            disadvantage,
                            situationalBonus: bonus,
                            baseDamage,
                            label: item.name
                        };
                        await performAttack(attacker, attackData);
                        resolve();
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
                    callback: () => resolve()
                }
            },
            default: 'attack',
            render: (html) => {
                // Update TN when raises change
                const updateTN = () => {
                    const raises = parseInt(html.find('[name="raises"]').val() || '0');
                    const tn = targetEvade + (raises * 4);
                    html.find('#attack-tn-value').text(tn);
                };
                html.find('[name="raises"]').on('input change', updateTN);
            },
            close: () => resolve()
        }, {
            width: 500,
            classes: ['mastery-system', 'attack-dialog']
        });
        dialog.render(true);
    });
}
/**
 * Perform the attack roll
 *
 * @param attacker - The attacking actor
 * @param attackData - Attack configuration
 * @returns Attack result
 */
async function performAttackRoll(attacker, attackData) {
    const masteryRank = attacker.system.mastery?.rank || 2;
    const totalFlat = (attackData.skillValue || 0) + (attackData.situationalBonus || 0);
    // Perform the roll
    const roll = await rollKeepD8(attacker, {
        dice: attackData.attributeValue,
        keep: masteryRank,
        flat: totalFlat,
        advantage: attackData.advantage,
        disadvantage: attackData.disadvantage,
        tn: attackData.targetEvade,
        declaredRaises: attackData.declaredRaises,
        label: `Attack: ${attackData.label}`
    });
    const hit = roll.success || false;
    return {
        roll,
        hit,
        totalRaises: attackData.declaredRaises
    };
}
/**
 * Perform a complete attack sequence
 *
 * @param attacker - The attacking actor
 * @param attackData - Attack configuration
 */
export async function performAttack(attacker, attackData) {
    // 1. Perform attack roll
    const attackResult = await performAttackRoll(attacker, attackData);
    // 2. Show attack chat card
    await createAttackChatCard(attacker, attackData, attackResult);
    // 3. If hit, prompt for damage and apply it
    if (attackResult.hit) {
        await promptAndApplyDamage(attacker, attackData, attackResult);
    }
}
/**
 * Prompt player to spend Raises on damage, then roll and apply damage
 *
 * @param attacker - The attacking actor
 * @param attackData - Attack configuration
 * @param attackResult - Result of attack roll
 */
async function promptAndApplyDamage(attacker, attackData, attackResult) {
    const availableRaises = attackResult.totalRaises;
    if (availableRaises === 0) {
        // No raises, just roll base damage
        await rollAndApplyDamage(attacker, attackData, 0);
        return;
    }
    // Show dialog to spend raises
    return new Promise((resolve) => {
        const dialog = new Dialog({
            title: 'Hit! Spend Raises',
            content: `
        <form class="mastery-damage-dialog">
          <p><strong>Available Raises:</strong> ${availableRaises}</p>
          <p>Each Raise can grant:</p>
          <ul>
            <li>+1d8 Damage (non-exploding)</li>
            <li>OR apply 1 Special effect (if available)</li>
          </ul>
          
          <div class="form-group">
            <label>Raises for Damage:</label>
            <input type="number" name="damageRaises" value="${availableRaises}" min="0" max="${availableRaises}"/>
          </div>
          
          <div class="form-group">
            <label>Raises for Specials:</label>
            <input type="number" name="specialRaises" value="0" min="0" max="${availableRaises}" disabled/>
            <small>Specials not yet implemented</small>
          </div>
          
          <div class="raise-total">
            <span>Total: <strong id="raise-sum">${availableRaises}</strong> / ${availableRaises}</span>
          </div>
        </form>
      `,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice"></i>',
                    label: 'Roll Damage',
                    callback: async (html) => {
                        const damageRaises = parseInt(html.find('[name="damageRaises"]').val() || '0');
                        await rollAndApplyDamage(attacker, attackData, damageRaises);
                        resolve();
                    }
                }
            },
            default: 'roll',
            render: (html) => {
                html.find('[name="damageRaises"], [name="specialRaises"]').on('input', () => {
                    const damage = parseInt(html.find('[name="damageRaises"]').val() || '0');
                    const special = parseInt(html.find('[name="specialRaises"]').val() || '0');
                    html.find('#raise-sum').text(damage + special);
                });
            },
            close: () => resolve()
        }, {
            width: 400,
            classes: ['mastery-system', 'damage-dialog']
        });
        dialog.render(true);
    });
}
/**
 * Roll damage, apply to target, and show chat card
 *
 * @param attacker - The attacking actor
 * @param attackData - Attack configuration
 * @param bonusDice - Extra damage dice from Raises
 */
async function rollAndApplyDamage(attacker, attackData, bonusDice) {
    // Roll damage
    const damageResult = await rollDamage(attackData.baseDamage, bonusDice);
    // Get target's armor
    const targetArmor = (attackData.target.system.combat?.armor || 0) +
        (attackData.target.system.combat?.shield || 0) +
        (attackData.target.system.mastery?.rank || 0);
    // Calculate final damage
    let finalDamage = damageResult.total - targetArmor;
    // Special rule: if damage ≤ 0, still take 1 damage per 8 rolled
    if (finalDamage <= 0) {
        const eightsRolled = count8sInDamage(damageResult.rolls);
        finalDamage = eightsRolled;
    }
    finalDamage = Math.max(0, finalDamage);
    // Apply damage
    if (finalDamage > 0) {
        await applyVitalityDamage(attackData.target, finalDamage);
    }
    // Show damage chat card
    await createDamageChatCard(attacker, attackData.target, attackData.item, damageResult, targetArmor, finalDamage);
    // TODO: Apply conditions from item if any
}
//# sourceMappingURL=attacks.js.map