/**
 * NPC shared Maximization pool + per-attack eligibility/cadence.
 * Spends feed the same Damage-card „Roll Maximum“ path as player Maximization.
 */

import type { AttackValue, NpcMaximizationPool } from '../types/actor.js';
import {
  coerceNpcPhasesArray,
  getNpcAttackByIndex,
  npcAttackUsageKey,
} from '../utils/npc-attack-model.js';
import type { RoundState } from './action-economy.js';

export type NpcMaximizationRefresh = 'perRound' | 'perPhase';
export type NpcMaximizationCadence = 'perRound' | 'perPhase';

export interface NpcMaximizationConfig {
  charges: number;
  refresh: NpcMaximizationRefresh;
  phaseIndex: number | null;
}

export interface NpcMaximizationAttackRef {
  phaseIndex?: number | null;
  attackIndex?: number | null;
}

function liveCombat(): any | null {
  try {
    return (globalThis as any).game?.combat ?? null;
  } catch {
    return null;
  }
}

function clampCharges(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(10, n);
}

function normalizeRefresh(raw: unknown): NpcMaximizationRefresh {
  return String(raw || '').trim() === 'perPhase' ? 'perPhase' : 'perRound';
}

function normalizeCadence(raw: unknown): NpcMaximizationCadence {
  return String(raw || '').trim() === 'perPhase' ? 'perPhase' : 'perRound';
}

function normalizePool(raw: unknown): NpcMaximizationPool | null {
  if (!raw || typeof raw !== 'object') return null;
  const charges = clampCharges((raw as any).charges);
  if (charges <= 0) return null;
  return { charges, refresh: normalizeRefresh((raw as any).refresh) };
}

/** Active phase index for phased bosses; null for root / non-phased. */
export function resolveNpcMaximizationPhaseIndex(system: any): number | null {
  const phases = coerceNpcPhasesArray(system?.phases);
  if (!phases.length) return null;
  return Math.max(
    0,
    Math.min(phases.length - 1, Math.floor(Number(system?.npcActivePhaseIndex) || 0)),
  );
}

/** Shared pool config for the active (or given) phase / root. */
export function resolveNpcMaximizationConfig(
  system: any,
  phaseIndex?: number | null,
): NpcMaximizationConfig | null {
  const phases = coerceNpcPhasesArray(system?.phases);
  let pi =
    phaseIndex === undefined
      ? resolveNpcMaximizationPhaseIndex(system)
      : phaseIndex == null
        ? null
        : Math.floor(Number(phaseIndex));
  if (phases.length > 0) {
    if (pi == null || !Number.isFinite(pi)) {
      pi = resolveNpcMaximizationPhaseIndex(system);
    }
    pi = Math.max(0, Math.min(phases.length - 1, Math.floor(Number(pi) || 0)));
    const pool = normalizePool(phases[pi]?.npcMaximization);
    if (!pool) return null;
    return { charges: pool.charges, refresh: pool.refresh, phaseIndex: pi };
  }
  const pool = normalizePool(system?.npcMaximization);
  if (!pool) return null;
  return { charges: pool.charges, refresh: pool.refresh, phaseIndex: null };
}

export function isNpcAttackMaximizationEligible(attack: AttackValue | null | undefined): boolean {
  if (!attack) return false;
  return (
    attack.npcMaximizationEligible === true ||
    (attack as any).npcMaximizationEligible === 'true' ||
    (attack as any).npcMaximizationEligible === 'on'
  );
}

export function npcAttackMaximizationCadence(
  attack: AttackValue | null | undefined,
): NpcMaximizationCadence {
  return normalizeCadence(attack?.npcMaximizationCadence);
}

/**
 * Seed / refresh NPC Maximization fields on a RoundState.
 * - perRound pool: refill to charges; drop perRound attack uses; keep perPhase attack uses when same phase+combat.
 * - perPhase pool: refill only when combat/phase changes; otherwise carry remaining + perPhase attack uses.
 */
