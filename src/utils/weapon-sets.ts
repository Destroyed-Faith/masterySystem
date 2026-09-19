/**
 * Prepared weapon sets for the two hand slots, plus the shared Weapon Swap.
 *
 * Only the active set is mechanically equipped (`system.equipped` + slot flag).
 * Sets store item-id references — never duplicated items.
 */

import {
  consumeMovementAction,
  getActionEconomyActor,
  getAvailableMovementActions,
  isNormalMovementReplaced,
  refundMovementAction,
} from '../combat/action-economy.js';
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { actorParticipatesInActiveCombat } from './consumable-slots.js';
import { formatArtifactWeaponRangeDisplay } from './artifact-rules.js';
import { isEchoBoundArtifact } from './echo-artifact-equip.js';
import {
  migrateActorAmmunition,
  normalizeAmmoWeaponSetHands,
  requiresAmmunition,
} from './ammunition.js';

export const WEAPON_SWAP_ID = 'weapon-swap';
export const WEAPON_SETS_FLAG = 'weaponSets';
export const WEAPON_SETS_SCHEMA = 1;

export type WeaponSetIndex = 1 | 2;

export interface WeaponSetHands {
  mainhand: string | null;
  offhand: string | null;
}

export interface WeaponSetsState {
  schemaVersion: number;
  active: WeaponSetIndex;
  /** Weapons put away. Both sets stay stored; Basic Attack is Unarmed. */
  stowed?: boolean;
  sets: Record<WeaponSetIndex, WeaponSetHands>;
}

export type WeaponSwapTarget = WeaponSetIndex | 'unarmed';

export type SwapWeaponSetResult =
  | { ok: true; swapped: false; active: WeaponSetIndex }
  | { ok: true; swapped: true; active: WeaponSetIndex; spentMovement: boolean }
  | { ok: false; reason: 'busy' | 'permission' | 'no-movement' | 'spend-failed' | 'apply-failed' };

const swapLocks = new Set<string>();

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(`MASTERY.weaponSets.${key}`);
  return raw && raw !== `MASTERY.weaponSets.${key}` ? raw : fallback;
}

function actorKey(actor: any): string {
  return String(actor?.uuid || actor?.id || '');
}

