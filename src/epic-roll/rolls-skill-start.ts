/**
 * Start Skill workflows from the unified Rolls (epic-roll-config) dialog.
 * Standard → createSkillCheckRequest (DF Skill Check engine).
 * Comparative / Group Ambush → same dice engine + comparative resolution.
 */

import { createSkillCheckRequest } from '../chat/skill-check-request.js';
import {
  executeGroupAmbushStealthRoll,
  planGroupAmbushStealthPool,
} from '../combat/group-ambush.js';
import {
  resolveComparativeSkillCheck,
  skillAdvantageRerollMax,
  type SkillCheckSkillRef,
} from '../rules/index.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
  applyApproachToRow,
  resolveSkillRank,
  skillKeyFromRef,
  skillRefFromKey,
  type RollsAllowedApproach,
  type RollsComparativeConfig,
  type RollsParticipantSkillRow,
  type RollsSkillMode,
  type RollsVirtualOpponent,
} from './rolls-skill-panel.js';

export interface RollsSkillStartInput {
  taskDescription: string;
  note: string;
  showTn: boolean;
  mode: RollsSkillMode;
  approaches: RollsAllowedApproach[];
  participantRows: RollsParticipantSkillRow[];
  allowPlayerSuggestions: boolean;
  comparative: RollsComparativeConfig;
  /** When true, skip auto-open of player overlays after create (unused). */
  skipOverlays?: boolean;
}

function defaultRowFromApproaches(
  approaches: RollsAllowedApproach[],
  rows: RollsParticipantSkillRow[],
): {
  defaultSkill: SkillCheckSkillRef;
  attributeKey: string;
  baseTn: number;
  perActorSkill: Record<string, SkillCheckSkillRef>;
  perActorAttribute: Record<string, string>;
  perActorBaseTn: Record<string, number>;
  allowedSkills: SkillCheckSkillRef[];
} {
  const perActorSkill: Record<string, SkillCheckSkillRef> = {};
  const perActorAttribute: Record<string, string> = {};
  const perActorBaseTn: Record<string, number> = {};
  for (const row of rows) {
    perActorSkill[row.actorId] = row.skillRef;
    perActorAttribute[row.actorId] = row.attributeKey;
    perActorBaseTn[row.actorId] = Math.max(0, Math.floor(Number(row.baseTn) || 0));
  }
  const first = rows[0];
  const allowedSkills = approaches.length
    ? approaches.map((a) => skillRefFromKey(a.skillKey))
    : first
      ? [first.skillRef]
      : [{ kind: 'untrained' as const }];
  return {
    defaultSkill: first?.skillRef ?? { kind: 'untrained' },
    attributeKey: first?.attributeKey || 'wits',
    baseTn: first ? Math.max(0, Math.floor(Number(first.baseTn) || 0)) : 12,
    perActorSkill,
    perActorAttribute,
    perActorBaseTn,
    allowedSkills,
  };
}

/** Ensure every selected actor has a participant row (from approaches or defaults). */
export function ensureParticipantRows(
  actorIds: string[],
  existing: RollsParticipantSkillRow[],
  approaches: RollsAllowedApproach[],
  fallbackTn: number,
): RollsParticipantSkillRow[] {
  const byId = new Map(existing.map((r) => [r.actorId, r]));
  const out: RollsParticipantSkillRow[] = [];
  for (const id of actorIds) {
    const prev = byId.get(id);
    if (prev) {
      out.push(prev);
      continue;
    }
    const approach = approaches[0];
    if (approach) {
      out.push(applyApproachToRow(approach, id));
    } else {
      out.push({
        actorId: id,
        skillRef: { kind: 'perception' },
        attributeKey: 'wits',
        baseTn: Math.max(0, Math.floor(Number(fallbackTn) || 12)),
      });
    }
  }
  return out;
}

