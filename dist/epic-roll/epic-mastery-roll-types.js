/**
 * Epic Mastery Roll — shared types.
 */
import { SKILLS } from '../utils/skills.js';
export function formatDiceSummary(kept) {
    if (!kept?.length)
        return '—';
    return kept.join(', ');
}
export function countResolvedParticipants(session) {
    return session.participants.filter((p) => p.status === 'rolled' || p.status === 'skipped').length;
}
export function isSessionReadyToComplete(session) {
    if (session.status !== 'active')
        return false;
    return session.participants.every((p) => p.status === 'rolled' || p.status === 'skipped');
}
export function mergeParticipantResult(session, result, opts) {
    const staged = opts?.staged ?? result.awaitingConfirm === true;
    const participants = session.participants.map((p) => p.actorId === result.actorId
        ? {
            ...p,
            status: result.skipped
                ? 'skipped'
                : staged
                    ? 'awaiting_spend'
                    : 'rolled',
        }
        : p);
    return {
        ...session,
        participants,
        results: { ...session.results, [result.actorId]: result },
    };
}
export function skipParticipantInSession(session, actorId) {
    const participant = session.participants.find((p) => p.actorId === actorId);
    if (!participant)
        return session;
    const result = {
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
export function rollLabelForConfig(roll) {
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
export function participantResultFromRoll(actorId, actorName, label, rollResult, payload, opts = {}) {
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
//# sourceMappingURL=epic-mastery-roll-types.js.map