function collectItems(actor: any): any[] {
  if (!actor?.items) return [];
  const items = actor.items;
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

function emptyHands(): WeaponSetHands {
  return { mainhand: null, offhand: null };
}

export function emptyWeaponSetsState(): WeaponSetsState {
  return {
    schemaVersion: WEAPON_SETS_SCHEMA,
    active: 1,
    stowed: false,
    sets: { 1: emptyHands(), 2: emptyHands() },
  };
}

export function isTwoHandedSet(set: WeaponSetHands): boolean {
  return !!set.mainhand && set.mainhand === set.offhand;
}

export function weaponSetAssignedIds(state: WeaponSetsState): Set<string> {
  const ids = new Set<string>();
  for (const hands of [state.sets[1], state.sets[2]]) {
    if (hands?.mainhand) ids.add(hands.mainhand);
    if (hands?.offhand) ids.add(hands.offhand);
  }
  return ids;
}

export function isItemAssignedToWeaponSet(actor: any, itemId: string | null | undefined): boolean {
  if (!itemId) return false;
  return weaponSetAssignedIds(peekWeaponSets(actor)).has(String(itemId));
}

/** Inactive-set items stay prepared on the character — hidden, not in the carry grid. */
export function isWeaponSetPreparedFlags(flags: { weaponSetPrepared?: unknown } | null | undefined): boolean {
  return flags?.weaponSetPrepared === true;
}

export function isWeaponSetPreparedItem(item: any): boolean {
  return isWeaponSetPreparedFlags(getItemEquipmentFlags(item));
}

/** True when an item belongs to a weapon set and must not appear in inventory. */
export function isHiddenInInactiveWeaponSet(actor: any, item: any): boolean {
  const id = item?.id != null ? String(item.id) : '';
  if (!id) return false;
  if (isWeaponSetPreparedItem(item)) return true;
  if (!isItemAssignedToWeaponSet(actor, id)) return false;
  const slot = getItemEquipmentFlags(item).slot;
  return !slot && item?.system?.equipped !== true;
}

export function isNaturallyTwoHandedItem(item: any): boolean {
  if (!item) return false;
  if (requiresAmmunition(item)) return false;
  const sys = item.system || {};
  if (Number(sys.hands) >= 2) return true;
  if (sys.twoHanded === true) return true;
  const profile = String(sys.baseProfile || '');
  return profile === 'twoHandedWeapon' || profile === 'twoHandedWeaponRanged';
}

export function isVersatileItem(item: any): boolean {
  const innates = Array.isArray(item?.system?.innateAbilities) ? item.system.innateAbilities : [];
  return innates.some((a: unknown) => /versatile/i.test(String(a)));
}

export function canMarkTwoHandedGrip(item: any): boolean {
  return isNaturallyTwoHandedItem(item) || isVersatileItem(item);
}

export function getItemEquipmentFlags(item: any): Record<string, any> {
  if (typeof item?.getFlag === 'function') {
    return { ...(item.getFlag('mastery-system', 'equipment') || {}) };
  }
  return { ...(item?.flags?.['mastery-system']?.equipment || {}) };
}

export function getItemInHandSlot(actor: any, slotKey: 'mainhand' | 'offhand'): any | null {
  const items = collectItems(actor);
  for (const it of items) {
    const flags = getItemEquipmentFlags(it);
    if (flags.slot === slotKey) return it;
  }
  if (slotKey === 'mainhand') {
    return items.find((it) => it.type === 'weapon' && it.system?.equipped === true) ?? null;
  }
  if (slotKey === 'offhand') {
    return items.find((it) => it.type === 'shield' && it.system?.equipped === true) ?? null;
  }
  return null;
}

export function readHandsFromEquippedItems(actor: any): WeaponSetHands {
  const main = getItemInHandSlot(actor, 'mainhand');
  const off = getItemInHandSlot(actor, 'offhand');
  const mainId = main?.id ? String(main.id) : null;
  if (main && isNaturallyTwoHandedItem(main)) {
    return { mainhand: mainId, offhand: mainId };
  }
  const offId = off?.id ? String(off.id) : null;
  if (mainId && getItemEquipmentFlags(main).twoHanded === true && !requiresAmmunition(main)) {
    return { mainhand: mainId, offhand: mainId };
  }
  if (mainId && offId === mainId && !requiresAmmunition(main)) {
    return { mainhand: mainId, offhand: mainId };
  }
  return { mainhand: mainId, offhand: offId };
}

export function isInitializedWeaponSets(raw: unknown): raw is WeaponSetsState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as WeaponSetsState;
  if (s.schemaVersion !== WEAPON_SETS_SCHEMA) return false;
  if (s.active !== 1 && s.active !== 2) return false;
  if (!s.sets?.[1] || !s.sets?.[2]) return false;
  return true;
}

export function pruneWeaponSetRefs(state: WeaponSetsState, validIds: Set<string>): WeaponSetsState {
  const clean = (hands: WeaponSetHands): WeaponSetHands => ({
    mainhand: hands.mainhand && validIds.has(hands.mainhand) ? hands.mainhand : null,
    offhand: hands.offhand && validIds.has(hands.offhand) ? hands.offhand : null,
  });
  return {
    schemaVersion: WEAPON_SETS_SCHEMA,
    active: state.active === 2 ? 2 : 1,
    stowed: state.stowed === true,
    sets: {
      1: clean(state.sets[1] || emptyHands()),
      2: clean(state.sets[2] || emptyHands()),
    },
  };
}

export function buildInitialWeaponSets(currentHands: WeaponSetHands): WeaponSetsState {
  return {
    schemaVersion: WEAPON_SETS_SCHEMA,
    active: 1,
    stowed: false,
    sets: { 1: { ...currentHands }, 2: emptyHands() },
  };
}

