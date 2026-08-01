/**
 * Summon Bond combat enforcement (Players Guide Summons V2).
 *
 * - Multiple Bodies share one Summon Attack budget per Bond per Round.
 * - Bond Special applies at most once per Round.
 * - Summons cannot use Stones / Artifacts / unbought Powers.
 */

import { getRoundState, setRoundState, type RoundState } from '../combat/action-economy.js';
import type { SummonBondRecord } from './summon-bond-bind.js';

export type SummonBondRoundUsage = {
  bondId: string;
  attacksUsed: number;
  specialApplied: boolean;
  reactionsUsed: number;
};

function usageMap(rs: RoundState): Record<string, SummonBondRoundUsage> {
  const raw = (rs as any).summonBondUsage as Record<string, SummonBondRoundUsage> | undefined;
  return raw && typeof raw === 'object' ? { ...raw } : {};
}

export function getSummonBondUsage(ownerActor: Actor, combat: Combat | null, bondId: string): SummonBondRoundUsage {
  const rs = getRoundState(ownerActor, combat);
  const map = usageMap(rs);
  return map[bondId] ?? { bondId, attacksUsed: 0, specialApplied: false, reactionsUsed: 0 };
}

export function remainingSummonAttacks(
  ownerActor: Actor,
  combat: Combat | null,
  bond: SummonBondRecord,
): number {
  const used = getSummonBondUsage(ownerActor, combat, bond.id).attacksUsed;
  return Math.max(0, Math.floor(Number(bond.summonAttacks) || 1) - used);
}

export async function spendSummonAttack(
  ownerActor: Actor,
  combat: Combat | null,
  bond: SummonBondRecord,
): Promise<{ ok: boolean; reason?: string }> {
  const remaining = remainingSummonAttacks(ownerActor, combat, bond);
  if (remaining <= 0) {
    return { ok: false, reason: 'No Summon Attacks remaining for this Bond this Round.' };
  }
  const rs = getRoundState(ownerActor, combat);
  const map = usageMap(rs);
  const cur = map[bond.id] ?? { bondId: bond.id, attacksUsed: 0, specialApplied: false, reactionsUsed: 0 };
  map[bond.id] = { ...cur, attacksUsed: cur.attacksUsed + 1 };
  (rs as any).summonBondUsage = map;
  await setRoundState(ownerActor, rs);
  return { ok: true };
}

export async function tryApplySummonBondSpecial(
  ownerActor: Actor,
  combat: Combat | null,
  bond: SummonBondRecord,
): Promise<{ ok: boolean; reason?: string; specialKey?: string | null; specialValue?: number }> {
  if (!bond.specialKey || bond.specialValue <= 0) {
    return { ok: false, reason: 'Bond has no Special Access.' };
  }
  const cur = getSummonBondUsage(ownerActor, combat, bond.id);
  if (cur.specialApplied) {
    return { ok: false, reason: 'Summon Bond Special already applied this Round.' };
  }
  const rs = getRoundState(ownerActor, combat);
  const map = usageMap(rs);
  map[bond.id] = { ...cur, specialApplied: true };
  (rs as any).summonBondUsage = map;
  await setRoundState(ownerActor, rs);
  return { ok: true, specialKey: bond.specialKey, specialValue: bond.specialValue };
}

export async function spendSummonBondReaction(
  ownerActor: Actor,
  combat: Combat | null,
  bond: SummonBondRecord,
): Promise<{ ok: boolean; reason?: string }> {
  const cur = getSummonBondUsage(ownerActor, combat, bond.id);
  if (cur.reactionsUsed >= 1) {
    return { ok: false, reason: 'Summon Bond may use only one Reaction per Round.' };
  }
  const rs = getRoundState(ownerActor, combat);
  const map = usageMap(rs);
  map[bond.id] = { ...cur, reactionsUsed: cur.reactionsUsed + 1 };
  (rs as any).summonBondUsage = map;
  await setRoundState(ownerActor, rs);
  return { ok: true };
}

/** Summon actors have no stone pools, artifacts, or power shopping outside Bond purchases. */
export function summonActorMayUseStonesOrArtifacts(actor: any): boolean {
  if (!actor || actor.type !== 'summon') return true;
  return false;
}

export function bodyHasPurchasedPower(bond: SummonBondRecord, bodyId: string, templateId: string): boolean {
  const body = bond.bodies.find((b) => b.id === bodyId);
  if (!body) return false;
  return (body.powers || []).some((p) => p.templateId === templateId);
}

/** Extra bodies never increase the Bond attack budget by themselves. */
export function bondAttackBudgetFromBodies(bond: SummonBondRecord): number {
  return Math.max(1, Math.floor(Number(bond.summonAttacks) || 1));
}