export function seedNpcMaximizationRoundState(
  actor: any,
  combat: any | null,
  roundState: RoundState,
  previous?: RoundState | null,
): void {
  const cfg = resolveNpcMaximizationConfig(actor?.system);
  if (!cfg) {
    roundState.npcMaximizationRemaining = 0;
    roundState.npcMaximizationGranted = 0;
    roundState.npcMaximizationRefresh = undefined;
    roundState.npcMaximizationPhaseIndex = null;
    roundState.npcMaximizationAttackUses = {};
    return;
  }

  const combatId = String((combat as any)?.id ?? roundState.combatId ?? '');
  const prevCombatId = String(previous?.combatId ?? '');
  const sameCombat = !!combatId && combatId === prevCombatId;
  const samePhase =
    sameCombat &&
    (previous?.npcMaximizationPhaseIndex ?? null) === cfg.phaseIndex;

  const prevUses = { ...(previous?.npcMaximizationAttackUses || {}) };
  const nextUses: Record<string, number> = {};

  // Preserve perPhase attack cadence uses across rounds when still same phase/combat.
  if (samePhase) {
    for (const [key, n] of Object.entries(prevUses)) {
      const used = Math.max(0, Math.floor(Number(n) || 0));
      if (used <= 0) continue;
      const atkIdx = parseAttackIndexFromUsageKey(key);
      if (atkIdx == null) continue;
      const atk = getNpcAttackByIndex(actor.system, atkIdx, cfg.phaseIndex);
      if (npcAttackMaximizationCadence(atk) === 'perPhase') {
        nextUses[key] = used;
      }
    }
  }

  if (cfg.refresh === 'perRound') {
    roundState.npcMaximizationRemaining = cfg.charges;
  } else if (
    samePhase &&
    typeof previous?.npcMaximizationRemaining === 'number' &&
    previous.npcMaximizationRefresh === 'perPhase'
  ) {
    roundState.npcMaximizationRemaining = Math.max(
      0,
      Math.min(cfg.charges, Math.floor(Number(previous.npcMaximizationRemaining) || 0)),
    );
  } else {
    roundState.npcMaximizationRemaining = cfg.charges;
  }

  roundState.npcMaximizationGranted = cfg.charges;
  roundState.npcMaximizationRefresh = cfg.refresh;
  roundState.npcMaximizationPhaseIndex = cfg.phaseIndex;
  roundState.npcMaximizationAttackUses = nextUses;
}

/** After a boss phase change: refill if the new phase pool refreshes perPhase (or always set from new config). */
export async function onNpcMaximizationPhaseChanged(actor: any): Promise<void> {
  const type = String(actor?.type || '');
  if (type !== 'npc' && type !== 'summon') return;
  const combat = liveCombat();
  try {
    const { getRoundState, setRoundState } = await import('./action-economy.js');
    const rs = getRoundState(actor, combat);
    const cfg = resolveNpcMaximizationConfig(actor?.system);
    if (!cfg) {
      rs.npcMaximizationRemaining = 0;
      rs.npcMaximizationGranted = 0;
      rs.npcMaximizationRefresh = undefined;
      rs.npcMaximizationPhaseIndex = null;
      rs.npcMaximizationAttackUses = {};
      await setRoundState(actor, rs);
      return;
    }
    // New phase: always clear attack uses; refill pool from new phase config.
    rs.npcMaximizationRemaining = cfg.charges;
    rs.npcMaximizationGranted = cfg.charges;
    rs.npcMaximizationRefresh = cfg.refresh;
    rs.npcMaximizationPhaseIndex = cfg.phaseIndex;
    rs.npcMaximizationAttackUses = {};
    await setRoundState(actor, rs);
  } catch (err) {
    console.warn('Mastery System | onNpcMaximizationPhaseChanged failed', err);
  }
}

function parseAttackIndexFromUsageKey(key: string): number | null {
  const m = /^npc-attack-(?:root|\d+)-(\d+)$/.exec(String(key || ''));
  if (!m) return null;
  const n = Math.floor(Number(m[1]));
  return Number.isFinite(n) ? n : null;
}

function usageKeyFor(ref: NpcMaximizationAttackRef, system: any): string {
  const phase =
    ref.phaseIndex === undefined
      ? resolveNpcMaximizationPhaseIndex(system)
      : ref.phaseIndex == null
        ? null
        : Math.floor(Number(ref.phaseIndex));
  const idx = Math.max(0, Math.floor(Number(ref.attackIndex) || 0));
  return npcAttackUsageKey(phase, idx);
}

/** Ensure RoundState has live remaining for the current config (lazy sync). */
export function syncNpcMaximizationRemaining(actor: any, combat?: any | null): number {
  const cfg = resolveNpcMaximizationConfig(actor?.system);
  if (!cfg) return 0;
  const c = combat === undefined ? liveCombat() : combat;
  try {
    // Sync is sync-path only — callers that need write use spend / seed.
    const stored = (actor as any).getFlag?.('mastery-system', 'roundState') as RoundState | undefined;
    const combatId = String((c as any)?.id ?? '');
    const round = Math.max(1, Math.floor(Number(c?.round ?? 1) || 1));
    if (
      stored &&
      stored.round === round &&
      String(stored.combatId ?? '') === combatId &&
      stored.npcMaximizationPhaseIndex === cfg.phaseIndex &&
      typeof stored.npcMaximizationRemaining === 'number'
    ) {
      return Math.max(0, Math.floor(Number(stored.npcMaximizationRemaining) || 0));
    }
    // No live state yet — treat as full pool for UI enablement before first round seed.
    return cfg.charges;
  } catch {
    return cfg.charges;
  }
}

