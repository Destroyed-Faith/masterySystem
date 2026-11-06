/**
 * Retire Summon Skill Dice Token purchases.
 *
 * Existing Bonds may have spent Tokens on Skill Dice. This migration:
 * - computes Tokens invested (`skillDicePurchases × skillDiceTokenCost`)
 * - credits them as `skillDiceTokenCredit` (unspent budget; not Artifact bonus)
 * - clears selectedSkills / skillDiceAlloc / skillDicePurchases
 * - is idempotent via per-bond `skillDiceRefundStamp`
 *
 * Does not alter other upgrades, combat stats, XP, or owner Professions.
 */

import { SUMMON_CAPS } from '../stones/summon-bond-rules.js';

export const SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG = 'summonSkillDiceRefunded' as const;

export interface SummonSkillDiceBondRefund {
  bondId: string;
  bondName: string;
  purchases: number;
  tokensCredited: number;
  alreadyRefunded: boolean;
  clearedSelectedSkills: string[];
  clearedAlloc: Record<string, number>;
}

export interface SummonSkillDiceRefundPlan {
  actorId: string;
  actorName: string;
  alreadyFullyRefunded: boolean;
  bonds: SummonSkillDiceBondRefund[];
  totalTokensCredited: number;
  review: string[];
  hasLegacyData: boolean;
}

function bondList(actor: any): any[] {
  const raw = actor?.system?.summonBonds;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') return Object.values(raw);
  return [];
}

function purchaseCount(bond: any): number {
  const spend = bond?.spend ?? bond?.upgradeSpend ?? {};
  return Math.max(0, Math.floor(Number(spend.skillDicePurchases) || 0));
}

function stampOf(bond: any): { tokens: number; at: string } | null {
  const s = bond?.skillDiceRefundStamp;
  if (!s || typeof s !== 'object') return null;
  return {
    tokens: Math.max(0, Math.floor(Number((s as any).tokens) || 0)),
    at: String((s as any).at || ''),
  };
}

export function planSummonSkillDiceRefund(actor: any): SummonSkillDiceRefundPlan {
  const bonds: SummonSkillDiceBondRefund[] = [];
  const review: string[] = [];
  let total = 0;
  let hasLegacy = false;
  let pending = false;

  for (const bond of bondList(actor)) {
    const id = String(bond?.id ?? bond?._id ?? '');
    const name = String(bond?.name ?? bond?.expression ?? id ?? 'Bond');
    const purchases = purchaseCount(bond);
    const selected = Array.isArray(bond?.selectedSkills) ? bond.selectedSkills.map(String) : [];
    const alloc =
      bond?.skillDiceAlloc && typeof bond.skillDiceAlloc === 'object'
        ? { ...(bond.skillDiceAlloc as Record<string, number>) }
        : {};
    const legacyHere =
      purchases > 0 || selected.length > 0 || Object.keys(alloc).some((k) => Number(alloc[k]) > 0);
    if (legacyHere) hasLegacy = true;

    const stamp = stampOf(bond);
    if (stamp) {
      bonds.push({
        bondId: id,
        bondName: name,
        purchases,
        tokensCredited: stamp.tokens,
        alreadyRefunded: true,
        clearedSelectedSkills: selected,
        clearedAlloc: alloc,
      });
      continue;
    }

    if (!legacyHere) {
      bonds.push({
        bondId: id,
        bondName: name,
        purchases: 0,
        tokensCredited: 0,
        alreadyRefunded: true,
        clearedSelectedSkills: [],
        clearedAlloc: {},
      });
      continue;
    }

    const tokens = purchases * SUMMON_CAPS.skillDiceTokenCost;
    // Policy: credit exactly the purchase cost. Allocated dice without purchases
    // still clear, but credit 0 and flag for GM review (no silent inventing budget).
    if (purchases <= 0 && (selected.length || Object.keys(alloc).length)) {
      review.push(
        `${name}: had selected Skills / alloc without skillDicePurchases — clearing without Token credit.`,
      );
    }
    pending = true;
    total += tokens;
    bonds.push({
      bondId: id,
      bondName: name,
      purchases,
      tokensCredited: tokens,
      alreadyRefunded: false,
      clearedSelectedSkills: selected,
      clearedAlloc: alloc,
    });
  }

  const actorFlag =
    actor?.getFlag?.('mastery-system', SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG) === true ||
    actor?.flags?.['mastery-system']?.[SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG] === true;

  return {
    actorId: String(actor?.id ?? ''),
    actorName: String(actor?.name ?? ''),
    alreadyFullyRefunded: actorFlag && !pending,
    bonds,
    totalTokensCredited: total,
    review,
    hasLegacyData: hasLegacy,
  };
}

/** Build actor update payload. Idempotent — stamped bonds are left alone. */
export function buildSummonSkillDiceRefundUpdate(
  actor: any,
  now: Date = new Date(),
): { ok: boolean; update: Record<string, unknown>; plan: SummonSkillDiceRefundPlan } {
  const plan = planSummonSkillDiceRefund(actor);
  if (plan.alreadyFullyRefunded || (!plan.hasLegacyData && plan.bonds.every((b) => b.alreadyRefunded))) {
    return {
      ok: true,
      update: {
        [`flags.mastery-system.${SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG}`]: true,
      },
      plan,
    };
  }

  const list = bondList(actor).map((bond: any) => {
    const id = String(bond?.id ?? bond?._id ?? '');
    const row = plan.bonds.find((b) => b.bondId === id);
    if (!row || row.alreadyRefunded) return { ...bond };
    const spend = { ...(bond.spend ?? bond.upgradeSpend ?? {}) };
    spend.skillDicePurchases = 0;
    const prevCredit = Math.max(0, Math.floor(Number(bond.skillDiceTokenCredit) || 0));
    return {
      ...bond,
      spend,
      selectedSkills: [],
      skillDiceAlloc: {},
      skillDiceTokenCredit: prevCredit + row.tokensCredited,
      skillDiceRefundStamp: {
        tokens: row.tokensCredited,
        at: now.toISOString(),
        purchases: row.purchases,
      },
    };
  });

  return {
    ok: true,
    update: {
      'system.summonBonds': list,
      [`flags.mastery-system.${SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG}`]: true,
    },
    plan,
  };
}

export async function applySummonSkillDiceRefund(actor: any): Promise<SummonSkillDiceRefundPlan> {
  const { update, plan } = buildSummonSkillDiceRefundUpdate(actor);
  if (actor?.update) await actor.update(update);
  return plan;
}

export async function runSummonSkillDiceRefundMigration(
  actors?: Iterable<any>,
): Promise<{ scanned: number; credited: number; review: string[] }> {
  const list =
    actors ??
    (((globalThis as any).game?.actors?.filter?.((a: any) => a?.type === 'character') as any[]) ||
      []);
  let scanned = 0;
  let credited = 0;
  const review: string[] = [];
  for (const actor of list) {
    scanned += 1;
    const plan = await applySummonSkillDiceRefund(actor);
    credited += plan.totalTokensCredited;
    for (const line of plan.review) review.push(`${plan.actorName}: ${line}`);
  }
  return { scanned, credited, review };
}
