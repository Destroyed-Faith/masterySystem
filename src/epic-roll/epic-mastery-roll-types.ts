/**
 * Epic Mastery Roll — shared types.
 */

import { SKILLS } from '../utils/skills.js';
import type { MasteryRollResult } from '../types/index.js';

export type EpicRollKind = 'skill' | 'attribute';

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

export type EpicRollConfig = EpicSkillRollConfig | EpicAttributeRollConfig;

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
  /** True while the owner may still spend skill points or reroll before locking in. */
  awaitingConfirm?: boolean;
  skillKey?: string;
  /** Attribute used for this check — needed to reroll the same pool. */
  attributeKey?: string;
  skillSpent?: number;
  raiseTn?: number;
  /** Already spent a Reroll Point on this Epic Roll. */
  rerolled?: boolean;
  rollPayload?: EpicRollPayload;
  echoCardUsed?: {
    cardId: string;
    optionId: string;
    cardName: string;
    optionLabel: string;
  };
  /** Persisted dice breakdown for overlay / summary after rollPayload is cleared. */
  diceFaces?: EpicDiceFace[];
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

export interface EpicDiceFace {
  value: number;
  label: string;
  kept: boolean;
  exploded: boolean;
}

export function buildEpicDiceFaces(
  rollResult: MasteryRollResult & { keptIndices?: number[] },
): EpicDiceFace[] {
  const keptIdx = new Set(rollResult.keptIndices ?? []);
  const chains = rollResult.dieChains;
  return (rollResult.dice ?? []).map((total, i) => {
    const chain = chains?.[i];
    const label =
      chain && chain.length > 1 ? `${chain.join('+')}=${total}` : String(total);
    return {
      value: total,
      label,
      kept: keptIdx.has(i),
      exploded: (chain?.length ?? 1) > 1,
    };
  });
}

/** Full pool display: all dice with kept totals for chat / overlay. */
export function formatEpicRollDiceSummary(
  rollResult: MasteryRollResult & { keptIndices?: number[] },
): string {
  const faces = buildEpicDiceFaces(rollResult);
  if (!faces.length) return '—';
  const rolled = faces.map((f) => f.label).join(', ');
  const kept = rollResult.kept?.length ? rollResult.kept.join(', ') : '—';
  return `Rolled: ${rolled} · Kept: ${kept}`;
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
    attributeKey?: string;
    awaitingConfirm?: boolean;
    skillSpent?: number;
    rerolled?: boolean;
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
    diceSummary: formatEpicRollDiceSummary(rollResult),
    diceFaces: buildEpicDiceFaces(rollResult),
    awaitingConfirm: opts.awaitingConfirm,
    skillKey: opts.skillKey,
    attributeKey: opts.attributeKey,
    skillSpent: opts.skillSpent ?? 0,
    rerolled: opts.rerolled === true,
    raiseTn: payload.raiseTn,
    rollPayload: payload,
  };
}
