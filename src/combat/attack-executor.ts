/**
 * Attack Executor
 * Creates melee attack chat cards with proper flags for the roll handler
 */

import type { RadialCombatOption } from "../token-radial-menu";

/**
 * Get equipped weapon from actor
 */
function getEquippedWeapon(actor: any): any | null {
  if (!actor) return null;
  const items = actor.items || [];
  return items.find((item: any) => 
    item.type === 'weapon' && (item.system as any)?.equipped === true
  ) || null;
}

/**
 * Get attribute value from actor
 */
function getAttributeValue(actor: any, attributeName: string): number {
  if (!actor || !actor.system) return 0;
  const system = actor.system as any;
  const attributes = system.attributes || {};
  const attr = attributes[attributeName.toLowerCase()] || {};
  return attr.value || attr.stones || 0;
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
 */
function getTargetEvade(targetActor: any): number {
  if (!targetActor || !targetActor.system) return 6; // Default
  
  const system = targetActor.system as any;
  const combat = system.combat || {};
  return combat.evade || 6;
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
  } catch (error) {
    console.error('Mastery System | [ATTACK EXECUTOR] Failed to create attack card', error);
    ui.notifications?.error('Failed to create attack card');
  }
}