export async function startStandardSkillFromRolls(
  input: RollsSkillStartInput,
): Promise<ChatMessage | null> {
  const rows = input.participantRows;
  if (!rows.length) {
    ui.notifications?.warn('Select at least one participant.');
    return null;
  }
  const mapped = defaultRowFromApproaches(input.approaches, rows);
  return createSkillCheckRequest({
    taskDescription: input.taskDescription.trim() || 'Skill Check',
    note: input.note.trim(),
    baseTn: mapped.baseTn,
    attributeKey: mapped.attributeKey,
    defaultSkill: mapped.defaultSkill,
    perActorSkill: mapped.perActorSkill,
    perActorAttribute: mapped.perActorAttribute,
    perActorBaseTn: mapped.perActorBaseTn,
    targetActorIds: rows.map((r) => r.actorId),
    allowedSkills: mapped.allowedSkills,
    mode: 'standard',
    showTn: input.showTn,
    allowPlayerSuggestions: input.allowPlayerSuggestions,
  });
}

async function rollVirtualOpponent(
  opp: RollsVirtualOpponent,
  flavor: string,
): Promise<{ total: number; label: string }> {
  const pool = Math.max(0, Math.floor(Number(opp.poolDice) || 0));
  const mr = Math.max(1, Math.floor(Number(opp.masteryRank) || 1));
  const keep = Math.max(1, Math.min(pool || 1, mr));
  const rank = Math.max(0, Math.floor(Number(opp.skillRank) || 0));
  const adv = skillAdvantageRerollMax(rank);
  const { masteryRoll } = await import('../dice/roll-handler.js');
  const result = await masteryRoll({
    numDice: pool,
    keepDice: keep,
    skill: 0,
    tn: 0,
    normalTn: 0,
    raiseTn: 0,
    declaredRaiseSlots: 0,
    stoneBonusRaises: 0,
    freeRaisesAvailableAtSuccess: 0,
    raiseModel: 'skill',
    rollDisadvantage: rank <= 0,
    skillAdvantageRerollMax: rank <= 0 ? 0 : adv,
    attackExplodeDiceOn78: !!opp.allowSkillCrit && rank >= 5,
    label: `${opp.name} · ${opp.skillName}`,
    flavor,
    isSkillRoll: true,
    rollKind: 'skill',
    applyPoolPenalties: false,
    skipChat: false,
  } as any);
  return {
    total: Math.floor(Number(result?.total) || 0),
    label: `${opp.name} (${opp.skillName} ${pool}k${keep})`,
  };
}

async function rollNpcOpposition(
  npc: any,
  skillKey: string,
  attributeKey: string,
  flavor: string,
): Promise<{ total: number; label: string }> {
  const { readSituationalSkills, findSituationalSkillByName, findSituationalSkillById } =
    await import('../rules/index.js');
  const skills = readSituationalSkills(npc?.system);
  const byId = findSituationalSkillById(skills, skillKey);
  const byName =
    byId ||
    findSituationalSkillByName(skills, skillKey) ||
    findSituationalSkillByName(skills, 'Perception') ||
    skills[0];
  if (byName) {
    const pool = Math.max(0, Math.floor(Number(byName.poolDice) || 0));
    const mr = Math.max(1, Math.floor(Number(getRulesMasteryRank(npc)) || 1));
    const keep = Math.max(1, Math.min(pool || 1, mr));
    const rank = Math.max(0, Math.floor(Number(byName.skillRank) || 0));
    const { masteryRoll } = await import('../dice/roll-handler.js');
    const result = await masteryRoll({
      numDice: pool,
      keepDice: keep,
      skill: 0,
      tn: 0,
      normalTn: 0,
      raiseTn: 0,
      declaredRaiseSlots: 0,
      stoneBonusRaises: 0,
      freeRaisesAvailableAtSuccess: 0,
      raiseModel: 'skill',
      rollDisadvantage: rank <= 0,
      skillAdvantageRerollMax: rank <= 0 ? 0 : skillAdvantageRerollMax(rank),
      label: `${npc.name} · ${byName.name}`,
      flavor,
      actorId: String(npc.id),
      isSkillRoll: true,
      rollKind: 'skill',
      applyPoolPenalties: false,
    } as any);
    return {
      total: Math.floor(Number(result?.total) || 0),
      label: `${npc.name} (${byName.name} ${pool}k${keep})`,
    };
  }
  // Fallback: Attribute k MR untrained
  const attr = String(attributeKey || 'wits').toLowerCase();
  const attributeValue = Math.max(
    0,
    Math.floor(Number(npc?.system?.attributes?.[attr]?.value) || 0),
  );
  const mr = Math.max(1, Math.floor(Number(getRulesMasteryRank(npc)) || 1));
  const keep = Math.max(1, Math.min(attributeValue || 1, mr));
  const { masteryRoll } = await import('../dice/roll-handler.js');
  const result = await masteryRoll({
    numDice: attributeValue,
    keepDice: keep,
    skill: 0,
    tn: 0,
    normalTn: 0,
    raiseTn: 0,
    declaredRaiseSlots: 0,
    stoneBonusRaises: 0,
    freeRaisesAvailableAtSuccess: 0,
    raiseModel: 'skill',
    rollDisadvantage: true,
    skillAdvantageRerollMax: 0,
    label: `${npc.name} · Untrained ${attr}`,
    flavor,
    actorId: String(npc.id),
    isSkillRoll: true,
    rollKind: 'skill',
    poolAttribute: attr,
    applyPoolPenalties: true,
  } as any);
  return {
    total: Math.floor(Number(result?.total) || 0),
    label: `${npc.name} (Untrained ${attr} ${attributeValue}k${keep})`,
  };
}

