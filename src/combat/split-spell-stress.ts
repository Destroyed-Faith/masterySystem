/**
 * Split Spell fizzle stress (legacy — mechanical Stress retired).
 * Tracking remains for callers; never applies Stress.
 */

const pending = new Map<string, number[]>();

export function splitSpellShouldStress(_totals: number[], _spellBaseTn: number): boolean {
  return false;
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
  if (!id) return 'clear';
  const row = pending.get(id) ?? [];
  row.push(Math.floor(Number(total) || 0));
  if (row.length < expected) {
    pending.set(id, row);
    return 'pending';
  }
  pending.delete(id);
  return 'clear';
}

/** Test hook. */
export function resetSplitSpellRolls(): void {
  pending.clear();
}
