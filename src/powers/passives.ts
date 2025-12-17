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
 */
export function getPassiveSlots(actor: Actor): PassiveSlot[] {
  const system = (actor.system as any);
  const passives = system.passives || {};
  const slots: PassiveSlot[] = [];
  
  // Create 8 slots (standard passive slot count)
  for (let i = 0; i < 8; i++) {
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
 * This would typically come from the actor's mastery trees and powers
 */
export function getAvailablePassives(_actor: Actor): PassiveAbility[] {
  const available: PassiveAbility[] = [];
  
  // Get passives from equipped powers/items
  // For now, return empty array - this should be populated from mastery trees
  // TODO: Implement proper passive extraction from mastery trees
  
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
  
  // TODO: Get passive data from mastery trees based on passiveId
  // For now, create a placeholder
  system.passives[slotKey].passive = {
    id: passiveId,
    name: passiveId, // TODO: Get actual name
    description: '', // TODO: Get actual description
    category: '' // TODO: Get actual category
  };
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

