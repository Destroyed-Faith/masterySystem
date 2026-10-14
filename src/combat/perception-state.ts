/**
 * Per-combat stealth, hidden, invisibility, and perception-check bookkeeping.
 * Stored on `actor.flags['mastery-system'].perceptionCombat`.
 */

import type { CombatSenseId } from './combat-senses.js';

export interface PerceptionCombatState {
  /** Hidden from observers (Stealth success without Invisibility). */
  hidden?: boolean;
  /**
   * Legacy: +2 Perception TN per Raise on a Stealth check (Hidden without Invis).
   * Kept for non-invis Hidden until a separate Stealth rewrite.
   */
  stealthRaiseBonus?: number;
  /**
   * Round-wide TN bonus from retroactive Stealth Skill Point spending
   * against Covered Combat Senses (Invisibility). Resets each Round.
   */
  stealthSpentThisRound?: number;
  /** Synced Invisibility Bonus from powers (informational; live bonus comes from powers). */
  invisibilityBonus?: number;
  /** @deprecated Cloak Disruption removed — ignored by effective bonus. */
  currentInvisibilityBonus?: number;
  /** Senses Obscured/Covered by Invisibility (from Passive/Buff selections). */
  blockedSenses?: CombatSenseId[];
  /**
   * Observer located target entries keyed by target actor id.
   * expiresRound: inclusive — location lasts until end of that round.
   */
  locatedTargets?: Record<string, { targetId: string; round: number; expiresRound: number }>;
  /** Observer has used their one Perception check vs target this round (key = targetId). */
  perceptionUsedVs?: Record<string, boolean>;
  /**
   * @deprecated Attack-reveal removed — attacking no longer reveals Invisibility.
   * Ignored if still present on older actors; stripped on round/encounter clear.
   */
  revealedThisRound?: number;
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

/**
 * Write perception combat flags with full replace semantics.
 *
 * Token ActorDelta / Foundry `mergeObject` keeps stale nested keys when you
 * `setFlag({ perceptionUsedVs: {} })` — empty objects do not delete prior ids.
 * Unset-then-set (same pattern as combat-snapshot) is required so clears stick.
 */
export async function setPerceptionCombatState(actor: any, patch: Partial<PerceptionCombatState>): Promise<void> {
  if (!actor?.setFlag && !actor?.update) return;
  const cur = getPerceptionCombatState(actor);
  const next: PerceptionCombatState = { ...cur, ...patch };

  // Omit emptied maps so they are not re-created after unset.
  if (patch.perceptionUsedVs && Object.keys(patch.perceptionUsedVs).length === 0) {
    delete next.perceptionUsedVs;
  }
  if (patch.locatedTargets && Object.keys(patch.locatedTargets).length === 0) {
    delete next.locatedTargets;
  }

  try {
    await actor.unsetFlag?.('mastery-system', FLAG_KEY);
  } catch {
    try {
      await actor.update?.({ [`flags.mastery-system.-=${FLAG_KEY}`]: null });
    } catch {
      /* continue and try setFlag */
    }
  }

  if (Object.keys(next).length === 0) return;

  if (typeof actor.setFlag === 'function') {
    await actor.setFlag('mastery-system', FLAG_KEY, next);
  } else {
    await actor.update?.({ [`flags.mastery-system.${FLAG_KEY}`]: next });
  }
}

/** Effective Invisibility Bonus from combat flags (powers preferred via profile layer). */
export function effectiveInvisibilityBonus(state: PerceptionCombatState): number {
  return Math.max(0, Math.floor(Number(state.invisibilityBonus) || 0));
}

/**
 * Sense Obscured by stored veil list, or by any live Invisibility Bonus
 * (Normal Combat Awareness + Darkvision). Special senses come from `blockedSenses`.
 */
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

/** @deprecated Cloak Disruption removed from rules — no-op identity. */
export function applyCloakDisruption(
  state: PerceptionCombatState,
  _amount: number,
): PerceptionCombatState {
  return { ...state };
}

/** Clear only this observer's Perception attempts (call on their turn start). */
export async function clearPerceptionRoundUsage(actor: any): Promise<void> {
  const st = getPerceptionCombatState(actor);
  if (!st.perceptionUsedVs || Object.keys(st.perceptionUsedVs).length === 0) return;
  await setPerceptionCombatState(actor, { perceptionUsedVs: {} });
}

/** New Round: attempts + retroactive Stealth TN bonus (+ strip legacy attack-reveal). */
export async function clearPerceptionRoundState(actor: any): Promise<void> {
  const st = getPerceptionCombatState(actor);
  const hasAttempts = st.perceptionUsedVs && Object.keys(st.perceptionUsedVs).length > 0;
  const hasLegacyReveal = !!st.revealedThisRound;
  const hasSpend = (st.stealthSpentThisRound ?? 0) > 0;
  if (!hasAttempts && !hasLegacyReveal && !hasSpend) return;

  const next: PerceptionCombatState = { ...st };
  delete next.perceptionUsedVs;
  delete next.revealedThisRound;
  delete next.stealthSpentThisRound;

  try {
    await actor.unsetFlag?.('mastery-system', FLAG_KEY);
  } catch {
    try {
      await actor.update?.({ [`flags.mastery-system.-=${FLAG_KEY}`]: null });
    } catch {
      /* continue */
    }
  }
  if (Object.keys(next).length === 0) return;
  if (typeof actor.setFlag === 'function') {
    await actor.setFlag('mastery-system', FLAG_KEY, next);
  } else {
    await actor.update?.({ [`flags.mastery-system.${FLAG_KEY}`]: next });
  }
}

/**
 * Full combat-scoped perception wipe (combat end / new encounter).
 * Callers re-sync Invisibility from powers afterwards.
 *
 * Always `unsetFlag` — patching nested maps to `{}` does not clear Token ActorDelta.
 */
export async function clearPerceptionCombatEncounterState(actor: any): Promise<void> {
  if (!actor?.unsetFlag && !actor?.update) return;
  try {
    await actor.unsetFlag?.('mastery-system', FLAG_KEY);
  } catch {
    try {
      await actor.update?.({ [`flags.mastery-system.-=${FLAG_KEY}`]: null });
    } catch {
      /* ignore */
    }
  }
}

export function hasLocatedTarget(observer: any, target: any, round: number): boolean {
  const tgtId = String(target?.id ?? '');
  if (!tgtId) return false;
  const st = getPerceptionCombatState(observer);
  const entry = st.locatedTargets?.[tgtId];
  if (!entry) return false;
  return round <= (entry.expiresRound ?? entry.round);
}

/** Locate until end of the current Round (expiresRound = round). */
export async function markLocatedTarget(observer: any, target: any, round: number): Promise<void> {
  const tgtId = String(target?.id ?? '');
  if (!tgtId) return;
  const st = getPerceptionCombatState(observer);
  const located = { ...(st.locatedTargets ?? {}) };
  located[tgtId] = { targetId: tgtId, round, expiresRound: round };
  await setPerceptionCombatState(observer, { locatedTargets: located });
}

/**
 * Lost Health Bars for Invisibility TN (Healthy=0 … Broken=4).
 * Incapacitated is handled separately via `isInvisibilitySuppressedByHealth`.
 */
export function lostHealthBarsForInvis(actor: any): number {
  const bars = Array.isArray(actor?.system?.health?.bars) ? actor.system.health.bars : [];
  const idx = Math.max(0, Math.floor(Number(actor?.system?.health?.currentBar) || 0));
  if (bars.length) {
    const name = String(bars[idx]?.name || '').toLowerCase();
    if (name.includes('incapacitat')) return 4;
    if (name.includes('broken')) return 4;
    if (name.includes('wound')) return 3;
    if (name.includes('injur')) return 2;
    if (name.includes('bruise')) return 1;
    if (name.includes('healthy') || idx === 0) return 0;
  }
  // Index fallback: 0 Healthy … 4 Broken … 5+ Incapacitated
  return Math.min(4, idx);
}

export function isInvisibilitySuppressedByHealth(actor: any): boolean {
  const bars = Array.isArray(actor?.system?.health?.bars) ? actor.system.health.bars : [];
  const idx = Math.max(0, Math.floor(Number(actor?.system?.health?.currentBar) || 0));
  if (bars.length) {
    const name = String(bars[idx]?.name || '').toLowerCase();
    if (name.includes('incapacitat')) return true;
  }
  return idx >= 5;
}
