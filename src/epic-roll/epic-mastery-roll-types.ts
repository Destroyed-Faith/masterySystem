/**
 * Epic Mastery Roll — shared types.
 */

import { SKILLS } from '../utils/skills.js';
import type { SaveCategory } from '../utils/saving-throws.js';
import type { MasteryRollResult } from '../types/index.js';

export type EpicRollKind = 'skill' | 'attribute' | 'save';

export interface EpicTnConfig {
  challengeMR: number;
  baseTN: number;
  raises: number;
}

export interface EpicSkillRollConfig {
  kind: 'skill';
  skillKey: string;
}

export interface EpicAttributeRollConfig {
  kind: 'attribute';
  attributeKey: string;
}

export interface EpicSaveRollConfig {
  kind: 'save';
  saveType: SaveCategory;
}

export type EpicRollConfig = EpicSkillRollConfig | EpicAttributeRollConfig | EpicSaveRollConfig;

export type EpicParticipantStatus = 'pending' | 'awaiting_spend' | 'rolled' | 'skipped';

export interface EpicParticipant {
  actorId: string;
  actorName: string;
  status: EpicParticipantStatus;
  img?: string;
}

/** Serializable roll payload kept while the player chooses skill spend. */
export interface EpicRollPayload {
  rollResult: MasteryRollResult;
  skillKey?: string;
  isSkillRoll: boolean;
  baseModifier: number;
  raiseTn?: number;
}

export interface EpicParticipantResult {
  actorId: string;
  actorName: string;
  label: string;
  total: number;
  normalTn: number;
  success: boolean;
  raises: number;
  diceSummary: string;
  skipped?: boolean;
  /** True while the owner may still spend skill points before locking in. */
  awaitingConfirm?: boolean;
  skillKey?: string;
  skillSpent?: number;
  raiseTn?: number;
  rollPayload?: EpicRollPayload;
  echoCardUsed?: {
    cardId: string;
    optionId: string;
    cardName: string;
    optionLabel: string;
  };
}

export interface EpicMasteryRollSession {
  id: string;
  title: string;
  flavor: string;
  showTn: boolean;
  tn: EpicTnConfig;
  roll: EpicRollConfig;
  participants: EpicParticipant[];
  results: Record<string, EpicParticipantResult>;
  status: 'active' | 'complete' | 'cancelled';
  /** Band tint hue (0–360). */
  bandHue?: number;
}

export interface EpicMasteryRollPreset {
  title: string;
  flavor: string;
  showTn: boolean;
  tn: EpicTnConfig;
  roll: EpicRollConfig;
  actorIds: string[];
}

export interface EpicMasteryRollStartConfig {
  title: string;
  flavor: string;
  showTn: boolean;
  tn: EpicTnConfig;
  roll: EpicRollConfig;
  actorIds: string[];
}

export function formatDiceSummary(kept: number[]): string {
  if (!kept?.length) return '—';
  return kept.join(', ');
}

export function countResolvedParticipants(session: EpicMasteryRollSession): number {
  return session.participants.filter((p) => p.status === 'rolled' || p.status === 'skipped').length;
}

export function isSessionReadyToComplete(session: EpicMasteryRollSession): boolean {
  if (session.status !== 'active') return false;
  return session.participants.every((p) => p.status === 'rolled' || p.status === 'skipped');
}

export function mergeParticipantResult(
  session: EpicMasteryRollSession,
  result: EpicParticipantResult,
  opts?: { staged?: boolean },
): EpicMasteryRollSession {
  const staged = opts?.staged ?? result.awaitingConfirm === true;
  const participants = session.participants.map((p) =>
    p.actorId === result.actorId
      ? {
          ...p,
          status: result.skipped
            ? ('skipped' as const)
            : staged
              ? ('awaiting_spend' as const)
              : ('rolled' as const),
        }
      : p,
  );
  return {
    ...session,
    participants,
    results: { ...session.results, [result.actorId]: result },
  };
}

export function skipParticipantInSession(
  session: EpicMasteryRollSession,
  actorId: string,
): EpicMasteryRollSession {
  const participant = session.participants.find((p) => p.actorId === actorId);
  if (!participant) return session;

  const result: EpicParticipantResult = {
    actorId,
    actorName: participant.actorName,
    label: '—',
    total: 0,
    normalTn: session.tn.baseTN,
    success: false,
    raises: 0,
    diceSummary: '—',
    skipped: true,
  };

  return mergeParticipantResult(session, result);
}

export function rollLabelForConfig(roll: EpicRollConfig): string {
  switch (roll.kind) {
    case 'skill':
      return SKILLS[roll.skillKey]?.name ?? roll.skillKey;
    case 'attribute':
      return roll.attributeKey.charAt(0).toUpperCase() + roll.attributeKey.slice(1);
    case 'save':
      return `${roll.saveType.charAt(0).toUpperCase()}${roll.saveType.slice(1)} Save`;
    default:
      return 'Roll';
  }
}

export function participantResultFromRoll(
  actorId: string,
  actorName: string,
  label: string,
  rollResult: MasteryRollResult,
  payload: EpicRollPayload,
  opts: {
    skillKey?: string;
    awaitingConfirm?: boolean;
    skillSpent?: number;
  } = {},
): EpicParticipantResult {
  return {
    actorId,
    actorName,
    label,
    total: rollResult.total,
    normalTn: rollResult.tn ?? rollResult.normalTn ?? 0,
    success: rollResult.success,
    raises: rollResult.raises ?? 0,
    diceSummary: formatDiceSummary(rollResult.kept),
    awaitingConfirm: opts.awaitingConfirm,
    skillKey: opts.skillKey,
    skillSpent: opts.skillSpent ?? 0,
    raiseTn: payload.raiseTn,
    rollPayload: payload,
  };
}
