/**
 * Echo-bound artifact equip + duplicate cleanup.
 *
 * Echo artifacts (Dragon Claws, Wyrm Scales, Dragon Head, …) are intrinsic to
 * the character: one embedded copy per catalog key, auto-equipped to the
 * paperdoll, never deleted by players. Duplicate embedded copies can appear
 * after a failed tree grant + fallback, or legacy migration edge cases — this
 * module dedupes them and keeps the best wired/slotted copy.
 */

import { getArtifactBindingKind } from './artifact-actor-rules.js';
import { inferArtifactKeyFromName } from './artifact-tree-grant.js';
import { inferArtifactEquipSlots, normalizeSlotKey } from './equip-slots.js';

export function getEchoArtifactKey(item: any): string | null {
  if (!item || item.type !== 'artifact') return null;
  const flagged = item.getFlag?.('mastery-system', 'echoArtifactKey');
  if (typeof flagged === 'string' && flagged.trim()) return flagged.trim();
  if (getArtifactBindingKind(item) === 'echo') {
    return inferArtifactKeyFromName(item.name);
  }
  const bound = item.getFlag?.('mastery-system', 'echoBound');
  if (bound && typeof bound === 'string' && bound.trim()) return bound.trim();
  return inferArtifactKeyFromName(item.name);
}

/** True for Echo-bound artifacts (locked to the character). */
export function isEchoBoundArtifact(item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  if (item.getFlag?.('mastery-system', 'echoLocked') === true) return true;
  if (item.getFlag?.('mastery-system', 'echoBound')) return true;
  if (String((item.system as any)?.binding || '') === 'echo') return true;
  return getArtifactBindingKind(item) === 'echo';
}

function scoreEchoArtifactCopy(item: any): number {
  let score = 0;
  if (item.getFlag?.('mastery-system', 'evolutionRootItemId')) score += 100;
  const slot = normalizeSlotKey(item.getFlag?.('mastery-system', 'equipment')?.slot);
  if (slot) score += 50;
  if (item.getFlag?.('mastery-system', 'echoLocked') === true) score += 10;
  if (item.getFlag?.('mastery-system', 'artifactActivated') === true) score += 5;
  if (item.getFlag?.('mastery-system', 'echoBound')) score += 2;
  return score;
}

/** Equip a freshly-granted Echo artifact into its paperdoll slot and lock it. */
export async function equipEchoArtifact(actor: Actor, item: any): Promise<void> {
  if (!item || !actor) return;
  const sys = (item.system as any) || {};
  const slots = inferArtifactEquipSlots(sys) || [];
  const primarySlot = slots[0] || null;

  const currentFlags = item.getFlag?.('mastery-system', 'equipment') || {};
  const update: Record<string, unknown> = {
    'system.equipped': true,
  };
  if (slots.length > 0) update['system.equipSlots'] = slots;
  if (primarySlot) {
    update['flags.mastery-system.equipment'] = {
      ...currentFlags,
      container: 'inventory',
      slot: primarySlot,
      band: currentFlags.band || 'not',
    };
  }
  update['flags.mastery-system.echoBound'] = true;
  update['flags.mastery-system.echoLocked'] = true;
  const echoKey = getEchoArtifactKey(item);
  if (echoKey) update['flags.mastery-system.echoArtifactKey'] = echoKey;
  await item.update(update);
}

/** Re-apply equip flags when an Echo copy lost its slot (sync/migration drift). */
export async function ensureEchoArtifactEquipped(actor: Actor, item: any): Promise<boolean> {
  if (!isEchoBoundArtifact(item)) return false;
  const flags = item.getFlag?.('mastery-system', 'equipment') || {};
  const slot = normalizeSlotKey(flags.slot);
  const sys = (item.system as any) || {};
  const slots = inferArtifactEquipSlots(sys) || [];
  const needsSlot = !slot && slots.length > 0;
  const needsLock =
    item.getFlag?.('mastery-system', 'echoLocked') !== true ||
    !item.getFlag?.('mastery-system', 'echoBound');
  const needsEquipped = sys.equipped !== true;
  if (!needsSlot && !needsLock && !needsEquipped) return false;
  await equipEchoArtifact(actor, item);
  return true;
}

/**
 * Remove duplicate Echo artifact copies on an actor. Keeps the best copy per
 * catalog key (wired tree + slotted wins). Returns the number of items removed.
 */
