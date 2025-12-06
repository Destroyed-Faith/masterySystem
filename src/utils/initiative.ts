/**
 * Initiative calculation and management for Mastery System
 * Initiative is rolled each round using:
 * Base Initiative = Agility + Wits + Combat Reflexes (skill)
 * Mastery Roll = Roll [Mastery Rank]d8, keep all, 8s explode
 * Final Initiative = Base + Mastery Roll - Shop Spending
 */

import { INITIATIVE_SHOP, EXPLODE_VALUE } from './constants';

/**
 * Calculate base initiative for an actor
 * Base = Agility + Wits + Combat Reflexes skill
 */
export function calculateBaseInitiative(actor: any): number {
  const system = actor.system;
  
  const agility = system.attributes?.agility?.value || 0;
  const wits = system.attributes?.wits?.value || 0;
  const combatReflexes = system.skills?.combatReflexes || 0;
  
  return agility + wits + combatReflexes;
}

/**
 * Roll initiative dice for an actor
 * Rolls [Mastery Rank]d8, keeps all, 8s explode
 * 
 * @param actor - The actor rolling initiative
 * @param withStones - Whether to include Stone Power bonuses (+1d8 per activation)
 * @param stoneActivations - Number of Wits Stone activations for initiative
 * @returns Object with total, rolls array, and formula string
 */
export async function rollInitiativeDice(
  actor: any, 
  withStones: boolean = false,
  stoneActivations: number = 0
): Promise<{ total: number; rolls: number[]; formula: string }> {
  const system = actor.system;
  const masteryRank = system.mastery?.rank || 2;
  
  // Base dice from Mastery Rank
  let numDice = masteryRank;
  
  // Add extra d8s from Wits Stone Powers if applicable
  if (withStones && stoneActivations > 0) {
    numDice += stoneActivations;
  }
  
  // Roll the dice with explosions
  const rolls: number[] = [];
  let total = 0;
  
  for (let i = 0; i < numDice; i++) {
    let dieTotal = 0;
    let exploding = true;
    
    while (exploding) {
      const roll = Math.floor(Math.random() * 8) + 1; // 1-8
      dieTotal += roll;
      
      // 8s explode
      if (roll === EXPLODE_VALUE) {
        exploding = true; // Continue exploding
      } else {
        exploding = false;
      }
    }
    
    rolls.push(dieTotal);
    total += dieTotal;
  }
  
  const formula = withStones && stoneActivations > 0 
    ? `${masteryRank}d8 + ${stoneActivations}d8 (Wits Stones)`
    : `${masteryRank}d8`;
  
  return { total, rolls, formula };
}

/**
 * Data returned from the Initiative Shop dialog
 */
export interface InitiativeShopResult {
  finalInitiative: number;
  spentPoints: number;
  purchases: {
    extraMovement: number;  // In meters (multiples of 2)
    initiativeSwap: boolean;
    extraAttack: boolean;
  };
  cancelled: boolean;
}

/**
 * Calculate the total cost of shop purchases
 */
export function calculateShopCost(purchases: InitiativeShopResult['purchases']): number {
  let cost = 0;
  
  // Extra movement: 4 points per 2m
  cost += (purchases.extraMovement / 2) * INITIATIVE_SHOP.MOVEMENT.COST;
  
  // Initiative swap
  if (purchases.initiativeSwap) {
    cost += INITIATIVE_SHOP.SWAP.COST;
  }
  
  // Extra attack
  if (purchases.extraAttack) {
    cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
  }
  
  return cost;
}

/**
 * Validate shop purchases against available initiative points
 */
export function validateShopPurchases(
  rawInitiative: number, 
  purchases: InitiativeShopResult['purchases']
): { valid: boolean; error?: string } {
  const cost = calculateShopCost(purchases);
  
  if (cost > rawInitiative) {
    return { 
      valid: false, 
      error: `Not enough initiative points. Cost: ${cost}, Available: ${rawInitiative}` 
    };
  }
  
  const finalInitiative = rawInitiative - cost;
  if (finalInitiative < 0) {
    return { 
      valid: false, 
      error: 'Initiative cannot drop below 0' 
    };
  }
  
  return { valid: true };
}

/**
 * Apply initiative shop purchases to an actor
 * Updates resources (movement, actions) based on purchases
 */
