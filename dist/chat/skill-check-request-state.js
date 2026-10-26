/**
 * Pure state helpers for chat-driven Skill Check requests.
 * No Foundry globals — unit-testable.
 */
import { skillRefsEqual } from '../rules/index.js';
export const SKILL_CHECK_REQUEST_SCHEMA = 'df-skill-check-request-chat-driven-2026-10-26';
export function canActorJoinRequest(payload, actorId) {
    if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled')
        return false;
    const existing = payload.participants[actorId];
    if (existing?.status === 'rolled')
        return false;
    if (existing?.status === 'approved')
        return false;
    if (existing?.status === 'proposed')
        return false;
    if (existing?.status === 'declined')
        return false;
    // rejected → may submit a revised proposal
    if (payload.invitedActorIds.length > 0 && !payload.invitedActorIds.includes(actorId)) {
        return false;
    }
    return true;
}
export function applyDecline(payload, actorId) {
    return {
        ...payload,
        participants: {
            ...payload.participants,
            [actorId]: { actorId, status: 'declined' },
        },
    };
}
export function applyProposal(payload, actorId, proposal) {
    return {
        ...payload,
        lifecycle: payload.lifecycle === 'completed' ? payload.lifecycle : 'open',
        participants: {
            ...payload.participants,
            [actorId]: {
                actorId,
                status: 'proposed',
                proposedSkill: proposal.skill,
                proposedAttributeKey: proposal.attributeKey,
                explanation: proposal.explanation?.trim() || undefined,
            },
        },
    };
}
export function applyReject(payload, actorId) {
    const prev = payload.participants[actorId];
    if (!prev)
        return payload;
    return {
        ...payload,
        participants: {
            ...payload.participants,
            [actorId]: {
                ...prev,
                status: 'rejected',
                skill: undefined,
                attributeKey: undefined,
                baseTn: undefined,
            },
        },
    };
}
export function applyApprove(payload, actorId, opts) {
    const prev = payload.participants[actorId];
    if (!prev)
        return payload;
    const skill = opts?.skill ?? prev.proposedSkill ?? prev.skill;
    const attributeKey = opts?.attributeKey ?? prev.proposedAttributeKey ?? prev.attributeKey ?? 'wits';
    if (!skill)
        return payload;
    const baseTn = payload.mode === 'comparative'
        ? 0
        : opts?.baseTn != null
            ? Math.max(0, Math.floor(Number(opts.baseTn) || 0))
            : prev.baseTn != null
                ? Math.max(0, Math.floor(Number(prev.baseTn) || 0))
                : Math.max(0, Math.floor(Number(payload.baseTn) || 0));
    return {
        ...payload,
        lifecycle: 'rolling',
        participants: {
            ...payload.participants,
            [actorId]: {
                ...prev,
                status: 'approved',
                skill,
                attributeKey,
                baseTn,
            },
        },
    };
}
export function applyRollResult(payload, actorId, result) {
    const prev = payload.participants[actorId];
    if (!prev || prev.status !== 'approved')
        return payload;
    return {
        ...payload,
        participants: {
            ...payload.participants,
            [actorId]: {
                ...prev,
                status: 'rolled',
                ...result,
            },
        },
    };
}
export function approvedAssignment(payload, actorId) {
    const p = payload.participants[actorId];
    if (!p || (p.status !== 'approved' && p.status !== 'rolled'))
        return null;
    if (!p.skill || !p.attributeKey)
        return null;
    return {
        skill: p.skill,
        attributeKey: p.attributeKey,
        baseTn: payload.mode === 'comparative' ? 0 : Math.max(0, Math.floor(Number(p.baseTn ?? payload.baseTn) || 0)),
        taskDescription: payload.taskDescription,
        mode: payload.mode,
    };
}
/** True when every active (non-declined) participant has finished or none remain. */
export function readyToFinalize(payload) {
    const entries = Object.values(payload.participants);
    const active = entries.filter((p) => p.status !== 'declined' && p.status !== 'rejected');
    if (!active.length)
        return true;
    return active.every((p) => p.status === 'rolled');
}
export function listJoinableActorIds(payload, allPcIds) {
    return allPcIds.filter((id) => canActorJoinRequest(payload, id));
}
export function proposalFingerprint(p) {
    const skill = p.proposedSkill ?? p.skill;
    const attr = p.proposedAttributeKey ?? p.attributeKey ?? '';
    const skillKey = !skill
        ? ''
        : skill.kind === 'specialization' || skill.kind === 'npc-situational'
            ? `${skill.kind}:${skill.id}`
            : skill.kind;
    return `${skillKey}|${attr}|${p.explanation || ''}`;
}
export function skillsMatch(a, b) {
    if (!a || !b)
        return false;
    return skillRefsEqual(a, b);
}
//# sourceMappingURL=skill-check-request-state.js.map