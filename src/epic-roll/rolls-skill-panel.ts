/**
 * Pure helpers for the unified Rolls dialog Skill panel (DF Skill System).
 * Does not mutate character Specialization data.
 */

import {
  SPEC_ATTRIBUTE_KEYS,
  baseTnPresets,
  findSpecializationById,
  readSpecializations,
  skillAdvantageLabel,
  skillCritDailyAllowance,
  type SkillCheckSkillRef,
} from '../rules/index.js';
import { getSkillCritUsesRemaining } from '../rules/skill-advantage.js';
import { planGroupAmbushStealthPool } from '../combat/group-ambush.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

export type RollsSkillMode = 'standard' | 'comparative';

export interface RollsAllowedApproach {
  id: string;
  /** Specialization id, or 'perception' / 'untrained'. */
  skillKey: string;
  label: string;
  suggestedAttribute: string;
  baseTn: number;
  note: string;
}

export interface RollsParticipantSkillRow {
  actorId: string;
  skillRef: SkillCheckSkillRef;
  attributeKey: string;
  baseTn: number;
  /** Approach id that populated this row (optional). */
  approachId?: string;
}

export interface RollsVirtualOpponent {
  name: string;
  skillName: string;
  poolDice: number;
  masteryRank: number;
  skillRank: number;
  attributeKey: string;
  allowSkillCrit: boolean;
}

export interface RollsComparativeConfig {
  source: 'npc' | 'virtual';
  npcActorId: string;
  npcSkillKey: string;
  npcAttributeKey: string;
  virtual: RollsVirtualOpponent;
  groupAmbush: boolean;
  ambushParticipantIds: string[];
  stealthSpecialistId: string;
}

