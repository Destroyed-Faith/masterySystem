/**
 * Resource Management for Mastery System
 * Handles Stones, Vitality (Health), and Stress tracking
 * 
 * Stones:
 * - Spent to activate powers (1, 2, 4, 8 exponential cost)
 * - Regenerate [Mastery Rank] per round
 * - Full restore after combat
 * 
 * Vitality:
 * - Health bars (Vitality × 2 boxes each)
 * - Reduced by damage, not spent
 * - Can spend 1 Stone to reactivate filled bar
 * 
 * Stress:
 * - Based on Resolve + Wits
 * - Gained from fear, magic, horror
 * - Triggers Mind Saves when bars fill
 */

/**
 * Spend Stones for an actor
 * @param actor - The actor spending Stones
 * @param amount - Number of Stones to spend
 * @param reason - Description of why (for chat message)
 * @returns Success boolean
 */
export async function spendStones(
  actor: any,
  amount: number,
  reason: string = 'power activation'
): Promise<boolean> {
  if (!actor || !actor.system.resources?.stones) return false;
  
  const stones = actor.system.resources.stones;
  
  // Check if enough Stones available
  if (stones.current < amount) {
    ui.notifications?.warn(`Not enough Stones! Have ${stones.current}, need ${amount}.`);
    return false;
  }
  
  const newCurrent = stones.current - amount;
  const newSpent = (stones.spentThisRound || 0) + amount;
  
  await actor.update({
    'system.resources.stones.current': newCurrent,
    'system.resources.stones.spentThisRound': newSpent
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-resource-use stone-use">
        <div class="resource-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} spends Stones</h3>
        </div>
        <div class="resource-details">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Stones Spent:</strong> ${amount}</p>
          <p><strong>Remaining:</strong> ${newCurrent} / ${stones.maximum}</p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'resource-use',
        resource: 'stones',
        amount,
        reason
      }
    }
  });
  
  console.log(`Mastery System | ${actor.name} spent ${amount} Stones for ${reason}`);
  return true;
}

/**
 * Regenerate Stones at end of round
 * @param actor - The actor
 * @returns New Stone count
 */
export async function regenerateStones(actor: any): Promise<number> {
  if (!actor || !actor.system.resources?.stones) return 0;
  
  const stones = actor.system.resources.stones;
  const regeneration = stones.regeneration || actor.system.mastery?.rank || 2;
  
  const newCurrent = Math.min(stones.maximum, stones.current + regeneration);
  
  await actor.update({
    'system.resources.stones.current': newCurrent,
    'system.resources.stones.spentThisRound': 0
  });
  
  const regenerated = newCurrent - stones.current;
  
  if (regenerated > 0) {
    console.log(`Mastery System | ${actor.name} regenerated ${regenerated} Stone(s) (${newCurrent}/${stones.maximum})`);
  }
  
  return newCurrent;
}

/**
 * Restore all Stones to maximum (after combat)
 * @param actor - The actor
 */
export async function restoreAllStones(actor: any): Promise<void> {
  if (!actor || !actor.system.resources?.stones) return;
  
  const stones = actor.system.resources.stones;
  
  await actor.update({
    'system.resources.stones.current': stones.maximum,
    'system.resources.stones.spentThisRound': 0
  });
  
  console.log(`Mastery System | ${actor.name} restored all Stones to ${stones.maximum}`);
}

/**
 * Apply Vitality damage to an actor
 * Uses existing health bar system
 * @param actor - The actor taking damage
 * @param amount - Amount of damage
 * @returns Success boolean
 */
export async function applyVitalityDamage(
  actor: any,
  amount: number
): Promise<boolean> {
  if (!actor || amount <= 0) return false;
  
  // Use existing applyDamage method from MasteryActor
  if (typeof (actor as any).applyDamage === 'function') {
    await (actor as any).applyDamage(amount);
  } else {
    console.warn('Mastery System | Actor does not have applyDamage method');
    return false;
  }
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-resource-use vitality-damage">
        <div class="resource-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} takes damage</h3>
        </div>
        <div class="resource-details">
          <p><strong>Damage:</strong> ${amount} HP</p>
          <p><strong>Current HP:</strong> ${(actor as any).totalHP || 0}</p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'resource-use',
        resource: 'vitality',
        amount,
        damage: true
      }
    }
  });
  
  console.log(`Mastery System | ${actor.name} took ${amount} Vitality damage`);
  return true;
}

/**
 * Heal Vitality
 * Uses existing heal method from MasteryActor
 * @param actor - The actor being healed
 * @param amount - Amount of healing
 * @returns Success boolean
 */
