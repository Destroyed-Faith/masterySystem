/**
 * Intellect Special Boost (DF Core 0.9.9.1).
 * Adds the Rank bonus to every numeric Special(X) the character applies
 * this round. Binary specials (no parentheses) are unchanged.
 * This is not Active Buff: Special Increase.
 */

export function readSpecialBoost(actor: any): number {
  if (!actor) return 0;
  try {
    const rs = actor.getFlag?.('mastery-system', 'roundState');
    const raw = Number(rs?.stoneBonuses?.specialBoost ?? rs?.stoneBonuses?.spellSpecialBoost ?? 0);
    return Math.max(0, Math.floor(raw) || 0);
  } catch {
    return 0;
  }
}

/** `Lacerate(3)` + 4 → `Lacerate(7)`. Labels without `(N)` stay as written. */
export function applySpecialBoostToLabel(label: string, bonus: number): string {
  const b = Math.max(0, Math.floor(Number(bonus) || 0));
  if (b <= 0) return String(label ?? '');
  return String(label ?? '').replace(/\((\d+)\)/g, (_m, n) => `(${Number(n) + b})`);
}

export function applySpecialBoostToLabels(labels: string[], bonus: number): string[] {
  if (!Array.isArray(labels) || bonus <= 0) return labels;
  return labels.map((label) => applySpecialBoostToLabel(label, bonus));
}
