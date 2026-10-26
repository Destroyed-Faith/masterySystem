/**
 * Shared execution path for ordinary Skill Checks (sheet + GM request).
 * Authoritative Attribute / Skill / Base TN come from the draft source.
 */

import {
  authoritativeCheckContext,
  buildSkillCheckResolvedSnapshot,
  consumeSkillCritUse,
  findSpecializationById,
  getSkillCritUsesRemaining,
  planSkillCheckDraft,
  readSpecializations,
  skillAdvantageLabel,
  validateAgainstGmAssignment,
  type SkillCheckDraft,
  type SkillCheckResolvedSnapshot,
  type SkillCheckSkillRef,
} from '../rules/index.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

export interface ExecuteSkillCheckOptions {
  actor: any;
  draft: SkillCheckDraft;
  flavorExtra?: string;
  /**
   * When rolling from a GM request, pass the authoritative assignment so
   * client-forged Skill / Attribute / TN overrides are rejected.
   */
  gmAssignment?: {
    attributeKey: string;
    baseTn: number;
    skill: SkillCheckSkillRef;
    allowedSkills?: SkillCheckSkillRef[];
  };
}

export interface ExecuteSkillCheckResult {
  ok: boolean;
  error?: string;
  snapshot?: SkillCheckResolvedSnapshot;
}

