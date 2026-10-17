/**
 * Universal Flee. One Movement and one Attack Action, then up to 4 × Speed
 * along a normal path. The lock lasts until the start of the creature's next
 * Turn. Flee does not start a Pursuit.
 */

import {
  consumeMovementAction,
  getAvailableAttackActions,
  getAvailableMovementActions,
  getRoundState,
  isFleeLocked,
  refundMovementAction,
  setRoundState,
  spendAttackAction,
} from './action-economy.js';
import { movementActionMeters } from './movement-allowance.js';

/** Flee is a path. It is not Safe Movement and not a teleport. */
export const FLEE_TRAVERSAL = 'path' as const;

export function fleeAllowanceMeters(input: {
  speed: number;
  enhancement?: number;
  reduced?: boolean;
}): number {
  return movementActionMeters({
    kind: 'flee',
    speed: input.speed,
    enhancement: input.enhancement ?? 0,
    reduced: input.reduced === true,
  }).meters;
}

export function canDeclareFlee(
  actor: any,
  combat: any,
): { ok: boolean; reason?: string } {
  if (!actor || !combat) return { ok: false, reason: 'Flee requires a started combat.' };
  if (isFleeLocked(actor, combat)) {
    return { ok: false, reason: 'Flee is already in effect until your next Turn.' };
  }
  if (getAvailableMovementActions(actor, combat) < 1) {
    return { ok: false, reason: 'Flee needs an available Movement.' };
  }
  if (getAvailableAttackActions(actor, combat) < 1) {
    return { ok: false, reason: 'Flee needs an available Attack Action.' };
  }
  return { ok: true };
}

/**
 * Spend Movement and the Attack Action, then lock Attacks, Reactions, and Stones.
 * A second call in the same Turn does not spend again.
 * A failed check spends nothing and does not lock.
 */
export async function commitFlee(
  actor: any,
  combat: any,
): Promise<{ ok: boolean; already?: boolean; meters: number; reason?: string }> {
  const speed = Number(actor?.system?.combat?.speed) || 0;
  const rs = getRoundState(actor, combat);
  const meters = fleeAllowanceMeters({
    speed,
    enhancement: Math.max(0, Number(rs?.moveBonusMeters) || 0) + Math.max(0, Number(rs?.stoneBonuses?.extraMoveMeters) || 0),
    reduced: false,
  });
  if (rs.fleeCommitted) return { ok: true, already: true, meters };
  const check = canDeclareFlee(actor, combat);
  if (!check.ok) return { ok: false, meters, reason: check.reason };
  const moved = await consumeMovementAction(actor, combat);
  if (!moved) return { ok: false, meters, reason: 'Flee needs an available Movement.' };
  const attacked = await spendAttackAction(actor, combat);
  if (!attacked) {
    await refundMovementAction(actor, combat);
    return { ok: false, meters, reason: 'Flee needs an available Attack Action.' };
  }
  const next = getRoundState(actor, combat);
  next.fleeLock = true;
  next.fleeCommitted = true;
  await setRoundState(actor, next);
  return { ok: true, meters };
}
