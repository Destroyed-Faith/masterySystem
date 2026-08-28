/**
 * The four skill-use boxes on the sheet / printout.
 *
 * A skill is not spent point-by-point: it has four uses per Safe Haven Rest
 * and each use costs the current Mastery Rank. The rating (capped at MR × 4)
 * fills those boxes left to right, so raising MR recomputes every box.
 * Example: 8 points at MR 2 → [2, 2, 2, 2]; the same 8 at MR 3 → [3, 3, 2, 0].
 * All four boxes read 3 only at MR 3 with 12 points invested.
 */

import { calculateMaxSkillRank } from './calculations.js';

export const SKILL_USE_BOX_COUNT = 4;

export interface SkillUseBoxView {
  index: number;
  /** Points this box holds — Mastery Rank, or less on a short leftover. */
  size: number;
  used: number;
  remaining: number;
  unavailable: boolean;
  spent: boolean;
  state: 'available' | 'spent' | 'locked';
}

export function skillUsePointsPerBox(masteryRank: number): number {
  return Math.max(1, Math.floor(Number(masteryRank) || 1));
}

export function buildSkillUseBoxes(
  rating: number,
  spent: number,
  masteryRank: number
): SkillUseBoxView[] {
  const pointsPerUse = skillUsePointsPerBox(masteryRank);
  const rated = Math.min(
    Math.max(0, Math.floor(Number(rating) || 0)),
    calculateMaxSkillRank(masteryRank)
  );
  let ratingLeft = rated;
  let spentLeft = Math.min(Math.max(0, Math.floor(Number(spent) || 0)), rated);

  return Array.from({ length: SKILL_USE_BOX_COUNT }, (_, index) => {
    const size = Math.min(pointsPerUse, Math.max(0, ratingLeft));
    ratingLeft -= size;
    const used = Math.min(size, Math.max(0, spentLeft));
    spentLeft -= used;
    const remaining = size - used;
    const unavailable = size === 0;
    const isSpent = size > 0 && remaining === 0;
    return {
      index,
      size,
      used,
      remaining,
      unavailable,
      spent: isSpent,
      state: unavailable ? 'locked' : isSpent ? 'spent' : 'available',
    };
  });
}