/**
 * Comparative Skill Check: open player Skill Check requests (no TN / no Raises),
 * then roll opposition and post a comparison card when players finish.
 * For GM-driven immediate compare (Group Ambush / quick opposition), use
 * `startComparativeImmediateFromRolls`.
 */
export async function startComparativeSkillFromRolls(
  input: RollsSkillStartInput,
): Promise<ChatMessage | null> {
  const rows = input.participantRows;
  if (!rows.length) {
    ui.notifications?.warn('Select at least one participant.');
    return null;
  }
  const mapped = defaultRowFromApproaches(input.approaches, rows);
  // Comparative: no Task TN — store 0; per-actor TN unused.
  return createSkillCheckRequest({
    taskDescription: input.taskDescription.trim() || 'Comparative Skill Check',
    note: input.note.trim(),
    baseTn: 0,
    attributeKey: mapped.attributeKey,
    defaultSkill: mapped.defaultSkill,
    perActorSkill: mapped.perActorSkill,
    perActorAttribute: mapped.perActorAttribute,
    perActorBaseTn: Object.fromEntries(rows.map((r) => [r.actorId, 0])),
    targetActorIds: rows.map((r) => r.actorId),
    allowedSkills: mapped.allowedSkills,
    mode: 'comparative',
    showTn: false,
    allowPlayerSuggestions: false,
    comparative: {
      source: input.comparative.source,
      npcActorId: input.comparative.npcActorId,
      npcSkillKey: input.comparative.npcSkillKey,
      npcAttributeKey: input.comparative.npcAttributeKey,
      virtual: { ...input.comparative.virtual },
      groupAmbush: false,
    },
  });
}

