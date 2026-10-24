/**
 * Canonical Skill Raise allowances (DF Players Guide 2026-10-24).
 * Paid Raises (+4 TN) are chosen before the roll.
 * Free Raises (+0 TN) become available automatically on success.
 * Effect allocation (Scope/Speed/…) happens after success on the result card.
 * Combat and Ritual Raises keep their own pre-roll allocation elsewhere.
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

export type SkillRaiseEffectAllocation = Record<SkillRaiseEffect, number>;

export const SKILL_RAISE_EFFECT_LABELS: Record<SkillRaiseEffect, { label: string; summary: string }> = {
  scope: { label: 'Scope', summary: 'Double eligible quantity each Raise (same task).' },
  speed: { label: 'Speed', summary: 'Halve feasible work time per Raise (realistic minimums).' },
  quality: { label: 'Quality', summary: 'Improve agreed quality or clarity one step.' },
  efficiency: { label: 'Efficiency', summary: 'Reduce avoidable waste or effort.' },
  insight: { label: 'Insight', summary: 'One relevant, supportable clue.' },
  safety: { label: 'Safety', summary: 'Mitigate one foreseeable secondary complication.' },
};

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

/** Free Raises unlocked by Rank; available only after a successful Skill Check. */
export function freeAllowance(rank: number): number {
  return getSkillRaiseAllowance(rank).maxFree;
}

/** Maximum Paid Raises that may be declared before the roll. */
export function paidCap(rank: number): number {
  return getSkillRaiseAllowance(rank).maxPaid;
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

/**
 * Clamp a requested Paid Raise count to the Rank paid cap.
 * Returns the clamped value and whether it was reduced.
 */
export function clampPaidRaises(rank: number, paid: number): { paid: number; clamped: boolean } {
  const cap = paidCap(rank);
  const raw = Math.max(0, Math.floor(Number(paid) || 0));
  const next = Math.min(cap, raw);
  return { paid: next, clamped: next !== raw };
}

/** Dropdown options: `0 Paid — Final TN 12`, … */
export function paidRaiseSelectOptions(
  rank: number,
  baseTn: number,
): Array<{ paid: number; finalTn: number; label: string }> {
  const cap = paidCap(rank);
  const base = Math.max(0, Math.floor(Number(baseTn) || 0));
  const out: Array<{ paid: number; finalTn: number; label: string }> = [];
  for (let paid = 0; paid <= cap; paid++) {
    const tn = finalSkillTn(base, paid);
    const noun = paid === 1 ? 'Raise' : 'Raises';
    out.push({ paid, finalTn: tn, label: `${paid} Paid → TN ${tn}` });
  }
  return out;
}

export interface RaiseAllocationCheck {
  ok: boolean;
  paid: number;
  free: number;
  total: number;
  error?: string;
}

/**
 * Validate Paid (+ optional Free) against Rank caps.
 * For ordinary Skill Checks, Free is not chosen pre-roll — pass free=0 when
 * validating the pre-roll declaration; use `skillCheckSuccessRaiseBudget` after success.
 */
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

/** Validate only the pre-roll Paid declaration (Free is auto on success). */
export function validatePaidRaisesDeclaration(rank: number, paid: number): RaiseAllocationCheck {
  return validateSkillRaiseAllocation(rank, paid, 0);
}

/** Raise budget after a successful ordinary Skill Check (at-roll Rank snapshot). */
export function skillCheckSuccessRaiseBudget(
  skillRankAtRoll: number,
  paidRaisesDeclared: number,
): { available: number; paid: number; free: number } {
  const allowance = getSkillRaiseAllowance(skillRankAtRoll);
  const paid = Math.max(0, Math.min(allowance.maxPaid, Math.floor(Number(paidRaisesDeclared) || 0)));
  const free = allowance.maxFree;
  return { available: paid + free, paid, free };
}

export function emptySkillRaiseEffectAllocation(): SkillRaiseEffectAllocation {
  return {
    scope: 0,
    speed: 0,
    quality: 0,
    efficiency: 0,
    insight: 0,
    safety: 0,
  };
}

export function sumSkillRaiseEffects(allocation: Partial<SkillRaiseEffectAllocation> | null | undefined): number {
  if (!allocation) return 0;
  let total = 0;
  for (const key of SKILL_RAISE_EFFECTS) {
    total += Math.max(0, Math.floor(Number(allocation[key]) || 0));
  }
  return total;
}

export function normalizeSkillRaiseEffectAllocation(
  raw: Partial<SkillRaiseEffectAllocation> | null | undefined,
): SkillRaiseEffectAllocation {
  const out = emptySkillRaiseEffectAllocation();
  if (!raw || typeof raw !== 'object') return out;
  for (const key of SKILL_RAISE_EFFECTS) {
    out[key] = Math.max(0, Math.floor(Number(raw[key]) || 0));
  }
  return out;
}

export interface EffectAllocationCheck {
  ok: boolean;
  allocation: SkillRaiseEffectAllocation;
  spent: number;
  available: number;
  error?: string;
}

/** Post-success: total allocated effects must be ≤ available (Paid + Free). */
export function validateSkillRaiseEffectAllocation(
  available: number,
  allocation: Partial<SkillRaiseEffectAllocation> | null | undefined,
): EffectAllocationCheck {
  const cap = Math.max(0, Math.floor(Number(available) || 0));
  const normalized = normalizeSkillRaiseEffectAllocation(allocation);
  const spent = sumSkillRaiseEffects(normalized);
  if (spent > cap) {
    return {
      ok: false,
      allocation: normalized,
      spent,
      available: cap,
      error: `Allocated ${spent} Raise effects but only ${cap} available.`,
    };
  }
  return { ok: true, allocation: normalized, spent, available: cap };
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
