/**
 * Remove Scar — Daily-Reset-scoped cumulative Seal payment.
 *
 * Each unresolved Tier Seals 1 / 2 / 4 / 8 Vitality Stones (T2=3, T3=7, T4=15).
 * A Tier already resolved since the last Safe Haven Rest is not paid or
 * resolved again. Artifact Support pre-fills its printed Tier; every lower
 * unresolved Tier stays payable. Colorless Stones cannot pay this cost.
 * Stones become Sealed (not Exhausted / Burned). Each newly resolved Tier
 * recovers 1 Scarred Health Bar.
 */

import { getActionEconomyActor, type AttributeKey } from '../combat/action-economy.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { distanceBetweenTokensMeters, tokenIsHostileTo } from '../combat/threatened-ranged.js';

export const REMOVE_SCAR_POWER_ID = 'vitality.removeScar';
export const REMOVE_SCAR_RESOLVED_FLAG = 'removeScarResolvedMaxTier';

/** Per-tier Seal cost: T1=1, T2=2, T3=4, T4=8. */
export const REMOVE_SCAR_TIER_SEAL_COST = [0, 1, 2, 4, 8] as const;

export interface RemoveScarPayment {
  unpaidTiers: number[];
  sealCost: number;
  barsRecovered: number;
  newResolvedMax: number;
}

function clampTier(value: unknown): number {
  return Math.max(0, Math.min(4, Math.floor(Number(value) || 0)));
}

export function getRemoveScarResolvedMaxTier(actor: any): number {
  const owner = getActionEconomyActor(actor) ?? actor;
  return clampTier(owner?.getFlag?.('mastery-system', REMOVE_SCAR_RESOLVED_FLAG));
}

export async function setRemoveScarResolvedMaxTier(actor: any, tier: number): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const next = clampTier(tier);
  if (next <= 0) {
    await owner?.unsetFlag?.('mastery-system', REMOVE_SCAR_RESOLVED_FLAG);
    return;
  }
  await owner?.setFlag?.('mastery-system', REMOVE_SCAR_RESOLVED_FLAG, next);
}

export async function clearRemoveScarResolvedTiers(actor: any): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  if (owner?.getFlag?.('mastery-system', REMOVE_SCAR_RESOLVED_FLAG) == null) return;
  await owner?.unsetFlag?.('mastery-system', REMOVE_SCAR_RESOLVED_FLAG);
}

/**
 * Unpaid Tiers in 1..target that are not already resolved and not the
 * Support-prefilled Tier. Support still counts as newly resolved for bars.
 */
export function computeRemoveScarPayment(
  resolvedMax: number,
  targetTier: number,
  supportPrefillTier = 0,
): RemoveScarPayment {
  const resolved = clampTier(resolvedMax);
  const target = clampTier(targetTier);
  const support = clampTier(supportPrefillTier);
  const unpaidTiers: number[] = [];
  let sealCost = 0;
  let barsRecovered = 0;
  for (let t = 1; t <= target; t += 1) {
    if (t <= resolved) continue;
    barsRecovered += 1;
    if (t === support) continue;
    unpaidTiers.push(t);
    sealCost += REMOVE_SCAR_TIER_SEAL_COST[t] ?? 0;
  }
  return {
    unpaidTiers,
    sealCost,
    barsRecovered,
    newResolvedMax: Math.max(resolved, target),
  };
}

/** Next activation target: Support pulls in all lower unpaid Tiers; otherwise the next unresolved Tier. */
export function inferRemoveScarTargetTier(resolvedMax: number, supportPrefillTier = 0): number {
  const resolved = clampTier(resolvedMax);
  const support = clampTier(supportPrefillTier);
  if (resolved >= 4) return 4;
  if (support > resolved) return support;
  return resolved + 1;
}

export function countScarredHealthBars(actor: any): number {
  const bars: any[] = Array.isArray(actor?.system?.health?.bars) ? actor.system.health.bars : [];
  return bars.filter((b) => (Number(b?.current) || 0) === 0).length;
}