export function resolveSwapTarget(active: WeaponSetIndex, requested?: WeaponSetIndex): WeaponSetIndex | null {
  const target = requested ?? (active === 1 ? 2 : 1);
  if (target === active) return null;
  return target;
}

function validItemIds(actor: any): Set<string> {
  return new Set(collectItems(actor).map((it) => String(it.id)).filter(Boolean));
}

function readStoredState(actor: any): unknown {
  if (typeof actor?.getFlag === 'function') {
    return actor.getFlag('mastery-system', WEAPON_SETS_FLAG);
  }
  return actor?.flags?.['mastery-system']?.[WEAPON_SETS_FLAG];
}

export function peekWeaponSets(actor: any): WeaponSetsState {
  const raw = readStoredState(actor);
  if (isInitializedWeaponSets(raw)) {
    return pruneWeaponSetRefs(raw, validItemIds(actor));
  }
  return buildInitialWeaponSets(readHandsFromEquippedItems(actor));
}

export async function persistWeaponSets(actor: any, state: WeaponSetsState): Promise<void> {
  const next = pruneWeaponSetRefs(state, validItemIds(actor));
  if (typeof actor.update === 'function') {
    await actor.update({ [`flags.mastery-system.${WEAPON_SETS_FLAG}`]: next });
    return;
  }
  if (typeof actor.setFlag === 'function') {
    if (typeof actor.unsetFlag === 'function' && readStoredState(actor)) {
      try {
        await actor.unsetFlag('mastery-system', WEAPON_SETS_FLAG);
      } catch {
        /* replace via setFlag */
      }
    }
    await actor.setFlag('mastery-system', WEAPON_SETS_FLAG, next);
  }
}

export async function ensureWeaponSets(actor: any): Promise<WeaponSetsState> {
  const raw = readStoredState(actor);
  if (isInitializedWeaponSets(raw)) {
    try {
      await migrateActorAmmunition(actor);
    } catch {
      /* field repair is best-effort */
    }
    const pruned = pruneWeaponSetRefs(raw, validItemIds(actor));
    const normalized: WeaponSetsState = {
      ...pruned,
      sets: {
        1: normalizeAmmoWeaponSetHands(actor, pruned.sets[1]),
        2: normalizeAmmoWeaponSetHands(actor, pruned.sets[2]),
      },
    };
    const changed =
      normalized.sets[1].mainhand !== raw.sets[1].mainhand ||
      normalized.sets[1].offhand !== raw.sets[1].offhand ||
      normalized.sets[2].mainhand !== raw.sets[2].mainhand ||
      normalized.sets[2].offhand !== raw.sets[2].offhand;
    if (changed) await persistWeaponSets(actor, normalized);
    return normalized;
  }
  const initial = buildInitialWeaponSets(readHandsFromEquippedItems(actor));
  await persistWeaponSets(actor, initial);
  return initial;
}

export async function pruneDeletedWeaponSetRefs(actor: any): Promise<WeaponSetsState | null> {
  const raw = readStoredState(actor);
  if (!isInitializedWeaponSets(raw)) return null;
  const pruned = pruneWeaponSetRefs(raw, validItemIds(actor));
  const changed =
    pruned.sets[1].mainhand !== raw.sets[1].mainhand ||
    pruned.sets[1].offhand !== raw.sets[1].offhand ||
    pruned.sets[2].mainhand !== raw.sets[2].mainhand ||
    pruned.sets[2].offhand !== raw.sets[2].offhand;
  if (changed) await persistWeaponSets(actor, pruned);
  return pruned;
}

export async function syncActiveWeaponSetFromHands(actor: any): Promise<WeaponSetsState> {
  if (swapLocks.has(actorKey(actor))) return peekWeaponSets(actor);
  const state = await ensureWeaponSets(actor);
  const hands = readHandsFromEquippedItems(actor);
  const handsEmpty = !hands.mainhand && !hands.offhand;
  if (state.stowed && handsEmpty) return state;
  const next: WeaponSetsState = {
    ...state,
    stowed: false,
    sets: {
      ...state.sets,
      [state.active]: hands,
    },
  };
  await persistWeaponSets(actor, next);
  return next;
}