export async function dedupeEchoArtifactsOnActor(actor: Actor): Promise<number> {
  const A = actor as any;
  if (!A?.items?.filter) return 0;

  const echoItems: any[] = Array.from(
    A.items.filter((it: any) => it.type === 'artifact' && isEchoBoundArtifact(it)),
  );
  if (echoItems.length === 0) return 0;

  const byKey = new Map<string, any[]>();
  for (const item of echoItems) {
    const key = getEchoArtifactKey(item) || `__unnamed__:${item.id}`;
    const list = byKey.get(key) ?? [];
    list.push(item);
    byKey.set(key, list);
  }

  let removed = 0;
  for (const [, group] of byKey) {
    if (group.length <= 1) {
      await ensureEchoArtifactEquipped(actor, group[0]);
      continue;
    }
    const sorted = [...group].sort((a, b) => scoreEchoArtifactCopy(b) - scoreEchoArtifactCopy(a));
    const keeper = sorted[0];
    const deleteIds = sorted.slice(1).map((it) => it.id).filter(Boolean);
    if (deleteIds.length > 0) {
      await A.deleteEmbeddedDocuments('Item', deleteIds, { masterySystemForceDelete: true });
      removed += deleteIds.length;
    }
    await ensureEchoArtifactEquipped(actor, keeper);
  }

  return removed;
}

/**
 * True when this Echo item should stay off the carry inventory grid.
 * Equipped / slotted Echo artifacts stay paperdoll-only. Explicitly stowed
 * copies (no equipment slot, not equipped) appear in the backpack so GMs can
 * park orphan / migration leftovers without deleting them.
 */
export function isEchoArtifactInventoryHidden(item: any): boolean {
  if (!isEchoBoundArtifact(item)) return false;
  const slot = normalizeSlotKey(item.getFlag?.('mastery-system', 'equipment')?.slot);
  if (slot) return true;
  if ((item.system as any)?.equipped === true) return true;
  return false;
}

/**
 * Move an actor-owned artifact off the paperdoll into the backpack inventory
 * band (`not`). Clears equipment slot / echo lock so the item is visible in
 * the inventory grid. Does not delete the item.
 */
export async function stowArtifactToBackpack(actor: Actor, item: any): Promise<boolean> {
  if (!actor || !item || item.type !== 'artifact') return false;
  if (item.parent !== actor && item.parent?.id !== (actor as any).id) return false;

  const currentFlags = item.getFlag?.('mastery-system', 'equipment') || {};
  const occupied: Array<{ x: number; y: number; w: number; h: number }> = [];
  try {
    const { itemInventorySize, parseInventorySize } = await import('./inventory-grid.js');
    const size = itemInventorySize(item);
    const w = Math.min(10, size.w || 1);
    const h = Math.min(9, size.h || 1);
    for (const it of Array.from<any>((actor as any).items ?? [])) {
      if (!it || it.id === item.id) continue;
      const f = it.getFlag?.('mastery-system', 'equipment') || {};
      if (f.container === 'inventory' && (f.band ?? 'not') === 'not' && f.grid) {
        const s = parseInventorySize(it.system?.inventorySize) || { w: 1, h: 1 };
        occupied.push({
          x: Number(f.grid.x) || 1,
          y: Number(f.grid.y) || 1,
          w: s.w || 1,
          h: s.h || 1,
        });
      }
    }
    const { findFirstFit } = await import('./inventory-grid.js');
    const fit = findFirstFit(occupied, w, h, 10, 9) || { x: 1, y: 1 };
    await item.update({
      'system.equipped': false,
      'flags.mastery-system.echoLocked': false,
      'flags.mastery-system.artifactActivated': false,
      'flags.mastery-system.equipment': {
        ...currentFlags,
        container: 'inventory',
        band: 'not',
        slot: null,
        grid: fit,
      },
    });
  } catch (err) {
    console.warn('Mastery System | stowArtifactToBackpack failed', err);
    await item.update({
      'system.equipped': false,
      'flags.mastery-system.echoLocked': false,
      'flags.mastery-system.artifactActivated': false,
      'flags.mastery-system.equipment': {
        ...currentFlags,
        container: 'inventory',
        band: 'not',
        slot: null,
      },
    });
  }
  return true;
}
