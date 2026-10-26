/**
 * Pure state helpers for chat-driven Skill Check requests.
 * No Foundry globals — unit-testable.
 */

import type { SkillCheckSkillRef } from '../rules/index.js';
import { skillRefsEqual } from '../rules/index.js';

export const SKILL_CHECK_REQUEST_SCHEMA = 'df-skill-check-request-chat-driven-2026-10-26' as const;

export type SkillCheckRequestMode = 'standard' | 'comparative';
export type SkillCheckLifecycle = 'open' | 'rolling' | 'completed' | 'cancelled';

export type ParticipantStatus =
  | 'declined'
  | 'proposed'
  | 'rejected'
  | 'approved'
  | 'rolled';

export interface SkillCheckComparativeMeta {
  source: 'npc' | 'virtual';
  npcActorId?: string;
  npcSkillKey?: string;
  npcAttributeKey?: string;
  virtual?: {
    name: string;
    skillName: string;
    poolDice: number;
    masteryRank: number;
    skillRank: number;
    attributeKey: string;
    allowSkillCrit: boolean;
  };
  groupAmbush?: boolean;
  ambushParticipantIds?: string[];
  stealthSpecialistId?: string;
}

export interface SkillCheckParticipant {
  actorId: string;
  status: ParticipantStatus;
  proposedSkill?: SkillCheckSkillRef;
  proposedAttributeKey?: string;
  explanation?: string;
  skill?: SkillCheckSkillRef;
  attributeKey?: string;
  baseTn?: number;
  paidRaises?: number;
  finalTn?: number;
  rollTotal?: number;
  success?: boolean;
  comparativeOutcome?: 'wins' | 'loses' | 'tie-defender';
}

export interface SkillCheckRequestPayload {
  schema: typeof SKILL_CHECK_REQUEST_SCHEMA;
  requestId: string;
  lifecycle: SkillCheckLifecycle;
  title: string;
  taskDescription: string;
  note: string;
  mode: SkillCheckRequestMode;
  /** Default Base TN for Standard checks (GM may override per participant). */
  baseTn: number;
  showTn: boolean;
  /**
   * Optional audience restriction. Empty = any eligible PC may join.
   * When non-empty, only listed actor ids may Participate.
   */
  invitedActorIds: string[];
  participants: Record<string, SkillCheckParticipant>;
  comparative?: SkillCheckComparativeMeta;
  opposition?: {
    rolled: boolean;
    total: number;
    label: string;
  };
  resultsPublished?: boolean;
  createdBy: string;
}

export function canActorJoinRequest(
  payload: SkillCheckRequestPayload,
  actorId: string,
): boolean {
  if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') return false;
  const existing = payload.participants[actorId];
  if (existing?.status === 'rolled') return false;
  if (existing?.status === 'approved') return false;
  if (existing?.status === 'proposed') return false;
  if (existing?.status === 'declined') return false;
  // rejected → may submit a revised proposal
  if (payload.invitedActorIds.length > 0 && !payload.invitedActorIds.includes(actorId)) {
    return false;
  }
  return true;
}

export function applyDecline(
  payload: SkillCheckRequestPayload,
  actorId: string,
): SkillCheckRequestPayload {
  return {
    ...payload,
    participants: {
      ...payload.participants,
      [actorId]: { actorId, status: 'declined' },
    },
  };
}

export function applyProposal(
  payload: SkillCheckRequestPayload,
  actorId: string,
  proposal: {
    skill: SkillCheckSkillRef;
    attributeKey: string;
    explanation?: string;
  },
): SkillCheckRequestPayload {
  return {
    ...payload,
    lifecycle: payload.lifecycle === 'completed' ? payload.lifecycle : 'open',
    participants: {
      ...payload.participants,
      [actorId]: {
        actorId,
        status: 'proposed',
        proposedSkill: proposal.skill,
        proposedAttributeKey: proposal.attributeKey,
        explanation: proposal.explanation?.trim() || undefined,
      },
    },
  };
}

