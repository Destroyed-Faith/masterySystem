/**
 * Stone Recovery maths — round 2+, the player decides which spent stones come
 * back (Mastery Rank many). Kept free of Foundry globals so it can be tested;
 * the Stone Powers dialog renders these rows above its power matrix.
 */

export interface StoneRecoveryPoolInput {
  key: string;
  /** Pool capacity from the attribute. */
  max: number;
  /** Stones currently sitting in the pool. */
  current: number;
  /** Capacity tied up by Sustain — never refills. */
  sustained: number;
}

export interface StoneRecoveryRow {
  key: string;
  /** Free space the recovery could fill. */
  space: number;
  /** Stones currently in the pool. */
  current: number;
  /** Stones recovered into the pool (never negative). */
  allocated: number;
  canAdd: boolean;
  canRemove: boolean;
}

export interface StoneRecoveryPlan {
  points: number;
  allocated: number;
  remaining: number;
  rows: StoneRecoveryRow[];
  /** No pool can take another stone — the rest of the points is simply lost. */
  saturated: boolean;
  /**
   * Always true: Confirm must never block. Unused Mastery Rank points are
   * simply skipped (player may recover fewer stones than the budget).
   */
  canFinish: boolean;
}

/** Space a pool offers: capacity minus Sustain, minus what is already in it. */
export function stoneRecoverySpace(pool: StoneRecoveryPoolInput): number {
  const max = Math.max(0, Math.floor(Number(pool.max) || 0));
  const current = Math.max(0, Math.floor(Number(pool.current) || 0));
  const sustained = Math.max(0, Math.floor(Number(pool.sustained) || 0));
  return Math.max(0, max - sustained - current);
}

function poolCurrent(pool: StoneRecoveryPoolInput): number {
  return Math.max(0, Math.floor(Number(pool.current) || 0));
}

function poolMax(pool: StoneRecoveryPoolInput): number {
  return Math.max(0, Math.floor(Number(pool.max) || 0));
}

/** Allocation clamped to [0, +space] for one pool — recovery only ever adds. */
function clampOwn(pool: StoneRecoveryPoolInput, raw: unknown): number {
  const n = Math.floor(Number(raw) || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(stoneRecoverySpace(pool), n);
}

/**
 * Rows a player can act on, plus the running totals. Every pool with capacity
 * gets a row: "+" takes a spent stone back (Mastery Rank budget), "−" undoes
 * one of your own "+" clicks. Allocation never goes below zero. Confirm never
 * blocks.
 */
export function planStoneRecovery(
  pools: readonly StoneRecoveryPoolInput[],
  allocation: Readonly<Record<string, number>>,
  points: number
): StoneRecoveryPlan {
  const total = Math.max(0, Math.floor(Number(points) || 0));
  let allocated = 0;
  for (const pool of pools) {
    allocated += clampOwn(pool, allocation[pool.key]);
  }
  const remaining = Math.max(0, total - allocated);

  const rows: StoneRecoveryRow[] = [];
  for (const pool of pools) {
    if (poolMax(pool) <= 0) continue;
    const space = stoneRecoverySpace(pool);
    const own = clampOwn(pool, allocation[pool.key]);
    rows.push({
      key: pool.key,
      space,
      current: poolCurrent(pool),
      allocated: own,
      canAdd: remaining > 0 && own < space,
      canRemove: own > 0,
    });
  }

  const saturated = remaining > 0 && !rows.some((row) => row.allocated < row.space);
  return {
    points: total,
    allocated,
    remaining,
    rows,
    saturated,
    // Never gate the fight on filling the Mastery Rank budget.
    canFinish: true,
  };
}

/** Allocation trimmed to what the pools can actually take, for the actor update. */
export function clampStoneRecoveryAllocation(
  pools: readonly StoneRecoveryPoolInput[],
  allocation: Readonly<Record<string, number>>,
  points: number
): Record<string, number> {
  const out: Record<string, number> = {};
  let left = Math.max(0, Math.floor(Number(points) || 0));
  for (const pool of pools) {
    if (left <= 0) break;
    const want = Math.max(0, Math.floor(Number(allocation[pool.key]) || 0));
    const take = Math.min(want, stoneRecoverySpace(pool), left);
    if (take <= 0) continue;
    out[pool.key] = take;
    left -= take;
  }
  return out;
}
