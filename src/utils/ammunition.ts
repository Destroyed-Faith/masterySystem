/**
 * Ammunition and quivers for bows / crossbows.
 *
 * Loose stacks live in the inventory grid. Loaded shots live as a count on
 * the quiver — not as nested container items. Only the quiver in the active
 * weapon set can feed an attack.
 */

import { getWeapon, masteryWeaponCatalogKey } from './weapons.js';

export const DEFAULT_AMMO_STACK = 24;
export const DEFAULT_QUIVER_CAPACITY = 24;

export type AmmunitionType = string;

export type AmmunitionAttackReason =
  | 'compatible-quiver-required'
  | 'empty-quiver'
  | 'not-enough-ammunition';

export type HandEquipReason =
  | 'invalid-hand-combination'
  | 'incompatible-ammunition'
  | 'slot-occupied';

const loadLocks = new Set<string>();

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(`MASTERY.ammunition.${key}`);
  return raw && raw !== `MASTERY.ammunition.${key}` ? raw : fallback;
}

function locFormat(key: string, data: Record<string, unknown>, fallback: string): string {
  const i18n = (globalThis as any).game?.i18n;
  const formatted = i18n?.format?.(`MASTERY.ammunition.${key}`, data);
  if (formatted && formatted !== `MASTERY.ammunition.${key}`) return formatted;
  return fallback;
}

