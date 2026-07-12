/**
 * Per-combat stealth, hidden, invisibility, and perception-check bookkeeping.
 * Stored on `actor.flags['mastery-system'].perceptionCombat`.
 */

import type { CombatSenseId } from './combat-senses.js';

export interface PerceptionCombatState {
  /** Hidden from observers (Stealth success without Invisibility). */
  hidden?: boolean;
  /** +2 Perception TN per Raise on the Stealth check. */
  stealthRaiseBonus?: number;
  /** Base Invisibility Bonus (restores at start of owner's next turn). */
  invisibilityBonus?: number;
  /** Current Invisibility Bonus after Cloak Disruption this round. */
  currentInvisibilityBonus?: number;
  /** Senses blocked on this creature (from Invisibility / veils / effects). */
  blockedSenses?: CombatSenseId[];
  /**
   * Observer located target entries keyed by target actor id.
   * expiresRound: inclusive round through which location lasts.
   */
  locatedTargets?: Record<string, { targetId: string; round: number; expiresRound: number }>;
  /** Observer has used their one Perception check vs target this round (key = targetId). */
  perceptionUsedVs?: Record<string, boolean>;
  /**
   * Defender vs invisible attacker this turn (key = attacker actor id).
   */
  perceivedInvisibleAttacker?: Record<string, { success: boolean; round: number }>;
}

const FLAG_KEY = 'perceptionCombat';

export function emptyPerceptionCombatState(): PerceptionCombatState {
  return {};
}

export function getPerceptionCombatState(actor: any): PerceptionCombatState {
  try {
    const raw = actor?.getFlag?.('mastery-system', FLAG_KEY);
    if (raw && typeof raw === 'object') return { ...(raw as PerceptionCombatState) };
  } catch {
    /* ignore */
  }
  return emptyPerceptionCombatState();
}

export async function setPerceptionCombatState(actor: any, patch: Partial<PerceptionCombatState>): Promise<void> {
  if (!actor?.setFlag) return;
  const cur = getPerceptionCombatState(actor);
  await actor.setFlag('mastery-system', FLAG_KEY, { ...cur, ...patch });
}

export function effectiveInvisibilityBonus(state: PerceptionCombatState): number {
  if (state.currentInvisibilityBonus !== undefined) {
    return Math.max(0, Math.floor(Number(state.currentInvisibilityBonus) || 0));
  }
  return Math.max(0, Math.floor(Number(state.invisibilityBonus) || 0));
}

export function isSenseBlockedOnTarget(target: any, senseId: CombatSenseId): boolean {
  const st = getPerceptionCombatState(target);
  const blocked = st.blockedSenses ?? [];
  if (blocked.includes(senseId)) return true;
  const inv = effectiveInvisibilityBonus(st);
  if (inv > 0 && (senseId === 'normalCombatAwareness' || senseId === 'darkvision')) {
    return true;
  }
  return false;
}

export function computeStealthRaiseBonus(raises: number): number {
  return Math.max(0, Math.floor(Number(raises) || 0)) * 2;
}

/** Cloak Disruption — reduce current invisibility bonus; clears stealth raise bonus. */
export function applyCloakDisruption(
  state: PerceptionCombatState,
  amount: number,
): PerceptionCombatState {
  const base = effectiveInvisibilityBonus(state);
  const next = Math.max(0, base - Math.max(0, Math.floor(Number(amount) || 0)));
  return {
    ...state,
    currentInvisibilityBonus: next,
    stealthRaiseBonus: 0,
  };
}

export async function resetInvisibilityAtTurnStart(actor: any): Promise<void> {
  const st = getPerceptionCombatState(actor);
  if (st.invisibilityBonus === undefined && st.currentInvisibilityBonus === undefined) return;
  await setPerceptionCombatState(actor, {
    currentInvisibilityBonus: Math.max(0, Math.floor(Number(st.invisibilityBonus) || 0)),
  });
}

export async function clearPerceptionRoundUsage(actor: any): Promise<void> {
  const st = getPerceptionCombatState(actor);
  if (!st.perceptionUsedVs || Object.keys(st.perceptionUsedVs).length === 0) return;
  await setPerceptionCombatState(actor, { perceptionUsedVs: {} });
}

export function hasLocatedTarget(observer: any, target: any, round: number): boolean {
  const tgtId = String(target?.id ?? '');
  if (!tgtId) return false;
  const st = getPerceptionCombatState(observer);
  const entry = st.locatedTargets?.[tgtId];
  if (!entry) return false;
  return round <= (entry.expiresRound ?? entry.round);
}

export async function markLocatedTarget(observer: any, target: any, round: number): Promise<void> {
  const tgtId = String(target?.id ?? '');
  if (!tgtId) return;
  const st = getPerceptionCombatState(observer);
  const located = { ...(st.locatedTargets ?? {}) };
  located[tgtId] = { targetId: tgtId, round, expiresRound: round + 1 };
  await setPerceptionCombatState(observer, { locatedTargets: located });
}
