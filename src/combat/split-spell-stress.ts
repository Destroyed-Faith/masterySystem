/**
 * Split Spell fizzle stress.
 * The caster takes 1d8 Stress only when none of the split Casting Rolls
 * reach Spell Base TN. A placement that reaches Base but misses Final Spell TN
 * is resisted, not fizzled.
 */

const pending = new Map<string, number[]>();

export function splitSpellShouldStress(totals: number[], spellBaseTn: number): boolean {
  if (!totals.length) return false;
  const base = Math.floor(Number(spellBaseTn) || 0);
  return totals.every((t) => Math.floor(Number(t) || 0) < base);
}

/**
 * Record one split Casting Roll. Returns whether this completion should
 * apply the single fizzle Stress. Earlier rolls in the pair return 'pending'.
 */
export function noteSplitSpellRoll(
  pairId: string,
  total: number,
  spellBaseTn: number,
  expected = 2,
): 'pending' | 'stress' | 'clear' {
  const id = String(pairId || '').trim();
  if (!id) return splitSpellShouldStress([total], spellBaseTn) ? 'stress' : 'clear';
  const row = pending.get(id) ?? [];
  row.push(Math.floor(Number(total) || 0));
  if (row.length < expected) {
    pending.set(id, row);
    return 'pending';
  }
  pending.delete(id);
  return splitSpellShouldStress(row, spellBaseTn) ? 'stress' : 'clear';
}

/** Test hook. */
export function resetSplitSpellRolls(): void {
  pending.clear();
}