export async function healVitality(
  actor: any,
  amount: number
): Promise<boolean> {
  if (!actor || amount <= 0) return false;
  
  // Use existing heal method from MasteryActor
  if (typeof (actor as any).heal === 'function') {
    await (actor as any).heal(amount);
  } else {
    console.warn('Mastery System | Actor does not have heal method');
    return false;
  }
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-resource-use vitality-heal">
        <div class="resource-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} heals</h3>
        </div>
        <div class="resource-details">
          <p><strong>Healing:</strong> +${amount} HP</p>
          <p><strong>Current HP:</strong> ${(actor as any).totalHP || 0}</p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'resource-use',
        resource: 'vitality',
        amount,
        healing: true
      }
    }
  });
  
  console.log(`Mastery System | ${actor.name} healed ${amount} HP`);
  return true;
}

/**
 * Add Stress to an actor
 * @param actor - The actor
 * @param amount - Amount of Stress to add
 * @param reason - Description of why (for chat message)
 * @returns New Stress value
 */
export async function addStress(
  actor: any,
  amount: number,
  reason: string = 'stressful event'
): Promise<number> {
  if (!actor || !actor.system.resources?.stress) return 0;
  
  const stress = actor.system.resources.stress;
  const newCurrent = Math.min(stress.maximum, stress.current + amount);
  
  await actor.update({
    'system.resources.stress.current': newCurrent
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-resource-use stress-gain">
        <div class="resource-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} gains Stress</h3>
        </div>
        <div class="resource-details">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Stress Gained:</strong> +${amount}</p>
          <p><strong>Current Stress:</strong> ${newCurrent} / ${stress.maximum}</p>
          ${newCurrent >= stress.maximum ? '<p class="warning"><strong>⚠ Mind Save required!</strong></p>' : ''}
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'resource-use',
        resource: 'stress',
        amount,
        reason
      }
    }
  });
  
  console.log(`Mastery System | ${actor.name} gained ${amount} Stress: ${reason}`);
  
  // TODO: Trigger Mind Save if Stress bar filled
  if (newCurrent >= stress.maximum) {
    ui.notifications?.warn(`${actor.name} must make a Mind Save! Stress at maximum.`);
  }
  
  return newCurrent;
}

/**
 * Reduce Stress for an actor
 * @param actor - The actor
 * @param amount - Amount of Stress to reduce
 * @param reason - Description of why (for chat message)
 * @returns New Stress value
 */
export async function reduceStress(
  actor: any,
  amount: number,
  reason: string = 'stress relief'
): Promise<number> {
  if (!actor || !actor.system.resources?.stress) return 0;
  
  const stress = actor.system.resources.stress;
  const newCurrent = Math.max(0, stress.current - amount);
  
  await actor.update({
    'system.resources.stress.current': newCurrent
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-resource-use stress-reduce">
        <div class="resource-header">
          <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
          <h3>${actor.name} reduces Stress</h3>
        </div>
        <div class="resource-details">
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Stress Reduced:</strong> -${amount}</p>
          <p><strong>Current Stress:</strong> ${newCurrent} / ${stress.maximum}</p>
        </div>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    flags: {
      'mastery-system': {
        type: 'resource-use',
        resource: 'stress',
        amount,
        reason
      }
    }
  });
  
  console.log(`Mastery System | ${actor.name} reduced ${amount} Stress: ${reason}`);
  return newCurrent;
}

/**
 * Calculate exponential Stone cost for repeated power use
 * @param usageCount - How many times this power has been used this round (1st, 2nd, 3rd...)
 * @returns Stone cost
 */
export function calculateStoneCost(usageCount: number): number {
  // Cost progression: 1, 2, 4, 8, 16...
  return Math.pow(2, usageCount - 1);
}

/**
 * Get resource status for display
 * @param actor - The actor
 * @returns Object with resource values
 */
export function getResourceStatus(actor: any): {
  stones: { current: number; maximum: number; regeneration: number; spentThisRound: number };
  vitality: { current: number; maximum: number; currentBar: number };
  stress: { current: number; maximum: number; percentage: number };
} {
  const system = actor.system;
  
  return {
    stones: {
      current: system.resources?.stones?.current || 0,
      maximum: system.resources?.stones?.maximum || 0,
      regeneration: system.resources?.stones?.regeneration || system.mastery?.rank || 2,
      spentThisRound: system.resources?.stones?.spentThisRound || 0
    },
    vitality: {
      current: (actor as any).totalHP || 0,
      maximum: (actor as any).maxHP || 0,
      currentBar: system.health?.currentBar || 0
    },
    stress: {
      current: system.resources?.stress?.current || 0,
      maximum: system.resources?.stress?.maximum || 0,
      percentage: system.resources?.stress?.maximum > 0 
        ? Math.round((system.resources.stress.current / system.resources.stress.maximum) * 100)
        : 0
    }
  };
}

