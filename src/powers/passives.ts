/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */

/** Mastery Rank at which each passive slot unlocks (max 4 slots). */
export const PASSIVE_SLOT_UNLOCK_RANKS: readonly number[] = [1, 2, 4, 6];

export const MAX_PASSIVE_SLOTS = PASSIVE_SLOT_UNLOCK_RANKS.length;

export interface PassiveSlot {
  slotIndex: number;
  passive: PassiveAbility | null;
  active: boolean;
  unlockMasteryRank: number;
}

export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  category: string;
  level?: number;
}

/** How many passive slots are available at the given Mastery Rank. */
export function getPassiveSlotCountForMasteryRank(masteryRank: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  let count = 0;
  for (const unlock of PASSIVE_SLOT_UNLOCK_RANKS) {
    if (mr >= unlock) count++;
    else break;
  }
  return count;
}

/** Mastery Rank required to unlock a slot index (0-based), or null if out of range. */
export function getPassiveSlotUnlockRank(slotIndex: number): number | null {
  return PASSIVE_SLOT_UNLOCK_RANKS[slotIndex] ?? null;
}

/**
 * Get all passive slots for an actor
 * Returns slots unlocked by Mastery Rank (MR 1/2/4/6 → up to 4 slots).
 */
export function getPassiveSlots(actor: Actor): PassiveSlot[] {
  const system = (actor.system as any);
  const passives = system.passives || {};
  const masteryRank = system.mastery?.rank || 2;
  const slotCount = getPassiveSlotCountForMasteryRank(masteryRank);
  const slots: PassiveSlot[] = [];

  for (let i = 0; i < slotCount; i++) {
    const slotData = passives[`slot${i}`] || {};
    slots.push({
      slotIndex: i,
      passive: slotData.passive || null,
      active: slotData.active || false,
      unlockMasteryRank: getPassiveSlotUnlockRank(i) ?? 1,
    });
  }

  return slots;
}

/**
 * Get all available passive abilities for an actor
 * Gets passives from actor's items (powers with powerType 'passive')
 */
export function getAvailablePassives(actor: Actor): PassiveAbility[] {
  const available: PassiveAbility[] = [];
  const items = (actor as any).items || [];
  
  // Get all items that are powers with powerType 'passive'
  for (const item of items) {
    const itemSystem = (item.system as any) || {};
    // Items with type 'power' and powerType 'passive' are passive abilities
    if (item.type === 'power' && itemSystem.powerType === 'passive') {
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
 * Item ids (or legacy fallbacks stored on slotted passive) already placed in a passive slot.
 * Used so the combat passive UI still lists other passives from the same tree.
 */
export function getSlottedPassiveIds(actor: Actor): Set<string> {
  const ids = new Set<string>();
  for (const slot of getPassiveSlots(actor)) {
    const pid = slot.passive?.id;
    if (pid != null && String(pid).length > 0) {
      ids.add(String(pid));
    }
  }
  return ids;
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
    item.type === 'power' && 
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
  
  // Slotted passives are always treated as active (no separate activate step).
  system.passives[slotKey].active = true;

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
  const maxActive = getPassiveSlotCountForMasteryRank(masteryRank);
  const activeCount = getActivePassiveCount(actor);

  // Toggle active state
  const currentActive = system.passives[slotKey].active || false;

  if (!currentActive && activeCount >= maxActive) {
    ui.notifications.warn(
      `You can only have ${maxActive} active passives at Mastery Rank ${masteryRank}.`,
    );
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