/** Restore up to `count` most-recent Scarred bars. Returns the actor update payload. */
export function buildRecoverScarredBarUpdates(actor: any, count: number): Record<string, unknown> {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const updates: Record<string, unknown> = {};
  if (n <= 0) return updates;
  const system: any = actor?.system ?? {};
  const src: any[] = Array.isArray(system?.health?.bars) ? system.health.bars : [];
  if (!src.length) return updates;
  const bars = src.map((b: any) => ({ ...b }));
  let recovered = 0;
  for (let i = bars.length - 1; i >= 0 && recovered < n; i -= 1) {
    if ((Number(bars[i]?.current) || 0) === 0) {
      bars[i] = { ...bars[i], current: Number(bars[i]?.max) || 0 };
      recovered += 1;
    }
  }
  if (recovered <= 0) return updates;
  const scarredCount = bars.filter((b: any) => (Number(b?.current) || 0) === 0).length;
  const newActive = bars.findIndex((b: any) => (Number(b?.current) || 0) > 0);
  updates['system.health.bars'] = bars;
  updates['system.health.currentBar'] = Math.max(0, newActive);
  if (Object.prototype.hasOwnProperty.call(system?.health ?? {}, 'scarred')) {
    updates['system.health.scarred'] = scarredCount;
  }
  return updates;
}

export async function recoverScarredBars(actor: any, count: number): Promise<number> {
  const updates = buildRecoverScarredBarUpdates(actor, count);
  if (!Object.keys(updates).length) return 0;
  const before = countScarredHealthBars(actor);
  await actor?.update?.(updates);
  return Math.max(0, before - countScarredHealthBars(actor));
}

export async function sealVitalityStones(actor: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  const owner = getActionEconomyActor(actor) ?? actor;
  if (n <= 0) return true;
  const pool = owner?.system?.stonePools?.vitality ?? {};
  const current = Math.max(0, Math.floor(Number(pool.current) || 0));
  if (current < n) return false;
  const sealedNow = Math.max(0, Math.floor(Number(pool.sealed) || 0));
  await owner?.update?.({
    'system.stonePools.vitality.current': current - n,
    'system.stonePools.vitality.sealed': sealedNow + n,
  });
  return true;
}

function echoArtifactKeyFromItem(item: any): string {
  const flagged = item?.getFlag?.('mastery-system', 'echoArtifactKey');
  if (typeof flagged === 'string' && flagged.trim()) return flagged.trim();
  return '';
}

export function titanScarsArtifactLevel(actor: any): number {
  if (!actor?.items) return 0;
  let best = 0;
  for (const item of Array.from(actor.items) as any[]) {
    if (item?.type !== 'artifact') continue;
    const key = echoArtifactKeyFromItem(item);
    const named = /titan scars/i.test(String(item?.name || ''));
    if (key !== 'titanScars' && !named) continue;
    const sys = item.system ?? {};
    const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
    if (level > best) best = level;
  }
  return best;
}

export function titanScarsAllowsTouchRemoveScar(actor: any): boolean {
  return titanScarsArtifactLevel(actor) >= 9;
}

function listTouchedWillingActors(caster: any): any[] {
  const out: any[] = [caster];
  if (typeof canvas === 'undefined') return out;
  try {
    const selfToken = getPrimaryTokenForActor(caster);
    if (!selfToken) return out;
    const seen = new Set<string>([String(caster?.id ?? '')]);
    const touchMeters = Math.max(2, Number((canvas as any)?.grid?.distance ?? 2) * 1.08);
    for (const token of ((canvas as any).tokens?.placeables ?? []) as any[]) {
      const other = token?.actor;
      if (!other || token.id === selfToken.id) continue;
      const id = String(other.id ?? '');
      if (!id || seen.has(id)) continue;
      if (tokenIsHostileTo(selfToken, token) || tokenIsHostileTo(token, selfToken)) continue;
      const dist = distanceBetweenTokensMeters(selfToken, token);
      if (!Number.isFinite(dist) || dist > touchMeters) continue;
      seen.add(id);
      out.push(other);
    }
  } catch {
    /* canvas / distance helpers unavailable */
  }
  return out;
}

