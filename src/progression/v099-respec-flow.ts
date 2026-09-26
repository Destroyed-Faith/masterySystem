/**
 * Pure rules for the two-step v0.9.9 migration dialog:
 * starting package gate, Final +/- spending, and per-slot Stone placement.
 */

import {
  ATTRIBUTE_ABBREV,
  ATTRIBUTE_KEYS,
  buildStoneProgressionSlots,
  canConvertToPermanentColorless,
  canPlacePermanentStone,
  compressedAttributeStepCost,
  compressedAttributeXpBetween,
  emptyAssignments,
  permanentColorlessCount,
  permanentStonesFromLifetimeXp,
  readAssignments,
  type AttributeKeyName,
} from './v099-rules.js';

export interface StartingPackageStatus {
  fours: number;
  threes: number;
  twos: number;
  valid: boolean;
  summary: string;
}

/** Live check for the Starting column. Exactly two 4s, two 3s, three 2s. */
export function describeStartingPackage(values: Record<string, number>): StartingPackageStatus {
  const counts = { 2: 0, 3: 0, 4: 0, other: 0 };
  for (const key of ATTRIBUTE_KEYS) {
    const v = Math.floor(Number(values[key]) || 0);
    if (v === 2 || v === 3 || v === 4) counts[v] += 1;
    else counts.other += 1;
  }
  const valid = counts[4] === 2 && counts[3] === 2 && counts[2] === 3 && counts.other === 0;
  return {
    fours: counts[4],
    threes: counts[3],
    twos: counts[2],
    valid,
    summary: valid
      ? 'Starting package is ready: two 4s, two 3s, three 2s.'
      : `Need two 4s, two 3s and three 2s. Current: ${counts[4]}×4, ${counts[3]}×3, ${counts[2]}×2.`,
  };
}

export interface FinalAdjustRow {
  key: AttributeKeyName;
  value: number;
  canIncrease: boolean;
  canDecrease: boolean;
  increaseCost: number;
}

export interface FinalAdjust {
  spent: number;
  remaining: number;
  overBudget: boolean;
  rows: FinalAdjustRow[];
}

/** What + and − may do on Final after Starting has been applied. */
export function planFinalAttributes(
  starting: Record<string, number>,
  finalValues: Record<string, number>,
  budget: number,
): FinalAdjust {
  const purse = Math.max(0, Math.floor(Number(budget) || 0));
  const spent = compressedAttributeXpBetween(starting, finalValues);
  const overBudget = !Number.isFinite(spent) || spent > purse;
  const remaining = Number.isFinite(spent) ? purse - spent : purse;
  const rows: FinalAdjustRow[] = ATTRIBUTE_KEYS.map((key) => {
    const floor = Math.max(0, Math.floor(Number(starting[key]) || 0));
    const value = Math.max(floor, Math.floor(Number(finalValues[key]) || 0));
    const increaseCost = value >= 40 ? 0 : compressedAttributeStepCost(value + 1);
    return {
      key,
      value,
      canDecrease: value > floor,
      canIncrease: !overBudget && value < 40 && increaseCost > 0 && remaining >= increaseCost,
      increaseCost,
    };
  });
  return { spent: Number.isFinite(spent) ? spent : 0, remaining, overBudget, rows };
}

export type StoneSlotChoice = string | null;

/** Unlocked migration slots: two Start boxes, then one box per 20 Lifetime XP. */
export function migrationStoneSlotCount(lifetimeXp: number): number {
  return permanentStonesFromLifetimeXp(lifetimeXp);
}

export function migrationStoneSlotLabel(index: number): string {
  const i = Math.max(0, Math.floor(index));
  if (i < 2) return i === 0 ? 'Start' : 'Start';
  return String((i - 1) * 20);
}

export function emptyStoneSlotOrder(lifetimeXp: number): StoneSlotChoice[] {
  return Array.from({ length: migrationStoneSlotCount(lifetimeXp) }, () => null);
}

export interface StoneSlotProgress {
  assignments: Record<AttributeKeyName, number>;
  colorless: number;
  filled: number;
  openIndexes: number[];
}