function collectItems(actor: any): any[] {
  if (!actor?.items) return [];
  const items = actor.items;
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

function equipmentFlags(item: any): Record<string, any> {
  if (typeof item?.getFlag === 'function') {
    return { ...(item.getFlag('mastery-system', 'equipment') || {}) };
  }
  return { ...(item?.flags?.['mastery-system']?.equipment || {}) };
}

function itemParentId(item: any): string {
  return String(item?.parent?.id || item?.actor?.id || '');
}

function sameActor(a: any, b: any): boolean {
  const left = itemParentId(a) || String(a?.parent?.uuid || '');
  const right = itemParentId(b) || String(b?.parent?.uuid || '');
  if (left && right) return left === right;
  return a?.parent === b?.parent;
}

export function normalizeAmmunitionType(value: unknown): AmmunitionType {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export function catalogAmmunitionType(item: any): AmmunitionType {
  const def = getWeapon(item?.name || '');
  return normalizeAmmunitionType(def?.ammunitionType);
}

/** Runtime: structured fields only. Catalog names are used solely during migration. */
export function requiresAmmunition(item: any): boolean {
  if (!item) return false;
  if (item.system?.requiresAmmunition === true) return true;
  const type = normalizeAmmunitionType(item.system?.ammunitionType);
  return item.system?.requiresAmmunition !== false && !!type && isAmmunitionWeaponShape(item);
}

function isAmmunitionWeaponShape(item: any): boolean {
  if (!item) return false;
  if (item.type === 'weapon') return String(item.system?.weaponType || '').toLowerCase() === 'ranged';
  if (item.type === 'artifact') {
    return String(item.system?.artifactWeapon?.weaponType || '').toLowerCase() === 'ranged'
      && Number(item.system?.artifactWeapon?.hands || item.system?.hands || 0) >= 1;
  }
  return false;
}

export function isAmmunitionItem(item: any): boolean {
  return item?.system?.ammunition === true && !!normalizeAmmunitionType(item.system?.ammunitionType);
}

export function isAmmoContainer(item: any): boolean {
  return item?.system?.ammoContainer === true && !!normalizeAmmunitionType(item.system?.ammunitionType);
}

export function getAmmunitionType(item: any): AmmunitionType {
  return normalizeAmmunitionType(item?.system?.ammunitionType);
}

export function ammunitionTypesMatch(a: any, b: any): boolean {
  const left = getAmmunitionType(a);
  const right = getAmmunitionType(b);
  return !!left && left === right;
}

export function getAmmoMaxStack(item: any): number {
  const raw = Number(item?.system?.maxStack);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_AMMO_STACK;
}

export function getAmmoQuantity(item: any): number {
  const raw = Number(item?.system?.quantity);
  return Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
}

export function getQuiverCapacity(item: any): number {
  const raw = Number(item?.system?.capacity);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_QUIVER_CAPACITY;
}

export function getQuiverCurrent(item: any): number {
  const raw = Number(item?.system?.currentAmmunition);
  const current = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  return Math.min(current, getQuiverCapacity(item));
}

export function getQuiverFreeSpace(item: any): number {
  return Math.max(0, getQuiverCapacity(item) - getQuiverCurrent(item));
}

export function formatAmmunitionDisplay(current: number, capacity: number): string {
  return locFormat('display', { current, max: capacity }, `Ammunition: ${current}/${capacity}`);
}

export function quiverAmmunitionLabel(item: any): string {
  if (!isAmmoContainer(item)) return '';
  return formatAmmunitionDisplay(getQuiverCurrent(item), getQuiverCapacity(item));
}

export function keepsInventoryGridWhenEquipped(item: any): boolean {
  return isAmmoContainer(item);
}

export function occupiesInventoryGridWhileEquipped(flags: {
  slot?: unknown;
  keepInventoryGrid?: unknown;
} | null | undefined): boolean {
  return !!flags?.slot && flags.keepInventoryGrid === true;
}

export function isAmmoContainerEffectActive(actor: any, item: any): boolean {
  if (!isAmmoContainer(item) || !item) return false;
  if (item.system?.equipped !== true) return false;
  const slot = equipmentFlags(item).slot;
  if (slot !== 'mainhand' && slot !== 'offhand') return false;
  const pair = getActiveAmmoPair(actor);
  return !!pair && String(pair.quiver?.id) === String(item.id);
}

export function getItemInHandSlotLocal(actor: any, slotKey: 'mainhand' | 'offhand'): any | null {
  for (const it of collectItems(actor)) {
    if (equipmentFlags(it).slot === slotKey) return it;
  }
  return null;
}

export function getActiveAmmoPair(actor: any): { weapon: any; quiver: any } | null {
  const main = getItemInHandSlotLocal(actor, 'mainhand');
  const off = getItemInHandSlotLocal(actor, 'offhand');
  const pairs: Array<[any, any]> = [
    [main, off],
    [off, main],
  ];
  for (const [weapon, quiver] of pairs) {
    if (requiresAmmunition(weapon) && isAmmoContainer(quiver) && ammunitionTypesMatch(weapon, quiver)) {
      return { weapon, quiver };
    }
  }
  return null;
}

export function findEquippedAmmunitionWeapon(actor: any): any | null {
  const main = getItemInHandSlotLocal(actor, 'mainhand');
  const off = getItemInHandSlotLocal(actor, 'offhand');
  if (requiresAmmunition(main)) return main;
  if (requiresAmmunition(off)) return off;
  return null;
}

export function planAmmunitionStackSplit(quantity: number, maxStack: number): number[] {
  const max = Math.max(1, Math.floor(Number(maxStack) || DEFAULT_AMMO_STACK));
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty === 0) return [];
  if (qty <= max) return [qty];
  const stacks: number[] = [];
  let left = qty;
  while (left > 0) {
    const take = Math.min(max, left);
    stacks.push(take);
    left -= take;
  }
  return stacks;
}

export function planQuiverLoad(current: number, capacity: number, available: number): {
  moved: number;
  remaining: number;
  nextCurrent: number;
} {
  const cap = Math.max(0, Math.floor(Number(capacity) || 0));
  const cur = Math.min(cap, Math.max(0, Math.floor(Number(current) || 0)));
  const avail = Math.max(0, Math.floor(Number(available) || 0));
  const free = Math.max(0, cap - cur);
  const moved = Math.min(free, avail);
  return {
    moved,
    remaining: avail - moved,
    nextCurrent: cur + moved,
  };
}

export function countAmmunitionShotsForOption(option: any): number {
  if (!option) return 1;
  if (option.splitAttack === true || option.npcSplitAttack === true) return 2;
  const item = option.item;
  const tid = String(item?.system?.templateId || '');
  if (tid === 'active-melee-weapon-split' || tid === 'active-ranged-weapon-split') return 2;
  const mech = item?.system?.mechanics || item?.system?.levels?.[item?.system?.rank || '1']?.mechanics;
  if (mech?.splitAttack === true) return 2;
  const volley = Number(option.meleeBurstVolleyTotal ?? option.burstVolleyTotal);
  if (Number.isFinite(volley) && volley > 1) return Math.floor(volley);
  return 1;
}

function optionLooksLikeSpell(option: any): boolean {
  if (!option) return false;
  if (option.isSpell === true || option.item?.system?.isSpell === true) return true;
  const tags = Array.isArray(option.tags) ? option.tags : [];
  return tags.some((t: unknown) => /\bspell\b/i.test(String(t)));
}

export function attackUsesAmmunitionWeapon(actor: any, option: any): boolean {
  if (!actor || optionLooksLikeSpell(option)) return false;
  const items = collectItems(actor);
  const forcedId = option?.forcedWeaponItemId;
  if (forcedId) {
    const forced = items.find((it) => String(it.id) === String(forcedId));
    if (requiresAmmunition(forced)) return true;
    if (forced) return false;
  }
  const equipped = findEquippedAmmunitionWeapon(actor);
  if (!equipped) return false;
  if (option?.id === 'weapon-attack' || option?.source === 'weapon') return true;
  const range = Number(option?.range ?? option?.rangeMeters);
  if (option?.slot === 'attack' && Number.isFinite(range) && range > 4) return true;
  return false;
}

export function evaluateAmmunitionAttack(
  actor: any,
  shots = 1,
): { ok: true; weapon: any; quiver: any } | { ok: false; reason: AmmunitionAttackReason } {
  const needed = Math.max(1, Math.floor(Number(shots) || 1));
  const weapon = findEquippedAmmunitionWeapon(actor);
  if (!weapon) {
    return { ok: false, reason: 'compatible-quiver-required' };
  }
  const pair = getActiveAmmoPair(actor);
  if (!pair || String(pair.weapon.id) !== String(weapon.id)) {
    return { ok: false, reason: 'compatible-quiver-required' };
  }
  const current = getQuiverCurrent(pair.quiver);
  if (current <= 0) return { ok: false, reason: 'empty-quiver' };
  if (current < needed) return { ok: false, reason: 'not-enough-ammunition' };
  return { ok: true, weapon: pair.weapon, quiver: pair.quiver };
}

export function ammunitionAttackMessage(reason: AmmunitionAttackReason): string {
  if (reason === 'empty-quiver') return loc('emptyQuiver', 'The equipped quiver is empty.');
  if (reason === 'not-enough-ammunition') return loc('notEnoughAmmunition', 'Not enough ammunition for this attack.');
  return loc('compatibleQuiverRequired', 'A compatible quiver is required.');
}

export function warnAmmunitionAttack(reason: AmmunitionAttackReason): void {
  (globalThis as any).ui?.notifications?.warn(ammunitionAttackMessage(reason));
}

export function gateAmmunitionAttack(actor: any, option: any): boolean {
  if (!attackUsesAmmunitionWeapon(actor, option)) return true;
  const check = evaluateAmmunitionAttack(actor, countAmmunitionShotsForOption(option));
  if (check.ok) return true;
  warnAmmunitionAttack(check.reason);
  return false;
}

export async function consumeAmmunitionForAttack(
  actor: any,
  shots = 1,
): Promise<{ ok: true; remaining: number } | { ok: false; reason: AmmunitionAttackReason }> {
  const needed = Math.max(1, Math.floor(Number(shots) || 1));
  const check = evaluateAmmunitionAttack(actor, needed);
  if (!check.ok) {
    warnAmmunitionAttack(check.reason);
    return check;
  }
  const next = getQuiverCurrent(check.quiver) - needed;
  await updateItem(check.quiver, { 'system.currentAmmunition': next });
  await refreshAmmunitionSurfaces(actor);
  return { ok: true, remaining: next };
}

export async function refundAmmunitionForAttack(actor: any, shots = 1): Promise<void> {
  const pair = getActiveAmmoPair(actor);
  if (!pair) return;
  const needed = Math.max(1, Math.floor(Number(shots) || 1));
  const next = Math.min(getQuiverCapacity(pair.quiver), getQuiverCurrent(pair.quiver) + needed);
  await updateItem(pair.quiver, { 'system.currentAmmunition': next });
  await refreshAmmunitionSurfaces(actor);
}

export function validateHandEquip(
  actor: any,
  item: any,
  slot: 'mainhand' | 'offhand',
): { ok: true } | { ok: false; reason: HandEquipReason; message: string } {
  const otherSlot = slot === 'mainhand' ? 'offhand' : 'mainhand';
  const other = getItemInHandSlotLocal(actor, otherSlot);
  const occupant = getItemInHandSlotLocal(actor, slot);
  const invalid = (reason: HandEquipReason, message: string) => ({ ok: false as const, reason, message });

  if (occupant && occupant.id !== item.id && (requiresAmmunition(item) || isAmmoContainer(item) || requiresAmmunition(occupant) || isAmmoContainer(occupant))) {
    if (!isCompatibleReplacement(occupant, item)) {
      return invalid('slot-occupied', loc('invalidHandCombination', 'That hand combination is not allowed.'));
    }
  }

  if (requiresAmmunition(item)) {
    if (!other || other.id === item.id) return { ok: true };
    if (isAmmoContainer(other) && ammunitionTypesMatch(item, other)) return { ok: true };
    if (isAmmoContainer(other)) {
      return invalid('incompatible-ammunition', loc('incompatibleAmmunition', 'That ammunition does not fit this quiver.'));
    }
    return invalid('invalid-hand-combination', loc('invalidHandCombination', 'That hand combination is not allowed.'));
  }

  if (isAmmoContainer(item)) {
    if (!other || other.id === item.id) return { ok: true };
    if (requiresAmmunition(other) && ammunitionTypesMatch(item, other)) return { ok: true };
    if (requiresAmmunition(other)) {
      return invalid('incompatible-ammunition', loc('incompatibleAmmunition', 'That ammunition does not fit this quiver.'));
    }
    return { ok: true };
  }

  if (other && requiresAmmunition(other)) {
    return invalid('invalid-hand-combination', loc('invalidHandCombination', 'That hand combination is not allowed.'));
  }

  return { ok: true };
}

function isCompatibleReplacement(current: any, incoming: any): boolean {
  if (requiresAmmunition(current) && requiresAmmunition(incoming) && ammunitionTypesMatch(current, incoming)) {
    return true;
  }
  if (isAmmoContainer(current) && isAmmoContainer(incoming) && ammunitionTypesMatch(current, incoming)) {
    return true;
  }
  return false;
}

export async function loadAmmunitionIntoContainer(
  actor: any,
  ammo: any,
  quiver: any,
): Promise<{ ok: boolean; moved: number; remaining: number; reason?: string }> {
  if (!actor || !ammo || !quiver) {
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'missing' };
  }
  if (!isAmmoContainer(quiver)) {
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'not-container' };
  }
  if (!isAmmunitionItem(ammo)) {
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'not-ammunition' };
  }
  if (ammo.parent && quiver.parent && !sameActor(ammo, quiver)) {
    (globalThis as any).ui?.notifications?.warn(loc('incompatibleAmmunition', 'That ammunition does not fit this quiver.'));
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'other-actor' };
  }
  if (actor.id && itemParentId(ammo) && itemParentId(ammo) !== String(actor.id)) {
    (globalThis as any).ui?.notifications?.warn(loc('incompatibleAmmunition', 'That ammunition does not fit this quiver.'));
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'other-actor' };
  }
  if (!ammunitionTypesMatch(ammo, quiver)) {
    (globalThis as any).ui?.notifications?.warn(loc('incompatibleAmmunition', 'That ammunition does not fit this quiver.'));
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'incompatible' };
  }

  const lock = `${String(actor.id || actor.uuid || '')}:${String(quiver.id)}`;
  if (loadLocks.has(lock)) {
    return { ok: false, moved: 0, remaining: getAmmoQuantity(ammo), reason: 'busy' };
  }
  loadLocks.add(lock);
  try {
    const plan = planQuiverLoad(getQuiverCurrent(quiver), getQuiverCapacity(quiver), getAmmoQuantity(ammo));
    if (plan.moved <= 0) {
      (globalThis as any).ui?.notifications?.warn(loc('quiverFull', 'The quiver is full.'));
      return { ok: false, moved: 0, remaining: plan.remaining, reason: 'full' };
    }
    await updateItem(quiver, { 'system.currentAmmunition': plan.nextCurrent });
    if (plan.remaining <= 0) {
      await deleteItem(actor, ammo);
    } else {
      await updateItem(ammo, { 'system.quantity': plan.remaining });
    }
    await refreshAmmunitionSurfaces(actor);
    return { ok: true, moved: plan.moved, remaining: plan.remaining };
  } finally {
    loadLocks.delete(lock);
  }
}