/** AL9+ Titan Scars: self or one touched willing creature. Tests / no Dialog stay on self. */
export async function resolveRemoveScarHealTarget(caster: any): Promise<any> {
  if (!titanScarsAllowsTouchRemoveScar(caster)) return caster;
  const candidates = listTouchedWillingActors(caster);
  if (candidates.length <= 1) return caster;
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.prompt !== 'function') return caster;
  try {
    const options = candidates
      .map((a: any) => {
        const self = a === caster || String(a?.id) === String(caster?.id);
        return `<option value="${String(a.id)}">${String(a.name || 'Unknown')}${self ? ' (self)' : ''}</option>`;
      })
      .join('');
    const id = await DialogV2.prompt({
      window: { title: 'Remove Scar' },
      content: `<form class="mastery-dialog-form"><label class="md-label">Heal</label><select name="target" class="md-select">${options}</select></form>`,
      ok: {
        label: 'Heal',
        callback: (_event: unknown, button: any) => String(button?.form?.elements?.target?.value || ''),
      },
    });
    return candidates.find((a: any) => String(a.id) === String(id)) || caster;
  } catch {
    return caster;
  }
}

export async function applyRemoveScarEffect(
  actor: any,
  targetTier: number,
  healTarget?: any,
): Promise<RemoveScarPayment> {
  const resolved = getRemoveScarResolvedMaxTier(actor);
  const payment = computeRemoveScarPayment(resolved, targetTier, 0);
  const target = healTarget ?? actor;
  if (payment.barsRecovered > 0) {
    const restored = await recoverScarredBars(target, payment.barsRecovered);
    if (restored <= 0 && target !== actor) {
      ui.notifications?.warn(`${target?.name ?? 'Target'} has no Scarred Health Bar to recover.`);
    } else if (restored <= 0) {
      ui.notifications?.warn(`${actor?.name ?? 'Actor'} has no Scarred Health Bar to recover.`);
    }
  }
  if (payment.newResolvedMax > resolved) {
    await setRemoveScarResolvedMaxTier(actor, payment.newResolvedMax);
  }
  return payment;
}

export async function payAndApplyRemoveScar(
  actor: any,
  opts: {
    colorlessSpent?: number;
    supportPrefillTier?: number;
    healTarget?: any;
    skipTargetPrompt?: boolean;
    /** When set, activate this Tier instead of inferring the next / Support target. */
    targetTier?: number;
  } = {},
): Promise<boolean> {
  const colorlessSpent = Math.max(0, Math.floor(Number(opts.colorlessSpent) || 0));
  if (colorlessSpent > 0) {
    ui.notifications?.warn('Colorless Stones cannot pay Remove Scar.');
    return false;
  }
  const owner = getActionEconomyActor(actor) ?? actor;
  const resolved = getRemoveScarResolvedMaxTier(owner);
  const support = clampTier(opts.supportPrefillTier);
  const targetTier =
    opts.targetTier != null ? clampTier(opts.targetTier) : inferRemoveScarTargetTier(resolved, support);
  const payment = computeRemoveScarPayment(resolved, targetTier, support);
  if (payment.barsRecovered <= 0 && payment.sealCost <= 0) {
    ui.notifications?.warn(`${owner?.name ?? 'Actor'}: Remove Scar has no unresolved Tiers since the last Daily Reset.`);
    return false;
  }
  const current = Math.max(0, Math.floor(Number(owner?.system?.stonePools?.vitality?.current) || 0));
  if (current < payment.sealCost) {
    ui.notifications?.warn(
      `Not enough Vitality stones to Seal! Need ${payment.sealCost}, have ${current}`,
    );
    return false;
  }
  const healTarget =
    opts.healTarget ??
    (opts.skipTargetPrompt ? owner : await resolveRemoveScarHealTarget(owner));
  if (!(await sealVitalityStones(owner, payment.sealCost))) {
    ui.notifications?.warn('Failed to Seal Vitality Stones for Remove Scar.');
    return false;
  }
  const restored = payment.barsRecovered > 0 ? await recoverScarredBars(healTarget, payment.barsRecovered) : 0;
  if (payment.newResolvedMax > resolved) {
    await setRemoveScarResolvedMaxTier(owner, payment.newResolvedMax);
  }
  const sealedNote = payment.sealCost > 0 ? `${payment.sealCost} Vitality Stone(s) Sealed` : 'no Seal (Support)';
  ui.notifications?.info(
    `${owner?.name}: Remove Scar T${targetTier} — recovered ${restored} Scarred Health Bar(s); ${sealedNote} until Safe Haven Rest.`,
  );
  return true;
}

/** Attribute this power may spend. Colorless is never legal. */
export function removeScarSpendableAttributes(): AttributeKey[] {
  return ['vitality'];
}
