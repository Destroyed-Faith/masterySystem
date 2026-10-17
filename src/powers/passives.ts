/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */

import { findCombatantByActorId, readCombatantSetupStep } from '../combat/encounter-setup-flags.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { resolvePowerCategoryFromItem } from '../utils/power-catalog.js';

/**
 * Mastery Rank at which each passive slot unlocks (Players Guide / passives.md).
 * MR1→1, MR2→2, MR3–4→3, MR5–6→4, MR7→5, MR8→6.
 */
export const PASSIVE_SLOT_UNLOCK_RANKS: readonly number[] = [1, 2, 3, 5, 7, 8];

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
 * Returns slots unlocked by Mastery Rank (up to 6 at MR 8).
 */
export function getPassiveSlots(actor: Actor): PassiveSlot[] {
  const system = (actor.system as any);
  const passives = system.passives || {};
  const masteryRank = getRulesMasteryRank(actor);
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

/**
 * World prototype + unlinked token actor often diverge: GM may grant a Passive on
 * the sheet while Combat Select Passives reads the other. Union both.
 */
export function passiveItemSourceActors(actor: Actor | null | undefined): Actor[] {
  if (!actor) return [];
  const sources: Actor[] = [];
  const seen = new Set<string>();
  const seenObj = new WeakSet<object>();
  const add = (a: any) => {
    if (!a) return;
    if (typeof a === 'object') {
      if (seenObj.has(a)) return;
      seenObj.add(a);
    }
    const key = String(a.uuid ?? a.id ?? '');
    // Actors without id/uuid (tests / transient sheets) still contribute items.
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }
    sources.push(a as Actor);
  };
  add(actor);
  const anyA = actor as any;
  const g = globalThis as any;
  const worldId = String(
    anyA.isToken
      ? (anyA.token?.actorId ?? anyA.token?.document?.actorId ?? anyA.id ?? '')
      : (anyA.id ?? ''),
  );

  if (anyA.isToken && worldId) {
    add(g.game?.actors?.get?.(worldId));
  }

  const considerTokenDoc = (doc: any) => {
    if (!doc || doc.actorLink === true) return;
    if (worldId && String(doc.actorId ?? '') !== worldId) return;
    // Prefer the synthetic actor on the placeable; fall back to TokenDocument.actor.
    const placeable = doc.object ?? doc;
    add(placeable?.actor ?? doc.actor);
  };

  const placeables = g.canvas?.tokens?.placeables;
  if (Array.isArray(placeables)) {
    for (const t of placeables) considerTokenDoc(t?.document ?? t);
  }

  const combatants = g.game?.combat?.combatants;
  const bag = combatants
    ? Array.isArray(combatants)
      ? combatants
      : Array.isArray(combatants.contents)
        ? combatants.contents
        : typeof combatants[Symbol.iterator] === 'function'
          ? [...combatants]
          : []
    : [];
  for (const c of bag) {
    const tok = (c as any)?.token;
    if (tok) considerTokenDoc(tok.document ?? tok);
    // Combatant.actor may already be the unlinked synthetic copy — only same world.
    const ca = (c as any)?.actor;
    if (!ca?.isToken) continue;
    const caWorld = String(
      (c as any)?.actorId ??
        ca.token?.actorId ??
        ca.token?.document?.actorId ??
        '',
    );
    if (worldId && caWorld !== worldId) continue;
    add(ca);
  }

  return sources;
}

/** True when a power item is a Passive (category, powerType, or catalog template). */
export function isPassivePowerItem(item: any): boolean {
  if (!item || item.type !== 'power') return false;
  const sys = (item.system as any) || {};
  const tags = Array.isArray(sys.tags) ? sys.tags.map((t: any) => String(t).toLowerCase()) : [];
  // Artifact meta (Empowerment / Extension) are not Combat Passive Slot picks.
  if (tags.includes('artifact-only')) return false;
  const tid = String(sys.templateId || '').trim().toLowerCase();
  if (tid.startsWith('empower-buff-') || tid.startsWith('extend-buff-')) return false;
  if (sys.category === 'passive') return true;
  if (sys.powerType === 'passive') return true;
  if (tid.startsWith('passive-')) return true;
  // Match Powers-tab grouping (legacy category / powerType shapes).
  return resolvePowerCategoryFromItem(item) === 'passive';
}

function passiveAbilityFromItem(item: any): PassiveAbility {
  const itemSystem = (item.system as any) || {};
  return {
    id: String(item.id || item._id || item.name || ''),
    name: item.name || 'Unknown Passive',
    description: itemSystem.effect || itemSystem.description || '',
    category: itemSystem.tree || itemSystem.category || 'General',
    level: itemSystem.level || itemSystem.rank || 1,
  };
}