function equipmentUpdate(
  item: any,
  patch: { slot: string | null; equipped: boolean; twoHanded?: boolean; prepared?: boolean },
): Record<string, unknown> {
  const flags = getItemEquipmentFlags(item);
  const next: Record<string, unknown> = {
    ...flags,
    container: flags.container || 'inventory',
    band: flags.band || 'not',
    slot: patch.slot,
  };
  if (patch.twoHanded) next.twoHanded = true;
  else delete next.twoHanded;
  if (patch.prepared) next.weaponSetPrepared = true;
  else delete next.weaponSetPrepared;
  delete next.grid;
  delete next.keepInventoryGrid;
  return {
    _id: item.id,
    'flags.mastery-system.equipment': next,
    'system.equipped': patch.equipped,
  };
}

export async function applyWeaponSetHands(actor: any, set: WeaponSetHands): Promise<void> {
  const items = collectItems(actor);
  const byId = new Map(items.map((it) => [String(it.id), it]));
  const desiredMain = set.mainhand && byId.get(set.mainhand) ? set.mainhand : null;
  const desiredOff = set.offhand && byId.get(set.offhand) ? set.offhand : null;
  const twoHanded = !!(desiredMain && desiredMain === desiredOff);
  const desiredIds = new Set<string>();
  if (desiredMain) desiredIds.add(desiredMain);
  if (desiredOff) desiredIds.add(desiredOff);

  const updates: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  const queue = (item: any, patch: { slot: string | null; equipped: boolean; twoHanded?: boolean; prepared?: boolean }) => {
    const id = String(item.id);
    if (seen.has(id)) return;
    seen.add(id);
    updates.push(equipmentUpdate(item, patch));
  };

  const currentMain = getItemInHandSlot(actor, 'mainhand');
  const currentOff = getItemInHandSlot(actor, 'offhand');
  for (const held of [currentMain, currentOff]) {
    if (!held?.id) continue;
    const id = String(held.id);
    if (desiredIds.has(id)) continue;
    if (isEchoBoundArtifact(held)) continue;
    queue(held, { slot: null, equipped: false, twoHanded: false, prepared: true });
  }

  if (desiredMain) {
    const item = byId.get(desiredMain);
    if (item) queue(item, { slot: 'mainhand', equipped: true, twoHanded });
  }
  if (desiredOff && !twoHanded) {
    const item = byId.get(desiredOff);
    if (item) queue(item, { slot: 'offhand', equipped: true, twoHanded: false });
  }

  if (!updates.length) return;
  if (typeof actor.updateEmbeddedDocuments === 'function') {
    await actor.updateEmbeddedDocuments('Item', updates);
    return;
  }
  for (const upd of updates) {
    const item = byId.get(String(upd._id));
    if (item && typeof item.update === 'function') {
      const { _id, ...rest } = upd;
      void _id;
      await item.update(rest);
    }
  }
}

