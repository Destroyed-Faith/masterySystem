/**
 * Skill spend helpers for Epic Mastery Roll overlay.
 * DF 2026: Skill Spend is retired — option builders return empty / no-op.
 */

import { countMarginRaises } from '../dice/roll-handler.js';
import type { MasteryRollResult } from '../types/index.js';

export interface SkillSpendOption {
  amount: number;
  newTotal: number;
  success: boolean;
  raises: number;
  label: string;
}

export interface SkillSpendPacket {
  index: number;
  amount: number;
  clickable: boolean;
}

/** Distribute remaining skill pool across four MR-sized packets (skill sheet style). */
export function buildSkillSpendPackets(remainingPool: number, masteryRank: number): SkillSpendPacket[] {
  const MR = Math.max(1, Math.floor(masteryRank) || 1);
  let left = Math.max(0, remainingPool);
  const packets: SkillSpendPacket[] = [];

  for (let index = 0; index < 4; index++) {
    const amount = Math.min(MR, left);
    left -= amount;
    packets.push({
      index,
      amount,
      clickable: amount > 0,
    });
  }

  return packets;
}

export function sumSelectedPacketSpend(packets: SkillSpendPacket[], selected: boolean[]): number {
  return packets.reduce(
    (sum, pkt, i) => sum + (selected[i] && pkt.clickable ? pkt.amount : 0),
    0,
  );
}

/**
 * @deprecated DF 2026-10-23: post-roll Skill Spend is retired.
 * Always returns no options so Epic Roll never offers spend UI.
 */
export function getSkillSpendOptions(
  _actor: Actor,
  _skillKey: string,
  _rollResult: MasteryRollResult & { raiseOutcome?: string; stoneBonusRaises?: number },
  _baseModifier = 0,
): { remainingPool: number; skillRating: number; options: SkillSpendOption[] } {
  return { remainingPool: 0, skillRating: 0, options: [] };
}

/** @deprecated DF 2026 — Skill Spend retired; does nothing. */
export async function applySkillSpendToActor(
  _actor: Actor,
  _skillKey: string,
  _amount: number,
): Promise<void> {
  console.info('Mastery System | applySkillSpendToActor is deprecated (DF 2026: Skill Spend retired).');
}
export function totalsAfterSkillSpend(
  rollResult: MasteryRollResult,
  spendAmount: number,
  baseModifier = 0,
): { total: number; success: boolean; raises: number; skill: number } {
  const diceSum = rollResult.kept.reduce((sum, die) => sum + die, 0);
  const skill = spendAmount;
  const total = diceSum + skill + baseModifier;
  let success = rollResult.success;
  let raises = rollResult.raises ?? 0;
  if (rollResult.tn > 0) {
    success = total >= rollResult.tn;
    raises = success ? countMarginRaises(total, rollResult.tn) : 0;
    const stoneBonusRaises = Math.max(0, rollResult.stoneBonusRaises ?? 0);
    if (success && rollResult.raiseOutcome === 'full' && stoneBonusRaises > 0) {
      raises += stoneBonusRaises;
    }
  }
  return { total, success, raises, skill };
}
