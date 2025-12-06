/**
 * Passive Powers System for Mastery System
 * 
 * Rules:
 * - 8 Passive Slots total
 * - Max active Passives = Mastery Rank
 * - Only 1 Passive per category can be active
 * - Categories: Armor, Evade, To-Hit, Damage, Roll, Save, Hit Point, Healing, Awareness, Attribute
 * - Set before Initiative roll, no switching during combat
 * - Effects apply automatically (no roll required)
 */

/**
 * Passive Power Categories
 */
export enum PassiveCategory {
  ARMOR = 'armor',
  EVADE = 'evade',
  TO_HIT = 'toHit',
  DAMAGE = 'damage',
  ROLL = 'roll',
  SAVE = 'save',
  HIT_POINT = 'hitPoint',
  HEALING = 'healing',
  AWARENESS = 'awareness',
  ATTRIBUTE = 'attribute'
}

/**
 * Passive Power Data
 */
export interface PassiveData {
  id: string;
  name: string;
  category: PassiveCategory;
  description: string;
  effects: PassiveEffect[];
  sourceItem?: string; // Item ID that grants this passive
}

/**
 * Effect of a passive power
 */
export interface PassiveEffect {
  type: 'flat' | 'dice' | 'flag';
  target: string; // e.g., 'armor', 'evade', 'damage', 'saves.body'
  value: number | string;
  condition?: string; // Optional condition (e.g., "when using melee weapons")
}

/**
 * Passive Slot State
 */
export interface PassiveSlot {
  slotIndex: number; // 0-7
  passive: PassiveData | null;
  active: boolean;
}

/**
 * Get all passive slots for an actor
 */
export function getPassiveSlots(actor: any): PassiveSlot[] {
  const slots: PassiveSlot[] = [];
  const slotData = actor.system.passives?.slots || [];
  
  for (let i = 0; i < 8; i++) {
    const slot = slotData[i] || { passive: null, active: false };
    slots.push({
      slotIndex: i,
      passive: slot.passive,
      active: slot.active
    });
  }
  
  return slots;
}

/**
 * Get all available passive powers from actor's items
 */
export function getAvailablePassives(actor: any): PassiveData[] {
  const passives: PassiveData[] = [];
  
  // Find all items with passive powers
  for (const item of actor.items) {
    if (item.type === 'special' && item.system.powerType === 'passive') {
      const category = item.system.passiveCategory || PassiveCategory.DAMAGE;
      
      passives.push({
        id: item.id,
        name: item.name,
        category,
        description: item.system.description || '',
        effects: item.system.passiveEffects || [],
        sourceItem: item.id
      });
    }
  }
  
  return passives;
}

/**
 * Slot a passive power
 * Validates category uniqueness and Mastery Rank limit
 */
export async function slotPassive(
  actor: any,
  slotIndex: number,
  passiveId: string
): Promise<boolean> {
  
  if (slotIndex < 0 || slotIndex >= 8) {
    ui.notifications?.error('Invalid slot index!');
    return false;
  }
  
  const availablePassives = getAvailablePassives(actor);
  const passive = availablePassives.find(p => p.id === passiveId);
  
  if (!passive) {
    ui.notifications?.error('Passive not found!');
    return false;
  }
  
  const slots = getPassiveSlots(actor);
  const currentSlots = actor.system.passives?.slots || [];
  
  // Check if this category is already slotted
  const categoryUsed = slots.some((slot, idx) => 
    idx !== slotIndex && 
    slot.passive && 
    slot.passive.category === passive.category
  );
  
  if (categoryUsed) {
    ui.notifications?.error(`Category ${passive.category} is already used in another slot!`);
    return false;
  }
  
  // Update the slot
  const newSlots = [...currentSlots];
  newSlots[slotIndex] = {
    passive,
    active: false // Will be activated separately
  };
  
  await actor.update({
    'system.passives.slots': newSlots
  });
  
  ui.notifications?.info(`${passive.name} slotted into slot ${slotIndex + 1}`);
  return true;
}

/**
 * Unslot a passive power
 */
