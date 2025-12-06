/**
 * Movement Powers System for Mastery System
 * 
 * Rules from rulebook (Lines 4636-4642):
 * 
 * Movement Powers:
 * - Replace your normal Movement for the round
 * - Cost: 1 Movement Action
 * - Roll: Only required if movement includes an attack or contested action
 * - May reposition, evade, or strike while moving
 * 
 * Additional from Active Powers (Lines 4644-4667):
 * - Powers may have Stone costs for enhanced effects
 * - AoE modifiers may apply
 * - Range considerations
 */

/**
 * Movement power usage data
 */
export interface MovementPowerUsage {
  actorId: string;
  powerId: string;
  powerName: string;
  requiresRoll: boolean;
  hasAttack: boolean;
  hasContest: boolean;
  stoneCost: number;
}

/**
 * Check if a power requires a roll
 * Movement powers only need rolls if they include attack/contested action
 */
export function movementPowerRequiresRoll(power: any): boolean {
  const system = power.system;
  
  // Check if power has attack component
  const hasAttack = system.hasAttack || false;
  const hasContest = system.contestType || false;
  
  return hasAttack || hasContest;
}

/**
 * Use a Movement Power
 * 
 * @param actor - The actor using the power
 * @param power - The movement power item
 * @returns Success status
 */
export async function useMovementPower(
  actor: any,
  power: any
): Promise<boolean> {
  
  // Verify it's a movement power
  if (power.type !== 'movement') {
    ui.notifications?.error(`${power.name} is not a Movement Power!`);
    return false;
  }
  
  // Check if actor has movement action available
  const movementActions = actor.system.actions?.movement;
  if (!movementActions || movementActions.used >= movementActions.max) {
    ui.notifications?.error(`${actor.name} has no Movement Actions left!`);
    return false;
  }
  
  // Get power details
  const system = power.system;
  const stoneCost = system.stoneCost || 0;
  const requiresRoll = movementPowerRequiresRoll(power);
  
  // Check stone cost
  const currentStones = actor.system.resources?.stones?.current || 0;
  if (stoneCost > 0 && currentStones < stoneCost) {
    ui.notifications?.error(`${actor.name} needs ${stoneCost} Stones to use ${power.name}!`);
    return false;
  }
  
  // Spend stones if needed
  if (stoneCost > 0) {
    await actor.update({
      'system.resources.stones.current': currentStones - stoneCost
    });
  }
  
  // Use movement action
  await actor.update({
    'system.actions.movement.used': movementActions.used + 1
  });
  
  // Create chat message
  let chatContent = `
    <div class="mastery-movement-power">
      <h3>Movement Power: ${power.name}</h3>
      <p><strong>${actor.name}</strong> uses their Movement Action</p>
      ${stoneCost > 0 ? `<p><em>Stone Cost: ${stoneCost}</em></p>` : ''}
  `;
  
  if (requiresRoll) {
    chatContent += `
      <p><em>This power requires a roll...</em></p>
    `;
  } else {
    chatContent += `
      <p><strong>Effect:</strong> ${system.description || 'Movement repositioning'}</p>
    `;
  }
  
  chatContent += `</div>`;
  
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: chatContent,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  // If requires roll, prompt for it
  if (requiresRoll) {
    ui.notifications?.info(`${power.name} requires a roll - please roll attack or contest!`);
    
    // TODO: Integrate with attack/contest system
    // For now, just notify the user
  }
  
  console.log(`Mastery System | ${actor.name} used Movement Power: ${power.name} ${stoneCost > 0 ? `(${stoneCost} Stones)` : ''}`);
  
  return true;
}

/**
 * Get all equipped movement powers for an actor
 */
export function getMovementPowers(actor: any): any[] {
  return actor.items.filter((item: any) => 
    item.type === 'movement' && 
    (item.system.equipped === true || item.system.equipped === undefined)
  );
}

/**
 * Calculate stone cost for a movement power
 * Based on AoE, range, and special effects
 */
export function calculateMovementPowerCost(power: any): number {
  const system = power.system;
  let cost = system.baseStoneCost || 0;
  
  // AoE modifiers
  if (system.aoe) {
    const aoeType = system.aoe.type;
    const aoeSize = system.aoe.size || 0;
    
    if (aoeType === 'line' || aoeType === 'cone') {
      cost += Math.floor(aoeSize / 4); // +1 per 4m
    } else if (aoeType === 'radius') {
      cost += Math.floor(aoeSize / 2); // +1 per 2m radius
    }
  }
  
  // Range modifiers
  const range = system.range || 0;
  if (range > 16) {
    cost += 1; // Long range
  }
  
  return cost;
}

