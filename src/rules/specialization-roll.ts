/**
 * Pure Specialization roll planning + list helpers (Destroyed Faith Skill System).
 *
 * - Trained roll: Attribute dice, Keep = Mastery Rank; Rank grants Skill Advantage / Crit.
 * - Untrained: full Attribute pool with Disadvantage, 0 Raises.
 * - Task Level × 4 = Base TN; optional uncapped Paid Raises (+4 TN each).
 * - Free Raises from Skill Rank are retired.
 */

import {
  finalSkillTn,
  getSkillRaiseAllowance,
  passiveSkillValue,
  skillTaskBaseTn,
  specializationXpCostToReach,
  validatePaidRaisesDeclaration,
  type SkillRaiseAllowance,
} from './skill-raises.js';
import {
  skillAdvantageLabel,
  skillAdvantageRerollMax,
  skillCritDailyAllowance,
} from './skill-advantage.js';
import {
  SKILL_FIELD_LABELS,
  isSkillField,
  normalizeSpecializationName,
  specializationIdentityKey,
  type SkillField,
  type SpecializationRecord,
} from './specializations.js';

export const SPECIALIZATION_MAX_RANK = 8;

/** Soft UI hint when Paid Raises are uncapped. */
const SKILL_PAID_RAISE_UI_HINT = 8;

export const SPEC_ATTRIBUTE_KEYS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

export type SpecAttributeKey = (typeof SPEC_ATTRIBUTE_KEYS)[number];

export interface SpecializationRollPlanInput {
  /** Spec Rank; 0 / undefined / null = untrained. */
  rank?: number | null;
  attributeValue: number;
  masteryRank: number;
  /** Prefer `baseTn` when the GM sets an explicit TN (e.g. opposed). */
  taskLevel?: number;
  baseTn?: number;
  paidRaises?: number;
  /**
   * @deprecated Free Raises retired — ignored.
   */
  freeRaises?: number;
}

export interface SpecializationRollPlan {
  ok: boolean;
  error?: string;
  trained: boolean;
  rank: number;
  allowance: SkillRaiseAllowance;
  taskLevel: number;
  baseTn: number;
  paidRaises: number;
  /** Always 0 — Free Raises retired. */
  freeRaises: number;
  finalTn: number;
  numDice: number;
  keepDice: number;
  rollDisadvantage: boolean;
  skillAdvantageRerollMax: 0 | 1 | 2 | 3 | 4 | 5;
  skillCritDailyAllowance: 0 | 1 | 2;
}

/** Validate Paid Raises BEFORE the roll and compute pool / TN. */
export function planSpecializationRoll(input: SpecializationRollPlanInput): SpecializationRollPlan {
  const rank = Math.max(0, Math.min(SPECIALIZATION_MAX_RANK, Math.floor(Number(input.rank) || 0)));
  const trained = rank > 0;
  const taskLevel = Math.max(
    1,
    Math.floor(
      Number(
        input.taskLevel ??
          (typeof input.baseTn === 'number' ? Math.max(1, Math.round(Number(input.baseTn) / 4) || 1) : 1),
      ) || 1,
    ),
  );
  const baseTn =
    typeof input.baseTn === 'number' && Number.isFinite(input.baseTn)
      ? Math.max(0, Math.floor(Number(input.baseTn) || 0))
      : skillTaskBaseTn(taskLevel);
  const allowance = getSkillRaiseAllowance(rank);
  const requestedPaid = Math.max(0, Math.floor(Number(input.paidRaises) || 0));
  const mr = Math.max(1, Math.floor(Number(input.masteryRank) || 1));
  const numDice = Math.max(0, Math.floor(Number(input.attributeValue) || 0));

  const check = validatePaidRaisesDeclaration(rank, requestedPaid);
  const paid = check.ok ? check.paid : 0;

  let error = check.error;
  if (!trained && requestedPaid > 0) {
    error = 'Untrained rolls get 0 Raises.';
  }

  return {
    ok: !error && check.ok,
    ...(error ? { error } : {}),
    trained,
    rank,
    allowance,
    taskLevel,
    baseTn,
    paidRaises: paid,
    freeRaises: 0,
    finalTn: finalSkillTn(baseTn, paid),
    numDice,
    keepDice: mr,
    rollDisadvantage: !trained,
    skillAdvantageRerollMax: skillAdvantageRerollMax(rank),
    skillCritDailyAllowance: skillCritDailyAllowance(rank),
  };
}

