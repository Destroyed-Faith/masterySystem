/**
 * Attack Executor
 * Creates melee attack chat cards with proper flags for the roll handler
 */
/**
 * Safely collect items from actor (handles Collection, Array, Map)
 */
function collectActorItems(actor) {
    if (!actor || !actor.items)
        return [];
    if (Array.isArray(actor.items)) {
        return actor.items;
    }
    else if (actor.items instanceof Map) {
        return Array.from(actor.items.values());
    }
    else if (actor.items.size !== undefined && actor.items.values) {
        // Foundry Collection-like object
        return Array.from(actor.items.values());
    }
    return [];
}
/**
 * Get equipped weapon from actor with robust resolution
 * First tries equipped weapon, then falls back to first weapon found
 */
function getEquippedWeapon(actor) {
    if (!actor)
        return null;
    const items = collectActorItems(actor);
    const weapons = items.filter((item) => item.type === 'weapon');
    // First: try equipped weapon
    const equippedWeapon = weapons.find((item) => item.system?.equipped === true);
    if (equippedWeapon) {
        return equippedWeapon;
    }
    // Fallback: first weapon found
    if (weapons.length > 0) {
        return weapons[0];
    }
    return null;
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
    // Robust weapon resolution
    const items = collectActorItems(attacker);
    const weapon = getEquippedWeapon(attacker);
    const weaponId = weapon?.id ?? null;
    // Debug log: item counts and weapon resolution
    const itemTypes = items.reduce((acc, item) => {
        const type = item.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    if (!weapon && items.length > 0) {
        console.warn('Mastery System | [ATTACK EXECUTOR] No weapon found for attacker', {
            attackerId: attacker.id,
            totalItems: items.length,
            itemTypes: itemTypes,
            weaponItems: items.filter((i) => i.type === 'weapon').length
        });
    }
    console.log('Mastery System | [ATTACK EXECUTOR] Weapon resolution', {
        attackerId: attacker.id,
        totalItems: items.length,
        weaponItems: items.filter((i) => i.type === 'weapon').length,
        weaponFound: !!weapon,
        weaponId: weaponId,
        weaponName: weapon?.name || null
    });
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
    // Debug log before creating message
    const weaponCandidateFromEquipped = weapon;
    console.log('Mastery System | [WEAPON-ID DEBUG]', {
        messageType: 'attack-card:create:before',
        attackerId: attacker.id,
        targetId: target.id,
        weaponId: weaponId,
        selectedPowerId: selectedPowerId,
        raises: 0,
        flagsKeys: Object.keys(flagsObj),
        weaponCandidateFromEquipped: weaponCandidateFromEquipped ? {
            id: weaponCandidateFromEquipped.id,
            name: weaponCandidateFromEquipped.name,
            type: weaponCandidateFromEquipped.type
        } : null
    });
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
      <i class="fas fa-dice-d20"></i> Roll
    </button>
  `;
    // Build raises dropdown (1-8)
    const raisesOptions = Array.from({ length: 8 }, (_, i) => {
        const value = i + 1;
        return `<option value="${value}">${value}</option>`;
    }).join('');
    const raisesDropdown = `
    <div class="raises-input-group">
      <label for="raises-select-${attacker.id}-${target.id}">Raises:</label>
      <select id="raises-select-${attacker.id}-${target.id}" class="raises-select" data-message-id="">
        <option value="0" selected>0</option>
        ${raisesOptions}
      </select>
    </div>
  `;
    const content = `
    <div class="mastery-attack-card">
      <div class="attack-header">
        <h3><i class="fas fa-sword"></i> ${optionName}</h3>
        <p class="attack-participants"><strong>${attackerName}</strong> → <strong>${targetName}</strong></p>
      </div>
      <div class="attack-details">
        <div class="detail-row">
          <span class="detail-label">Attribute:</span>
          <span class="detail-value">${attribute.charAt(0).toUpperCase() + attribute.slice(1)} (${attributeValue})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Mastery Rank:</span>
          <span class="detail-value">${masteryRank}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Target Evade:</span>
          <span class="detail-value">${targetEvade}</span>
        </div>
        ${weapon ? `<div class="detail-row"><span class="detail-label">Weapon:</span><span class="detail-value">${weapon.name}</span></div>` : ''}
        ${selectedPowerId ? `<div class="detail-row"><span class="detail-label">Power:</span><span class="detail-value">${option.name}</span></div>` : ''}
      </div>
      <div class="attack-controls">
        ${raisesDropdown}
        ${buttonHtml}
      </div>
    </div>
  `;
    // Create chat message
    const speaker = ChatMessage.getSpeaker({
        actor: attacker,
        token: attackerToken.document
    });
    try {
        const message = await ChatMessage.create({
            speaker,
            content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            flags: {
                'mastery-system': flagsObj
            }
        });
        // Debug log after creating message
        console.log('Mastery System | [WEAPON-ID DEBUG]', {
            messageType: 'attack-card:create:after',
            messageId: message.id,
            createdFlags: message.flags?.['mastery-system']
        });
        // Update the raises dropdown with the actual message ID and add change handler
        if (message) {
            const messageId = message.id;
            // Wait a bit for the DOM to be ready
            setTimeout(() => {
                const messageElement = $(`.message[data-message-id="${messageId}"]`);
                if (messageElement.length === 0) {
                    // Try alternative selector
                    const altElement = $(`[data-message-id="${messageId}"]`);
                    if (altElement.length) {
                        setupRaisesHandler(altElement, messageId, baseEvade);
                    }
                }
                else {
                    setupRaisesHandler(messageElement, messageId, baseEvade);
                }
            }, 100);
        }
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
/**
 * Setup raises dropdown change handler
 */
function setupRaisesHandler(messageElement, messageId, baseEvade) {
    const raisesSelect = messageElement.find('.raises-select');
    if (raisesSelect.length) {
        raisesSelect.attr('data-message-id', messageId);
        // Add change handler to update button data-raises
        raisesSelect.off('change').on('change', function () {
            const raises = parseInt($(this).val()) || 0;
            const button = messageElement.find('.roll-attack-btn');
            button.attr('data-raises', raises.toString());
            // Update target-evade based on raises (each raise adds +2 to TN)
            const adjustedEvade = baseEvade + (raises * 2);
            button.attr('data-target-evade', adjustedEvade.toString());
            console.log('Mastery System | [ATTACK CARD] Raises updated', {
                raises,
                baseEvade,
                adjustedEvade
            });
        });
    }
}
//# sourceMappingURL=attack-executor.js.map