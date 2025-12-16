/**
 * Attack Executor
 * Creates melee attack chat cards with proper flags for the roll handler
 */
/**
 * Get equipped weapon from actor
 */
function getEquippedWeapon(actor) {
    if (!actor)
        return null;
    const items = actor.items || [];
    return items.find((item) => item.type === 'weapon' && item.system?.equipped === true) || null;
}
/**
 * Get attribute value from actor
 */
function getAttributeValue(actor, attributeName) {
    if (!actor || !actor.system)
        return 0;
    const system = actor.system;
    const attributes = system.attributes || {};
    const attr = attributes[attributeName.toLowerCase()] || {};
    return attr.value || attr.stones || 0;
}
/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor) {
    if (!actor || !actor.system)
        return 2; // Default
    const system = actor.system;
    if (system.mastery?.rank) {
        return system.mastery.rank;
    }
    // Fallback to settings
    const playerMasteryRanks = game.settings?.get('mastery-system', 'playerMasteryRanks') || {};
    const defaultMasteryRank = game.settings?.get('mastery-system', 'defaultMasteryRank') || 2;
    const playerId = actor.getFlag?.('mastery-system', 'playerId') || actor.ownership?.default || '';
    return playerMasteryRanks[playerId] || defaultMasteryRank;
}
/**
 * Get evade value from target actor
 */
function getTargetEvade(targetActor) {
    if (!targetActor || !targetActor.system)
        return 6; // Default
    const system = targetActor.system;
    const combat = system.combat || {};
    return combat.evade || 6;
}
/**
 * Determine which attribute to use for attack
 */
function getAttackAttribute(_actor, weapon, option) {
    // If it's a power, check if it specifies an attribute
    if (option.source === 'power' && option.item) {
        const powerSystem = option.item.system || {};
        if (powerSystem.attribute) {
            return powerSystem.attribute.toLowerCase();
        }
    }
    // Check weapon for Finesse (uses Agility)
    if (weapon) {
        const weaponSystem = weapon.system;
        const innateAbilities = weaponSystem.innateAbilities || [];
        const hasFinesse = innateAbilities.some((a) => a.toLowerCase().includes('finesse'));
        if (hasFinesse) {
            return 'agility';
        }
    }
    // Default to Might for melee attacks
    return 'might';
}
/**
 * Create a melee attack chat card with roll button
 */
export async function createMeleeAttackCard(attackerToken, targetToken, option) {
    const attacker = attackerToken.actor;
    const target = targetToken.actor;
    if (!attacker || !target) {
        console.error('Mastery System | [ATTACK EXECUTOR] Missing actor data', {
            hasAttacker: !!attacker,
            hasTarget: !!target
        });
        return;
    }
    // Get equipped weapon
    const weapon = getEquippedWeapon(attacker);
    const weaponId = weapon?.id || null;
    // Determine attack attribute
    const attribute = getAttackAttribute(attacker, weapon, option);
    const attributeValue = getAttributeValue(attacker, attribute);
    const masteryRank = getMasteryRank(attacker);
    // Get target evade
    const targetEvade = getTargetEvade(target);
    const baseEvade = targetEvade;
    // Get power info if applicable
    let selectedPowerId = null;
    let selectedPowerLevel = null;
    let selectedPowerSpecials = [];
    let selectedPowerDamage = null;
    if (option.source === 'power' && option.item) {
        selectedPowerId = option.item.id;
        const powerSystem = option.item.system || {};
        selectedPowerLevel = powerSystem.level || null;
        // Extract specials and damage from power data
        if (option.item.name) {
            // Try to get from option data if available
            const powerData = option.powerData;
            if (powerData) {
                selectedPowerSpecials = powerData.specials || [];
                selectedPowerDamage = powerData.damage || null;
            }
        }
    }
    // Build flags object
    const flagsObj = {
        attackType: 'melee',
        attackerId: attacker.id,
        targetId: target.id,
        targetTokenId: targetToken.id,
        attribute: attribute,
        attributeValue: attributeValue,
        masteryRank: masteryRank,
        targetEvade: targetEvade,
        baseEvade: baseEvade,
        weaponId: weaponId,
        selectedPowerId: selectedPowerId,
        selectedPowerLevel: selectedPowerLevel,
        selectedPowerSpecials: selectedPowerSpecials,
        selectedPowerDamage: selectedPowerDamage || ''
    };
    // Build chat card HTML
    const attackerName = attacker.name || 'Unknown';
    const targetName = target.name || 'Unknown';
    const optionName = option.name || 'Attack';
    const buttonHtml = `
    <button class="roll-attack-btn" 
            data-attacker-id="${attacker.id}"
            data-target-id="${target.id}"
            data-target-token-id="${targetToken.id}"
            data-attribute="${attribute}"
            data-attribute-value="${attributeValue}"
            data-mastery-rank="${masteryRank}"
            data-target-evade="${targetEvade}"
            data-base-evade="${baseEvade}"
            data-raises="0">
      <i class="fas fa-dice-d20"></i> Roll Attack
    </button>
  `;
    const content = `
    <div class="mastery-system-attack-card">
      <h3>${optionName}</h3>
      <p><strong>${attackerName}</strong> attacks <strong>${targetName}</strong></p>
      <div class="attack-details">
        <div>Attribute: ${attribute.charAt(0).toUpperCase() + attribute.slice(1)} (${attributeValue})</div>
        <div>Mastery Rank: ${masteryRank}</div>
        <div>Target Evade: ${targetEvade}</div>
        ${weapon ? `<div>Weapon: ${weapon.name}</div>` : ''}
        ${selectedPowerId ? `<div>Power: ${option.name}</div>` : ''}
      </div>
      ${buttonHtml}
    </div>
  `;
    // Create chat message
    const speaker = ChatMessage.getSpeaker({
        actor: attacker,
        token: attackerToken.document
    });
    try {
        await ChatMessage.create({
            speaker,
            content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            flags: {
                'mastery-system': flagsObj
            }
        });
        console.log('Mastery System | [ATTACK EXECUTOR] Attack card created', {
            attackerId: attacker.id,
            targetId: target.id,
            optionId: option.id,
            attribute,
            attributeValue,
            masteryRank,
            targetEvade
        });
    }
    catch (error) {
        console.error('Mastery System | [ATTACK EXECUTOR] Failed to create attack card', error);
        ui.notifications?.error('Failed to create attack card');
    }
}
//# sourceMappingURL=attack-executor.js.map