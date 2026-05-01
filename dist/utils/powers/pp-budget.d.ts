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
export declare function triangular(x: number): number;
/** Players Guide / Actives.md: every level grants 30 PP of build budget. */
export declare const PP_PER_LEVEL = 30;
/** Damage rider price — `+1d8 = 15 PP`. */
export declare const PP_PER_DAMAGE_DIE = 15;
/** Ranged baseline range that costs nothing. */
export declare const RANGE_FREE_BASELINE_M = 8;
/** Ranged step size. */
export declare const RANGE_STEP_M = 4;
/** PP per additional `+4 m` of ranged distance. */
export declare const PP_PER_RANGE_STEP = 5;
/** Default Diminishing Special start-PP per Tier. */
export declare const TIER_START_PP: Record<ActiveTier, number>;
/** Compute the *available* PP for a Power at level `lvl`. */
export declare function ppBudgetForLevel(lvl: number): number;
/** PP cost of a Diminishing Special at value `X` for the given Tier. */
export declare function specialCost(tier: ActiveTier, x: number, opts?: {
    aoe?: boolean;
}): number;
/**
 * PP cost to extend a ranged Active to `rangeM` meters (`8 m` baseline).
 * Always returns `0` when called for melee templates.
 */
export declare function rangeCost(rangeM: number): number;
/**
 * Solve the maximum Special X that fits in `budget` PP for the given Tier
 * (single-target) or AoE (`opts.aoe = true`). Returns 0 when nothing fits.
 */
export declare function maxSpecialForBudget(tier: ActiveTier, budget: number, opts?: {
    aoe?: boolean;
}): number;
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
export declare function solveDamageRow(tier: ActiveTier, lvl: number, opts?: {
    isRanged?: boolean;
    aoe?: boolean;
    anchorLvl?: number;
}): {
    rangeM: number;
    specialRank: number;
    damageDice: number;
    ppLeft: number;
};
//# sourceMappingURL=pp-budget.d.ts.map