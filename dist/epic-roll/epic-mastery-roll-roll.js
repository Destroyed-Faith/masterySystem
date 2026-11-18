/**
 * Epic Mastery Roll — participant roll execution.
 */
import { masteryRoll, showMasteryRollDice3d } from '../dice/roll-handler.js';
import { buildAttributeRollContext } from '../dice/roll-context-build.js';
import { participantResultFromRoll } from './epic-mastery-roll-types.js';
async function resolveStoneBonusRaises(_actor) {
    // Free Raises are declared on the roll. They are not applied automatically.
    return 0;
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
    return opts.hasRerollPoint && !opts.alreadyRerolled;
}
export async function buildEpicRollContext(session, actor, attributeKeyOverride) {
    const stoneBonusRaises = await resolveStoneBonusRaises(actor);
    const tnSpec = tnSpecFromSession(session);
    let built = null;
    if (session.roll.kind === 'attribute') {
        built = buildAttributeRollContext(actor, session.roll.attributeKey, tnSpec, stoneBonusRaises);
    }
    if (session.roll.kind === 'fear') {
        const { FEAR_CHECK_BAND_CLEAR, FEAR_CHECK_BAND_HARD } = await import('../combat/fear.js');
        const resolveRaw = Math.max(0, Math.floor(Number(actor?.system?.attributes?.resolve?.value) || 0));
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
                actorId: String(actor.id ?? ''),
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
    if (!built)
        return null;
    return {
        label: built.label,
        attributeKey: session.roll.attributeKey,
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
    const payload = {
        rollResult,
        isSkillRoll: ctx.isSkillRoll,
        baseModifier: ctx.baseModifier,
        raiseTn: ctx.raiseTn,
    };
    const awaitingConfirm = shouldStageEpicFailure({
        success: !!rollResult.success,
        // Reroll Points are a general meta resource (Fear Checks included).
        hasRerollPoint: canSpendEpicRerollPoint(actor),
        alreadyRerolled: isReroll || previous?.rerolled === true,
    });
    const usedAttribute = ctx.attributeKey || attributeKeyOverride || previous?.attributeKey;
    return participantResultFromRoll(actorId, actor.name ?? participant.actorName, ctx.label, rollResult, payload, {
        attributeKey: usedAttribute,
        awaitingConfirm,
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
export async function confirmEpicRollWithoutSpend(session, actorId) {
    const draft = session.results[actorId];
    if (!draft)
        return;
    await finalizeEpicParticipantResult(session, draft);
}
//# sourceMappingURL=epic-mastery-roll-roll.js.map