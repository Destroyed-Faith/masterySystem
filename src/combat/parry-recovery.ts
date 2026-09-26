/**
 * Active Buff: Parry Recovery (template id `ab-reinforced-parry`).
 * After Parry is spent, refund up to the buff's per-round cap.
 * The pool cannot rise above the amount with which Parry was entered.
 * Works for Martial Parry and Spell Parry — both spend the same pool.
 */

export interface ParryRecoveryInput {
  spent: number;
  pool: number;
  entryPool: number;
  recoveredThisRound: number;
  maxRecoverPerRound: number;
}

export interface ParryRecoveryResult {
  pool: number;
  recoveredThisRound: number;
  regained: number;
}

export function computeParryRecovery(input: ParryRecoveryInput): ParryRecoveryResult {
  const spent = Math.max(0, Math.floor(Number(input.spent) || 0));
  const pool = Math.max(0, Math.floor(Number(input.pool) || 0));
  const entryPool = Math.max(pool, Math.floor(Number(input.entryPool) || 0));
  const recovered = Math.max(0, Math.floor(Number(input.recoveredThisRound) || 0));
  const cap = Math.max(0, Math.floor(Number(input.maxRecoverPerRound) || 0));
  const room = Math.max(0, cap - recovered);
  const headroom = Math.max(0, entryPool - pool);
  const regained = Math.min(spent, room, headroom);
  return {
    pool: pool + regained,
    recoveredThisRound: recovered + regained,
    regained,
  };
}

function effectList(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (Array.isArray(effects.contents)) return effects.contents;
  if (typeof effects.values === 'function') return Array.from(effects.values());
  return [];
}

/** Per-round recovery cap from a maintained Parry Recovery buff. 0 if absent. */
export function readParryRecoveryCap(actor: any): number {
  let best = 0;
  for (const effect of effectList(actor)) {
    const flags = effect?.flags?.['mastery-system'] ?? {};
    if (flags.activeBuff !== true) continue;
    const tid = String(flags.powerTemplateId ?? flags.templateId ?? '').toLowerCase();
    const name = String(effect?.name ?? flags.powerName ?? '').toLowerCase();
    const isRecovery =
      tid === 'ab-reinforced-parry' ||
      tid === 'ab-parry-recovery' ||
      name.includes('parry recovery') ||
      name.includes('reinforced parry');
    if (!isRecovery) continue;
    const fromMech = Math.floor(Number(flags.mechanics?.parryRecoveryPerRound) || 0);
    const fromLevel = Math.floor(Number(flags.level ?? flags.powerLevel) || 0);
    const cap = fromMech > 0 ? fromMech : fromLevel;
    if (cap > best) best = cap;
  }
  return best;
}
