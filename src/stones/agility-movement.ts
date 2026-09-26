/**
 * Agility Stone Abilities: Safe Movement and Slip.
 *
 * Safe Movement replaces the actor's normal Movement for that use.
 * Slip is a separate reactive move and does not touch that budget.
 */

export const SAFE_MOVEMENT_METERS = [4, 8, 12, 16] as const;
export const SLIP_METERS = [4, 8, 12, 16] as const;

function rankMeters(seq: readonly number[], tier: number): number {
  const t = Math.floor(Number(tier) || 0);
  if (t < 1 || t > seq.length) return 0;
  return Number(seq[t - 1]) || 0;
}

export const PENDING_SAFE_MOVEMENT_FLAG = 'pendingSafeMovement';
export const PENDING_SLIP_FLAG = 'pendingSlip';
export const SLIP_MOVEMENT_ACTIVE_FLAG = 'slipMovementActive';

export function safeMovementMeters(tier: number): number {
  return rankMeters(SAFE_MOVEMENT_METERS, tier);
}

export function slipMeters(tier: number): number {
  return rankMeters(SLIP_METERS, tier);
}

export interface MovementBudget {
  movementTotal: number;
  movementUsed: number;
  movementPowerUsed: boolean;
  attackUsed: number;
  reactionUsed: number;
}

/** Safe Movement needs an unspent Movement action and must not already have replaced Movement. */
export function canCommitSafeMovement(budget: MovementBudget): boolean {
  if (budget.movementPowerUsed) return false;
  const total = Math.max(0, Math.floor(Number(budget.movementTotal) || 0));
  const used = Math.max(0, Math.floor(Number(budget.movementUsed) || 0));
  return used < total;
}

/**
 * Spend the Movement budget on Safe Movement.
 * Attack Actions and Reactions are left untouched.
 * Returns null when Movement is already gone.
 */
export function commitSafeMovement(budget: MovementBudget): MovementBudget | null {
  if (!canCommitSafeMovement(budget)) return null;
  const total = Math.max(0, Math.floor(Number(budget.movementTotal) || 0));
  const used = Math.max(0, Math.floor(Number(budget.movementUsed) || 0)) + 1;
  return {
    ...budget,
    movementTotal: total,
    movementUsed: used,
    // The base Move/Dash entry closes once nothing remains. An extra Movement
    // action from another rule stays available.
    movementPowerUsed: used >= total,
  };
}

export function movementProvokesReactions(kind: 'normal' | 'safe' | 'slip'): boolean {
  return kind === 'normal';
}

export interface SlipArm {
  meters: number;
  used: boolean;
  actorId: string;
  armedCombatId: string | null;
  armedRound: number;
  armedTurn: number;
}

export interface SlipTriggerEvent {
  defenderId: string;
  attackerId: string;
  /** True when the Attack meets the defender's TN. */
  hit: boolean;
  /** False for spells, skill checks, and effects that are not an Attack. */
  isAttack: boolean;
}

export function readSlipArm(raw: unknown): SlipArm | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<SlipArm>;
  const meters = Math.floor(Number(row.meters) || 0);
  if (meters <= 0) return null;
  return {
    meters,
    used: row.used === true,
    actorId: String(row.actorId || ''),
    armedCombatId: row.armedCombatId == null ? null : String(row.armedCombatId),
    armedRound: Math.floor(Number(row.armedRound) || 0),
    armedTurn: Math.floor(Number(row.armedTurn) || 0),
  };
}

/** An enemy Attack missed this actor, and Slip is still armed. */
export function slipCanTrigger(slip: SlipArm | null | undefined, event: SlipTriggerEvent): boolean {
  if (!slip || slip.used || slip.meters <= 0) return false;
  if (!event.isAttack || event.hit) return false;
  const defenderId = String(event.defenderId || '');
  const attackerId = String(event.attackerId || '');
  if (!defenderId || defenderId === attackerId) return false;
  if (slip.actorId && slip.actorId !== defenderId) return false;
  return true;
}

export function markSlipUsed(slip: SlipArm): SlipArm {
  return { ...slip, used: true };
}

/** Unused Slip ends when this actor's next Turn starts. A used Slip is already spent. */
export function expireSlipOnOwnTurnStart(slip: SlipArm | null | undefined): null {
  void slip;
  return null;
}
