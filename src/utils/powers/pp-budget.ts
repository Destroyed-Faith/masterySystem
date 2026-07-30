/**
 * Active Power PP-Budget Engine.
 *
 * Source: `Powers/Actives.md` (~74–141, 144–145, 237–238, 600+, 665+).
 *
 * Conventions:
 *   • Each Power Level grants `30 PP` of build budget.
 *   • Damage rider: `+1d8 = 15 PP`.
 *   • Range cost (ranged Active): baseline `8 m` is free; every additional
 *     `+4 m` costs `+5 PP`.
 *   • Diminishing Specials (Tier 3–6): `cost(X) = StartPP × T(X)` with
 *     `T(X) = X × (X + 1) / 2`.
 *   • AoE variants (radius/blast/cone): the Special applies at
 *     `floor(single / 2)` and the cost uses `T(X+1)` instead of `T(X)`.
 *   • Damage Anchor (Actives.md ~79–90 / ~600 / ~675): once a Power has
 *     reached its anchor level (default L4), the damage rider stays fixed
 *     while special-step still affords an upgrade. From the next level it
 *     only grows when the special-step is blocked by available budget.
 *
 * The helpers below are intentionally pure: they take a definition + level
 * and return a (special rank, damage dice) pair. Templates in
 * `actives.ts` consume them to drive the level rows.
 */

export type ActiveTier = 3 | 4 | 5 | 6;

/** Triangular helper used for Diminishing Special pricing. */
export function triangular(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 0;
  return (x * (x + 1)) / 2;
}

/** Players Guide / Actives.md: every level grants 30 PP of build budget. */
export const PP_PER_LEVEL = 30;

/** Damage rider price — `+1d8 = 15 PP`. */
export const PP_PER_DAMAGE_DIE = 15;

/** Ranged baseline range that costs nothing. */
export const RANGE_FREE_BASELINE_M = 8;

/** Ranged step size. */
export const RANGE_STEP_M = 4;

/** PP per additional `+4 m` of ranged distance. */
export const PP_PER_RANGE_STEP = 5;

/** Default Diminishing Special start-PP per Tier (Rules/actives.md groups). */
export const TIER_START_PP: Record<ActiveTier, number> = {
  3: 3,
  4: 4,
  5: 6,
  6: 8,
};

/** Compute the *available* PP for a Power at level `lvl`. */
export function ppBudgetForLevel(lvl: number): number {
  return Math.max(0, Math.floor(lvl) * PP_PER_LEVEL);
}

/** PP cost of a Diminishing Special at value `X` for the given Tier. */
export function specialCost(tier: ActiveTier, x: number, opts?: { aoe?: boolean }): number {
  const startPP = TIER_START_PP[tier];
  // AoE: cost uses `T(X+1)` instead of `T(X)` (Actives.md ~1196–1221).
  const t = opts?.aoe ? triangular(x + 1) : triangular(x);
  return Math.ceil(startPP * t);
}

/**
 * PP cost to extend a ranged Active to `rangeM` meters (`8 m` baseline).
 * Always returns `0` when called for melee templates.
 */
export function rangeCost(rangeM: number): number {
  if (!Number.isFinite(rangeM) || rangeM <= RANGE_FREE_BASELINE_M) return 0;
  const extra = rangeM - RANGE_FREE_BASELINE_M;
  const steps = Math.ceil(extra / RANGE_STEP_M);
  return steps * PP_PER_RANGE_STEP;
}

/**
 * Solve the maximum Special X that fits in `budget` PP for the given Tier
 * (single-target) or AoE (`opts.aoe = true`). Returns 0 when nothing fits.
 */
export function maxSpecialForBudget(
  tier: ActiveTier,
  budget: number,
  opts?: { aoe?: boolean },
): number {
  let x = 0;
  while (specialCost(tier, x + 1, opts) <= budget) {
    x += 1;
    if (x > 64) break; // safety – no Active should ever realistically need 64+
  }
  return x;
}

/**
 * Solve the level row for a damage Active.
 *
 * @param tier            Diminishing tier the Power picks Specials from.
 * @param lvl             Power level (1..16).
 * @param opts.isRanged   When true, deducts the level's range cost from the
 *                        PP budget and uses the standard 8 m + (lvl−1) × 4 m
 *                        range curve.
 * @param opts.aoe        Use AoE pricing (T(X+1) cost, half-special).
 * @param opts.anchorLvl  Level at which the damage rider stops growing
 *                        unless the special-step would be blocked. Default 4.
 *
 * @returns               { rangeM, specialRank, damageDice, ppLeft }
 */
export function solveDamageRow(
  tier: ActiveTier,
  lvl: number,
  opts: {
    isRanged?: boolean;
    aoe?: boolean;
    anchorLvl?: number;
  } = {},
): { rangeM: number; specialRank: number; damageDice: number; ppLeft: number } {
  const isRanged = !!opts.isRanged;
  const aoe = !!opts.aoe;
  const anchorLvl = Math.max(1, Math.floor(opts.anchorLvl ?? 4));

  const budgetTotal = ppBudgetForLevel(lvl);
  const rangeM = isRanged ? RANGE_FREE_BASELINE_M + (lvl - 1) * RANGE_STEP_M : 0;
  const rangeBudgetCost = isRanged ? rangeCost(rangeM) : 0;
  const baseBudget = Math.max(0, budgetTotal - rangeBudgetCost);

  // Step 1 — solve single-target special X for this level (no damage yet).
  const singleX = maxSpecialForBudget(tier, baseBudget, { aoe: false });
  // Step 2 — for AoE, the special applies at floor(single/2) but uses T(X+1).
  const aoeSpecialRank = aoe ? Math.max(0, Math.floor(singleX / 2)) : singleX;
  const specialPrice = aoe ? specialCost(tier, aoeSpecialRank, { aoe: true }) : specialCost(tier, singleX);

  // Step 3 — Damage Anchor (Actives.md ~79–90):
  //   * Levels 1..anchorLvl: pour every leftover PP into damage dice.
  //   * From anchorLvl+1 upwards: cap damage at the anchor level's value.
  //     If the special-step at this level would be blocked because the
  //     anchor froze the damage budget, allow the damage rider to grow
  //     just enough to absorb the leftover PP that *would* have funded the
  //     special step.
  const remainingForDamage = Math.max(0, baseBudget - specialPrice);
  let damageDice = Math.floor(remainingForDamage / PP_PER_DAMAGE_DIE);

  if (lvl > anchorLvl) {
    const anchorRow = solveDamageRow(tier, anchorLvl, { isRanged, aoe });
    const anchorDice = anchorRow.damageDice;
    if (damageDice > anchorDice) {
      // Damage exceeded the anchor — clamp it. The leftover PP simply
      // sinks into the special (already chosen above) or is unused.
      damageDice = anchorDice;
    }
  }

  const ppLeft = remainingForDamage - damageDice * PP_PER_DAMAGE_DIE;
  return {
    rangeM,
    specialRank: aoe ? aoeSpecialRank : singleX,
    damageDice,
    ppLeft,
  };
}
