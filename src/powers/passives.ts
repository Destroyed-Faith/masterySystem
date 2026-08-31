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
    const raw = slotData.passive;
    const hasPassive = !!(raw && (raw.id || raw.name));
    slots.push({
      slotIndex: i,
      passive: hasPassive ? raw : null,
      active: hasPassive && !!slotData.active,
      unlockMasteryRank: getPassiveSlotUnlockRank(i) ?? 1,
    });
  }

  return slots;
}

function actorItemList(actor: Actor): any[] {
  const raw = (actor as any).items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.contents)) return raw.contents;
  if (typeof raw[Symbol.iterator] === 'function') return [...raw];
  return [];
}

/** Passive powers on the actor (items with powerType `passive`). */
export function getAvailablePassives(actor: Actor): PassiveAbility[] {
  const available: PassiveAbility[] = [];
  const items = actorItemList(actor);
  
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
  const items = actorItemList(actor);
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
  const slotKey = `slot${slotIndex}`;
  // Foundry diffs drop `null` on object replace, so the old passive would stay.
  // The `-=` key deletes the slot on the document the player actually owns.
  await actor.update({ [`system.passives.-=${slotKey}`]: null });
}

/**
 * Get count of active passives
 */
function getActivePassiveCount(actor: Actor): number {
  const slots = getPassiveSlots(actor);
  return slots.filter(slot => slot.active && slot.passive).length;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUnit(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Choose default passive ids for empty slots. Deterministic per `seed`
 * (normally the actor id) so the first fight does not reshuffle.
 */
export function pickDefaultPassiveIds(
  available: Array<{ id?: string | null }>,
  slotCount: number,
  seed: string,
): string[] {
  const count = Math.max(0, Math.floor(Number(slotCount) || 0));
  const ids = [
    ...new Set(
      available
        .map((p) => String(p?.id ?? '').trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
  if (count <= 0 || ids.length === 0) return [];
  if (ids.length <= count) return ids;
  const rng = seededUnit(hashSeed(String(seed || 'passives')));
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, count);
}

/**
 * If the actor has no slotted passives yet, fill unlocked slots from known
 * passives (all of them when they fit; otherwise a stable random subset).
 * Already-slotted picks are the saved default and are left alone.
 */
export async function ensureDefaultPassiveSlots(actor: Actor): Promise<string[]> {
  const slots = getPassiveSlots(actor);
  if (slots.some((s) => s.passive)) {
    return slots.map((s) => String(s.passive?.id ?? '')).filter(Boolean);
  }
  const available = getAvailablePassives(actor);
  const picked = pickDefaultPassiveIds(
    available,
    slots.length,
    String((actor as { id?: string }).id ?? (actor as { name?: string }).name ?? ''),
  );
  for (let i = 0; i < picked.length; i += 1) {
    await slotPassive(actor, i, picked[i]);
  }
  return picked;
}

