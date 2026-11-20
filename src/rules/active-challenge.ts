/**
 * Active Challenge session (world) — group progress for Challenge Rolls.
 *
 * Professional Roles remain ordinary Professions/Perception/Untrained.
 * Combat Special Challenge(X) is unrelated.
 */

import {
  MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION,
  TYPICAL_COMPLEX_CHALLENGE_TARGET,
  TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET,
} from './challenge-rolls.js';

export const ACTIVE_CHALLENGE_SETTING = 'activeChallenge';
export const ACTIVE_CHALLENGE_FLAG_SCOPE = 'mastery-system';

export interface ActiveChallengeState {
  id: string;
  objective: string;
  target: number;
  accumulated: number;
  contributorActorIds: string[];
  startedAt: number;
}

export interface StartActiveChallengeInput {
  objective: string;
  target: number;
  id?: string;
  startedAt?: number;
}

export interface RecordContributionResult {
  ok: boolean;
  state: ActiveChallengeState | null;
  successesApplied: number;
  complete: boolean;
  error?: string;
}

function newId(): string {
  try {
    return (globalThis as any).foundry?.utils?.randomID?.() ?? `ch-${Date.now()}`;
  } catch {
    return `ch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function normalizeActiveChallenge(raw: unknown): ActiveChallengeState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<ActiveChallengeState>;
  const id = String(o.id || '').trim();
  const objective = String(o.objective || '').trim();
  const target = Math.max(1, Math.floor(Number(o.target) || 0));
  if (!id || !objective || target < 1) return null;
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

export function isChallengeComplete(state: ActiveChallengeState): boolean {
  return state.accumulated >= state.target;
}

export function actorAlreadyContributed(
  state: ActiveChallengeState,
  actorId: string,
): boolean {
  const id = String(actorId || '').trim();
  if (!id) return false;
  return state.contributorActorIds.includes(id);
}

/** Pure: build a new active Challenge. */
export function planStartActiveChallenge(
  input: StartActiveChallengeInput,
): { ok: true; state: ActiveChallengeState } | { ok: false; error: string } {
  const objective = String(input.objective || '').trim();
  if (!objective) return { ok: false, error: 'Name the Challenge objective.' };
  const target = Math.max(1, Math.floor(Number(input.target) || 0));
  if (target < 1) return { ok: false, error: 'Challenge target must be at least 1.' };
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
export function planRecordChallengeContribution(
  state: ActiveChallengeState | null,
  actorId: string,
  successes: number,
): RecordContributionResult {
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
  const applied = Math.max(
    0,
    Math.min(MAX_CHALLENGE_SUCCESSES_PER_CONTRIBUTION, Math.floor(Number(successes) || 0)),
  );
  const next: ActiveChallengeState = {
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

export function registerActiveChallengeSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING, {
      name: 'Active Challenge',
      hint: 'Current group Challenge Rolls progress (GM-managed).',
      scope: 'world',
      config: false,
      type: Object,
      default: null,
    });
  } catch (err) {
    console.warn('Mastery System | activeChallenge setting register failed', err);
  }
}

export function readActiveChallenge(): ActiveChallengeState | null {
  const g = globalThis as any;
  try {
    const raw = g.game?.settings?.get?.(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING);
    return normalizeActiveChallenge(raw);
  } catch {
    return null;
  }
}

async function writeActiveChallenge(state: ActiveChallengeState | null): Promise<boolean> {
  const g = globalThis as any;
  try {
    await g.game?.settings?.set?.(ACTIVE_CHALLENGE_FLAG_SCOPE, ACTIVE_CHALLENGE_SETTING, state);
    return true;
  } catch (err) {
    console.warn('Mastery System | activeChallenge set failed', err);
    return false;
  }
}

function isGmUser(): boolean {
  return !!(globalThis as any).game?.user?.isGM;
}

export async function startActiveChallenge(
  input: StartActiveChallengeInput,
): Promise<{ ok: boolean; state?: ActiveChallengeState; error?: string }> {
  if (!isGmUser()) return { ok: false, error: 'Only the GM can start a Challenge.' };
  const planned = planStartActiveChallenge(input);
  if (!planned.ok) return planned;
  const wrote = await writeActiveChallenge(planned.state);
  if (!wrote) return { ok: false, error: 'Failed to save active Challenge.' };
  return { ok: true, state: planned.state };
}

export async function clearActiveChallenge(): Promise<{ ok: boolean; error?: string }> {
  if (!isGmUser()) return { ok: false, error: 'Only the GM can clear a Challenge.' };
  const wrote = await writeActiveChallenge(null);
  if (!wrote) return { ok: false, error: 'Failed to clear active Challenge.' };
  return { ok: true };
}

export async function recordChallengeContribution(
  actorId: string,
  successes: number,
): Promise<RecordContributionResult> {
  const current = readActiveChallenge();
  const planned = planRecordChallengeContribution(current, actorId, successes);
  if (!planned.ok || !planned.state) return planned;
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

export function typicalTargetOptions(): Array<{ value: number; label: string }> {
  return [
    { value: TYPICAL_COMPLEX_CHALLENGE_TARGET, label: `Complex (${TYPICAL_COMPLEX_CHALLENGE_TARGET})` },
    {
      value: TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET,
      label: `Very complex (${TYPICAL_VERY_COMPLEX_CHALLENGE_TARGET})`,
    },
  ];
}