export function isColorlessSlot(choice: string | null | undefined): boolean {
  const value = choice == null ? '' : String(choice);
  return value === 'colorless' || value.startsWith('colorless#');
}

export function stoneSlotProgress(order: readonly (string | null)[]): StoneSlotProgress {
  const assignments = emptyAssignments();
  let colorlessBoxes = 0;
  let filled = 0;
  const openIndexes: number[] = [];
  order.forEach((raw, index) => {
    const choice = raw == null ? '' : String(raw);
    if (!choice) {
      openIndexes.push(index);
      return;
    }
    filled += 1;
    if (isColorlessSlot(choice)) {
      colorlessBoxes += 1;
      return;
    }
    if (ATTRIBUTE_KEYS.includes(choice as AttributeKeyName)) {
      assignments[choice as AttributeKeyName] += 1;
    }
  });
  return { assignments, colorless: Math.floor(colorlessBoxes / 2), filled, openIndexes };
}

export interface StoneSlotTally {
  ok: boolean;
  reason?: string;
  assignments: Record<AttributeKeyName, number>;
  colorless: number;
}

/** A finished slot list: every box filled, Colorless boxes in pairs. */
export function tallyStoneSlotOrder(order: readonly (string | null)[]): StoneSlotTally {
  const assignments = emptyAssignments();
  const pairs = new Map<string, number>();
  for (const raw of order) {
    const choice = raw == null ? '' : String(raw);
    if (!choice) {
      return { ok: false, reason: 'Assign every unlocked Stone first.', assignments, colorless: 0 };
    }
    if (isColorlessSlot(choice)) {
      pairs.set(choice, (pairs.get(choice) ?? 0) + 1);
      continue;
    }
    if (!ATTRIBUTE_KEYS.includes(choice as AttributeKeyName)) {
      return { ok: false, reason: `Unknown Stone target: ${choice}.`, assignments, colorless: 0 };
    }
    assignments[choice as AttributeKeyName] += 1;
  }
  let colorless = 0;
  for (const count of pairs.values()) {
    if (count !== 2) {
      return {
        ok: false,
        reason: 'Permanent Colorless Stones use two boxes each.',
        assignments,
        colorless: 0,
      };
    }
    colorless += 1;
  }
  return { ok: true, assignments, colorless };
}

export interface StonePlacementOptions {
  attributes: AttributeKeyName[];
  colorless: boolean;
  colorlessReason: string;
}

export function stonePlacementOptions(
  order: readonly (string | null)[],
  storedRank = 1,
  lifetimeXp?: number | null,
): StonePlacementOptions {
  const progress = stoneSlotProgress(order);
  const total = order.length;
  const attributes = ATTRIBUTE_KEYS.filter(
    (key) =>
      canPlacePermanentStone({
        attribute: key,
        assignments: progress.assignments,
        totalPermanent: total,
        storedRank,
        permanentColorless: progress.colorless,
        lifetimeXp,
      }).ok,
  );
  const convert = canConvertToPermanentColorless({
    assignments: progress.assignments,
    totalPermanent: total,
    permanentColorless: progress.colorless,
    storedRank,
    lifetimeXp,
  });
  const anotherOpen = progress.openIndexes.length >= 2;
  return {
    attributes,
    colorless: convert.ok && anotherOpen,
    colorlessReason: !anotherOpen
      ? 'Combining into a Permanent Colorless Stone needs a second open box.'
      : convert.reason || '',
  };
}

/** Slot list for an actor. A stored order wins; otherwise the current sheet order. */
export function stoneOrderForActor(system: any, lifetimeXp: number): (string | null)[] {
  const total = permanentStonesFromLifetimeXp(lifetimeXp);
  const stored = system?.progression?.stoneSlotOrder;
  if (Array.isArray(stored)) {
    const next = stored.slice(0, total).map((entry) => {
      if (entry == null || entry === '') return null;
      return String(entry);
    });
    while (next.length < total) next.push(null);
    return next;
  }
  const span = Math.max(20, Math.ceil(Math.max(0, lifetimeXp) / 20) * 20);
  return buildStoneProgressionSlots(
    lifetimeXp,
    readAssignments(system),
    span,
    permanentColorlessCount(system),
  )
    .filter((slot) => slot.unlocked)
    .map((slot) => slot.attribute);
}