async function refreshWeaponSetSurfaces(actor: any): Promise<void> {
  try {
    actor.prepareDerivedData?.();
  } catch {
    /* derived refresh is best-effort */
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
  try {
    (globalThis as any).Hooks?.callAll?.('masterySystem.weaponSetsChanged', { actorId: actor?.id });
  } catch {
    /* ignore */
  }
}

function activeCombat(): any | null {
  const combat = (globalThis as any).game?.combat;
  return combat?.active ? combat : null;
}

function itemById(actor: any, id: string | null | undefined): any | null {
  if (!id) return null;
  return collectItems(actor).find((it) => String(it.id) === String(id)) ?? null;
}

function cleanItemName(item: any): string {
  return String(item?.name || 'Weapon')
    .replace(/\s*-\s*Level\s+\d+-\d+\s*$/i, '')
    .trim();
}

/** Short label for one prepared set: weapon names, or empty hands. */
export function describeWeaponSetHands(actor: any, hands: WeaponSetHands | null | undefined): string {
  const set = hands || emptyHands();
  const main = itemById(actor, set.mainhand);
  const off = itemById(actor, set.offhand);
  if (!main && !off) return loc('emptyHands', 'empty');
  if (main && set.mainhand && set.mainhand === set.offhand) {
    return `${cleanItemName(main)} (${loc('bothHands', 'both hands')})`;
  }
  const parts: string[] = [];
  if (main) parts.push(cleanItemName(main));
  if (off && off !== main) parts.push(cleanItemName(off));
  return parts.join(' + ') || loc('emptyHands', 'empty');
}

export interface WeaponSwapPreview {
  active: WeaponSetIndex;
  next: WeaponSetIndex;
  from: string;
  to: string;
  /** One line for the radial and the sheet tooltip. */
  line: string;
}

/** What Weapon Swap will do with the sets as they are stored right now. */
export function describeWeaponSwap(actor: any): WeaponSwapPreview {
  const state = peekWeaponSets(actor);
  const next: WeaponSetIndex = state.active === 1 ? 2 : 1;
  const from = describeWeaponSetHands(actor, state.sets[state.active]);
  const to = describeWeaponSetHands(actor, state.sets[next]);
  const formatted = (globalThis as any).game?.i18n?.format?.('MASTERY.weaponSets.swapDetail', {
    fromN: state.active,
    from,
    toN: next,
    to,
  });
  const line =
    formatted && formatted !== 'MASTERY.weaponSets.swapDetail'
      ? formatted
      : `Set ${state.active}: ${from} → Set ${next}: ${to}. Costs 1 Movement in combat.`;
  return { active: state.active, next, from, to, line };
}

export interface WeaponSwapChoice {
  target: WeaponSwapTarget;
  /** Roman numeral or Fists, for the sheet button. */
  shortLabel: string;
  summary: string;
  /** Full radial title. */
  name: string;
  description: string;
  active: boolean;
}

function setChoice(actor: any, state: WeaponSetsState, index: WeaponSetIndex): WeaponSwapChoice {
  const summary = describeWeaponSetHands(actor, state.sets[index]);
  const active = state.stowed !== true && state.active === index;
  const roman = index === 1 ? 'I' : 'II';
  const name = active
    ? fmt('choiceWearing', { n: roman, hands: summary }, `Wearing · Set ${roman}: ${summary}`)
    : fmt('choiceSwitch', { n: roman, hands: summary }, `Set ${roman}: ${summary}`);
  const description = active
    ? fmt('choiceWearingDetail', { n: roman, hands: summary }, `Wearing this. Set ${roman}: ${summary}.`)
    : fmt(
        'choiceSwitchDetail',
        { n: roman, hands: summary },
        `Switch to Set ${roman}: ${summary}. Costs 1 Movement in combat.`,
      );
  return { target: index, shortLabel: roman, summary, name, description, active };
}

function unarmedChoice(state: WeaponSetsState): WeaponSwapChoice {
  const active = state.stowed === true;
  const summary = loc('stowSummary', 'Stow weapons and fight unarmed');
  return {
    target: 'unarmed',
    shortLabel: loc('stowName', 'Fists'),
    summary,
    name: active ? loc('stowWearing', 'Wearing · Fists') : loc('stowName', 'Fists'),
    description: active
      ? loc('stowWearingDetail', 'Wearing this. Unarmed.')
      : loc(
          'stowDetail',
          'Stow weapons and fight unarmed. Both sets stay saved. Costs 1 Movement in combat.',
        ),
    active,
  };
}

function setHasGear(actor: any, hands: WeaponSetHands | null | undefined): boolean {
  const set = hands || emptyHands();
  return !!(itemById(actor, set.mainhand) || itemById(actor, set.offhand));
}

/**
 * Filled sets, then Fists. An empty set is not a button — if Set II is empty
 * the card offers the worn set and Fists, not an empty Set II as well.
 * Fists stays on the card whenever another set still has a weapon.
 */
export function listWeaponSwapChoices(actor: any): WeaponSwapChoice[] {
  const state = peekWeaponSets(actor);
  const filled = ([1, 2] as WeaponSetIndex[]).filter((index) => setHasGear(actor, state.sets[index]));
  const fists = unarmedChoice(state);
  if (state.stowed) {
    return [fists, ...filled.map((index) => setChoice(actor, state, index))];
  }
  const worn = filled
    .filter((index) => index === state.active)
    .map((index) => setChoice(actor, state, index));
  const others = filled
    .filter((index) => index !== state.active)
    .map((index) => setChoice(actor, state, index));
  return [...worn, ...others, fists];
}

function fmt(key: string, data: Record<string, string | number>, fallback: string): string {
  const formatted = (globalThis as any).game?.i18n?.format?.(`MASTERY.weaponSets.${key}`, data);
  return formatted && formatted !== `MASTERY.weaponSets.${key}` ? formatted : fallback;
}

export interface ActiveWeaponProfile {
  unarmed: boolean;
  name: string;
  damage: string;
  attackType: 'melee' | 'ranged';
  /** Radial range. Ranged must be > 4 so the targeting flow treats it as ranged. */
  rangeM: number;
  summary: string;
}

function profileFromItem(item: any): { attackType: 'melee' | 'ranged'; rangeM: number; damage: string } {
  const sys = item?.system || {};
  if (item?.type === 'artifact') {
    const display = formatArtifactWeaponRangeDisplay(sys.artifactWeapon, sys.baseProfile);
    const damage = String(sys.artifactWeapon?.damage || '1d8');
    if (display.kind === 'ranged') {
      return { attackType: 'ranged', rangeM: Math.max(8, display.meters || 8), damage };
    }
    return { attackType: 'melee', rangeM: 2, damage };
  }
  const innates: string[] = Array.isArray(sys.innateAbilities) ? sys.innateAbilities.map(String) : [];
  const rangedInnate = innates.find((a) => /\b(ranged|thrown)\b/i.test(a));
  const damage = String(sys.damage || sys.weaponDamage || '1d8');
  if (sys.weaponType === 'ranged' || rangedInnate) {
    const match = String(rangedInnate || sys.range || '').match(/(\d+)/);
    const meters = match ? parseInt(match[1], 10) : 12;
    return { attackType: 'ranged', rangeM: Math.max(8, meters), damage };
  }
  return { attackType: 'melee', rangeM: 2, damage };
}

/**
 * What Basic Attack rolls right now: the active set's main-hand weapon, or
 * Unarmed 1d8 when that set is empty.
 */
export function describeActiveWeaponProfile(actor: any): ActiveWeaponProfile {
  const state = peekWeaponSets(actor);
  if (state.stowed) {
    const fists = loc('stowName', 'Fists');
    return {
      unarmed: true,
      name: fists,
      damage: '1d8',
      attackType: 'melee',
      rangeM: 2,
      summary: `${fists} · 1d8 + MR × 2d8. No weapon Specials.`,
    };
  }
  const hands = state.sets[state.active] || emptyHands();
  const main = itemById(actor, hands.mainhand);
  const carriesWeapon =
    !!main &&
    (main.type === 'weapon' ||
      main.type === 'artifact' && (main.system?.artifactWeapon || main.system?.artifactKind === 'weapon'));
  if (!carriesWeapon) {
    const fists = loc('stowName', 'Fists');
    return {
      unarmed: true,
      name: fists,
      damage: '1d8',
      attackType: 'melee',
      rangeM: 2,
      summary: `${fists} · 1d8 + MR × 2d8. No weapon Specials.`,
    };
  }
  const spec = profileFromItem(main);
  const name = cleanItemName(main);
  return {
    unarmed: false,
    name,
    damage: spec.damage,
    attackType: spec.attackType,
    rangeM: spec.rangeM,
    summary: `${name} · ${spec.damage} + MR × 2d8`,
  };
}

/**
 * Shared Weapon Swap. Sheet buttons and the radial pass a target:
 * set 1, set 2, or `unarmed` (stow both sets and fight with fists).
 * `target` omitted = toggle to the other set.
 */
export async function swapWeaponSet(
  actor: any,
  target?: WeaponSwapTarget,
  options?: { quiet?: boolean },
): Promise<SwapWeaponSetResult> {
  if (!actor) return { ok: false, reason: 'apply-failed' };
  const key = actorKey(actor);
  if (key && swapLocks.has(key)) return { ok: false, reason: 'busy' };
  if (key) swapLocks.add(key);

  try {
    if (typeof (globalThis as any).game !== 'undefined' && !canCurrentUserUpdateDocument(actor)) {
      return { ok: false, reason: 'permission' };
    }

    const state = await ensureWeaponSets(actor);
    const next: WeaponSwapTarget =
      target === 'unarmed' || target === 1 || target === 2
        ? target
        : state.active === 1
          ? 2
          : 1;
    const alreadyThere =
      next === 'unarmed' ? state.stowed === true : state.stowed !== true && state.active === next;
    if (alreadyThere) {
      return { ok: true, swapped: false, active: state.active };
    }

    const combat = activeCombat();
    const inCombat = !!combat && actorParticipatesInActiveCombat(actor);
    let spentMovement = false;
    const economyActor = (getActionEconomyActor(actor) ?? actor) as any;

    if (inCombat) {
      if (isNormalMovementReplaced(economyActor, combat)) {
        (globalThis as any).ui?.notifications?.warn(
          loc('movementReplaced', 'A Movement Power already replaced your normal Movement this round.'),
        );
        return { ok: false, reason: 'no-movement' };
      }
      if (getAvailableMovementActions(economyActor, combat) <= 0) {
        (globalThis as any).ui?.notifications?.warn(
          loc('noMovement', 'No Movement Action available to switch Weapon Sets.'),
        );
        return { ok: false, reason: 'no-movement' };
      }
      const spent = await consumeMovementAction(economyActor, combat);
      if (!spent) {
        return { ok: false, reason: 'spend-failed' };
      }
      spentMovement = true;
    }

    const nextActive: WeaponSetIndex = next === 'unarmed' ? state.active : next;
    const nextState: WeaponSetsState = {
      ...state,
      active: nextActive,
      stowed: next === 'unarmed',
    };
    const destination =
      next === 'unarmed'
        ? loc('stowedNow', 'Weapons stowed — unarmed.')
        : `Set ${next}: ${describeWeaponSetHands(actor, state.sets[next])}`;

    try {
      await persistWeaponSets(actor, nextState);
      await applyWeaponSetHands(actor, next === 'unarmed' ? emptyHands() : state.sets[next] || emptyHands());
    } catch (err) {
      console.warn('Mastery System | Weapon set apply failed', err);
      if (spentMovement) {
        try {
          await refundMovementAction(economyActor, combat);
        } catch {
          /* ignore */
        }
      }
      return { ok: false, reason: 'apply-failed' };
    }

    await refreshWeaponSetSurfaces(actor);
    try {
      const ChatMessage = (globalThis as any).ChatMessage;
      if (!options?.quiet && typeof ChatMessage?.create === 'function') {
        const note = spentMovement
          ? loc('swappedCombat', 'Movement spent.')
          : loc('swappedFree', 'Free — not in combat.');
        await ChatMessage.create({
          speaker:
            typeof ChatMessage.getSpeaker === 'function' ? ChatMessage.getSpeaker({ actor }) : undefined,
          content: `<p><strong>${loc('actionName', 'Weapon Swap')}</strong> — ${destination} ${note}</p>`,
        });
      }
    } catch (err) {
      console.warn('Mastery System | Weapon swap chat note failed', err);
    }
    return { ok: true, swapped: true, active: nextActive, spentMovement };
  } finally {
    if (key) swapLocks.delete(key);
  }
}

/** Test helper — do not use from production UI. */
export function resetWeaponSetLocks(): void {
  swapLocks.clear();
}
