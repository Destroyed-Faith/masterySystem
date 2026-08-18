/**
 * Epic Mastery Roll — participant roll execution.
 */
import { masteryRoll, showMasteryRollDice3d } from '../dice/roll-handler.js';
import { buildAttributeRollContext, buildSkillRollContext, getSkillRollDicePool, } from '../dice/roll-context-build.js';
import { SKILLS } from '../utils/skills.js';
import { participantResultFromRoll } from './epic-mastery-roll-types.js';
import { getSkillSpendOptions } from './epic-mastery-roll-skill-spend.js';
async function resolveStoneBonusRaises(actor) {
    try {
        const { getRoundState } = await import('../combat/action-economy.js');
        const combat = game.combat;
        if (!combat)
            return 0;
        const rs = getRoundState(actor, combat);
        return Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
    }
    catch {
        return 0;
    }
}
export async function pickSkillAttribute(actor, skillKey) {
    const def = SKILLS[skillKey];
    if (!def?.attributes?.length)
        return null;
    if (def.attributes.length === 1)
        return def.attributes[0];
    const options = def.attributes
        .map((attr) => {
        const pool = getSkillRollDicePool(actor, skillKey, attr);
        const label = attr.charAt(0).toUpperCase() + attr.slice(1);
        return { attr, label, pool };
    })
        .sort((a, b) => b.pool.numDice - a.pool.numDice);
    return new Promise((resolve) => {
        const buttons = {};
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
        new Dialog({
            title: `${def.name} — Choose Attribute`,
            content: `<p class="emr-attr-pick">Which attribute applies to this check?</p>`,
            buttons,
            default: options[0]?.attr,
        }, { classes: ['mastery-system', 'mastery-roll-dialog'] }).render(true);
    });
}
function tnSpecFromSession(session) {
    return {
        baseTN: session.tn.baseTN,
        raises: session.tn.raises,
    };
}
export function shouldStageEpicFailure(opts) {
    if (opts.success)
        return false;
    return opts.hasSkillSpend || (opts.hasRerollPoint && !opts.alreadyRerolled);
}
export async function buildEpicRollContext(session, actor, attributeKeyOverride) {
    const stoneBonusRaises = await resolveStoneBonusRaises(actor);
    const tnSpec = tnSpecFromSession(session);
    let built = null;
    if (session.roll.kind === 'skill') {
        const attributeKey = attributeKeyOverride ?? (await pickSkillAttribute(actor, session.roll.skillKey));
        if (!attributeKey)
            return null;
        built = buildSkillRollContext(actor, session.roll.skillKey, attributeKey, tnSpec, stoneBonusRaises);
        if (!built)
            return null;
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
    if (!built)
        return null;
    return {
        label: built.label,
        attributeKey: session.roll.kind === 'attribute' ? session.roll.attributeKey : built.attributeKey,
        isSkillRoll: false,
        baseModifier: built.rollOptions.baseModifier ?? 0,
        raiseTn: built.rollOptions.raiseTn ?? tnSpec.baseTN + tnSpec.raises * 4,
        rollOptions: built.rollOptions,
    };
}
export function actorEpicRerollPoints(actor) {
    const system = actor?.system;
    return {
        current: Math.max(0, Math.floor(Number(system?.faithFractures?.current) || 0)),
        maximum: Math.max(0, Math.floor(Number(system?.faithFractures?.maximum) || 0)),
    };
}
export function canSpendEpicRerollPoint(actor) {
    return actorEpicRerollPoints(actor).current >= 1;
}
export async function executeEpicParticipantRoll(session, actorId, attributeKeyOverride, opts) {
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
    if (!participant)
        return null;
    if (isReroll) {
        if (participant.status !== 'awaiting_spend' || previous?.rerolled || previous?.success) {
            return null;
        }
    }
    else if (participant.status !== 'pending') {
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
    await showMasteryRollDice3d(rollResult, ctx.rollOptions.skill ?? 0);
    const payload = {
        rollResult,
        skillKey: ctx.skillKey,
        isSkillRoll: ctx.isSkillRoll,
        baseModifier: ctx.baseModifier,
        raiseTn: ctx.raiseTn,
    };
    const hasSkillSpend = !rollResult.success &&
        !!ctx.isSkillRoll &&
        !!ctx.skillKey &&
        getSkillSpendOptions(actor, ctx.skillKey, rollResult, ctx.baseModifier).options.length > 0;
    const awaitingConfirm = shouldStageEpicFailure({
        success: !!rollResult.success,
        hasSkillSpend,
        hasRerollPoint: canSpendEpicRerollPoint(actor),
        alreadyRerolled: isReroll || previous?.rerolled === true,
    });
    const usedAttribute = ctx.attributeKey || attributeKeyOverride || previous?.attributeKey;
    return participantResultFromRoll(actorId, actor.name ?? participant.actorName, ctx.label, rollResult, payload, {
        skillKey: ctx.skillKey,
        attributeKey: usedAttribute,
        awaitingConfirm,
        skillSpent: 0,
        rerolled: isReroll || previous?.rerolled === true,
    });
}
export async function submitEpicParticipantResult(sessionId, result, opts) {
    if (game.user?.isGM) {
        const { ingestEpicMasteryRollResult } = await import('./epic-mastery-roll-session.js');
        await ingestEpicMasteryRollResult(sessionId, result, opts);
    }
    else {
        const { emitEpicMasteryRollResult } = await import('./epic-mastery-roll-socket.js');
        emitEpicMasteryRollResult(sessionId, result, opts);
    }
}
export async function performEpicParticipantRoll(session, actorId, attributeKeyOverride) {
    const result = await executeEpicParticipantRoll(session, actorId, attributeKeyOverride);
    if (!result)
        return null;
    const staged = result.awaitingConfirm === true;
    await submitEpicParticipantResult(session.id, result, { staged });
    return result;
}
export async function performEpicParticipantReroll(session, actorId) {
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
export async function finalizeEpicParticipantResult(session, result) {
    const finalized = {
        ...result,
        awaitingConfirm: false,
        rollPayload: undefined,
    };
    await submitEpicParticipantResult(session.id, finalized, { staged: false });
}
export async function applyEpicSkillSpendAndFinalize(session, actorId, spendAmount) {
    const draft = session.results[actorId];
    if (!draft?.rollPayload || !draft.skillKey)
        return;
    const actor = game.actors?.get(actorId);
    if (!actor)
        return;
    const { applySkillSpendToActor, totalsAfterSkillSpend } = await import('./epic-mastery-roll-skill-spend.js');
    await applySkillSpendToActor(actor, draft.skillKey, spendAmount);
    const { total, success, raises, skill } = totalsAfterSkillSpend(draft.rollPayload.rollResult, spendAmount, draft.rollPayload.baseModifier);
    const rollResult = {
        ...draft.rollPayload.rollResult,
        total,
        success,
        raises,
        skill,
    };
    const finalized = participantResultFromRoll(actorId, draft.actorName, draft.label, rollResult, draft.rollPayload, {
        skillKey: draft.skillKey,
        attributeKey: draft.attributeKey,
        skillSpent: spendAmount,
        rerolled: draft.rerolled === true,
        awaitingConfirm: false,
    });
    await finalizeEpicParticipantResult(session, finalized);
}
export async function confirmEpicRollWithoutSpend(session, actorId) {
    const draft = session.results[actorId];
    if (!draft)
        return;
    await finalizeEpicParticipantResult(session, draft);
}
//# sourceMappingURL=epic-mastery-roll-roll.js.map