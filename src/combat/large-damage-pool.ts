/**
 * Large Damage Pools (Core v0.9.9.6, Damage Roll).
 *
 * If 40 or more Damage Dice remain after Damage Negation, the roller may count
 * each die as 5 instead of rolling. Maximization still counts each die as 8.
 * A damage floor above 5 (Mark, Brutal Impact) counts each die at that floor.
 */

export const LARGE_DAMAGE_POOL_MIN_DICE = 40;
export const LARGE_DAMAGE_POOL_DIE_VALUE = 5;

/** True when the remaining pool (after Damage Negation) may be counted instead of rolled. */
export function isLargeDamagePool(remainingDice: number, opts: { maximized?: boolean } = {}): boolean {
  if (opts.maximized === true) return false;
  return Math.floor(Number(remainingDice) || 0) >= LARGE_DAMAGE_POOL_MIN_DICE;
}

/** Replace every d8 term with its counted value (5 per die); flat parts stay. */
export function countLargeDamagePoolFormula(formula: string): string {
  return String(formula || '').replace(/(\d*)d8(?:x\d+)?/gi, (_match, count) => {
    const n = count ? Math.max(1, parseInt(count, 10) || 1) : 1;
    return String(LARGE_DAMAGE_POOL_DIE_VALUE * n);
  });
}

/**
 * Roll-shaped stand-in for `n` counted dice, so Mark / Brutal Impact floors
 * (which read die results) raise each counted 5 to the floor value.
 */
export function countedPoolFloorSource(n: number): { terms: Array<{ faces: number; results: Array<{ result: number; active: boolean }> }> } {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  return {
    terms: [
      {
        faces: 8,
        results: Array.from({ length: count }, () => ({ result: LARGE_DAMAGE_POOL_DIE_VALUE, active: true })),
      },
    ],
  };
}

/** Value one counted die contributes after floors (Maximization wins with 8). */
export function largeDamagePoolDieValue(opts: { maximized?: boolean; floor?: number } = {}): number {
  if (opts.maximized === true) return 8;
  return Math.max(LARGE_DAMAGE_POOL_DIE_VALUE, Math.floor(Number(opts.floor) || 0));
}
