/**
 * Minor Magic Items — store one use of a purchased Active Power in a
 * temporary object (potion, grenade, rune, prepared weapon, trap, charm).
 *
 * Prototype: snapshot + inventory gear + stone hold. Combat resolution
 * of the stored Power comes in a later pass.
 */

import { findFirstFit, parseInventorySize } from './inventory-grid.js';
import { ZONE_WIDTH_COLS } from './encumbrance.js';
import { poolSpendableStones } from './artifact-actor-rules.js';
import { resolvePowerCategoryFromItem } from './power-catalog.js';
import { getPowerDefinitionRank } from './power-definition-rank.js';
import { getAttackAttributeForPowerTreeOrSchool } from './power-roll-attribute.js';
import { renderAoe, renderDuration, renderRange, renderSpecials } from './power-rendering.js';
import type { AoeSpec, PowerLevelRow, PowerSpecial, RangeSpec } from '../types/item.js';

export const MINOR_MAGIC_FLAG = 'minorMagic';
export const MINOR_MAGIC_LEDGER_FLAG = 'minorMagicLedger';
export const MINOR_MAGIC_STONE_COST = 1;

export const MINOR_MAGIC_FORMS = [
  'potion',
  'grenade',
  'rune',
  'weapon',
  'trap',
  'charm',
] as const;

export type MinorMagicForm = (typeof MINOR_MAGIC_FORMS)[number];

export const MINOR_MAGIC_FORM_LABELS: Record<MinorMagicForm, string> = {
  potion: 'Potion',
  grenade: 'Grenade',
  rune: 'Rune',
  weapon: 'Prepared Weapon',
  trap: 'Trap',
  charm: 'Charm',
};

const FORM_ICONS: Record<MinorMagicForm, string> = {
  potion: 'systems/mastery-system/assets/icons/items/gear/Glass Bottle.png',
  grenade: 'systems/mastery-system/assets/icons/items/gear/Glass Bottle.png',
  rune: 'icons/svg/aura.svg',
  weapon: 'systems/mastery-system/assets/icons/items/weapons/shortsword.png',
  trap: 'icons/svg/item-bag.svg',
  charm: 'icons/svg/aura.svg',
};

const POOL_ATTRS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

export type MinorMagicStoneAttr = (typeof POOL_ATTRS)[number];

export interface MinorMagicAttackPool {
  attribute: string;
  numDice: number;
  keepDice: number;
}

export interface MinorMagicSnapshot {
  powerId: string;
  powerName: string;
  templateId: string;
  templateName: string;
  powerLevel: number;
  definitionRank: number;
  category: 'active';
  actionCost: string;
  isSpell: boolean;
  castingAttribute: string;
  attackPool: MinorMagicAttackPool;
  damage: string;
  healing: string;
  range: string;
  aoe: string;
  aoeShape: string;
  targets: number | null;
  duration: string;
  specials: string;
  effect: string;
  chosenSpecialKey: string;
}

export interface MinorMagicItemFlag {
  creatorId: string;
  creatorName: string;
  form: MinorMagicForm;
  stoneAttr: string;
  released?: boolean;
  armedAsTrap?: boolean;
  trapTrigger?: string;
  snapshot: MinorMagicSnapshot;
}

export interface MinorMagicLedger {
  heldByAttr: Record<string, number>;
  pendingByAttr: Record<string, number>;
  items: Record<string, { attr: string }>;
}

export function emptyMinorMagicLedger(): MinorMagicLedger {
  return { heldByAttr: {}, pendingByAttr: {}, items: {} };
}

