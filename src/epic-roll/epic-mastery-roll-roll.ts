/**
 * Epic Mastery Roll — participant roll execution.
 */

import { masteryRoll, showMasteryRollDice3d } from '../dice/roll-handler.js';
import {
  buildAttributeRollContext,
  buildSkillRollContext,
  getSkillRollDicePool,
} from '../dice/roll-context-build.js';
import { SKILLS } from '../utils/skills.js';
import type {
  EpicMasteryRollSession,
  EpicParticipantResult,
  EpicRollPayload,
} from './epic-mastery-roll-types.js';
import { participantResultFromRoll } from './epic-mastery-roll-types.js';
import { getSkillSpendOptions } from './epic-mastery-roll-skill-spend.js';

async function resolveStoneBonusRaises(_actor: Actor): Promise<number> {
  // Free Raises are declared on the roll. They are not applied automatically.
  return 0;
}

export async function pickSkillAttribute(
  actor: Actor,
  skillKey: string,
): Promise<string | null> {
  const def = SKILLS[skillKey];
  if (!def?.attributes?.length) return null;
  if (def.attributes.length === 1) return def.attributes[0]!;

  const options = def.attributes
    .map((attr) => {
      const pool = getSkillRollDicePool(actor, skillKey, attr);
      const label = attr.charAt(0).toUpperCase() + attr.slice(1);
      return { attr, label, pool };
    })
    .sort((a, b) => b.pool.numDice - a.pool.numDice);

  return new Promise((resolve) => {
    const buttons: Record<string, { label: string; callback?: () => void }> = {};
    for (const opt of options) {
      buttons[opt.attr] = {
        label: `${opt.label} (${opt.pool.numDice}d8, keep ${opt.pool.keepDice})`,
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
  attributeKey?: string;
  isSkillRoll: boolean;
  baseModifier: number;
  raiseTn: number;
  rollOptions: Parameters<typeof masteryRoll>[0];
}

export function shouldStageEpicFailure(opts: {
  success: boolean;
  hasSkillSpend: boolean;
  hasRerollPoint: boolean;
  alreadyRerolled: boolean;
}): boolean {
  if (opts.success) return false;
  return opts.hasSkillSpend || (opts.hasRerollPoint && !opts.alreadyRerolled);
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
      attributeKey,
      isSkillRoll: !!built.rollOptions.isSkillRoll,
      baseModifier: built.rollOptions.baseModifier ?? 0,
      raiseTn: built.rollOptions.raiseTn ?? tnSpec.baseTN + tnSpec.raises * 4,
      rollOptions: built.rollOptions,
    };
  }

  if (session.roll.kind === 'attribute') {
    built = buildAttributeRollContext(actor, session.roll.attributeKey, tnSpec, stoneBonusRaises);
  }

  if (session.roll.kind === 'fear') {
    const { FEAR_CHECK_BAND_CLEAR, FEAR_CHECK_BAND_HARD } = await import('../combat/fear.js');
    const resolveRaw = Math.max(
      0,
      Math.floor(Number((actor as any)?.system?.attributes?.resolve?.value) || 0),
    );
    const { finalizeRolledPool } = await import('../dice/pool-finalize.js');
    const finalized = finalizeRolledPool(actor, resolveRaw, 1, {
      rollKind: 'generic',
      poolAttribute: 'resolve',
      applyPoolPenalties: true,
    });
    const label = `Fear Check (Resolve k1 — bands ${FEAR_CHECK_BAND_HARD} / ${FEAR_CHECK_BAND_CLEAR})`;
    return {
      label,
      attributeKey: 'resolve',
      isSkillRoll: false,
      baseModifier: 0,
      raiseTn: FEAR_CHECK_BAND_CLEAR,
      rollOptions: {
        numDice: finalized.numDice,
        keepDice: 1,
        skill: 0,
        tn: FEAR_CHECK_BAND_CLEAR,
        normalTn: FEAR_CHECK_BAND_CLEAR,
        label,
        flavor: [
          `No Skill Points / Raises · <${FEAR_CHECK_BAND_HARD} → +2 Fear · <${FEAR_CHECK_BAND_CLEAR} → +1 Fear · ≥${FEAR_CHECK_BAND_CLEAR} → none`,
          ...finalized.notes,
        ].join(' · '),
        actorId: String((actor as any).id ?? ''),
        actorRef: actor,
        rollKind: 'generic',
        poolAttribute: 'resolve',
        applyPoolPenalties: false,
        applyFear: false,
        guaranteedEights: 0,
        raiseModel: 'margin',
        isSkillRoll: false,
      },
    };
  }

  if (!built) return null;

  return {
    label: built.label,
    attributeKey: session.roll.kind === 'attribute' ? session.roll.attributeKey : built.attributeKey,
    isSkillRoll: false,
    baseModifier: built.rollOptions.baseModifier ?? 0,
    raiseTn: built.rollOptions.raiseTn ?? tnSpec.baseTN + tnSpec.raises * 4,
    rollOptions: built.rollOptions,
  };
}

export function actorEpicRerollPoints(actor: Actor | null | undefined): {
  current: number;
  maximum: number;
} {
  const system = (actor as any)?.system;
  return {
    current: Math.max(0, Math.floor(Number(system?.faithFractures?.current) || 0)),
    maximum: Math.max(0, Math.floor(Number(system?.faithFractures?.maximum) || 0)),
  };
}

export function canSpendEpicRerollPoint(actor: Actor | null | undefined): boolean {
  return actorEpicRerollPoints(actor).current >= 1;
}

export async function executeEpicParticipantRoll(
  session: EpicMasteryRollSession,
  actorId: string,
  attributeKeyOverride?: string,
  opts?: { reroll?: boolean },
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
  const previous = session.results[actorId];
  const isReroll = opts?.reroll === true;
  if (!participant) return null;
  if (isReroll) {
    if (participant.status !== 'awaiting_spend' || previous?.rerolled || previous?.success) {
      return null;
    }
  } else if (participant.status !== 'pending') {
    return null;
  }

  const ctx = await buildEpicRollContext(session, actor, attributeKeyOverride);
  if (!ctx) {
    ui.notifications?.error('Could not build roll context.');
    return null;
  }

  let rollResult = await masteryRoll({
    ...ctx.rollOptions,
    skipChat: true,
  });

  await showMasteryRollDice3d(rollResult, ctx.rollOptions.skill ?? 0);

  if (session.roll.kind === 'fear') {
    const { fearGainedFromCheckTotal, FEAR_CHECK_BAND_CLEAR } = await import('../combat/fear.js');
    const gained = fearGainedFromCheckTotal(rollResult.total);
    rollResult = {
      ...rollResult,
      success: gained === 0,
      raises: 0,
      tn: FEAR_CHECK_BAND_CLEAR,
      normalTn: FEAR_CHECK_BAND_CLEAR,
    };
  }

  const payload: EpicRollPayload = {
    rollResult,
    skillKey: ctx.skillKey,
    isSkillRoll: ctx.isSkillRoll,
    baseModifier: ctx.baseModifier,
    raiseTn: ctx.raiseTn,
  };

  const hasSkillSpend =
    session.roll.kind !== 'fear' &&
    !rollResult.success &&
    !!ctx.isSkillRoll &&
    !!ctx.skillKey &&
    getSkillSpendOptions(actor, ctx.skillKey, rollResult, ctx.baseModifier).options.length > 0;
  const awaitingConfirm = shouldStageEpicFailure({
    success: !!rollResult.success,
    hasSkillSpend,
    // Fear Checks: no Skill Points; Reroll Points remain available as a general meta resource.
    hasRerollPoint: canSpendEpicRerollPoint(actor),
    alreadyRerolled: isReroll || previous?.rerolled === true,
  });

  const usedAttribute = ctx.attributeKey || attributeKeyOverride || previous?.attributeKey;

  return participantResultFromRoll(
    actorId,
    actor.name ?? participant.actorName,
    ctx.label,
    rollResult,
    payload,
    {
      skillKey: ctx.skillKey,
      attributeKey: usedAttribute,
      awaitingConfirm,
      skillSpent: 0,
      rerolled: isReroll || previous?.rerolled === true,
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

export async function performEpicParticipantReroll(
  session: EpicMasteryRollSession,
  actorId: string,
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

  const draft = session.results[actorId];
  const participant = session.participants.find((p) => p.actorId === actorId);
  if (!draft || draft.success || draft.rerolled || participant?.status !== 'awaiting_spend') {
    return null;
  }
  if (!canSpendEpicRerollPoint(actor)) {
    ui.notifications?.warn('No Reroll Points left.');
    return null;
  }

  const { current } = actorEpicRerollPoints(actor);
  await actor.update({ 'system.faithFractures.current': current - 1 });

  const result = await executeEpicParticipantRoll(session, actorId, draft.attributeKey, {
    reroll: true,
  });
  if (!result) {
    await actor.update({ 'system.faithFractures.current': current });
    return null;
  }

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
      attributeKey: draft.attributeKey,
      skillSpent: spendAmount,
      rerolled: draft.rerolled === true,
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
