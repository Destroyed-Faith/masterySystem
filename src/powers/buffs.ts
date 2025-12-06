/**
 * Buff Duration & Limits System for Mastery System
 * 
 * Rules:
 * - Active Buffs last 2-6 rounds
 * - Max 1 Buff of same type active at once
 * - Cannot reactivate until expired
 * - Tracked per actor
 */

/**
 * Buff types (categories that cannot stack)
 */
export enum BuffType {
  ATTACK = 'attack',         // Attack bonuses
  DEFENSE = 'defense',       // Defense/Evade bonuses
  DAMAGE = 'damage',         // Damage bonuses
  MOVEMENT = 'movement',     // Speed/movement bonuses
  ATTRIBUTE = 'attribute',   // Attribute bonuses
  RESISTANCE = 'resistance', // Damage resistance
  REGENERATION = 'regeneration', // Healing over time
  CUSTOM = 'custom'          // Unique buffs
}

/**
 * Active buff data
 */
export interface ActiveBuff {
  id: string;
  name: string;
  type: BuffType;
  duration: number;          // Rounds remaining
  maxDuration: number;       // Initial duration
  effect: string;            // Description
  sourceItem?: string;       // Item that granted it
  appliedRound: number;      // Combat round when applied
  effects: BuffEffect[];     // Mechanical effects
}

/**
 * Buff effect (similar to passive effects)
 */
export interface BuffEffect {
  type: 'flat' | 'dice' | 'flag';
  target: string;            // e.g., 'attack', 'evade', 'damage'
  value: number | string;
  condition?: string;
}

/**
 * Get all active buffs for an actor
 */
export function getActiveBuffs(actor: any): ActiveBuff[] {
  return actor.system.activeBuffs || [];
}

/**
 * Check if actor has a buff of a specific type
 */
export function hasBuffType(actor: any, buffType: BuffType): boolean {
  const buffs = getActiveBuffs(actor);
  return buffs.some(buff => buff.type === buffType);
}

/**
 * Get buff of a specific type
 */
export function getBuffByType(actor: any, buffType: BuffType): ActiveBuff | null {
  const buffs = getActiveBuffs(actor);
  return buffs.find(buff => buff.type === buffType) || null;
}

/**
 * Apply a buff to an actor
 * Validates that no buff of same type is active
 */
export async function applyBuff(
  actor: any,
  buffData: Omit<ActiveBuff, 'id' | 'appliedRound' | 'duration'>
): Promise<boolean> {
  
  // Check if buff of this type already exists
  if (hasBuffType(actor, buffData.type)) {
    const existingBuff = getBuffByType(actor, buffData.type);
    ui.notifications?.error(`Cannot apply ${buffData.name}: ${existingBuff?.name} is already active!`);
    return false;
  }
  
  // Get current combat round
  const combat = (game as any).combat;
  const currentRound = combat?.round || 0;
  
  // Create the buff
  const buff: ActiveBuff = {
    id: `buff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...buffData,
    duration: buffData.maxDuration,
    appliedRound: currentRound
  };
  
  // Add to actor's active buffs
  const currentBuffs = getActiveBuffs(actor);
  const newBuffs = [...currentBuffs, buff];
  
  await actor.update({
    'system.activeBuffs': newBuffs
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-buff-applied">
        <h3>${actor.name} gains ${buff.name}!</h3>
        <p><strong>Type:</strong> ${buff.type}</p>
        <p><strong>Duration:</strong> ${buff.maxDuration} rounds</p>
        <p>${buff.effect}</p>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  ui.notifications?.info(`${buff.name} applied for ${buff.maxDuration} rounds!`);
  console.log(`Mastery System | Applied buff ${buff.name} to ${actor.name}`);
  
  // Recalculate stats
  actor.prepareData();
  
  return true;
}

/**
 * Remove a buff from an actor
 */
export async function removeBuff(actor: any, buffId: string): Promise<void> {
  const currentBuffs = getActiveBuffs(actor);
  const buff = currentBuffs.find(b => b.id === buffId);
  
  if (!buff) {
    console.warn(`Mastery System | Buff ${buffId} not found on ${actor.name}`);
    return;
  }
  
  const newBuffs = currentBuffs.filter(b => b.id !== buffId);
  
  await actor.update({
    'system.activeBuffs': newBuffs
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-buff-expired">
        <h3>${buff.name} expired on ${actor.name}</h3>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  ui.notifications?.info(`${buff.name} expired!`);
  console.log(`Mastery System | Removed buff ${buff.name} from ${actor.name}`);
  
  // Recalculate stats
  actor.prepareData();
}

/**
 * Update buff durations at start of round
 * Called by combat hooks
 */
export async function updateBuffDurations(actor: any): Promise<void> {
  const buffs = getActiveBuffs(actor);
  const updatedBuffs: ActiveBuff[] = [];
  const expiredBuffs: ActiveBuff[] = [];
  
  for (const buff of buffs) {
    const newDuration = buff.duration - 1;
    
    if (newDuration <= 0) {
      // Buff expired
      expiredBuffs.push(buff);
    } else {
      // Update duration
      updatedBuffs.push({
        ...buff,
        duration: newDuration
      });
    }
  }
  
  // Update actor
  await actor.update({
    'system.activeBuffs': updatedBuffs
  });
  
  // Notify about expired buffs
  for (const buff of expiredBuffs) {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="mastery-buff-expired">
          <h3>${buff.name} expired on ${actor.name}</h3>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }
  
  if (expiredBuffs.length > 0) {
    console.log(`Mastery System | ${expiredBuffs.length} buff(s) expired on ${actor.name}`);
    // Recalculate stats
    actor.prepareData();
  }
}

/**
 * Get all buff effects for stat calculations
 * Similar to passive effects but from active buffs
 */
export function getActiveBuffEffects(actor: any): BuffEffect[] {
  const buffs = getActiveBuffs(actor);
  const effects: BuffEffect[] = [];
  
  for (const buff of buffs) {
    effects.push(...buff.effects);
  }
  
  return effects;
}

/**
 * Apply buff effects to a stat calculation
 */
export function applyBuffEffects(
  actor: any,
  target: string,
  baseValue: number
): number {
  const effects = getActiveBuffEffects(actor);
  let value = baseValue;
  
  for (const effect of effects) {
    if (effect.target === target && effect.type === 'flat') {
      value += Number(effect.value);
    }
  }
  
  return value;
}

/**
 * Get buff dice bonuses for rolls
 */
export function getBuffDiceBonus(actor: any, rollType: string): number {
  const effects = getActiveBuffEffects(actor);
  let bonus = 0;
  
  for (const effect of effects) {
    if (effect.target === rollType && effect.type === 'dice') {
      bonus += Number(effect.value);
    }
  }
  
  return bonus;
}

/**
 * Check if actor has a specific buff flag
 */
export function hasBuffFlag(actor: any, flagName: string): boolean {
  const effects = getActiveBuffEffects(actor);
  
  return effects.some(effect => 
    effect.type === 'flag' && 
    effect.target === flagName && 
    effect.value
  );
}

/**
 * Clear all buffs from an actor (e.g., at end of combat)
 */
export async function clearAllBuffs(actor: any): Promise<void> {
  await actor.update({
    'system.activeBuffs': []
  });
  
  console.log(`Mastery System | Cleared all buffs from ${actor.name}`);
}