/** Normalized read of `system.specializations` (array or keyed object). */
export function readSpecializations(system: any): SpecializationRecord[] {
  const raw = system?.specializations;
  const list: any[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  const out: SpecializationRecord[] = [];
  for (const s of list) {
    if (!s || !String(s.name ?? '').trim()) continue;
    const field: SkillField = isSkillField(s.field) ? s.field : 'physical';
    const name = String(s.name).trim();
    out.push({
      id: String(s.id || specializationIdentityKey(name, field)),
      name,
      field,
      scope: String(s.scope ?? ''),
      rank: Math.max(0, Math.min(SPECIALIZATION_MAX_RANK, Math.floor(Number(s.rank) || 0))),
    });
  }
  return out;
}

export function findSpecializationById(
  specs: SpecializationRecord[],
  id: string | null | undefined,
): SpecializationRecord | null {
  if (!id) return null;
  return specs.find((s) => s.id === id) ?? null;
}

/** Match a Spec by free name (case/diacritics-insensitive). */
export function findSpecializationByName(
  specs: SpecializationRecord[],
  name: string,
): SpecializationRecord | null {
  const norm = normalizeSpecializationName(name);
  if (!norm) return null;
  return specs.find((s) => normalizeSpecializationName(s.name) === norm) ?? null;
}

export function upsertSpecialization(
  specs: SpecializationRecord[],
  record: SpecializationRecord,
  replaceId?: string,
): SpecializationRecord[] {
  const target = replaceId ?? record.id;
  if (specs.some((s) => s.id === target)) {
    return specs.map((s) => (s.id === target ? record : s));
  }
  return [...specs, record];
}

export function removeSpecialization(specs: SpecializationRecord[], id: string): SpecializationRecord[] {
  return specs.filter((s) => s.id !== id);
}

/** XP cost to advance from `currentRank` to currentRank+1 (new ladder; future buys only). */
export function specializationRankUpCost(currentRank: number): number {
  const cur = Math.max(0, Math.floor(Number(currentRank) || 0));
  if (cur >= SPECIALIZATION_MAX_RANK) return 0;
  return specializationXpCostToReach(cur + 1);
}

export function canRankUpSpecialization(spec: Pick<SpecializationRecord, 'rank'>): boolean {
  return Math.floor(Number(spec.rank) || 0) < SPECIALIZATION_MAX_RANK;
}

/** Return a new list with Spec `id` raised one Rank; null if impossible. */
export function rankUpSpecialization(
  specs: SpecializationRecord[],
  id: string,
): SpecializationRecord[] | null {
  const spec = findSpecializationById(specs, id);
  if (!spec || !canRankUpSpecialization(spec)) return null;
  return specs.map((s) => (s.id === id ? { ...s, rank: s.rank + 1 } : s));
}

export interface SpecializationSheetRow {
  id: string;
  name: string;
  field: SkillField;
  fieldLabel: string;
  scope: string;
  rank: number;
  maxPaid: number;
  maxFree: number;
  maxTotal: number;
  allowanceLabel: string;
  skillAdvantageLabel: string;
  skillCritDailyAllowance: 0 | 1 | 2;
  nextRankXpCost: number;
  /** Passive Skill Value with the character's best Attribute (2 × Attribute). */
  passiveBest: number;
  passiveBestAttribute: string;
  passiveHint: string;
}

/** Sheet-ready rows: Field label, Advantage/Crit, passive hint. */
export function buildSpecializationSheetRows(
  specs: SpecializationRecord[],
  attributeValues: Partial<Record<string, number>>,
): SpecializationSheetRow[] {
  let bestKey: string = SPEC_ATTRIBUTE_KEYS[0];
  let bestVal = -1;
  for (const key of SPEC_ATTRIBUTE_KEYS) {
    const v = Math.max(0, Math.floor(Number(attributeValues[key]) || 0));
    if (v > bestVal) {
      bestVal = v;
      bestKey = key;
    }
  }
  const bestAttr = Math.max(0, bestVal);
  const passiveBest = passiveSkillValue(bestAttr);
  const bestLabel = bestKey.charAt(0).toUpperCase() + bestKey.slice(1);

  return specs.map((s) => {
    const a = getSkillRaiseAllowance(s.rank);
    const crit = skillCritDailyAllowance(s.rank);
    const adv = skillAdvantageLabel(s.rank);
    return {
      id: s.id,
      name: s.name,
      field: s.field,
      fieldLabel: SKILL_FIELD_LABELS[s.field] ?? s.field,
      scope: s.scope,
      rank: s.rank,
      maxPaid: Number.isFinite(a.maxPaid) ? a.maxPaid : SKILL_PAID_RAISE_UI_HINT,
      maxFree: 0,
      maxTotal: Number.isFinite(a.maxTotal) ? a.maxTotal : SKILL_PAID_RAISE_UI_HINT,
      allowanceLabel: crit > 0 ? `${adv} · Skill Crit ${crit}/day` : adv,
      skillAdvantageLabel: adv,
      skillCritDailyAllowance: crit,
      nextRankXpCost: specializationRankUpCost(s.rank),
      passiveBest,
      passiveBestAttribute: bestLabel,
      passiveHint: `Passive ${passiveBest} (2 × ${bestLabel} ${bestAttr}); beats TN ≤ ${passiveBest}`,
    };
  });
}