export function findAmmoContainerFromDropPath(actor: any, path: Iterable<any>): any | null {
  for (const node of path) {
    const el = node as HTMLElement;
    const id = el?.dataset?.itemId || el?.closest?.('[data-item-id]')?.getAttribute?.('data-item-id');
    if (!id) continue;
    const item = actor?.items?.get?.(id) || collectItems(actor).find((it) => String(it.id) === String(id));
    if (isAmmoContainer(item)) return item;
  }
  return null;
}

export function migrateItemAmmunitionFields(item: any): Record<string, unknown> | null {
  if (!item) return null;
  const patch: Record<string, unknown> = {};
  const sys = item.system || {};

  if (item.type === 'weapon' || item.type === 'artifact') {
    const catalogType = catalogAmmunitionType(item);
    if (catalogType && sys.requiresAmmunition !== true) {
      patch['system.requiresAmmunition'] = true;
      if (!normalizeAmmunitionType(sys.ammunitionType)) {
        patch['system.ammunitionType'] = catalogType;
      }
    }
  }

  const catalogKey = masteryWeaponCatalogKey(item.name || '');
  if (!isAmmunitionItem(item) && (catalogKey === 'arrows' || catalogKey === 'crossbowbolts' || catalogKey === 'bolts')) {
    const type = catalogKey === 'arrows' ? 'arrow' : 'bolt';
    patch['system.ammunition'] = true;
    patch['system.ammunitionType'] = type;
    patch['system.maxStack'] = getAmmoMaxStack(item) || DEFAULT_AMMO_STACK;
    if (!Number.isFinite(Number(sys.quantity))) {
      patch['system.quantity'] = DEFAULT_AMMO_STACK;
    }
    if (!Array.isArray(sys.equipSlots) || sys.equipSlots.length > 0) {
      patch['system.equipSlots'] = [];
    }
  }

  return Object.keys(patch).length ? patch : null;
}