export function normalizeMinorMagicLedger(raw: unknown): MinorMagicLedger {
  const src = raw && typeof raw === 'object' ? (raw as Partial<MinorMagicLedger>) : {};
  const heldByAttr: Record<string, number> = {};
  const pendingByAttr: Record<string, number> = {};
  const items: Record<string, { attr: string }> = {};
  if (src.heldByAttr && typeof src.heldByAttr === 'object') {
    for (const [k, v] of Object.entries(src.heldByAttr)) {
      const n = Math.max(0, Math.floor(Number(v) || 0));
      if (n > 0) heldByAttr[k] = n;
    }
  }
  if (src.pendingByAttr && typeof src.pendingByAttr === 'object') {
    for (const [k, v] of Object.entries(src.pendingByAttr)) {
      const n = Math.max(0, Math.floor(Number(v) || 0));
      if (n > 0) pendingByAttr[k] = n;
    }
  }
  if (src.items && typeof src.items === 'object') {
    for (const [id, row] of Object.entries(src.items)) {
      const attr = String((row as { attr?: string })?.attr || '').trim();
      if (id && attr) items[id] = { attr };
    }
  }
  return { heldByAttr, pendingByAttr, items };
}

export function countHeldMinorMagicItems(ledger: MinorMagicLedger): number {
  return Object.keys(ledger.items).length;
}

export function applyCreateToLedger(
  ledger: MinorMagicLedger,
  itemId: string,
  attr: string,
): MinorMagicLedger {
  const next = structuredClone(ledger);
  next.items[itemId] = { attr };
  next.heldByAttr[attr] = (next.heldByAttr[attr] ?? 0) + 1;
  return next;
}

export function applyReleaseToLedger(
  ledger: MinorMagicLedger,
  itemId: string,
): MinorMagicLedger | null {
  const row = ledger.items[itemId];
  if (!row) return null;
  const next = structuredClone(ledger);
  delete next.items[itemId];
  const held = Math.max(0, (next.heldByAttr[row.attr] ?? 0) - 1);
  if (held > 0) next.heldByAttr[row.attr] = held;
  else delete next.heldByAttr[row.attr];
  next.pendingByAttr[row.attr] = (next.pendingByAttr[row.attr] ?? 0) + 1;
  return next;
}

/** Safe Haven: pending stones return; held stones stay burned. */
export function applySafeHavenToLedger(ledger: MinorMagicLedger): {
  ledger: MinorMagicLedger;
  restoreByAttr: Record<string, number>;
} {
  const restoreByAttr = { ...ledger.pendingByAttr };
  return {
    ledger: {
      heldByAttr: { ...ledger.heldByAttr },
      pendingByAttr: {},
      items: { ...ledger.items },
    },
    restoreByAttr,
  };
}

export function isMinorMagicForm(value: string): value is MinorMagicForm {
  return (MINOR_MAGIC_FORMS as readonly string[]).includes(value);
}

export function defaultMinorMagicName(form: MinorMagicForm, powerName: string): string {
  const power = String(powerName || 'Power').trim() || 'Power';
  switch (form) {
    case 'potion':
      return `Potion of ${power}`;
    case 'grenade':
      return `Grenade of ${power}`;
    case 'rune':
      return `Rune of ${power}`;
    case 'weapon':
      return `Prepared ${power}`;
    case 'trap':
      return `Trap: ${power}`;
    case 'charm':
      return `Charm of ${power}`;
  }
}

export function iconForMinorMagicForm(form: MinorMagicForm): string {
  return FORM_ICONS[form];
}

export function actorMasteryRank(actor: { system?: { mastery?: { rank?: unknown } } }): number {
  return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}

export function minorMagicLimit(actor: { system?: { mastery?: { rank?: unknown } } }): number {
  return actorMasteryRank(actor);
}

