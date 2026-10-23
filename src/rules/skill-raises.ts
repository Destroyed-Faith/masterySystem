/**
 * Canonical Skill Raise allowances (DF Players Guide 2026-10-23).
 * Paid Raises add +4 TN each; Free Raises add 0 TN.
 */

export const SKILL_RAISE_EFFECTS = [
  'scope',
  'speed',
  'quality',
  'efficiency',
  'insight',
  'safety',
] as const;

export type SkillRaiseEffect = (typeof SKILL_RAISE_EFFECTS)[number];

export interface SkillRaiseAllowance {
  maxPaid: number;
  maxFree: number;
  maxTotal: number;
}

const ALLOWANCE: Record<number, SkillRaiseAllowance> = {
  0: { maxPaid: 0, maxFree: 0, maxTotal: 0 },
  1: { maxPaid: 1, maxFree: 0, maxTotal: 1 },
  2: { maxPaid: 2, maxFree: 0, maxTotal: 2 },
  3: { maxPaid: 3, maxFree: 0, maxTotal: 3 },
  4: { maxPaid: 3, maxFree: 1, maxTotal: 4 },
  5: { maxPaid: 4, maxFree: 1, maxTotal: 5 },
  6: { maxPaid: 4, maxFree: 2, maxTotal: 6 },
  7: { maxPaid: 5, maxFree: 2, maxTotal: 7 },
  8: { maxPaid: 5, maxFree: 3, maxTotal: 8 },
};

export function getSkillRaiseAllowance(rank: number): SkillRaiseAllowance {
  const r = Math.max(0, Math.min(8, Math.floor(Number(rank) || 0)));
  return { ...ALLOWANCE[r] };
}

/** Base Task TN = Task Level × 4. */
export function skillTaskBaseTn(taskLevel: number): number {
  const level = Math.max(1, Math.floor(Number(taskLevel) || 1));
  return level * 4;
}

export function finalSkillTn(baseTn: number, paidRaises: number): number {
  const paid = Math.max(0, Math.floor(Number(paidRaises) || 0));
  return Math.max(0, Math.floor(Number(baseTn) || 0)) + paid * 4;
}

export interface RaiseAllocationCheck {
  ok: boolean;
  paid: number;
  free: number;
  total: number;
  error?: string;
}

export function validateSkillRaiseAllocation(
  rank: number,
  paid: number,
  free: number,
): RaiseAllocationCheck {
  const allowance = getSkillRaiseAllowance(rank);
  const p = Math.max(0, Math.floor(Number(paid) || 0));
  const f = Math.max(0, Math.floor(Number(free) || 0));
  const total = p + f;
  if (p > allowance.maxPaid) {
    return { ok: false, paid: p, free: f, total, error: `Paid Raises exceed Rank ${rank} max (${allowance.maxPaid}).` };
  }
  if (f > allowance.maxFree) {
    return { ok: false, paid: p, free: f, total, error: `Free Raises exceed Rank ${rank} max (${allowance.maxFree}).` };
  }
  if (total > allowance.maxTotal) {
    return { ok: false, paid: p, free: f, total, error: `Total Raises exceed Rank ${rank} max (${allowance.maxTotal}).` };
  }
  return { ok: true, paid: p, free: f, total };
}

/** Passive Skill Value = 2 × relevant Attribute. */
export function passiveSkillValue(attribute: number): number {
  return 2 * Math.max(0, Math.floor(Number(attribute) || 0));
}

export function passiveSkillSucceeds(attribute: number, finalTn: number): boolean {
  return passiveSkillValue(attribute) >= Math.floor(Number(finalTn) || 0);
}

/** Starting creation: 20 Skill Creation Points, 2 per Rank, five Rank-2 Specializations. */
export const SKILL_CREATION_POINTS = 20;
export const SKILL_CREATION_COST_PER_RANK = 2;
export const STARTING_SPECIALIZATION_COUNT = 5;
export const STARTING_SPECIALIZATION_RANK = 2;
export const SPECIALIZATION_XP_PER_RANK = 4;