export function newApproachId(): string {
  return `ap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyApproach(partial?: Partial<RollsAllowedApproach>): RollsAllowedApproach {
  return {
    id: newApproachId(),
    skillKey: 'perception',
    label: 'Perception',
    suggestedAttribute: 'wits',
    baseTn: 12,
    note: '',
    ...partial,
  };
}

export function defaultVirtualOpponent(): RollsVirtualOpponent {
  return {
    name: 'Opposition',
    skillName: 'Perception',
    poolDice: 8,
    masteryRank: 2,
    skillRank: 2,
    attributeKey: 'wits',
    allowSkillCrit: false,
  };
}

export function defaultComparativeConfig(): RollsComparativeConfig {
  return {
    source: 'virtual',
    npcActorId: '',
    npcSkillKey: 'perception',
    npcAttributeKey: 'wits',
    virtual: defaultVirtualOpponent(),
    groupAmbush: false,
    ambushParticipantIds: [],
    stealthSpecialistId: '',
  };
}

export function skillRefFromKey(key: string): SkillCheckSkillRef {
  const v = String(key || '').trim();
  if (v === 'perception') return { kind: 'perception' };
  if (v === 'untrained' || !v) return { kind: 'untrained' };
  return { kind: 'specialization', id: v };
}

export function skillKeyFromRef(ref: SkillCheckSkillRef): string {
  if (ref.kind === 'perception') return 'perception';
  if (ref.kind === 'untrained') return 'untrained';
  return ref.id;
}

export function listActorSkillOptions(actor: any): Array<{
  key: string;
  label: string;
  rank: number;
}> {
  const specs = readSpecializations(actor?.system);
  const out: Array<{ key: string; label: string; rank: number }> = [
    { key: 'perception', label: 'Perception', rank: 2 },
    { key: 'untrained', label: 'Untrained', rank: 0 },
  ];
  for (const s of specs) {
    if (/^perception$/i.test(s.name)) continue; // Perception already listed
    out.push({ key: s.id, label: `${s.name} · Rank ${s.rank}`, rank: s.rank });
  }
  return out;
}

export function resolveSkillRank(actor: any, ref: SkillCheckSkillRef): number {
  if (ref.kind === 'untrained') return 0;
  if (ref.kind === 'perception') {
    const specs = readSpecializations(actor?.system);
    const found = specs.find((s) => /^perception$/i.test(s.name));
    return found ? found.rank : 2;
  }
  const s = findSpecializationById(readSpecializations(actor?.system), ref.id);
  return s ? s.rank : 0;
}

export function attributePoolPreview(actor: any, attributeKey: string): {
  attributeValue: number;
  masteryRank: number;
  poolLabel: string;
} {
  const attr = String(attributeKey || 'wits').toLowerCase();
  const attributeValue = Math.max(
    0,
    Math.floor(Number(actor?.system?.attributes?.[attr]?.value) || 0),
  );
  const masteryRank = Math.max(1, Math.floor(Number(getRulesMasteryRank(actor)) || 1));
  return {
    attributeValue,
    masteryRank,
    poolLabel: `${attributeValue}k${Math.min(attributeValue || 1, masteryRank)}`,
  };
}

export function participantSkillPreview(actor: any, row: RollsParticipantSkillRow): {
  skillLabel: string;
  rank: number;
  advantageLabel: string;
  critRemaining: number;
  critAllowance: number;
  poolLabel: string;
  attributeValue: number;
  masteryRank: number;
} {
  const rank = resolveSkillRank(actor, row.skillRef);
  const pool = attributePoolPreview(actor, row.attributeKey);
  const critAllowance = skillCritDailyAllowance(rank);
  const trackId =
    row.skillRef.kind === 'specialization'
      ? row.skillRef.id
      : row.skillRef.kind === 'perception'
        ? 'perception:perception'
        : '';
  return {
    skillLabel:
      row.skillRef.kind === 'untrained'
        ? 'Untrained'
        : row.skillRef.kind === 'perception'
          ? 'Perception'
          : findSpecializationById(readSpecializations(actor?.system), row.skillRef.id)?.name ||
            row.skillRef.id,
    rank,
    advantageLabel: skillAdvantageLabel(rank),
    critRemaining: trackId ? getSkillCritUsesRemaining(actor, trackId, rank) : 0,
    critAllowance,
    poolLabel: pool.poolLabel,
    attributeValue: pool.attributeValue,
    masteryRank: pool.masteryRank,
  };
}

export function applyApproachToRow(
  approach: RollsAllowedApproach,
  actorId: string,
): RollsParticipantSkillRow {
  return {
    actorId,
    skillRef: skillRefFromKey(approach.skillKey),
    attributeKey: approach.suggestedAttribute || 'wits',
    baseTn: Math.max(0, Math.floor(Number(approach.baseTn) || 0)),
    approachId: approach.id,
  };
}

export function taskLevelTnPresets(): Array<{ level: number; tn: number; label: string }> {
  const labels = [
    'Trivial',
    'Easy',
    'Moderate',
    'Challenging',
    'Hard',
    'Very Hard',
    'Heroic',
    'Legendary',
  ];
  return baseTnPresets().map((tn, i) => ({
    level: i + 1,
    tn,
    label: `${labels[i] ?? `TL${i + 1}`} · TN ${tn}`,
  }));
}

export const ROLLS_ATTRIBUTES = [...SPEC_ATTRIBUTE_KEYS];

export function equipmentPenaltyBreakdown(participants: any[]): {
  total: number;
  rows: Array<{ actorId: string; name: string; penalty: number }>;
} {
  const rows: Array<{ actorId: string; name: string; penalty: number }> = [];
  let total = 0;
  for (const actor of participants) {
    if (!actor) continue;
    const penalty = Math.max(0, Math.floor(Number(getEquippedPhysicalSkillPenaltyDice(actor)) || 0));
    rows.push({
      actorId: String(actor.id ?? ''),
      name: String(actor.name ?? 'Unknown'),
      penalty,
    });
    total += penalty;
  }
  return { total, rows };
}

export function groupAmbushPoolPreview(
  specialist: any,
  participants: any[],
  attributeKey: string,
) {
  const plan = planGroupAmbushStealthPool({
    specialist,
    participants,
    attributeKey,
  });
  return {
    ok: plan.ok,
    error: plan.error,
    basePool: plan.basePool,
    combinedPenalty: plan.combinedPenalty,
    finalPool: plan.finalPool,
    keepDice: plan.keepDice,
    participantPenalties: plan.participantPenalties,
    skillAdvantageRerollMax: plan.skillAdvantageRerollMax,
    skillRank: plan.skillRank,
    skillName: plan.skillName,
    attributeKey: plan.attributeKey,
    masteryRank: plan.masteryRank,
  };
}

/** Prefer Stealth Spec when present for ambush preview. */
export function resolveStealthRef(actor: any): SkillCheckSkillRef {
  const specs = readSpecializations(actor?.system);
  const stealth = specs.find((s) => /stealth/i.test(s.name));
  if (stealth) return { kind: 'specialization', id: stealth.id };
  return { kind: 'untrained' };
}
