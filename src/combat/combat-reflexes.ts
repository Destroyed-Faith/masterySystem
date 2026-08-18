/**
 * Combat Reflexes on initiative. The skill used to be asked for in a popup right
 * after the roll, which meant a decision before the player could see anything.
 * It now lives in the Initiative Exchange row of the Stone Powers dialog, where
 * the Initiative score and the stone conversion are visible at the same time.
 *
 * Each point costs one point out of the Combat Reflexes pool and raises the
 * Initiative score by one. Points added this round are tracked on the combatant
 * so they can be given back — and so the per-roll cap survives a reopened dialog.
 */

import { calculateMaxSkillRank } from '../utils/calculations.js';

export const CR_SKILL_KEY = 'combatReflexes';

/** Points added to initiative this round, kept for the cap and for undo. */
const CR_ROUND_FLAG = 'msCrInitiativeThisRound';

export interface CombatReflexesInitiativeState {
  rating: number;
  spent: number;
  /** Skill points left in the pool. */
  remainingPool: number;
  /** Cap per initiative roll from the Mastery Rank. */
  capPerRoll: number;
  /** Points already put into initiative this round. */
  usedThisRound: number;
  /** Points the player may still add now. */
  addable: number;
  canAdd: boolean;
  canRemove: boolean;
}

/** Limits for spending Combat Reflexes on initiative. */
export function getCombatReflexesInitiativeLimits(
  actor: any,
  masteryRank: number
): { maxThisRoll: number; remainingPool: number; capPerRoll: number } {
  const rating = Math.max(0, Math.floor(Number(actor?.system?.skills?.[CR_SKILL_KEY] ?? 0) || 0));
  const spent = Math.max(0, Math.floor(Number(actor?.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0) || 0));
  const remainingPool = Math.max(0, rating - spent);
  const capPerRoll = calculateMaxSkillRank(masteryRank);
  return { maxThisRoll: Math.min(capPerRoll, remainingPool), remainingPool, capPerRoll };
}

export function combatReflexesUsedThisRound(combatant: any): number {
  return Math.max(0, Math.floor(Number(combatant?.getFlag?.('mastery-system', CR_ROUND_FLAG) ?? 0) || 0));
}

/**
 * What the Initiative Exchange row shows. `addable` respects both the pool and
 * the per-roll cap; `canRemove` needs initiative left to take the point back out
 * of, because the score may already have been converted into stones.
 */
export function combatReflexesInitiativeState(
  actor: any,
  combatant: any,
  masteryRank: number
): CombatReflexesInitiativeState {
  const { remainingPool, capPerRoll } = getCombatReflexesInitiativeLimits(actor, masteryRank);
  const rating = Math.max(0, Math.floor(Number(actor?.system?.skills?.[CR_SKILL_KEY] ?? 0) || 0));
  const spent = Math.max(0, Math.floor(Number(actor?.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0) || 0));
  const usedThisRound = combatReflexesUsedThisRound(combatant);
  const addable = Math.max(0, Math.min(remainingPool, capPerRoll - usedThisRound));
  const initiative = Math.max(0, Math.floor(Number(combatant?.initiative) || 0));
  return {
    rating,
    spent,
    remainingPool,
    capPerRoll,
    usedThisRound,
    addable,
    canAdd: addable > 0,
    canRemove: usedThisRound > 0 && initiative > 0,
  };
}

/**
 * Move one Combat Reflexes point into or out of the initiative score.
 * @returns the new initiative score, or null when the step is not allowed.
 */
export async function stepCombatReflexesInitiative(
  actor: any,
  combatant: any,
  delta: number,
  masteryRank: number
): Promise<number | null> {
  if (!actor || !combatant) return null;
  const step = delta > 0 ? 1 : -1;
  const state = combatReflexesInitiativeState(actor, combatant, masteryRank);
  if (step > 0 && !state.canAdd) return null;
  if (step < 0 && !state.canRemove) return null;

  const initiative = Math.max(0, Math.floor(Number(combatant.initiative) || 0));
  const nextInitiative = Math.max(0, initiative + step);
  const nextSpent = Math.max(0, state.spent + step);
  const nextUsed = Math.max(0, state.usedThisRound + step);

  await actor.update?.({ [`system.skillsSpent.${CR_SKILL_KEY}`]: nextSpent });
  await combatant.update?.({ initiative: nextInitiative });
  await combatant.setFlag?.('mastery-system', 'msInitiativeValue', nextInitiative);
  await combatant.setFlag?.('mastery-system', CR_ROUND_FLAG, nextUsed);
  return nextInitiative;
}

/** New round: the per-roll cap starts over. */
export async function resetCombatReflexesRoundUsage(combatant: any): Promise<void> {
  if (combatReflexesUsedThisRound(combatant) <= 0) return;
  await combatant?.setFlag?.('mastery-system', CR_ROUND_FLAG, 0);
}
