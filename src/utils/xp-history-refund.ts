/**
 * Cascade refund of one XP-history spend row.
 *
 * Drops the live value from current down to the row's `from` (floored at the
 * creation baseline) and refunds the *current* cost table, not the stored amount.
 *
 * Artifact rows prefer the world evolution node's level over a stale embed field.
 * When history shows a paid upgrade but live level is already at/below `from`
 * (desync / orphan spend), GMs can still credit the XP without a tree walk.
 */

import {
  applyAttributePendingChanges,
  applyPowerPendingChanges,
  getAttributeXpBaseline,
} from '../progression/progression-hub-actions.js';
import { downgradeArtifactForActor } from '../artifacts/artifact-evolution-actions.js';
import { attributeBandCost, artifactLevelXpCost, powerLevelCost } from './constants.js';
import { getPowerMinLevel } from './power-xp-refund.js';
import { resolveEffectiveArtifactLevel } from './artifact-evolution-repair.js';
import { appendXpHistory, currentXpUser, type XpHistoryEntry } from './xp-history.js';
import type { XpHistoryRow } from './xp-history.js';

const REFUNDABLE_CATEGORIES = new Set(['attribute', 'power', 'artifact']);

export interface HistoryRefundPlan {
  refundable: boolean;
  reason?: string;
  category: string;
  key: string;
  label: string;
  current: number;
  target: number;
  floor: number;
  pending: number;
  refundXp: number;
  /** Artifact XP was spent but live evolution no longer reflects it. */
  orphan?: boolean;
}

export function liveRefundXp(category: string, current: number, target: number): number {
  if (current <= target) return 0;
  if (category === 'artifact') {
    let sum = 0;
    for (let v = current; v > target; v--) sum += artifactLevelXpCost(v);
    return sum;
  }
  let sum = 0;
  for (let v = current; v > target; v--) {
    sum += category === 'power' ? powerLevelCost(v) : attributeBandCost(v);
  }
  return sum;
}

function resolveArtifactItem(actor: any, key: string, label: string): any {
  const items = actor?.items;
  if (!items) return undefined;
  if (key && typeof items.get === 'function') {
    const byId = items.get(key);
    if (byId) return byId;
  }
  const list: any[] = typeof items.filter === 'function' ? Array.from(items.filter((i: any) => i.type === 'artifact')) : [];
  if (key) {
    const byId = list.find(i => i.id === key);
    if (byId) return byId;
  }
  if (label) {
    return list.find(i => String(i.name || '') === label);
  }
  return undefined;
}

function readCurrentAndFloor(
  actor: any,
  category: string,
  key: string,
  label: string,
): { current: number; floor: number; resolvedKey: string } | { error: string } {
  if (category === 'attribute') {
    const current = Number(actor?.system?.attributes?.[key]?.value ?? NaN);
    if (!Number.isFinite(current)) return { error: 'Attribute not found.' };
    return { current, floor: getAttributeXpBaseline(actor, key), resolvedKey: key };
  }
  if (category === 'power') {
    const item = actor?.items?.get?.(key);
    if (!item) return { error: 'Power not found.' };
    const current = Number((item.system as any)?.level ?? 1) || 1;
    return { current, floor: getPowerMinLevel(item), resolvedKey: key };
  }
  if (category === 'artifact') {
    const item = resolveArtifactItem(actor, key, label);
    if (!item) return { error: 'Artifact not found.' };
    const current = resolveEffectiveArtifactLevel(item);
    return { current, floor: 1, resolvedKey: String(item.id || key) };
  }
  return { error: 'Not a spend that can be refunded.' };
}