/** Passive powers owned by the actor (sheet Passives + combat Available list). */
export function getAvailablePassives(actor: Actor): PassiveAbility[] {
  const byId = new Map<string, PassiveAbility>();
  for (const source of passiveItemSourceActors(actor)) {
    for (const item of actorItemList(source)) {
      if (!isPassivePowerItem(item)) continue;
      const row = passiveAbilityFromItem(item);
      if (!row.id) continue;
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
  }
  return [...byId.values()];
}

/** Find a Passive power item on the actor or its world/token counterpart. */
export function findPassivePowerItem(actor: Actor, passiveId: string): any | null {
  const want = String(passiveId || '');
  if (!want) return null;
  for (const source of passiveItemSourceActors(actor)) {
    for (const item of actorItemList(source)) {
      if (!isPassivePowerItem(item)) continue;
      if (
        String(item.id) === want ||
        String(item._id) === want ||
        String(item.name) === want
      ) {
        return item;
      }
    }
  }
  return null;
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
  
  const passiveItem = findPassivePowerItem(actor, passiveId);

  if (passiveItem) {
    const itemSystem = (passiveItem.system as any) || {};
    const templateId = String(itemSystem.templateId || '');
    const specialChoice = String(itemSystem.chosenSpecial?.key || itemSystem.specialChoice || '')
      .trim()
      .toLowerCase();
    if (templateId === 'passive-special-aura') {
      const { SPECIAL_AURA_ELIGIBLE, SPECIAL_AURA_RADIUS_M } = await import('../combat/aura-modifiers.js');
      const level = Math.floor(Number(itemSystem.level || itemSystem.rank) || 1);
      const radius = level >= 1 && level <= 16 ? SPECIAL_AURA_RADIUS_M[level - 1] : 0;
      if (!radius || !SPECIAL_AURA_ELIGIBLE.has(specialChoice)) {
        ui.notifications?.warn(
          'Special Aura needs one eligible diminishing Special and an available Power Level.',
        );
        return;
      }
    }
    system.passives[slotKey].passive = {
      id: passiveItem.id || passiveItem._id || passiveItem.name,
      name: passiveItem.name || 'Unknown Passive',
      description: itemSystem.effect || itemSystem.description || '',
      category: itemSystem.tree || itemSystem.category || 'General',
      level: itemSystem.level || itemSystem.rank || 1,
      templateId,
      specialChoice,
    };
  } else {
    ui.notifications?.warn(
      `Could not find Passive "${passiveId}" on this character (check world vs token actor items).`,
    );
    system.passives[slotKey].passive = {
      id: passiveId,
      name: passiveId,
      description: '',
      category: 'General',
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
  
  const masteryRank = getRulesMasteryRank(actor);
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

/** Stone Power `generic.exchangePassive` stores leftover mid-combat swaps here. */
export const EXCHANGE_PASSIVE_SWAPS_FLAG = 'exchangePassiveSwapsPending';

/**
 * Rainbow "pick passives" prompt only when a slot is still empty and there is
 * a passive left to put in it, or Exchange Passive paid a swap.
 * A full set (no third slot, or nothing left to assign) stays quiet.
 */
export function passiveSlotsHaveOpenChoice(
  slots: Array<{ passive?: unknown }>,
  availablePassiveCount: number,
  pendingSwaps: number,
): boolean {
  if (Math.max(0, Math.floor(pendingSwaps)) > 0) return true;
  const filled = slots.filter((slot) => slot?.passive).length;
  const empty = Math.max(0, slots.length - filled);
  const spare = Math.max(0, Math.floor(availablePassiveCount) - filled);
  return empty > 0 && spare > 0;
}

export function getPendingPassiveSwaps(actor: Actor | null | undefined): number {
  if (!actor) return 0;
  return Math.max(
    0,
    Math.floor(Number((actor as any).getFlag?.('mastery-system', EXCHANGE_PASSIVE_SWAPS_FLAG) ?? 0) || 0),
  );
}

export async function consumePendingPassiveSwap(actor: Actor): Promise<number> {
  const left = getPendingPassiveSwaps(actor);
  if (left <= 0) return 0;
  const next = left - 1;
  await (actor as any).setFlag?.('mastery-system', EXCHANGE_PASSIVE_SWAPS_FLAG, next);
  return next;
}

/**
 * Round 1 (and prepare) is free. Later rounds stay locked unless Exchange
 * Passive (or leftover swap tokens) has been paid this fight.
 */
export function canEditEncounterPassives(
  combat: Combat | null | undefined,
  actor: Actor | null | undefined,
): boolean {
  const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
  if (round <= 1) return true;
  if (getPendingPassiveSwaps(actor) > 0) return true;
  const bag = (combat as { combatants?: unknown } | null | undefined)?.combatants;
  const actorId = String((actor as { id?: string } | null | undefined)?.id ?? '');
  if (!combat || !bag || !actorId) return false;
  const combatant = findCombatantByActorId(combat, actorId);
  return readCombatantSetupStep(combatant, combat)?.passivesGmOpen === true;
}