export function applyReject(
  payload: SkillCheckRequestPayload,
  actorId: string,
): SkillCheckRequestPayload {
  const prev = payload.participants[actorId];
  if (!prev) return payload;
  return {
    ...payload,
    participants: {
      ...payload.participants,
      [actorId]: {
        ...prev,
        status: 'rejected',
        skill: undefined,
        attributeKey: undefined,
        baseTn: undefined,
      },
    },
  };
}

export function applyApprove(
  payload: SkillCheckRequestPayload,
  actorId: string,
  opts?: {
    skill?: SkillCheckSkillRef;
    attributeKey?: string;
    baseTn?: number;
  },
): SkillCheckRequestPayload {
  const prev = payload.participants[actorId];
  if (!prev) return payload;
  const skill = opts?.skill ?? prev.proposedSkill ?? prev.skill;
  const attributeKey =
    opts?.attributeKey ?? prev.proposedAttributeKey ?? prev.attributeKey ?? 'wits';
  if (!skill) return payload;
  const baseTn =
    payload.mode === 'comparative'
      ? 0
      : opts?.baseTn != null
        ? Math.max(0, Math.floor(Number(opts.baseTn) || 0))
        : prev.baseTn != null
          ? Math.max(0, Math.floor(Number(prev.baseTn) || 0))
          : Math.max(0, Math.floor(Number(payload.baseTn) || 0));
  return {
    ...payload,
    lifecycle: 'rolling',
    participants: {
      ...payload.participants,
      [actorId]: {
        ...prev,
        status: 'approved',
        skill,
        attributeKey,
        baseTn,
      },
    },
  };
}

export function applyRollResult(
  payload: SkillCheckRequestPayload,
  actorId: string,
  result: {
    paidRaises?: number;
    finalTn?: number;
    rollTotal?: number;
    success?: boolean;
    comparativeOutcome?: 'wins' | 'loses' | 'tie-defender';
  },
): SkillCheckRequestPayload {
  const prev = payload.participants[actorId];
  if (!prev || prev.status !== 'approved') return payload;
  return {
    ...payload,
    participants: {
      ...payload.participants,
      [actorId]: {
        ...prev,
        status: 'rolled',
        ...result,
      },
    },
  };
}

export function approvedAssignment(
  payload: SkillCheckRequestPayload,
  actorId: string,
): {
  skill: SkillCheckSkillRef;
  attributeKey: string;
  baseTn: number;
  taskDescription: string;
  mode: SkillCheckRequestMode;
} | null {
  const p = payload.participants[actorId];
  if (!p || (p.status !== 'approved' && p.status !== 'rolled')) return null;
  if (!p.skill || !p.attributeKey) return null;
  return {
    skill: p.skill,
    attributeKey: p.attributeKey,
    baseTn: payload.mode === 'comparative' ? 0 : Math.max(0, Math.floor(Number(p.baseTn ?? payload.baseTn) || 0)),
    taskDescription: payload.taskDescription,
    mode: payload.mode,
  };
}

/** True when every active (non-declined) participant has finished or none remain. */
export function readyToFinalize(payload: SkillCheckRequestPayload): boolean {
  const entries = Object.values(payload.participants);
  const active = entries.filter((p) => p.status !== 'declined' && p.status !== 'rejected');
  if (!active.length) return true;
  return active.every((p) => p.status === 'rolled');
}

export function listJoinableActorIds(
  payload: SkillCheckRequestPayload,
  allPcIds: string[],
): string[] {
  return allPcIds.filter((id) => canActorJoinRequest(payload, id));
}

export function proposalFingerprint(p: SkillCheckParticipant): string {
  const skill = p.proposedSkill ?? p.skill;
  const attr = p.proposedAttributeKey ?? p.attributeKey ?? '';
  const skillKey =
    !skill
      ? ''
      : skill.kind === 'specialization' || skill.kind === 'npc-situational'
        ? `${skill.kind}:${skill.id}`
        : skill.kind;
  return `${skillKey}|${attr}|${p.explanation || ''}`;
}

export function skillsMatch(
  a: SkillCheckSkillRef | undefined,
  b: SkillCheckSkillRef | undefined,
): boolean {
  if (!a || !b) return false;
  return skillRefsEqual(a, b);
}