export function planHistoryRefund(
  actor: any,
  row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>,
): HistoryRefundPlan {
  const category = String(row.category || '');
  const key = String(row.key || '').trim();
  const label = String(row.what || key || category);
  const base: HistoryRefundPlan = {
    refundable: false,
    category,
    key,
    label,
    current: 0,
    target: 0,
    floor: 0,
    pending: 0,
    refundXp: 0,
  };

  if (row.kind !== 'spend') {
    return { ...base, reason: 'Only spend rows can be refunded.' };
  }
  if (!REFUNDABLE_CATEGORIES.has(category)) {
    return { ...base, reason: 'This category cannot be refunded from history.' };
  }
  if (!key && category !== 'artifact') {
    return { ...base, reason: 'History row is missing its target key.' };
  }
  const from = Number(row.from);
  if (!Number.isFinite(from)) {
    return { ...base, reason: 'History row is missing its from-value.' };
  }

  const nameHint = String(row.what || '').replace(/\s+\d+\s*→\s*\d+\s*$/, '').trim();
  const read = readCurrentAndFloor(actor, category, key, nameHint);
  if ('error' in read) {
    return { ...base, reason: read.error };
  }

  const target = Math.max(from, read.floor);
  const pending = target - read.current;
  const refundXp = liveRefundXp(category, read.current, target);
  if (read.current <= target) {
    // Orphan artifact spend: XP paid, but live evolution is already at/below `from`.
    if (category === 'artifact') {
      const to = Number(row.to);
      if (Number.isFinite(to) && to > read.current) {
        return {
          refundable: true,
          orphan: true,
          category,
          key: read.resolvedKey,
          label,
          current: read.current,
          target: read.current,
          floor: read.floor,
          pending: 0,
          refundXp: liveRefundXp('artifact', to, read.current),
        };
      }
    }
    return {
      ...base,
      key: read.resolvedKey,
      current: read.current,
      target,
      floor: read.floor,
      pending: 0,
      refundXp: 0,
      reason: 'This step is no longer in effect.',
    };
  }

  return {
    refundable: true,
    category,
    key: read.resolvedKey,
    label,
    current: read.current,
    target,
    floor: read.floor,
    pending,
    refundXp,
  };
}

export function canRefundHistoryRow(
  actor: any,
  row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>,
): boolean {
  return planHistoryRefund(actor, row).refundable;
}

async function creditOrphanArtifactXp(
  actor: any,
  plan: HistoryRefundPlan,
): Promise<{ ok: boolean; error?: string }> {
  const refund = Math.max(0, Math.floor(plan.refundXp || 0));
  if (refund <= 0) return { ok: true };
  const sys = (actor.system as any) || {};
  const free = Math.max(0, Number(sys.points?.xpFree) || 0);
  const regular = Math.max(0, Number(sys.points?.xp) || 0);
  const freeEarned = Number(sys.xp?.freeEarned ?? 0) || 0;
  const totalEarned = Number(sys.xp?.totalEarned ?? 0) || 0;
  const totalSpent = Number(sys.xp?.totalSpent ?? 0) || 0;
  const freeSpent = Number(sys.xp?.freeSpent ?? 0) || 0;
  const before = { available: free + regular, totalEarned, totalSpent };
  const toFree = Math.max(0, Math.min(refund, freeEarned - free));
  const toReg = Math.max(0, refund - toFree);
  const nextSpent = Math.max(0, totalSpent - toReg);
  const user = currentXpUser();
  const entry: XpHistoryEntry = {
    ts: Date.now(),
    userId: user.userId,
    userName: user.userName,
    kind: 'adjust',
    category: 'artifact',
    amount: refund,
    note: `refund: orphan ${plan.label}`,
    details: {
      artifactId: plan.key,
      orphan: true,
      refund: true,
      from: plan.current,
      to: plan.current,
    },
    before,
    after: {
      available: free + regular + refund,
      totalEarned,
      totalSpent: nextSpent,
    },
  };
  await actor.update({
    'system.points.xpFree': free + toFree,
    'system.points.xp': regular + toReg,
    'system.xp.totalSpent': nextSpent,
    'system.xp.freeSpent': Math.max(0, freeSpent - toFree),
    'system.xp.history': appendXpHistory(actor, [entry]),
  });
  return { ok: true };
}

export async function refundHistoryRow(
  actor: any,
  row: Pick<XpHistoryRow, 'kind' | 'category' | 'key' | 'from' | 'to' | 'what'>,
): Promise<{ ok: boolean; error?: string; plan?: HistoryRefundPlan }> {
  const isGM = Boolean((globalThis as any).game?.user?.isGM);
  if (!isGM) {
    return { ok: false, error: 'Only the GM can refund XP history steps.' };
  }

  const plan = planHistoryRefund(actor, row);
  if (!plan.refundable) {
    return { ok: false, error: plan.reason || 'This step cannot be refunded.', plan };
  }

  if (plan.category === 'attribute') {
    const res = await applyAttributePendingChanges(actor, { [plan.key]: plan.pending });
    return { ok: res.ok, error: res.error, plan };
  }
  if (plan.category === 'power') {
    const res = await applyPowerPendingChanges(actor, { [plan.key]: plan.pending });
    return { ok: res.ok, error: res.error, plan };
  }
  if (plan.category === 'artifact') {
    if (plan.orphan) {
      const res = await creditOrphanArtifactXp(actor, plan);
      return { ok: res.ok, error: res.error, plan };
    }
    const res = await downgradeArtifactForActor(actor, plan.key, plan.target);
    return { ok: res.ok, error: res.error, plan };
  }
  return { ok: false, error: 'Unsupported refund category.', plan };
}
