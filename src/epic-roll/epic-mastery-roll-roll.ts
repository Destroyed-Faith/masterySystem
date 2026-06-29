/**
 * Epic Mastery Roll — participant roll execution.
 */

import { masteryRoll } from '../dice/roll-handler.js';
import {
  buildAttributeRollContext,
  buildSaveRollContext,
  buildSkillRollContext,
} from '../dice/roll-context-build.js';
import { SKILLS } from '../utils/skills.js';
import type {
  EpicMasteryRollSession,
  EpicParticipantResult,
  EpicRollPayload,
} from './epic-mastery-roll-types.js';
import { participantResultFromRoll } from './epic-mastery-roll-types.js';
import { getSkillSpendOptions } from './epic-mastery-roll-skill-spend.js';

async function resolveStoneBonusRaises(actor: Actor): Promise<number> {
  try {
    const { getRoundState } = await import('../combat/action-economy.js');
    const combat = game.combat;
    if (!combat) return 0;
    const rs = getRoundState(actor, combat);
    return Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
  } catch {
    return 0;
  }
}

export async function pickSkillAttribute(
  actor: Actor,
  skillKey: string,
): Promise<string | null> {
  const def = SKILLS[skillKey];
  if (!def?.attributes?.length) return null;
  if (def.attributes.length === 1) return def.attributes[0]!;

  const system = (actor as any).system;
  const options = def.attributes
    .map((attr) => {
      const val = Number(system.attributes?.[attr]?.value ?? 0);
      const label = attr.charAt(0).toUpperCase() + attr.slice(1);
      return { attr, label, val };
    })
    .sort((a, b) => b.val - a.val);

  return new Promise((resolve) => {
    const buttons: Record<string, { label: string; callback?: () => void }> = {};
    for (const opt of options) {
      buttons[opt.attr] = {
        label: `${opt.label} (${opt.val}d8)`,
        callback: () => resolve(opt.attr),
      };
    }
    buttons.cancel = {
      label: 'Cancel',
      callback: () => resolve(null),
    };

    new Dialog(
      {
        title: `${def.name} — Choose Attribute`,
        content: `<p class="emr-attr-pick">Which attribute applies to this check?</p>`,
        buttons,
        default: options[0]?.attr,
      },
      { classes: ['mastery-system', 'mastery-roll-dialog'] },
    ).render(true);
  });
}

function tnSpecFromSession(session: EpicMasteryRollSession) {
  return {
    baseTN: session.tn.baseTN,
    raises: session.tn.raises,
  };
}

export interface EpicRollBuiltContext {
  label: string;
  skillKey?: string;
  isSkillRoll: boolean;
  baseModifier: number;
  raiseTn: number;
  rollOptions: Parameters<typeof masteryRoll>[0];
}

export async function buildEpicRollContext(
  session: EpicMasteryRollSession,
  actor: Actor,
  attributeKeyOverride?: string,
): Promise<EpicRollBuiltContext | null> {
  const stoneBonusRaises = await resolveStoneBonusRaises(actor);
  const tnSpec = tnSpecFromSession(session);
  let built = null;

  if (session.roll.kind === 'skill') {
    const attributeKey =
      attributeKeyOverride ?? (await pickSkillAttribute(actor, session.roll.skillKey));
    if (!attributeKey) return null;
    built = buildSkillRollContext(actor, session.roll.skillKey, attributeKey, tnSpec, stoneBonusRaises);
    if (!built) return null;
    return {
      label: built.label,
      skillKey: session.roll.skillKey,
      isSkillRoll: !!built.rollOptions.isSkillRoll,
      baseModifier: built.rollOptions.baseModifier ?? 0,
      raiseTn: built.rollOptions.raiseTn ?? tnSpec.baseTN + tnSpec.raises * 4,
      rollOptions: built.rollOptions,
    };
  }

  if (session.roll.kind === 'attribute') {
    built = buildAttributeRollContext(actor, session.roll.attributeKey, tnSpec, stoneBonusRaises);
  } else if (session.roll.kind === 'save') {
    built = buildSaveRollContext(actor, session.roll.saveType, tnSpec, stoneBonusRaises);
  }

  if (!built) return null;

  return {
    label: built.label,
    isSkillRoll: false,
    baseModifier: built.rollOptions.baseModifier ?? 0,
    raiseTn: built.rollOptions.raiseTn ?? tnSpec.baseTN + tnSpec.raises * 4,
    rollOptions: built.rollOptions,
  };
}

