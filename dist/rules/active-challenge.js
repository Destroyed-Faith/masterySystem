/**
 * Active Challenge session (world) — group progress for Challenge Rolls.
 *
 * Professional Roles remain ordinary Professions/Perception/Untrained.
 * Combat Special Challenge(X) is unrelated.
 */
import { MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION, TYPICAL_COMPLEX_CHALLENGE_TARGET, TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET, } from './challenge-rolls.js';
export const ACTIVE_CHALLENGE_SETTING = 'activeChallenge';
export const ACTIVE_CHALLENGE_FLAG_SCOPE = 'mastery-system';
function newId() {
    try {
        return globalThis.foundry?.utils?.randomID?.() ?? `ch-${Date.now()}`;
    }
    catch {
        return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
export function normalizeActiveChallenge(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    const id = String(o.id || '').trim();
    const objective = String(o.objective || '').trim();
    const target = Math.max(1, Math.floor(Number(o.target) || 0));
    if (!id || !objective || target < 1)
        return null;
    const accumulated = Math.max(0, Math.floor(Number(o.accumulated) || 0));
    const contributorActorIds = Array.isArray(o.contributorActorIds)
        ? o.contributorActorIds.map((x) => String(x || '').trim()).filter(Boolean)
        : [];
    return {
        id,
        objective,
        target,
        accumulated,
        contributorActorIds,
        startedAt: Math.max(0, Math.floor(Number(o.startedAt) || 0)),
    };
}
export function isChallengeComplete(state) {
    return state.accumulated >= state.target;
}
export function actorAlreadyContributed(state, actorId) {
    const id = String(actorId || '').trim();
    if (!id)
        return false;
    return state.contributorActorIds.includes(id);
}
/** Pure: build a new active Challenge. */
export function planStartActiveChallenge(input) {
    const objective = String(input.objective || '').trim();
    if (!objective)
        return { ok: false, error: 'Name the Challenge objective.' };
    const target = Math.max(1, Math.floor(Number(input.target) || 0));
    if (target < 1)
        return { ok: false, error: 'Challenge target must be at least 1.' };
    return {
        ok: true,
        state: {
            id: String(input.id || '').trim() || newId(),
            objective,
            target,
            accumulated: 0,
            contributorActorIds: [],
            startedAt: Math.max(0, Math.floor(Number(input.startedAt) || Date.now())),
        },
    };
}
/**
 * Pure: apply one participant's Challenge Successes.
 * Marks the actor as having contributed even on 0 Successes (failed check).
 */
export function planRecordChallengeContribution(state, actorId, successes) {
    if (!state) {
        return {
            ok: false,
            state: null,
            successesApplied: 0,
            complete: false,
            error: 'No active Challenge.',
        };
    }
    const id = String(actorId || '').trim();
    if (!id) {
        return {
            ok: false,
            state,
            successesApplied: 0,
            complete: isChallengeComplete(state),
            error: 'Missing actor.',
        };
    }
    if (actorAlreadyContributed(state, id)) {
        return {
            ok: false,
            state,
            successesApplied: 0,
            complete: isChallengeComplete(state),
            error: 'Each participant ordinarily rolls once per Challenge.',
        };
    }
    const applied = Math.max(0, Math.min(MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION, Math.floor(Number(successes) || 0)));
    const next = {
        ...state,
        accumulated: state.accumulated + applied,
        contributorActorIds: [...state.contributorActorIds, id],
    };
    return {
        ok: true,
        state: next,
        successesApplied: applied,
        complete: isChallengeComplete(next),
    };
}
export function registerActiveChallengeSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING, {
            name: 'Active Challenge',
            hint: 'Current group Challenge Rolls progress (GM-managed).',
            scope: 'world',
            config: false,
            type: Object,
            default: null,
        });
    }
    catch (err) {
        console.warn('Mastery System | activeChallenge setting register failed', err);
    }
}
export function readActiveChallenge() {
    const g = globalThis;
    try {
        const raw = g.game?.settings?.get?.(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING);
        return normalizeActiveChallenge(raw);
    }
    catch {
        return null;
    }
}
async function writeActiveChallenge(state) {
    const g = globalThis;
    try {
        await g.game?.settings?.set?.(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING, state);
        return true;
    }
    catch (err) {
        console.warn('Mastery System | activeChallenge set failed', err);
        return false;
    }
}
function isGmUser() {
    return !!globalThis.game?.user?.isGM;
}
export async function startActiveChallenge(input) {
    if (!isGmUser())
        return { ok: false, error: 'Only the GM can start a Challenge.' };
    const planned = planStartActiveChallenge(input);
    if (!planned.ok)
        return planned;
    const wrote = await writeActiveChallenge(planned.state);
    if (!wrote)
        return { ok: false, error: 'Failed to save active Challenge.' };
    return { ok: true, state: planned.state };
}
export async function clearActiveChallenge() {
    if (!isGmUser())
        return { ok: false, error: 'Only the GM can clear a Challenge.' };
    const wrote = await writeActiveChallenge(null);
    if (!wrote)
        return { ok: false, error: 'Failed to clear active Challenge.' };
    return { ok: true };
}
export async function recordChallengeContribution(actorId, successes) {
    const current = readActiveChallenge();
    const planned = planRecordChallengeContribution(current, actorId, successes);
    if (!planned.ok || !planned.state)
        return planned;
    const wrote = await writeActiveChallenge(planned.state);
    if (!wrote) {
        return {
            ok: false,
            state: current,
            successesApplied: 0,
            complete: current ? isChallengeComplete(current) : false,
            error: 'Failed to save Challenge progress.',
        };
    }
    return planned;
}
export function typicalTargetOptions() {
    return [
        { value: TYPICAL_COMPLEX_CHALLENGE_TARGET, label: `Complex (${TYPICAL_COMPLEX_CHALLENGE_TARGET})` },
        {
            value: TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET,
            label: `Very complex (${TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET})`,
        },
    ];
}
//# sourceMappingURL=active-challenge.js.map