export async function executeSkillCheck(
  opts: ExecuteSkillCheckOptions,
): Promise<ExecuteSkillCheckResult> {
  const actor = opts.actor;
  if (!actor) return { ok: false, error: 'No actor.' };
  const system = actor.system ?? {};
  let draft: SkillCheckDraft = {
    ...opts.draft,
    actorId: String(actor.id ?? opts.draft.actorId),
  };

  // Re-apply authoritative source fields (ignore forged draft mirrors).
  const ctx = authoritativeCheckContext(draft);
  draft = {
    ...draft,
    skill: ctx.skill,
    attributeKey: ctx.attributeKey,
    baseTn: ctx.baseTn,
    taskDescription: ctx.taskDescription,
  };

  if (opts.gmAssignment) {
    const gate = validateAgainstGmAssignment(draft, opts.gmAssignment);
    if (!gate.ok) return { ok: false, error: gate.error };
    // Force assignment onto source + draft
    if (draft.source.kind === 'gm-request') {
      draft.source = {
        ...draft.source,
        attributeKey: opts.gmAssignment.attributeKey,
        baseTn: opts.gmAssignment.baseTn,
        skill: opts.gmAssignment.skill,
        ...(opts.gmAssignment.allowedSkills?.length
          ? { allowedSkills: opts.gmAssignment.allowedSkills }
          : {}),
      };
      draft.skill = opts.gmAssignment.skill;
      draft.attributeKey = opts.gmAssignment.attributeKey;
      draft.baseTn = opts.gmAssignment.baseTn;
    }
  }

  // Refresh NPC situational snapshot from actor at resolve time
  if (draft.skill.kind === 'npc-situational') {
    const { findSituationalSkillById, readSituationalSkills } = await import(
      '../rules/index.js'
    );
    const s = findSituationalSkillById(readSituationalSkills(system), draft.skill.id);
    if (!s) return { ok: false, error: 'Situational skill not found on this NPC.' };
    draft.npcSituational = {
      skillId: s.id,
      skillName: s.name,
      poolDice: s.poolDice,
      skillRank: s.skillRank,
    };
  }

  const plan = planSkillCheckDraft({ system, draft, requireKnownSkill: true });
  if (!plan.ok) return { ok: false, error: plan.error || 'Invalid Skill Check.' };

  const isNpcSituational = !!draft.npcSituational || draft.skill.kind === 'npc-situational';

  let equipPenalty = 0;
  if (!isNpcSituational && draft.skill.kind === 'specialization') {
    const spec = findSpecializationById(readSpecializations(system), draft.skill.id);
    if (spec?.field === 'physical') {
      equipPenalty = Math.max(0, Number(getEquippedPhysicalSkillPenaltyDice(actor)) || 0);
    }
  }

  const mr = getRulesMasteryRank(actor) || plan.masteryRank;
  const keepDice = Math.max(1, Math.min(plan.numDice, Math.floor(Number(mr) || plan.keepDice)));
  const numDice = Math.max(0, plan.numDice - equipPenalty);
  const attrLabel =
    plan.attributeKey.charAt(0).toUpperCase() + plan.attributeKey.slice(1);
  const label = `${plan.skillName} Check`;
  const verified = plan.gmVerified ? ' · GM-verified request' : ' · GM-announced (local)';

  let skillCritActive = false;
  if (draft.declareSkillCrit && plan.skillCritTrackId) {
    const remaining = getSkillCritUsesRemaining(actor, plan.skillCritTrackId, plan.rank);
    if (remaining <= 0) {
      return { ok: false, error: 'No Skill Crit uses remaining for this Skill today.' };
    }
    const spent = await consumeSkillCritUse(actor, plan.skillCritTrackId, plan.rank);
    if (!spent) {
      return { ok: false, error: 'Failed to spend Skill Crit use.' };
    }
    skillCritActive = true;
  }

  const advLabel = skillAdvantageLabel(plan.rank);
  let flavor = '';
  if (isNpcSituational) {
    flavor = `${plan.taskDescription ? `${plan.taskDescription} · ` : ''}NPC ${plan.skillName} (Rank ${plan.rank}) · Pool ${numDice}k${keepDice} · Base TN ${plan.baseTn} · Paid ${plan.paidRaises} (+${plan.paidRaises * 4}) · Final TN ${plan.finalTn} · ${advLabel}${verified}.`;
  } else {
    flavor = `${plan.taskDescription ? `${plan.taskDescription} · ` : ''}${plan.skillName} (Rank ${plan.rank}) · ${attrLabel} ${plan.attributeValue}d8 keep ${keepDice} · Base TN ${plan.baseTn} · Paid ${plan.paidRaises} (+${plan.paidRaises * 4}) · Final TN ${plan.finalTn} · ${advLabel}${verified}.`;
    if (plan.rollDisadvantage) {
      flavor = `${plan.taskDescription ? `${plan.taskDescription} · ` : ''}Untrained · ${attrLabel} ${plan.attributeValue}d8 keep ${keepDice} with Disadvantage · Base TN ${plan.baseTn} · Final TN ${plan.finalTn} · 0 Raises${verified}.`;
    }
  }
  if (skillCritActive) {
    flavor += ' Skill Crit: explode on 7–8.';
  }
  if (equipPenalty > 0) {
    flavor += ` Equipped armor/shield physical penalty: −${equipPenalty}d8.`;
  }
  if (opts.flavorExtra) flavor += ` ${opts.flavorExtra}`;

  const normalizedName = plan.skillName.trim().toLowerCase();
  const { masteryRoll } = await import('../dice/roll-handler.js');

  const result = await masteryRoll({
    numDice,
    keepDice,
    skill: 0,
    tn: plan.baseTn,
    normalTn: plan.baseTn,
    raiseTn: plan.finalTn,
    declaredRaiseSlots: plan.paidRaises,
    stoneBonusRaises: 0,
    freeRaisesAvailableAtSuccess: 0,
    raiseModel: 'skill',
    rollDisadvantage: plan.rollDisadvantage,
    skillAdvantageRerollMax: plan.rollDisadvantage ? 0 : plan.skillAdvantageRerollMax,
    attackExplodeDiceOn78: skillCritActive,
    label,
    flavor,
    actorId: String(actor.id),
    ...(normalizedName === 'stealth' ? { skillKey: 'stealth' } : {}),
    ...(normalizedName === 'perception' ? { skillKey: 'perception' } : {}),
    isSkillRoll: true,
    baseModifier: 0,
    rollKind: 'skill',
    ...(isNpcSituational ? {} : { poolAttribute: plan.attributeKey }),
    applyPoolPenalties: !isNpcSituational,
    autoFailIntent: 'skill',
    checkContext: {
      skillKey: normalizedName || undefined,
      ...(normalizedName === 'perception' ? { tags: ['sight'] } : {}),
    },
    skillCheckMeta: {
      source: draft.source,
      skillRankAtRoll: plan.rank,
      paidRaisesDeclared: plan.paidRaises,
      freeRaisesAvailableAtSuccess: 0,
      skillName: plan.skillName,
      attributeKey: plan.attributeKey,
      taskDescription: plan.taskDescription,
      gmVerified: plan.gmVerified,
    },
  } as any);

  const success = !!result?.success;
  const rollTotal = Number(result?.total) || 0;
  const snapshot = buildSkillCheckResolvedSnapshot({
    plan: { ...plan, keepDice, numDice },
    actorId: String(actor.id),
    source: draft.source,
    rollTotal,
    success,
  });

  return { ok: true, snapshot };
}
