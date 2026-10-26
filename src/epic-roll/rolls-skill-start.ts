/**
 * Start Skill workflows from the unified Rolls dialog.
 * Publishes one open chat-driven Skill Check request (players join & propose).
 * Group Ambush still publishes Comparative request with ambush flag for chat resolution.
 */

import { createSkillCheckRequest } from '../chat/skill-check-request.js';
import type { SkillCheckComparativeMeta } from '../chat/skill-check-request-state.js';
import type { RollsComparativeConfig, RollsSkillMode } from './rolls-skill-panel.js';

export interface RollsSkillStartInput {
  title?: string;
  taskDescription: string;
  note: string;
  showTn: boolean;
  mode: RollsSkillMode;
  /** Default Base TN for Standard checks. */
  baseTn: number;
  /** Optional audience restriction; empty = open join. */
  invitedActorIds: string[];
  comparative: RollsComparativeConfig;
}

function toComparativeMeta(cfg: RollsComparativeConfig): SkillCheckComparativeMeta {
  return {
    source: cfg.source,
    npcActorId: cfg.npcActorId,
    npcSkillKey: cfg.npcSkillKey,
    npcAttributeKey: cfg.npcAttributeKey,
    virtual: { ...cfg.virtual },
    groupAmbush: !!cfg.groupAmbush,
    ambushParticipantIds: [...(cfg.ambushParticipantIds || [])],
    stealthSpecialistId: cfg.stealthSpecialistId || '',
  };
}

export async function startSkillWorkflowFromRolls(
  input: RollsSkillStartInput,
): Promise<{ ok: boolean; error?: string; message?: ChatMessage | null }> {
  const task = input.taskDescription.trim() || input.title?.trim() || 'Skill Check';
  if (!task) {
    return { ok: false, error: 'Describe the Task / Obstacle first.' };
  }

  const msg = await createSkillCheckRequest({
    title: input.title?.trim() || 'Skill Check',
    taskDescription: task,
    note: input.note.trim(),
    baseTn: Math.max(0, Math.floor(Number(input.baseTn) || 12)),
    mode: input.mode,
    showTn: input.showTn,
    invitedActorIds: [...(input.invitedActorIds || [])],
    ...(input.mode === 'comparative'
      ? { comparative: toComparativeMeta(input.comparative) }
      : {}),
  });

  if (!msg) return { ok: false, error: 'Failed to publish Skill Check request.' };
  return { ok: true, message: msg };
}