export function normalizeAmmoWeaponSetHands(
  actor: any,
  hands: { mainhand: string | null; offhand: string | null },
): { mainhand: string | null; offhand: string | null } {
  if (!hands.mainhand || hands.mainhand !== hands.offhand) return hands;
  const item = collectItems(actor).find((it) => String(it.id) === String(hands.mainhand));
  if (requiresAmmunition(item) || catalogAmmunitionType(item)) {
    return { mainhand: hands.mainhand, offhand: null };
  }
  return hands;
}

export async function migrateActorAmmunition(actor: any): Promise<void> {
  if (!actor) return;
  const items = collectItems(actor);
  const fieldUpdates: Record<string, unknown>[] = [];
  for (const item of items) {
    const patch = migrateItemAmmunitionFields(item);
    if (patch) fieldUpdates.push({ _id: item.id, ...patch });
  }
  if (fieldUpdates.length) {
    await updateEmbedded(actor, fieldUpdates);
  }

  const refreshed = collectItems(actor);
  for (const item of refreshed) {
    if (!isAmmunitionItem(item)) continue;
    const stacks = planAmmunitionStackSplit(getAmmoQuantity(item), getAmmoMaxStack(item));
    if (stacks.length <= 1) continue;
    await updateItem(item, { 'system.quantity': stacks[0] });
    const extras = stacks.slice(1);
    if (typeof actor.createEmbeddedDocuments === 'function') {
      const source = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      const payload = extras.map((qty) => {
        const data = foundryClone(source);
        delete data._id;
        if (!data.system) data.system = {};
        data.system.quantity = qty;
        if (data.flags?.['mastery-system']?.equipment) {
          data.flags['mastery-system'].equipment = {
            ...data.flags['mastery-system'].equipment,
            grid: null,
            slot: null,
          };
        }
        return data;
      });
      await actor.createEmbeddedDocuments('Item', payload, { render: false });
    }
  }
}

