/**
 * Attack Executor
 * Creates melee attack chat cards with proper flags for the roll handler
 */

import type { RadialCombatOption } from "../token-radial-menu";
import { logActorItemSummary } from "../utils/debug-helpers";

/**
 * Safely collect items from actor (handles Collection, Array, Map)
 */
function collectActorItems(actor: any): any[] {
  if (!actor || !actor.items) return [];
  
  if (Array.isArray(actor.items)) {
    return actor.items;
  } else if (actor.items instanceof Map) {
    return Array.from(actor.items.values());
  } else if (actor.items.size !== undefined && actor.items.values) {
    // Foundry Collection-like object
    return Array.from(actor.items.values());
  }
  
  return [];
}


/**
 * Get attribute value from actor
 */
function getAttributeValue(actor: any, attributeName: string): number {
  if (!actor || !actor.system) {
    console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: No actor or system', {
      hasActor: !!actor,
      hasSystem: !!actor?.system,
      attributeName
    });
    return 0;
  }
  const system = actor.system as any;
  const attributes = system.attributes || {};
  const attrKey = attributeName.toLowerCase();
  const attr = attributes[attrKey] || {};
  const value = attr.value ?? attr.stones ?? 0;
  
  // Debug logging
  if (value === 0 || value < 2) {
    console.warn('Mastery System | [ATTACK EXECUTOR] getAttributeValue: Low or zero value detected', {
      attributeName,
      attrKey,
      attr,
      value,
      allAttributes: Object.keys(attributes),
      attributesData: attributes
    });
  }
  
  return value;
}

/**
 * Get mastery rank from actor
 */
function getMasteryRank(actor: any): number {
  if (!actor || !actor.system) return 2; // Default
  
  const system = actor.system as any;
  if (system.mastery?.rank) {
    return system.mastery.rank;
  }
  
  // Fallback to settings
  const playerMasteryRanks = (game as any).settings?.get('mastery-system', 'playerMasteryRanks') || {};
  const defaultMasteryRank = (game as any).settings?.get('mastery-system', 'defaultMasteryRank') || 2;
  const playerId = actor.getFlag?.('mastery-system', 'playerId') || actor.ownership?.default || '';
  return playerMasteryRanks[playerId] || defaultMasteryRank;
}

/**
 * Get evade value from target actor
 * Uses evadeTotal if available (includes shield bonus), otherwise falls back to base evade
 */
function getTargetEvade(targetActor: any): number {
  if (!targetActor || !targetActor.system) return 6; // Default
  
  const system = targetActor.system as any;
  const combat = system.combat || {};
  return combat.evadeTotal ?? combat.evade ?? 6;
}

/**
 * Determine which attribute to use for attack
 */