export async function unslotPassive(actor: any, slotIndex: number): Promise<void> {
  const currentSlots = actor.system.passives?.slots || [];
  const newSlots = [...currentSlots];
  
  newSlots[slotIndex] = {
    passive: null,
    active: false
  };
  
  await actor.update({
    'system.passives.slots': newSlots
  });
  
  ui.notifications?.info(`Slot ${slotIndex + 1} cleared`);
}

/**
 * Activate a slotted passive
 * Checks Mastery Rank limit
 */
export async function activatePassive(actor: any, slotIndex: number): Promise<boolean> {
  const masteryRank = actor.system.mastery?.rank || 2;
  const slots = getPassiveSlots(actor);
  const slot = slots[slotIndex];
  
  if (!slot.passive) {
    ui.notifications?.error('No passive in this slot!');
    return false;
  }
  
  // Count currently active passives
  const activeCount = slots.filter(s => s.active).length;
  
  if (activeCount >= masteryRank && !slot.active) {
    ui.notifications?.error(`Cannot activate more than ${masteryRank} passives (Mastery Rank limit)!`);
    return false;
  }
  
  // Toggle activation
  const currentSlots = actor.system.passives?.slots || [];
  const newSlots = [...currentSlots];
  newSlots[slotIndex] = {
    ...newSlots[slotIndex],
    active: !slot.active
  };
  
  await actor.update({
    'system.passives.slots': newSlots
  });
  
  if (!slot.active) {
    ui.notifications?.info(`${slot.passive.name} activated!`);
    
    // Post chat message
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="mastery-passive-activated">
          <h3>${actor.name} activates ${slot.passive.name}!</h3>
          <p><strong>Category:</strong> ${slot.passive.category}</p>
          <p>${slot.passive.description}</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  } else {
    ui.notifications?.info(`${slot.passive.name} deactivated!`);
  }
  
  // Recalculate derived stats
  actor.prepareData();
  
  return true;
}

/**
 * Deactivate all passives (e.g., at end of combat)
 */
export async function deactivateAllPassives(actor: any): Promise<void> {
  const currentSlots = actor.system.passives?.slots || [];
  const newSlots = currentSlots.map((slot: any) => ({
    ...slot,
    active: false
  }));
  
  await actor.update({
    'system.passives.slots': newSlots
  });
  
  console.log(`Mastery System | Deactivated all passives for ${actor.name}`);
}

/**
 * Get all active passive effects for an actor
 * Used for calculating derived stats
 */
export function getActivePassiveEffects(actor: any): PassiveEffect[] {
  const slots = getPassiveSlots(actor);
  const effects: PassiveEffect[] = [];
  
  for (const slot of slots) {
    if (slot.active && slot.passive) {
      effects.push(...slot.passive.effects);
    }
  }
  
  return effects;
}

/**
 * Apply passive effects to a stat calculation
 * 
 * @param actor - The actor
 * @param target - Target stat (e.g., 'armor', 'evade', 'damage')
 * @param baseValue - Base value before passives
 * @returns Modified value with passive effects
 */
export function applyPassiveEffects(
  actor: any,
  target: string,
  baseValue: number
): number {
  const effects = getActivePassiveEffects(actor);
  let value = baseValue;
  
  for (const effect of effects) {
    if (effect.target === target && effect.type === 'flat') {
      value += Number(effect.value);
    }
  }
  
  return value;
}

/**
 * Get passive dice bonuses for rolls
 * 
 * @param actor - The actor
 * @param rollType - Type of roll ('attack', 'damage', 'skill', etc.)
 * @returns Number of bonus dice to add
 */
export function getPassiveDiceBonus(actor: any, rollType: string): number {
  const effects = getActivePassiveEffects(actor);
  let bonus = 0;
  
  for (const effect of effects) {
    if (effect.target === rollType && effect.type === 'dice') {
      bonus += Number(effect.value);
    }
  }
  
  return bonus;
}

/**
 * Check if actor has a specific passive flag
 * 
 * @param actor - The actor
 * @param flagName - Flag to check (e.g., 'cannotBeSurprised', 'regeneration')
 * @returns True if flag is active
 */
export function hasPassiveFlag(actor: any, flagName: string): boolean {
  const effects = getActivePassiveEffects(actor);
  
  return effects.some(effect => 
    effect.type === 'flag' && 
    effect.target === flagName && 
    effect.value
  );
}

