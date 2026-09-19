import { canViewerSeeEndTurn } from './end-turn.js';

/** Only turn/round fields — the shape Foundry writes for nextTurn. */
export function isTurnAdvanceChange(changed: Record<string, unknown> | null | undefined): boolean {
  if (!changed || typeof changed !== 'object') return false;
  const keys = Object.keys(changed).filter((k) => k !== '_id' && k !== 'id');
  if (!keys.length) return false;
  return keys.every((k) => k === 'turn' || k === 'round');
}

/**
 * One step forward from the current combatant (including wrapping the round
 * when they are last). Rejects skipping the rest of the round.
 */
export function isSingleTurnStep(
  combat: { turn?: number; round?: number; turns?: unknown[]; combatants?: { size?: number } },
  changed: Record<string, unknown>,
): boolean {
  const currentTurn = Math.max(0, Math.floor(Number(combat.turn) || 0));
  const currentRound = Math.max(0, Math.floor(Number(combat.round) || 0));
  const nextTurn = changed.turn === undefined ? currentTurn : Math.floor(Number(changed.turn));
  const nextRound = changed.round === undefined ? currentRound : Math.floor(Number(changed.round));
  if (!Number.isFinite(nextTurn) || !Number.isFinite(nextRound)) return false;
  if (nextRound === currentRound && nextTurn === currentTurn + 1) return true;
  const nTurns = Array.isArray(combat.turns)
    ? combat.turns.length
    : Math.max(0, Math.floor(Number(combat.combatants?.size) || 0));
  return nextRound === currentRound + 1 && nextTurn === 0 && currentTurn >= Math.max(0, nTurns - 1);
}

/** Current combatant's owner may write the next-turn update. */
export function playerMayWriteOwnTurnAdvance(
  combat: any,
  user: any,
  changed: Record<string, unknown> | null | undefined,
): boolean {
  if (!combat || !user || user.isGM) return false;
  if (!isTurnAdvanceChange(changed) || !changed) return false;
  if (!isSingleTurnStep(combat, changed)) return false;
  return canViewerSeeEndTurn(combat.combatant?.actor, user);
}
