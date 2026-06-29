/**
 * Epic Mastery Roll — participant roll execution (no session side-effects).
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
} from './epic-mastery-roll-types.js';
import { formatDiceSummary } from './epic-mastery-roll-types.js';

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

  const stoneBonusRaises = await resolveStoneBonusRaises(actor);
  const tnSpec = tnSpecFromSession(session);
  let built = null;

  if (session.roll.kind === 'skill') {
    const attributeKey =
      attributeKeyOverride ?? (await pickSkillAttribute(actor, session.roll.skillKey));
    if (!attributeKey) return null;
    built = buildSkillRollContext(actor, session.roll.skillKey, attributeKey, tnSpec, stoneBonusRaises);
  } else if (session.roll.kind === 'attribute') {
    built = buildAttributeRollContext(actor, session.roll.attributeKey, tnSpec, stoneBonusRaises);
  } else if (session.roll.kind === 'save') {
    built = buildSaveRollContext(actor, session.roll.saveType, tnSpec, stoneBonusRaises);
  }

  if (!built) {
    ui.notifications?.error('Could not build roll context.');
    return null;
  }

  const rollResult = await masteryRoll({
    ...built.rollOptions,
    skipChat: true,
  });

  return {
    actorId,
    actorName: actor.name ?? participant.actorName,
    label: built.label,
    total: rollResult.total,
    normalTn: rollResult.tn ?? session.tn.baseTN,
    success: rollResult.success,
    raises: rollResult.raises ?? 0,
    diceSummary: formatDiceSummary(rollResult.kept),
  };
}

export async function submitEpicParticipantResult(
  sessionId: string,
  result: EpicParticipantResult,
): Promise<void> {
  if (game.user?.isGM) {
    const { ingestEpicMasteryRollResult } = await import('./epic-mastery-roll-session.js');
    await ingestEpicMasteryRollResult(sessionId, result);
  } else {
    const { emitEpicMasteryRollResult } = await import('./epic-mastery-roll-socket.js');
    emitEpicMasteryRollResult(sessionId, result);
  }
}

export async function performEpicParticipantRoll(
  session: EpicMasteryRollSession,
  actorId: string,
  attributeKeyOverride?: string,
): Promise<EpicParticipantResult | null> {
  const result = await executeEpicParticipantRoll(session, actorId, attributeKeyOverride);
  if (!result) return null;
  await submitEpicParticipantResult(session.id, result);
  return result;
}