export function getNpcMaximizationAttackUses(actor: any, combat?: any | null): Record<string, number> {
  const c = combat === undefined ? liveCombat() : combat;
  try {
    const stored = (actor as any).getFlag?.('mastery-system', 'roundState') as RoundState | undefined;
    const combatId = String((c as any)?.id ?? '');
    const round = Math.max(1, Math.floor(Number(c?.round ?? 1) || 1));
    if (
      stored &&
      stored.round === round &&
      String(stored.combatId ?? '') === combatId &&
      stored.npcMaximizationAttackUses
    ) {
      return { ...stored.npcMaximizationAttackUses };
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function canSpendNpcMaximization(
  actor: any,
  ref: NpcMaximizationAttackRef,
  combat?: any | null,
): boolean {
  if (!actor) return false;
  const type = String(actor.type || '');
  if (type !== 'npc' && type !== 'summon') return false;
  const cfg = resolveNpcMaximizationConfig(actor.system, ref.phaseIndex);
  if (!cfg || cfg.charges <= 0) return false;
  const remaining = syncNpcMaximizationRemaining(actor, combat);
  if (remaining <= 0) return false;

  const phase =
    ref.phaseIndex === undefined ? cfg.phaseIndex : ref.phaseIndex == null ? null : Math.floor(Number(ref.phaseIndex));
  const attackIndex = Math.max(0, Math.floor(Number(ref.attackIndex) || 0));
  const atk = getNpcAttackByIndex(actor.system, attackIndex, phase);
  if (!isNpcAttackMaximizationEligible(atk)) return false;

  const key = npcAttackUsageKey(phase, attackIndex);
  const uses = getNpcMaximizationAttackUses(actor, combat);
  const used = Math.max(0, Math.floor(Number(uses[key]) || 0));
  return used < 1;
}

export function getNpcMaximizationUiState(
  actor: any,
  ref: NpcMaximizationAttackRef,
  combat?: any | null,
): { remaining: number; canSpend: boolean; label: string } | null {
  const cfg = resolveNpcMaximizationConfig(actor?.system, ref.phaseIndex);
  if (!cfg) return null;
  const remaining = syncNpcMaximizationRemaining(actor, combat);
  const canSpend = canSpendNpcMaximization(actor, ref, combat);
  const refreshLabel = cfg.refresh === 'perPhase' ? 'pro Phase' : 'pro Runde';
  return {
    remaining,
    canSpend,
    label: `NPC Maximization (${remaining}/${cfg.charges}, ${refreshLabel})`,
  };
}

/** Spend 1 shared charge + mark this attack's cadence use. */
export async function spendNpcMaximization(
  actor: any,
  ref: NpcMaximizationAttackRef,
): Promise<boolean> {
  if (!canSpendNpcMaximization(actor, ref)) return false;
  const combat = liveCombat();
  const { getRoundState, setRoundState } = await import('./action-economy.js');
  const rs = getRoundState(actor, combat);
  const cfg = resolveNpcMaximizationConfig(actor.system, ref.phaseIndex);
  if (!cfg) return false;

  // If RoundState was never seeded (e.g. out of combat), seed from config first.
  if (
    typeof rs.npcMaximizationRemaining !== 'number' ||
    rs.npcMaximizationPhaseIndex !== cfg.phaseIndex
  ) {
    seedNpcMaximizationRoundState(actor, combat, rs, null);
  }

  const remaining = Math.max(0, Math.floor(Number(rs.npcMaximizationRemaining) || 0));
  if (remaining <= 0) return false;

  const key = usageKeyFor(ref, actor.system);
  const uses = { ...(rs.npcMaximizationAttackUses || {}) };
  const used = Math.max(0, Math.floor(Number(uses[key]) || 0));
  if (used >= 1) return false;

  uses[key] = used + 1;
  rs.npcMaximizationRemaining = remaining - 1;
  rs.npcMaximizationGranted = cfg.charges;
  rs.npcMaximizationRefresh = cfg.refresh;
  rs.npcMaximizationPhaseIndex = cfg.phaseIndex;
  rs.npcMaximizationAttackUses = uses;
  await setRoundState(actor, rs);
  return true;
}