function getAttackAttribute(_actor: any, weapon: any | null, option: RadialCombatOption): string {
  // If it's a power, check if it specifies an attribute
  if (option.source === 'power' && option.item) {
    const powerSystem = (option.item.system as any) || {};
    if (powerSystem.attribute) {
      return powerSystem.attribute.toLowerCase();
    }
  }
  
  // Check weapon for Finesse (uses Agility)
  if (weapon) {
    const weaponSystem = weapon.system as any;
    const innateAbilities = weaponSystem.innateAbilities || [];
    const hasFinesse = innateAbilities.some((a: string) => 
      a.toLowerCase().includes('finesse')
    );
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
export async function createMeleeAttackCard(
  attackerToken: any,
  targetToken: any,
  option: RadialCombatOption
): Promise<void> {
  // Use token actor (for unlinked tokens) or base actor
  // For unlinked tokens, token.actor is a synthetic actor with delta data
  // For linked tokens, token.actor is the base actor
  const attacker = attackerToken.actor;
  const target = targetToken.actor;
  
  // For unlinked tokens, we might need to merge token delta with base actor data
  // But for now, use the token actor as-is and let the debug logs show what's happening
  const isUnlinked = attackerToken.actorLink === false;
  const baseActorId = attackerToken.actorLink ? null : (attackerToken as any).actorId;
  const baseActor = baseActorId ? (game as any).actors?.get(baseActorId) : null;
  
  // Debug: Log actor information
  console.log('Mastery System | [ATTACK EXECUTOR] Actor resolution', {
    attackerTokenId: attackerToken.id,
    attackerActorId: attacker?.id,
    attackerActorType: attacker?.type,
    attackerName: attacker?.name,
    isUnlinked: isUnlinked,
    baseActorId: baseActorId,
    baseActorName: baseActor?.name,
    tokenActorMight: (attacker?.system as any)?.attributes?.might?.value,
    baseActorMight: (baseActor?.system as any)?.attributes?.might?.value,
    actorSystem: (attacker?.system as any)?.attributes
  });
  
  if (!attacker || !target) {
    console.error('Mastery System | [ATTACK EXECUTOR] Missing actor data', {
      hasAttacker: !!attacker,
      hasTarget: !!target
    });
    return;
  }
  
  // Log actor item summary for diagnostics
  logActorItemSummary(attacker, 'attack-card:create');
  
  // Robust weapon resolution: equipped weapon first, then any weapon, then null
  const items = collectActorItems(attacker);
  
  // Try multiple strategies to find weapon:
  // 1. type === 'weapon' && equipped === true (prefer melee for melee attacks)
  // 2. type === 'weapon' && equipped === true (any weapon type)
  // 3. type === 'weapon' (any weapon)
  // 4. Check if any item has weapon-like properties (damage, weaponDamage) even if type is wrong
  let weapon = items.find((i: any) => 
    i.type === 'weapon' && 
    (i.system as any)?.equipped === true &&
    (i.system as any)?.weaponType === 'melee'
  );
  
  if (!weapon) {
    weapon = items.find((i: any) => i.type === 'weapon' && (i.system as any)?.equipped === true);
  }
  
  if (!weapon) {
    weapon = items.find((i: any) => i.type === 'weapon');
  }
  
  // Fallback: Look for items with weapon properties (in case type is wrong)
  if (!weapon) {
    weapon = items.find((i: any) => {
      const system = i.system || {};
      return (system.damage || system.weaponDamage || system.weaponType) && 
             (system.equipped === true || i.name?.toLowerCase().includes('axe') || i.name?.toLowerCase().includes('sword') || i.name?.toLowerCase().includes('weapon'));
    });
    
    if (weapon) {
      console.warn('Mastery System | [ATTACK EXECUTOR] Found weapon-like item with wrong type', {
        itemId: weapon.id,
        itemName: weapon.name,
        itemType: weapon.type,
        hasDamage: !!(weapon.system as any)?.damage,
        hasWeaponDamage: !!(weapon.system as any)?.weaponDamage,
        equipped: (weapon.system as any)?.equipped
      });
    }
  }
  
  const weaponId = weapon?.id ?? null;
  
  // Set flags with weaponId (always, even if null)
  if (!weapon) {
    console.warn('Mastery System | [ATTACK EXECUTOR] Actor has no weapon items; baseDamage will fallback.', {
      attackerId: attacker.id,
      attackerName: attacker.name,
      totalItems: items.length,
      itemTypes: Object.keys(items.reduce((acc: Record<string, number>, item: any) => {
        const type = item.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}))
    });
  }
  
  console.log('Mastery System | [ATTACK EXECUTOR] Weapon resolution', {
    attackerId: attacker.id,
    totalItems: items.length,
    weaponItems: items.filter((i: any) => i.type === 'weapon').length,
    weaponFound: !!weapon,
    weaponId: weaponId,
    weaponName: weapon?.name || null
  });
  
  // Determine attack attribute
  const attribute = getAttackAttribute(attacker, weapon, option);
  const attributeValue = getAttributeValue(attacker, attribute);
  const masteryRank = getMasteryRank(attacker);
  
  // Debug: Log attribute reading
  console.log('Mastery System | [ATTACK EXECUTOR] Attribute calculation', {
    attribute,
    attributeValue,
    masteryRank,
    attackerId: attacker.id,
    attackerName: attacker.name,
    actorSystem: (attacker.system as any)?.attributes,
    mightValue: (attacker.system as any)?.attributes?.might?.value,
    mightStones: (attacker.system as any)?.attributes?.might?.stones
  });
  
  // Get target evade
  const targetEvade = getTargetEvade(target);
  const baseEvade = targetEvade;
  
  // Get power info if applicable
  let selectedPowerId: string | null = null;
  let selectedPowerLevel: number | null = null;
  let selectedPowerSpecials: string[] = [];
  let selectedPowerDamage: string | null = null;
  
  if (option.source === 'power' && option.item) {
    selectedPowerId = option.item.id;
    const powerSystem = (option.item.system as any) || {};
    selectedPowerLevel = powerSystem.level || null;
    
    // Extract specials and damage from power data
    if (option.item.name) {
      // Try to get from option data if available
      const powerData = (option as any).powerData;
      if (powerData) {
        selectedPowerSpecials = powerData.specials || [];
        selectedPowerDamage = powerData.damage || null;
      }
    }
  }
  
  // Build flags object
  const flagsObj: any = {
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
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
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
        } else {
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
  } catch (error) {
    console.error('Mastery System | [ATTACK EXECUTOR] Failed to create attack card', error);
    ui.notifications?.error('Failed to create attack card');
  }
}

/**
 * Setup raises dropdown change handler
 */
function setupRaisesHandler(messageElement: JQuery, messageId: string, baseEvade: number): void {
  const raisesSelect = messageElement.find('.raises-select');
  if (raisesSelect.length) {
    raisesSelect.attr('data-message-id', messageId);
    
    // Add change handler to update button data-raises
    raisesSelect.off('change').on('change', function() {
      const raises = parseInt($(this).val() as string) || 0;
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