function isBlockedSourcePower(item: {
  system?: Record<string, unknown>;
  getFlag?: (scope: string, key: string) => unknown;
}): boolean {
  const sys = item.system || {};
  if (sys.fromArtifact === true || sys.granted === true || sys.temporary === true) return true;
  const source = String(sys.source || sys.grantedBy || '').toLowerCase();
  if (['artifact', 'granted', 'buff', 'temporary', 'summon'].includes(source)) return true;
  try {
    const flag = item.getFlag?.('mastery-system', 'granted') ?? item.getFlag?.('mastery-system', 'temporary');
    if (flag === true) return true;
    const srcFlag = String(item.getFlag?.('mastery-system', 'source') || '').toLowerCase();
    if (['artifact', 'granted', 'buff', 'temporary'].includes(srcFlag)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function isEligibleMinorMagicPower(item: {
  type?: string;
  system?: Record<string, unknown>;
  getFlag?: (scope: string, key: string) => unknown;
}): boolean {
  if (item?.type !== 'power') return false;
  if (resolvePowerCategoryFromItem(item as { system?: { category?: any; powerType?: string } }) !== 'active') {
    return false;
  }
  if (isBlockedSourcePower(item)) return false;
  return true;
}

export function listEligibleMinorMagicPowers(actor: any): any[] {
  const items = actor?.items ? Array.from(actor.items as Iterable<any>) : [];
  return items
    .filter((it) => isEligibleMinorMagicPower(it))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

export function readMinorMagicFlag(item: {
  getFlag?: (scope: string, key: string) => unknown;
  flags?: Record<string, Record<string, unknown>>;
}): MinorMagicItemFlag | null {
  const raw =
    item.getFlag?.('mastery-system', MINOR_MAGIC_FLAG) ??
    item.flags?.['mastery-system']?.[MINOR_MAGIC_FLAG];
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<MinorMagicItemFlag>;
  if (!data.snapshot || !data.form || !data.creatorId) return null;
  return data as MinorMagicItemFlag;
}

export function listMinorMagicItemsOnActor(actor: { items?: Iterable<any> }): any[] {
  const items = actor?.items ? Array.from(actor.items as Iterable<any>) : [];
  return items.filter((it) => !!readMinorMagicFlag(it));
}

function readLevelRow(power: { system?: any }): PowerLevelRow | null {
  const sys = power.system || {};
  const levels = sys.levels;
  if (!levels || typeof levels !== 'object') return null;
  const rankInput = sys.rank ?? sys.level ?? 1;
  const defRank = getPowerDefinitionRank(rankInput, levels);
  const row = Array.isArray(levels)
    ? levels.find((r: { level?: number }) => Number(r?.level) === defRank)
    : levels[String(defRank)] ?? levels[String(rankInput)];
  return row && typeof row === 'object' ? (row as PowerLevelRow) : null;
}

function snapshotAttackPool(
  actor: { system?: any },
  power: { system?: any },
): MinorMagicAttackPool {
  const sys = power.system || {};
  let attribute = 'might';
  if (sys.isSpell && sys.castingAttribute) {
    attribute = String(sys.castingAttribute).toLowerCase();
  } else {
    const fromTree = getAttackAttributeForPowerTreeOrSchool(sys.tree);
    if (fromTree) attribute = fromTree;
    else if (sys.roll?.attribute) attribute = String(sys.roll.attribute).toLowerCase();
    else if (sys.newRoll?.attribute) attribute = String(sys.newRoll.attribute).toLowerCase();
  }
  const numDice = Math.max(0, Math.floor(Number(actor.system?.attributes?.[attribute]?.value) || 0));
  const keepDice = actorMasteryRank(actor);
  return { attribute, numDice, keepDice };
}

function snapshotDamage(sys: any, row: PowerLevelRow | null): string {
  const dice = row?.effect?.dice;
  if (typeof dice === 'string' && dice.trim()) return dice.trim();
  const rider = row?.mechanics?.damageRider?.flat;
  if (typeof rider === 'string' && rider.trim()) return rider.replace(/^\+/, '').trim();
  const legacy = sys?.roll?.damage;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
  return '—';
}

function snapshotHealing(sys: any, row: PowerLevelRow | null): string {
  const heal = row?.mechanics?.healing?.flat;
  if (typeof heal === 'string' && heal.trim()) return heal.trim();
  const legacy = sys?.roll?.healing;
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim();
  return '—';
}

function snapshotAoeShape(row: PowerLevelRow | null, sys: any): string {
  const shape = row?.aoe?.shape;
  if (shape) return String(shape);
  const raw = String(sys?.aoe || '').toLowerCase();
  if (!raw || raw === '—' || raw === 'none' || raw === 'single') return 'single';
  return 'other';
}

export function snapshotPowerForMinorMagic(
  actor: { id?: string; name?: string; system?: any },
  power: { id?: string; name?: string; system?: any },
): MinorMagicSnapshot {
  const sys = power.system || {};
  const row = readLevelRow(power);
  const rankInput = Math.max(1, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1));
  const definitionRank = getPowerDefinitionRank(rankInput, sys.levels);
  const specials = (row?.specials || []) as PowerSpecial[];
  const actionCost = String(sys.newCost?.action ?? sys.cost?.action ?? 'attack');
  const aoe = row?.aoe ?? null;
  const targets =
    typeof aoe?.targets === 'number'
      ? aoe.targets
      : aoe?.shape === 'single' || !aoe || aoe.shape === 'none'
        ? 1
        : null;

  return {
    powerId: String(power.id || ''),
    powerName: String(power.name || 'Power'),
    templateId: String(sys.templateId || ''),
    templateName: String(sys.templateName || power.name || ''),
    powerLevel: rankInput,
    definitionRank,
    category: 'active',
    actionCost,
    isSpell: sys.isSpell === true,
    castingAttribute: String(sys.castingAttribute || ''),
    attackPool: snapshotAttackPool(actor, power),
    damage: snapshotDamage(sys, row),
    healing: snapshotHealing(sys, row),
    range: row ? renderRange(row.range as RangeSpec | null) : String(sys.range || '—'),
    aoe: row ? renderAoe(row.aoe as AoeSpec | null) : String(sys.aoe || '—'),
    aoeShape: snapshotAoeShape(row, sys),
    targets,
    duration: row ? renderDuration(row.duration) : String(sys.duration || '—'),
    specials: specials.length
      ? renderSpecials(specials)
      : Array.isArray(sys.specials)
        ? sys.specials.join(', ')
        : '—',
    effect: String(row?.effect?.text || sys.effect || ''),
    chosenSpecialKey: String(sys.chosenSpecial?.key || ''),
  };
}

export function formatAttackPool(pool: MinorMagicAttackPool): string {
  const attr = pool.attribute ? pool.attribute.charAt(0).toUpperCase() + pool.attribute.slice(1) : '—';
  return `${pool.numDice}k${pool.keepDice} (${attr})`;
}

export function snapshotSummaryLines(snapshot: MinorMagicSnapshot): string[] {
  const lines = [
    `${snapshot.powerName} · Rank ${snapshot.powerLevel}`,
    `Action: ${snapshot.actionCost}`,
    `Attack Pool: ${formatAttackPool(snapshot.attackPool)}`,
    `Damage: ${snapshot.damage} (Power only — no weapon dice)`,
  ];
  if (snapshot.healing && snapshot.healing !== '—') lines.push(`Healing: ${snapshot.healing}`);
  lines.push(`Range: ${snapshot.range}`);
  lines.push(`Area: ${snapshot.aoe === '—' ? 'Single Target' : snapshot.aoe}`);
  if (snapshot.specials && snapshot.specials !== '—') lines.push(`Specials: ${snapshot.specials}`);
  return lines;
}

function inventoryRectsForBand(actor: { items?: Iterable<any> }, band: string) {
  const items = actor?.items ? Array.from(actor.items as Iterable<any>) : [];
  return items
    .map((it) => {
      const flags = it.getFlag?.('mastery-system', 'equipment') || {};
      if (flags.container !== 'inventory' || flags.band !== band || !flags.grid?.x || !flags.grid?.y) {
        return null;
      }
      const size = parseInventorySize(it.system?.inventorySize);
      return {
        x: flags.grid.x,
        y: flags.grid.y,
        w: Math.min(ZONE_WIDTH_COLS, size.w),
        h: Math.min(9, size.h),
      };
    })
    .filter(Boolean) as Array<{ x: number; y: number; w: number; h: number }>;
}

export function findInventorySlotForMinorMagic(actor: { items?: Iterable<any> }): {
  band: 'not' | 'enc' | 'heavy';
  x: number;
  y: number;
} | null {
  for (const band of ['not', 'enc', 'heavy'] as const) {
    const pos = findFirstFit(inventoryRectsForBand(actor, band), 1, 1, ZONE_WIDTH_COLS, 9);
    if (pos) return { band, x: pos.x, y: pos.y };
  }
  return null;
}

export function getActorMinorMagicLedger(actor: {
  getFlag?: (scope: string, key: string) => unknown;
}): MinorMagicLedger {
  return normalizeMinorMagicLedger(actor.getFlag?.('mastery-system', MINOR_MAGIC_LEDGER_FLAG));
}

export async function setActorMinorMagicLedger(
  actor: { setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown> },
  ledger: MinorMagicLedger,
): Promise<void> {
  await actor.setFlag?.('mastery-system', MINOR_MAGIC_LEDGER_FLAG, ledger);
}

function canCreateMinorMagic(
  actor: any,
  power: any,
  form: MinorMagicForm,
  stoneAttr: string,
): string | null {
  if (!isEligibleMinorMagicPower(power)) {
    return 'Only a purchased Active Power can be stored.';
  }
  if (!isMinorMagicForm(form)) return 'Choose a form for the item.';
  if (!POOL_ATTRS.includes(stoneAttr as MinorMagicStoneAttr)) return 'Place 1 Stone to create the item.';
  const ledger = getActorMinorMagicLedger(actor);
  if (countHeldMinorMagicItems(ledger) >= minorMagicLimit(actor)) {
    return `You may maintain ${minorMagicLimit(actor)} Minor Magic Item(s) (Mastery Rank).`;
  }
  if (poolSpendableStones(actor, stoneAttr) < MINOR_MAGIC_STONE_COST) {
    return `Need 1 spendable ${stoneAttr} Stone.`;
  }
  if (!findInventorySlotForMinorMagic(actor)) {
    return 'No space in inventory for a 1×1 item.';
  }
  return null;
}

export function validateCreateMinorMagic(
  actor: any,
  power: any,
  form: MinorMagicForm,
  stoneAttr: string,
): string | null {
  return canCreateMinorMagic(actor, power, form, stoneAttr);
}

function itemDescription(form: MinorMagicForm, snapshot: MinorMagicSnapshot): string {
  const formLabel = MINOR_MAGIC_FORM_LABELS[form];
  return [
    `Minor Magic Item (${formLabel}). Stores one use of ${snapshot.powerName}.`,
    ...snapshotSummaryLines(snapshot),
    'The form is flavor only. A grenade does not become an Area Power. Weapon dice and Weapon Specials are never added.',
  ].join('\n');
}

export async function createMinorMagicItem(
  actor: any,
  opts: { powerId: string; form: MinorMagicForm; name?: string; stoneAttr: string },
): Promise<{ ok: true; item: any } | { ok: false; error: string }> {
  const power = actor.items?.get?.(opts.powerId);
  if (!power) return { ok: false, error: 'Choose an Active Power to store.' };
  const err = canCreateMinorMagic(actor, power, opts.form, opts.stoneAttr);
  if (err) return { ok: false, error: err };

  const slot = findInventorySlotForMinorMagic(actor);
  if (!slot) return { ok: false, error: 'No space in inventory for a 1×1 item.' };

  const snapshot = snapshotPowerForMinorMagic(actor, power);
  const name = String(opts.name || '').trim() || defaultMinorMagicName(opts.form, snapshot.powerName);
  const flag: MinorMagicItemFlag = {
    creatorId: String(actor.id || ''),
    creatorName: String(actor.name || ''),
    form: opts.form,
    stoneAttr: opts.stoneAttr,
    snapshot,
  };

  const [created] = await actor.createEmbeddedDocuments('Item', [
    {
      name,
      type: 'gear',
      img: iconForMinorMagicForm(opts.form),
      system: {
        description: itemDescription(opts.form, snapshot),
        inventorySize: '1x1',
        quantity: 1,
        equipped: false,
        weight: 0,
        specials: [],
        baseDamage: '',
      },
      flags: {
        'mastery-system': {
          [MINOR_MAGIC_FLAG]: flag,
          equipment: {
            container: 'inventory',
            band: slot.band,
            grid: { x: slot.x, y: slot.y },
          },
        },
      },
    },
  ]);

  if (!created?.id) return { ok: false, error: 'Could not create the item.' };

  const current = Math.max(0, Number(actor.system?.stonePools?.[opts.stoneAttr]?.current) || 0);
  const ledger = applyCreateToLedger(getActorMinorMagicLedger(actor), created.id, opts.stoneAttr);
  await actor.update({
    [`system.stonePools.${opts.stoneAttr}.current`]: Math.max(0, current - MINOR_MAGIC_STONE_COST),
  });
  await setActorMinorMagicLedger(actor, ledger);

  return { ok: true, item: created };
}

async function releaseOnCreator(creator: any, itemId: string): Promise<boolean> {
  const next = applyReleaseToLedger(getActorMinorMagicLedger(creator), itemId);
  if (!next) return false;
  await setActorMinorMagicLedger(creator, next);
  return true;
}

async function resolveCreator(flag: MinorMagicItemFlag, fallback: any): Promise<any> {
  if (fallback?.id && String(fallback.id) === flag.creatorId) return fallback;
  const fromWorld = (globalThis as any).game?.actors?.get?.(flag.creatorId);
  return fromWorld || fallback;
}

export async function releaseMinorMagicItem(
  actor: any,
  item: any,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const flag = readMinorMagicFlag(item);
  if (!flag) return { ok: false, error: 'Not a Minor Magic Item.' };
  if (flag.released) return { ok: true };
  const creator = await resolveCreator(flag, actor);
  await releaseOnCreator(creator, item.id);
  try {
    await item.update?.({ 'flags.mastery-system.minorMagic.released': true });
  } catch {
    /* item may already be deleting */
  }
  return { ok: true };
}

export async function consumeMinorMagicItem(
  actor: any,
  item: any,
  mode: 'use' | 'trap' | 'dismiss',
  trapTrigger?: string,
): Promise<{ ok: true; flag: MinorMagicItemFlag } | { ok: false; error: string }> {
  const flag = readMinorMagicFlag(item);
  if (!flag) return { ok: false, error: 'Not a Minor Magic Item.' };
  if (mode === 'trap' && trapTrigger) {
    flag.armedAsTrap = true;
    flag.trapTrigger = trapTrigger;
  }
  const released = await releaseMinorMagicItem(actor, item);
  if (!released.ok) return released;
  if (item.id && actor.items?.get?.(item.id)) {
    await actor.deleteEmbeddedDocuments('Item', [item.id]);
  }
  return { ok: true, flag };
}

export function buildMinorMagicChatHtml(
  itemName: string,
  flag: MinorMagicItemFlag,
  mode: 'use' | 'trap' | 'dismiss',
): string {
  const formLabel = MINOR_MAGIC_FORM_LABELS[flag.form];
  const lines = snapshotSummaryLines(flag.snapshot)
    .map((line) => `<li>${line}</li>`)
    .join('');
  if (mode === 'dismiss') {
    return `<div class="minor-magic-chat"><h4>Dismissed ${itemName}</h4><p>The ${formLabel} loses its magic and no longer counts against the creator’s limit. The burned Stone returns on the next Safe Haven Rest.</p></div>`;
  }
  const heading =
    mode === 'trap'
      ? `Trap: ${itemName}`
      : `Used ${itemName}`;
  const trapLine = mode === 'trap' && flag.trapTrigger
    ? `<p><em>Trigger:</em> ${flag.trapTrigger}</p>`
    : '';
  return `
    <div class="minor-magic-chat">
      <h4>${heading}</h4>
      <p>${formLabel} — stored ${flag.snapshot.powerName} (creator: ${flag.creatorName || 'unknown'}).</p>
      ${trapLine}
      <ul>${lines}</ul>
      <p><em>Prototype:</em> the stored Power is recorded. Full attack / trap resolution comes next. The item is spent and no longer counts against the creator’s limit. The burned Stone returns on the next Safe Haven Rest.</p>
    </div>
  `;
}

export async function useMinorMagicItem(
  actor: any,
  item: any,
  mode: 'use' | 'trap' = 'use',
  trapTrigger?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await consumeMinorMagicItem(actor, item, mode, trapTrigger);
  if (!result.ok) return result;
  const ChatMessage = (globalThis as any).ChatMessage;
  if (ChatMessage?.create) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
      content: buildMinorMagicChatHtml(item.name, result.flag, mode),
    });
  }
  return { ok: true };
}