export async function applyShopPurchases(
  actor: any, 
  purchases: InitiativeShopResult['purchases']
): Promise<void> {
  const updates: any = {};
  
  // Add extra movement
  if (purchases.extraMovement > 0) {
    const currentMovement = actor.system.resources?.movement?.value || 1;
    const currentMax = actor.system.resources?.movement?.max || 1;
    updates['system.resources.movement.max'] = currentMax + 1;
    updates['system.resources.movement.value'] = currentMovement + 1;
  }
  
  // Add extra attack action
  if (purchases.extraAttack) {
    const currentActions = actor.system.resources?.actions?.value || 1;
    const currentMax = actor.system.resources?.actions?.max || 1;
    updates['system.resources.actions.max'] = currentMax + 1;
    updates['system.resources.actions.value'] = currentActions + 1;
  }
  
  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    await actor.update(updates);
  }
}

/**
 * Create a chat message for initiative roll results
 */
export async function createInitiativeChatMessage(
  actor: any,
  baseInitiative: number,
  masteryRoll: { total: number; rolls: number[]; formula: string },
  rawInitiative: number,
  shopResult: InitiativeShopResult
): Promise<void> {
  const rollsDisplay = masteryRoll.rolls.map(r => `<span class="die">${r}</span>`).join(' + ');
  
  let shopDetails = '';
  if (shopResult.spentPoints > 0) {
    shopDetails = '<div class="initiative-shop-details"><strong>Initiative Shop:</strong><ul>';
    
    if (shopResult.purchases.extraMovement > 0) {
      shopDetails += `<li>+${shopResult.purchases.extraMovement}m Movement (-${(shopResult.purchases.extraMovement / 2) * INITIATIVE_SHOP.MOVEMENT.COST} ini)</li>`;
    }
    if (shopResult.purchases.initiativeSwap) {
      shopDetails += `<li>Initiative Swap unlocked (-${INITIATIVE_SHOP.SWAP.COST} ini)</li>`;
    }
    if (shopResult.purchases.extraAttack) {
      shopDetails += `<li>+1 Extra Attack (-${INITIATIVE_SHOP.EXTRA_ATTACK.COST} ini)</li>`;
    }
    
    shopDetails += '</ul></div>';
  }
  
  const content = `
    <div class="mastery-roll initiative-roll">
      <div class="roll-header">
        <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
        <h3>${actor.name} rolls Initiative!</h3>
      </div>
      <div class="roll-details">
        <div class="base-initiative">
          <strong>Base Initiative:</strong> ${baseInitiative} 
          <span class="formula">(Agility + Wits + Combat Reflexes)</span>
        </div>
        <div class="mastery-roll">
          <strong>Mastery Roll:</strong> ${rollsDisplay} = ${masteryRoll.total}
          <span class="formula">${masteryRoll.formula}</span>
        </div>
        <div class="raw-initiative">
          <strong>Raw Initiative:</strong> ${rawInitiative}
        </div>
        ${shopDetails}
        <div class="final-initiative">
          <strong>Final Initiative:</strong> <span class="result">${shopResult.finalInitiative}</span>
        </div>
      </div>
    </div>
  `;
  
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'initiative-roll',
        baseInitiative,
        masteryRoll: masteryRoll.total,
        rawInitiative,
        finalInitiative: shopResult.finalInitiative,
        shopSpent: shopResult.spentPoints
      }
    }
  });
}

/**
 * Roll initiative for an NPC (no shop, automatic)
 */
export async function rollNpcInitiative(actor: any, combatant: any): Promise<number> {
  const baseInitiative = calculateBaseInitiative(actor);
  const masteryRoll = await rollInitiativeDice(actor, false, 0);
  const finalInitiative = Math.max(0, baseInitiative + masteryRoll.total);
  
  // Store flags on combatant
  await combatant.setFlag('mastery-system', 'initiativeData', {
    baseInitiative,
    masteryRoll: masteryRoll.total,
    masteryRollDetails: masteryRoll,
    rawInitiative: finalInitiative,
    finalInitiative,
    shopSpent: 0,
    shopPurchases: {
      extraMovement: 0,
      initiativeSwap: false,
      extraAttack: false
    }
  });
  
  // Create simple chat message for NPC
  const rollsDisplay = masteryRoll.rolls.join(' + ');
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-roll initiative-roll npc-initiative">
        <div class="roll-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} - Initiative</h3>
        </div>
        <div class="roll-details">
          <p><strong>Base:</strong> ${baseInitiative} + <strong>Roll:</strong> ${rollsDisplay} = <strong>${finalInitiative}</strong></p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  return finalInitiative;
}