export async function executeEpicParticipantRoll(
  session: EpicMasteryRollSession,
  actorId: string,
  attributeKeyOverride?: string,
): Promise<EpicParticipantResult | null> {
  const actor = game.actors?.get(actorId);
  if (!actor) {
    ui.notifications?.error('Actor not found.');
    return null;
  }

  if (!game.user?.isGM && !actor.isOwner) {
    ui.notifications?.warn('You do not own this actor.');
    return null;
  }

  const participant = session.participants.find((p) => p.actorId === actorId);
  if (!participant || participant.status !== 'pending') {
    return null;
  }

  const ctx = await buildEpicRollContext(session, actor, attributeKeyOverride);
  if (!ctx) {
    ui.notifications?.error('Could not build roll context.');
    return null;
  }

  const rollResult = await masteryRoll({
    ...ctx.rollOptions,
    skipChat: true,
  });

  const payload: EpicRollPayload = {
    rollResult,
    skillKey: ctx.skillKey,
    isSkillRoll: ctx.isSkillRoll,
    baseModifier: ctx.baseModifier,
    raiseTn: ctx.raiseTn,
  };

  let awaitingConfirm = false;
  if (ctx.isSkillRoll && ctx.skillKey && !rollResult.success) {
    const { options } = getSkillSpendOptions(actor, ctx.skillKey, rollResult, ctx.baseModifier);
    awaitingConfirm = options.length > 0;
  }

  return participantResultFromRoll(
    actorId,
    actor.name ?? participant.actorName,
    ctx.label,
    rollResult,
    payload,
    {
      skillKey: ctx.skillKey,
      awaitingConfirm,
      skillSpent: 0,
    },
  );
}

export async function submitEpicParticipantResult(
  sessionId: string,
  result: EpicParticipantResult,
  opts?: { staged?: boolean },
): Promise<void> {
  if (game.user?.isGM) {
    const { ingestEpicMasteryRollResult } = await import('./epic-mastery-roll-session.js');
    await ingestEpicMasteryRollResult(sessionId, result, opts);
  } else {
    const { emitEpicMasteryRollResult } = await import('./epic-mastery-roll-socket.js');
    emitEpicMasteryRollResult(sessionId, result, opts);
  }
}

export async function performEpicParticipantRoll(
  session: EpicMasteryRollSession,
  actorId: string,
  attributeKeyOverride?: string,
): Promise<EpicParticipantResult | null> {
  const result = await executeEpicParticipantRoll(session, actorId, attributeKeyOverride);
  if (!result) return null;

  const staged = result.awaitingConfirm === true;
  await submitEpicParticipantResult(session.id, result, { staged });
  return result;
}

export async function finalizeEpicParticipantResult(
  session: EpicMasteryRollSession,
  result: EpicParticipantResult,
): Promise<void> {
  const finalized: EpicParticipantResult = {
    ...result,
    awaitingConfirm: false,
    rollPayload: undefined,
  };
  await submitEpicParticipantResult(session.id, finalized, { staged: false });
}

export async function applyEpicSkillSpendAndFinalize(
  session: EpicMasteryRollSession,
  actorId: string,
  spendAmount: number,
): Promise<void> {
  const draft = session.results[actorId];
  if (!draft?.rollPayload || !draft.skillKey) return;

  const actor = game.actors?.get(actorId);
  if (!actor) return;

  const { applySkillSpendToActor, totalsAfterSkillSpend } = await import(
    './epic-mastery-roll-skill-spend.js'
  );

  await applySkillSpendToActor(actor, draft.skillKey, spendAmount);
  const { total, success, raises, skill } = totalsAfterSkillSpend(
    draft.rollPayload.rollResult,
    spendAmount,
    draft.rollPayload.baseModifier,
  );

  const rollResult = {
    ...draft.rollPayload.rollResult,
    total,
    success,
    raises,
    skill,
  };

  const finalized = participantResultFromRoll(
    actorId,
    draft.actorName,
    draft.label,
    rollResult,
    draft.rollPayload,
    {
      skillKey: draft.skillKey,
      skillSpent: spendAmount,
      awaitingConfirm: false,
    },
  );

  await finalizeEpicParticipantResult(session, finalized);
}

export async function confirmEpicRollWithoutSpend(
  session: EpicMasteryRollSession,
  actorId: string,
): Promise<void> {
  const draft = session.results[actorId];
  if (!draft) return;
  await finalizeEpicParticipantResult(session, draft);
}