export async function startGroupAmbushFromRolls(
  input: RollsSkillStartInput,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = input.comparative;
  const ambushIds =
    cfg.ambushParticipantIds.length > 0
      ? cfg.ambushParticipantIds
      : input.participantRows.map((r) => r.actorId);
  const specialistId = cfg.stealthSpecialistId || ambushIds[0] || '';
  const specialist = game.actors?.get(specialistId) as any;
  if (!specialist) {
    return { ok: false, error: 'Select a Stealth specialist for Group Ambush.' };
  }
  const participants = ambushIds
    .map((id) => game.actors?.get(id))
    .filter(Boolean) as any[];
  if (!participants.some((a) => String(a.id) === String(specialist.id))) {
    participants.push(specialist);
  }

  const specialistRow = input.participantRows.find(
    (r) => r.actorId === String(specialist.id),
  );
  const attributeKey = specialistRow?.attributeKey || 'agility';

  const plan = planGroupAmbushStealthPool({ specialist, participants, attributeKey });
  if (!plan.ok) return { ok: false, error: plan.error };

  // Roll opposition first so we have Perception totals.
  let observerPerceptionTotals: Array<{ observer: any; perceptionTotal: number }> = [];
  const flavorBase = `Group Ambush · ${input.taskDescription || 'Stealth'}`;
  if (cfg.source === 'npc' && cfg.npcActorId) {
    const npc = game.actors?.get(cfg.npcActorId) as any;
    if (!npc) return { ok: false, error: 'Opposing NPC not found.' };
    const rolled = await rollNpcOpposition(
      npc,
      cfg.npcSkillKey || 'perception',
      cfg.npcAttributeKey || 'wits',
      `${flavorBase} · Observer`,
    );
    observerPerceptionTotals = [{ observer: npc, perceptionTotal: rolled.total }];
  } else {
    const rolled = await rollVirtualOpponent(
      cfg.virtual,
      `${flavorBase} · ${cfg.virtual.name}`,
    );
    observerPerceptionTotals = [
      {
        observer: { id: 'virtual', name: cfg.virtual.name },
        perceptionTotal: rolled.total,
      },
    ];
  }

  const ambush = await executeGroupAmbushStealthRoll({
    specialist,
    participants,
    attributeKey,
    declareSkillCrit: false,
    observerPerceptionTotals,
  });
  if (!ambush.ok) return { ok: false, error: ambush.error };

  const lines = (ambush.observerResults || [])
    .map((o) => {
      const outcome = resolveComparativeSkillCheck({
        challengerTotal: ambush.stealthTotal ?? 0,
        defenderTotal: o.perceptionTotal,
      });
      const unaware = o.stealthWins;
      return `<li><strong>${escapeHtml(o.observerName)}</strong>: Perception ${o.perceptionTotal} · ${
        unaware ? 'Unaware (ambush succeeds)' : `Aware (${outcome.winner})`
      }</li>`;
    })
    .join('');

  await ChatMessage.create({
    user: game.user?.id,
    speaker: ChatMessage.getSpeaker({ alias: 'Group Ambush' }),
    content: `<div class="ms-group-ambush-result">
      <strong>Group Ambush</strong>
      <div>${escapeHtml(input.taskDescription || 'Stealth approach')}</div>
      <div>Specialist: <strong>${escapeHtml(specialist.name)}</strong> · Stealth total <strong>${ambush.stealthTotal}</strong>
      · Pool ${plan.finalPool}k${plan.keepDice} (−${plan.combinedPenalty} combined equipment)</div>
      <ul>${lines}</ul>
      ${input.note ? `<div class="ms-scr-note">${escapeHtml(input.note)}</div>` : ''}
    </div>`,
  } as any);

  return { ok: true };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function startSkillWorkflowFromRolls(
  input: RollsSkillStartInput,
): Promise<{ ok: boolean; error?: string }> {
  if (input.mode === 'comparative' && input.comparative.groupAmbush) {
    return startGroupAmbushFromRolls(input);
  }
  if (input.mode === 'comparative') {
    const msg = await startComparativeSkillFromRolls(input);
    return msg ? { ok: true } : { ok: false, error: 'Failed to create comparative request.' };
  }
  const msg = await startStandardSkillFromRolls(input);
  return msg ? { ok: true } : { ok: false, error: 'Failed to create Skill Check request.' };
}

export function approachSkillKeys(approaches: RollsAllowedApproach[]): string[] {
  return approaches.map((a) => skillKeyFromRef(skillRefFromKey(a.skillKey)));
}

export function resolveRankForRow(actor: any, row: RollsParticipantSkillRow): number {
  return resolveSkillRank(actor, row.skillRef);
}