/** Actor update that keeps assignments, pools and the clicked slot order together. */
export function stoneOrderActorUpdate(
  system: any,
  order: readonly (string | null)[],
): Record<string, unknown> {
  const progress = stoneSlotProgress(order);
  const prev = readAssignments(system);
  const updates: Record<string, unknown> = {
    'system.progression.stoneSlotOrder': order.map((entry) => entry ?? null),
  };
  for (const key of ATTRIBUTE_KEYS) {
    const next = progress.assignments[key];
    if (next === prev[key]) continue;
    const pool = system?.stonePools?.[key] ?? {};
    const current = Math.max(0, Math.floor(Number(pool.current) || 0));
    updates[`system.progression.stoneAssignments.${key}`] = next;
    updates[`system.stonePools.${key}.max`] = next;
    if (next === 0) {
      updates[`system.stonePools.${key}.current`] = 0;
      updates[`system.stonePools.${key}.sustained`] = 0;
      updates[`system.stonePools.${key}.sealed`] = 0;
      updates[`system.stonePools.${key}.burned`] = 0;
    } else {
      updates[`system.stonePools.${key}.current`] = Math.max(0, Math.min(next, current + (next - prev[key])));
    }
  }
  const prevColorless = permanentColorlessCount(system);
  if (progress.colorless !== prevColorless) {
    const pool = system?.stonePools?.colorless ?? {};
    const current = Math.max(0, Math.floor(Number(pool.current) || 0));
    updates['system.progression.permanentColorless'] = progress.colorless;
    updates['system.stonePools.colorless.max'] = progress.colorless;
    if (progress.colorless === 0) {
      updates['system.stonePools.colorless.current'] = 0;
      updates['system.stonePools.colorless.sustained'] = 0;
      updates['system.stonePools.colorless.sealed'] = 0;
      updates['system.stonePools.colorless.burned'] = 0;
    } else {
      updates['system.stonePools.colorless.current'] = Math.max(
        0,
        Math.min(progress.colorless, current + (progress.colorless - prevColorless)),
      );
    }
  }
  return updates;
}

/** Drop one box. A Permanent Colorless pair drops both boxes. */
export function releaseStoneSlot(order: readonly (string | null)[], index: number): (string | null)[] {
  const next = order.map((entry) => (entry == null || entry === '' ? null : String(entry)));
  if (index < 0 || index >= next.length) return next;
  const current = next[index];
  if (isColorlessSlot(current)) {
    for (let i = 0; i < next.length; i += 1) {
      if (next[i] === current) next[i] = null;
    }
  } else {
    next[index] = null;
  }
  return next;
}

/** Every earned box becomes empty again. Lifetime XP is untouched. */
export function releaseAllStoneSlots(order: readonly (string | null)[]): (string | null)[] {
  return order.map(() => null);
}

/**
 * GM unblock: Attribute pools and Permanent Colorless return to Ready.
 * Assignment is unchanged. Exhausted, Sustained, Sealed and Burned are cleared.
 */
export function unblockStonePoolsUpdate(system: any): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  const keys = [...ATTRIBUTE_KEYS, 'colorless'];
  for (const key of keys) {
    const pool = system?.stonePools?.[key];
    if (!pool) continue;
    const max = Math.max(0, Math.floor(Number(pool.max) || 0));
    updates[`system.stonePools.${key}.current`] = max;
    updates[`system.stonePools.${key}.sustained`] = 0;
    updates[`system.stonePools.${key}.sealed`] = 0;
    updates[`system.stonePools.${key}.burned`] = 0;
  }
  return updates;
}

export function slotAbbrev(choice: string | null): string {
  if (!choice) return '';
  if (isColorlessSlot(choice)) return 'CLS';
  return ATTRIBUTE_ABBREV[choice as AttributeKeyName] ?? choice.slice(0, 3).toUpperCase();
}
