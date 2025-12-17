/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */

export interface PassiveSlot {
  slotIndex: number;
  passive: PassiveAbility | null;
  active: boolean;
}

export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  category: string;
  level?: number;
}

/**
 * Get all passive slots for an actor
 * Returns only as many slots as the actor's Mastery Rank
 */
export function getPassiveSlots(actor: Actor): PassiveSlot[] {
  const system = (actor.system as any);
  const passives = system.passives || {};
  const masteryRank = system.mastery?.rank || 2;
  const slots: PassiveSlot[] = [];
  
  // Create slots based on Mastery Rank (not fixed 8)
  for (let i = 0; i < masteryRank; i++) {
    const slotData = passives[`slot${i}`] || {};
    slots.push({
      slotIndex: i,
      passive: slotData.passive || null,
      active: slotData.active || false
    });
  }
  
  return slots;
}

/**
 * Get all available passive abilities for an actor
 * Gets passives from actor's items (specials with powerType 'passive')
 */
export function getAvailablePassives(actor: Actor): PassiveAbility[] {
  const available: PassiveAbility[] = [];
  const items = (actor as any).items || [];
  
  // Get all items that are specials with powerType 'passive'
  for (const item of items) {
    const itemSystem = (item.system as any) || {};
    // Items with type 'special' and powerType 'passive' are passive abilities
    if (item.type === 'special' && itemSystem.powerType === 'passive') {
      // Extract category from tree or use a default
      const category = itemSystem.tree || itemSystem.category || 'General';
      
      available.push({
        id: item.id || item._id || item.name,
        name: item.name || 'Unknown Passive',
        description: itemSystem.effect || itemSystem.description || '',
        category: category,
        level: itemSystem.level || 1
      });
    }
  }
  
  return available;
}

/**
 * Slot a passive ability into a slot
 */
export async function slotPassive(actor: Actor, slotIndex: number, passiveId: string): Promise<void> {
  const system = (actor.system as any);
  if (!system.passives) {
    system.passives = {};
  }
  
  const slotKey = `slot${slotIndex}`;
  if (!system.passives[slotKey]) {
    system.passives[slotKey] = {};
  }
  
  // Find the passive item by ID or name
  const items = (actor as any).items || [];
  const passiveItem = items.find((item: any) => 
    (item.id === passiveId || item._id === passiveId || item.name === passiveId) && 
    item.type === 'special' && 
    (item.system as any)?.powerType === 'passive'
  );
  
  if (passiveItem) {
    const itemSystem = (passiveItem.system as any) || {};
    system.passives[slotKey].passive = {
      id: passiveItem.id || passiveItem._id || passiveItem.name,
      name: passiveItem.name || 'Unknown Passive',
      description: itemSystem.effect || itemSystem.description || '',
      category: itemSystem.tree || itemSystem.category || 'General',
      level: itemSystem.level || 1
    };
  } else {
    // Fallback if item not found
    system.passives[slotKey].passive = {
      id: passiveId,
      name: passiveId,
      description: '',
      category: 'General'
    };
  }
  
  system.passives[slotKey].active = false;
  
  await actor.update({ 'system.passives': system.passives });
}

/**
 * Activate or deactivate a passive in a slot
 */
export async function activatePassive(actor: Actor, slotIndex: number): Promise<void> {
  const system = (actor.system as any);
  if (!system.passives) {
    system.passives = {};
  }
  
  const slotKey = `slot${slotIndex}`;
  if (!system.passives[slotKey] || !system.passives[slotKey].passive) {
    return; // Can't activate empty slot
  }
  
  const masteryRank = system.mastery?.rank || 2;
  const activeCount = getActivePassiveCount(actor);
  
  // Toggle active state
  const currentActive = system.passives[slotKey].active || false;
  
  if (!currentActive && activeCount >= masteryRank) {
    ui.notifications.warn(`You can only have ${masteryRank} active passives (Mastery Rank)`);
    return;
  }
  
  system.passives[slotKey].active = !currentActive;
  await actor.update({ 'system.passives': system.passives });
}

/**
 * Remove a passive from a slot
 */
export async function unslotPassive(actor: Actor, slotIndex: number): Promise<void> {
  const system = (actor.system as any);
  if (!system.passives) {
    system.passives = {};
  }
  
  const slotKey = `slot${slotIndex}`;
  system.passives[slotKey] = {
    passive: null,
    active: false
  };
  
  await actor.update({ 'system.passives': system.passives });
}

/**
 * Get count of active passives
 */
function getActivePassiveCount(actor: Actor): number {
  const slots = getPassiveSlots(actor);
  return slots.filter(slot => slot.active && slot.passive).length;
}