function foundryClone(data: any): any {
  const fu = (globalThis as any).foundry?.utils?.deepClone;
  if (typeof fu === 'function') return fu(data);
  return JSON.parse(JSON.stringify(data));
}

async function updateItem(item: any, data: Record<string, unknown>): Promise<void> {
  if (typeof item?.update === 'function') {
    await item.update(data);
    return;
  }
  for (const [key, value] of Object.entries(data)) {
    if (key === 'system.currentAmmunition') item.system.currentAmmunition = value;
    if (key === 'system.quantity') item.system.quantity = value;
  }
}

async function updateEmbedded(actor: any, updates: Record<string, unknown>[]): Promise<void> {
  if (!updates.length) return;
  if (typeof actor.updateEmbeddedDocuments === 'function') {
    await actor.updateEmbeddedDocuments('Item', updates);
    return;
  }
  for (const upd of updates) {
    const item = collectItems(actor).find((it) => String(it.id) === String(upd._id));
    if (!item) continue;
    const { _id, ...rest } = upd;
    void _id;
    await updateItem(item, rest);
  }
}

async function deleteItem(actor: any, item: any): Promise<void> {
  if (typeof item?.delete === 'function') {
    await item.delete();
    return;
  }
  if (typeof actor?.deleteEmbeddedDocuments === 'function' && item?.id) {
    await actor.deleteEmbeddedDocuments('Item', [item.id]);
  }
}

async function refreshAmmunitionSurfaces(actor: any): Promise<void> {
  try {
    actor.prepareDerivedData?.();
  } catch {
    /* ignore */
  }
  try {
    actor.sheet?.render?.(false);
  } catch {
    /* ignore */
  }
  try {
    const { refreshRadialMenuActionLabelsIfOpenForActor } = await import('../token-radial-menu.js');
    await refreshRadialMenuActionLabelsIfOpenForActor(actor);
  } catch {
    /* radial may be closed */
  }
}

/** Test helper — do not use from production UI. */
export function resetAmmunitionLocks(): void {
  loadLocks.clear();
}
