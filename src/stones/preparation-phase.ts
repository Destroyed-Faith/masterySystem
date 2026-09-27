/**
 * Preparation Phase order for one combat round:
 * Initiative Boost → Initiative Exchange → Stone Assignment → locked.
 *
 * Initiative Boost must change Initiative before Exchange reads it.
 * Initiative Colorless Stones bought in Exchange are Ready in that same
 * Preparation Phase. Confirming the assignment locks the round; reopening
 * must not buy those Stones again.
 */

import { initiativeBoostAmount } from './colorless-stones.js';
import { stonePowerRankCost } from './stone-powers.js';

export const PREPARATION_PHASE_FLAG = 'preparationPhase';
export const INITIATIVE_BOOST_POWER_ID = 'wits.initiativeBoost';

export type PreparationBoost = 'pending' | 'skipped' | 'applied';
export type PreparationStep = 'roll' | 'boost' | 'exchange' | 'assignment' | 'locked';

export interface PreparationPhaseState {
  combatId: string;
  round: number;
  boost: PreparationBoost;
  /** Rank applied this round. 0 when skipped or still pending. */
  boostTier: number;
  exchange: 'pending' | 'done';
  /** Stones this Preparation Phase already bought. Reopen must not buy them again. */
  exchangeStones: number;
  assignment: 'open' | 'confirmed';
}

export function emptyPreparationPhase(combatId: string, round: number): PreparationPhaseState {
  return {
    combatId: String(combatId || ''),
    round: Math.max(0, Math.floor(Number(round) || 0)),
    boost: 'pending',
    boostTier: 0,
    exchange: 'pending',
    exchangeStones: 0,
    assignment: 'open',
  };
}

export function readPreparationPhase(
  raw: unknown,
  combatId: string,
  round: number,
): PreparationPhaseState {
  const fresh = emptyPreparationPhase(combatId, round);
  if (!raw || typeof raw !== 'object') return fresh;
  const row = raw as Partial<PreparationPhaseState>;
  if (String(row.combatId || '') !== fresh.combatId) return fresh;
  if (Math.floor(Number(row.round) || 0) !== fresh.round) return fresh;
  const boost: PreparationBoost =
    row.boost === 'skipped' || row.boost === 'applied' ? row.boost : 'pending';
  return {
    combatId: fresh.combatId,
    round: fresh.round,
    boost,
    boostTier: boost === 'applied' ? Math.max(0, Math.floor(Number(row.boostTier) || 0)) : 0,
    exchange: row.exchange === 'done' ? 'done' : 'pending',
    exchangeStones:
      row.exchange === 'done' ? Math.max(0, Math.floor(Number(row.exchangeStones) || 0)) : 0,
    assignment: row.assignment === 'confirmed' ? 'confirmed' : 'open',
  };
}

/**
 * Once-per-combat Boost already spent, or this round's assignment already
 * confirmed, must not open those steps again.
 */
export function reconcilePreparationPhase(
  state: PreparationPhaseState,
  opts: { boostAlreadyUsed?: boolean; assignmentConfirmed?: boolean },
): PreparationPhaseState {
  let next = state;
  if (opts.boostAlreadyUsed && next.boost === 'pending') {
    next = { ...next, boost: 'applied', boostTier: next.boostTier };
  }
  if (opts.assignmentConfirmed && next.assignment !== 'confirmed') {
    next = {
      ...next,
      boost: next.boost === 'pending' ? 'applied' : next.boost,
      exchange: 'done',
      assignment: 'confirmed',
    };
  }
  return next;
}

export function preparationStep(state: PreparationPhaseState, needsRoll = false): PreparationStep {
  if (state.assignment === 'confirmed') return 'locked';
  if (needsRoll) return 'roll';
  if (state.boost === 'pending') return 'boost';
  if (state.exchange === 'pending') return 'exchange';
  return 'assignment';
}

/** Initiative Exchange reads this score: the roll, then Initiative Boost. */
export function initiativeAfterBoost(
  initiative: number,
  boostTier: number,
  masteryRank: number,
): number {
  const base = Math.max(0, Math.floor(Number(initiative) || 0));
  const tier = Math.floor(Number(boostTier) || 0);
  if (tier < 1) return base;
  return base + initiativeBoostAmount(tier, masteryRank);
}

/**
 * Wits Stones to reach `rank`, using the same cumulative curve as the card.
 * `prefillTier` is one Rank the artifact already paid.
 */
export function initiativeBoostRankCost(rank: number, prefillTier = 0): number | null {
  const tier = Math.floor(Number(rank) || 0);
  if (tier < 1 || tier > 4) return null;
  const prefill = Math.max(0, Math.min(4, Math.floor(Number(prefillTier) || 0)));
  let cost = 0;
  for (let r = 1; r <= tier; r += 1) {
    if (r !== prefill) cost += stonePowerRankCost(INITIATIVE_BOOST_POWER_ID, r);
  }
  return cost;
}

export function skipInitiativeBoost(
  state: PreparationPhaseState,
): { state: PreparationPhaseState; changed: boolean } {
  if (state.boost !== 'pending' || state.assignment === 'confirmed') {
    return { state, changed: false };
  }
  return { state: { ...state, boost: 'skipped', boostTier: 0 }, changed: true };
}

export function applyInitiativeBoost(
  state: PreparationPhaseState,
  tier: number,
): { state: PreparationPhaseState; changed: boolean } {
  if (state.boost !== 'pending' || state.assignment === 'confirmed') {
    return { state, changed: false };
  }
  const rank = Math.floor(Number(tier) || 0);
  if (rank < 1 || rank > 4) return { state, changed: false };
  return { state: { ...state, boost: 'applied', boostTier: rank }, changed: true };
}

export function planInitiativeExchange(
  state: PreparationPhaseState,
  stones: number,
): { state: PreparationPhaseState; changed: boolean; stones: number } {
  if (state.assignment === 'confirmed' || state.exchange === 'done' || state.boost === 'pending') {
    return { state, changed: false, stones: state.exchange === 'done' ? state.exchangeStones : 0 };
  }
  const n = Math.max(0, Math.floor(Number(stones) || 0));
  return {
    state: { ...state, exchange: 'done', exchangeStones: n },
    changed: true,
    stones: n,
  };
}

export function confirmPreparationAssignment(state: PreparationPhaseState): PreparationPhaseState {
  return {
    ...state,
    boost: state.boost === 'pending' ? 'skipped' : state.boost,
    exchange: 'done',
    assignment: 'confirmed',
  };
}

/** GM reset reopens assignment. It does not buy Initiative Stones again. */
export function reopenPreparationAssignment(state: PreparationPhaseState): PreparationPhaseState {
  return { ...state, assignment: 'open' };
}