export async function dismissMinorMagicItem(
  actor: any,
  item: any,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await consumeMinorMagicItem(actor, item, 'dismiss');
  if (!result.ok) return result;
  const ChatMessage = (globalThis as any).ChatMessage;
  if (ChatMessage?.create) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
      content: buildMinorMagicChatHtml(item.name, result.flag, 'dismiss'),
    });
  }
  return { ok: true };
}

export async function onMinorMagicItemDeleted(item: any): Promise<void> {
  const flag = readMinorMagicFlag(item);
  if (!flag || flag.released) return;
  const parent = item.parent;
  const creator = await resolveCreator(flag, parent);
  if (!creator) return;
  await releaseOnCreator(creator, item.id);
}

export async function restoreMinorMagicStonesOnSafeHaven(actor: any): Promise<Record<string, unknown>> {
  const { ledger, restoreByAttr } = applySafeHavenToLedger(getActorMinorMagicLedger(actor));
  const updates: Record<string, unknown> = {};
  for (const [attr, n] of Object.entries(restoreByAttr)) {
    if (n <= 0) continue;
    const pool = actor.system?.stonePools?.[attr];
    if (!pool) continue;
    const max = Math.max(0, Number(pool.max) || 0);
    const sustained = Math.max(0, Number(pool.sustained) || 0);
    const held = ledger.heldByAttr[attr] ?? 0;
    const effectiveMax = Math.max(0, max - sustained - held);
    const current = Math.max(0, Number(pool.current) || 0);
    updates[`system.stonePools.${attr}.current`] = Math.min(effectiveMax, current + n);
  }
  await setActorMinorMagicLedger(actor, ledger);
  return updates;
}

export function minorMagicSheetView(actor: any): {
  limit: number;
  held: number;
  remaining: number;
  items: Array<{
    id: string;
    name: string;
    formLabel: string;
    powerName: string;
    summary: string;
    actionCost: string;
  }>;
} {
  const ledger = getActorMinorMagicLedger(actor);
  const limit = minorMagicLimit(actor);
  const held = countHeldMinorMagicItems(ledger);
  const items = listMinorMagicItemsOnActor(actor).map((it) => {
    const flag = readMinorMagicFlag(it)!;
    return {
      id: it.id,
      name: it.name,
      formLabel: MINOR_MAGIC_FORM_LABELS[flag.form],
      powerName: flag.snapshot.powerName,
      summary: snapshotSummaryLines(flag.snapshot).slice(0, 3).join(' · '),
      actionCost: flag.snapshot.actionCost,
    };
  });
  return { limit, held, remaining: Math.max(0, limit - held), items };
}
