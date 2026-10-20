/**
 * Critical(X) resolution — Active Buff Critical, stone/special Crit, and
 * Passive: Critical charges.
 *
 * Critical(X) = up to X designated Martial Attack / damaging Spell Casting
 * Pools may receive Critical (Active Buff = per Combat while maintained;
 * Agility Stone Crit = per Round; Passive Critical = per Combat). Sources do
 * not stack on one roll. X is never an explode-threshold strength; the
 * threshold is always 7–8 on Attack Dice only. Damage Dice never explode
 * from Critical.
 */

export type CriticalSource = 'active-buff' | 'stone-crit' | 'special-crit' | 'passive-crit';

/** Fixed explode faces for every Critical application. */
export const CRITICAL_ATTACK_EXPLODE_FACES = [7, 8] as const;

/** Damage Dice are never exploded by Critical(X). */
export const CRITICAL_DAMAGE_DICE_EXPLODE = false as const;

/**
 * Crit is declared before the roll. It applies to damaging Martial attacks
 * and damaging Spells. Non-damaging Spells do not consume a charge.
 */
export function critAppliesToAttackRoll(args: { spell: boolean; damageDice: number }): boolean {
  if (!args.spell) return true;
  return Math.max(0, Math.floor(Number(args.damageDice) || 0)) > 0;
}

export type CriticalRoundQuota = {
  /** Combat id — Active Buff quota is combat-wide (field name kept for save compat). */
  roundKey: string;
  /** Critical(X) granted this combat from Active Buff. */
  granted: number;
  /** Remaining Critical designations this combat. */
  remaining: number;
};

export type CriticalAttackModifier = {
  /**
   * Active Buff Critical(X) value — number of Critical designations per Combat.
   * Not an explode-strength tier.
   */
  criticalX: number;
  /** Buff quota remaining before this attack is resolved. */
  buffQuotaRemaining: number;
  stoneCritCharges: number;
  specialCritCharges: number;
  /** Passive: Critical charges remaining this Combat. */
  passiveCritCharges: number;
  /** This attack receives Critical (Attack Dice explode on 7–8). */
  applyCritical: boolean;
  /** Always true iff applyCritical — threshold never changes with X. */
  explodeOn78: boolean;
  explodeFaces: readonly [7, 8];
  damageDiceExplode: false;
  /** Which charge pool to decrement when Critical is applied. */
  consumeFrom: CriticalSource | null;
  sources: CriticalSource[];
};

/**
 * Sync Active Buff Critical quota for the current combat.
 * New combat → remaining = Critical(X). Same combat → keep spent charges
 * (reactivation / new Rounds do not refill the allowance).
 */
export function syncCriticalRoundQuota(
  existing: CriticalRoundQuota | null | undefined,
  roundKey: string,
  buffCriticalX: number,
): CriticalRoundQuota {
  const x = Math.max(0, Math.floor(Number(buffCriticalX) || 0));
  const key = String(roundKey || '');
  if (!existing || existing.roundKey !== key) {
    return { roundKey: key, granted: x, remaining: x };
  }
  if (x > existing.granted) {
    const delta = x - existing.granted;
    return {
      roundKey: key,
      granted: x,
      remaining: existing.remaining + delta,
    };
  }
  if (x < existing.granted) {
    return {
      roundKey: key,
      granted: x,
      remaining: Math.min(existing.remaining, x),
    };
  }
  return {
    roundKey: key,
    granted: existing.granted,
    remaining: Math.max(0, Math.floor(Number(existing.remaining) || 0)),
  };
}

/** Spend the declared Crit charge. No-op when the roll did not select Crit. */
export function applyDeclaredCritSpend(
  state: {
    stoneBonuses?: { critRaises?: number };
    criticalQuota?: CriticalRoundQuota | null;
    /** Set true by caller when Passive Crit is consumed via async flag write. */
    passiveCritPending?: boolean;
  },
  mod: CriticalAttackModifier,
): boolean {
  if (!mod.applyCritical || !mod.consumeFrom) return false;
  if (mod.consumeFrom === 'stone-crit') {
    const current = Math.max(0, Math.floor(Number(state.stoneBonuses?.critRaises) || 0));
    if (!state.stoneBonuses || current <= 0) return false;
    state.stoneBonuses.critRaises = current - 1;
    return true;
  }
  if (mod.consumeFrom === 'active-buff' && state.criticalQuota) {
    state.criticalQuota = consumeCriticalQuota(state.criticalQuota);
    return true;
  }
  if (mod.consumeFrom === 'passive-crit') {
    state.passiveCritPending = true;
    return true;
  }
  return false;
}

export function consumeCriticalQuota(
  quota: CriticalRoundQuota,
): CriticalRoundQuota {
  return {
    ...quota,
    remaining: Math.max(0, quota.remaining - 1),
  };
}

/**
 * Active Buff Critical combat key (combat-wide). Round is ignored so the
 * allowance does not refresh at Round boundaries.
 */
export function combatRoundKey(combat: { id?: string; round?: number } | null | undefined): string {
  return String((combat as any)?.id ?? '');
}

/** @deprecated Alias — Active Buff Critical is combat-wide; prefer combatRoundKey. */
export function combatCriticalKey(combat: { id?: string } | null | undefined): string {
  return combatRoundKey(combat);
}

/**
 * Resolve whether this attack receives Critical.
 * Multiple sources never improve the explode threshold — always 7–8 on Attack Dice.
 * Prefer Active Buff quota, then stone Crit, then Passive Crit, then special Crit —
 * unless the player picks a preferred source that still has charges.
 */
export function resolveCriticalAttackModifier(opts: {
  activeBuffCriticalX?: number;
  buffQuotaRemaining?: number;
  stoneCritCharges?: number;
  specialCritCharges?: number;
  passiveCritCharges?: number;
  /** Player checked Crit on this roll. Without it, no charge is spent. */
  declared?: boolean;
  /** When multiple sources exist, prefer this one if it still has charges. */
  preferredSource?: CriticalSource | null;
}): CriticalAttackModifier {
  const criticalX = Math.max(0, Math.floor(Number(opts.activeBuffCriticalX) || 0));
  const buffRemaining = Math.max(0, Math.floor(Number(opts.buffQuotaRemaining) || 0));
  const stone = Math.max(0, Math.floor(Number(opts.stoneCritCharges) || 0));
  const special = Math.max(0, Math.floor(Number(opts.specialCritCharges) || 0));
  const passive = Math.max(0, Math.floor(Number(opts.passiveCritCharges) || 0));

  let consumeFrom: CriticalSource | null = null;
  const pref = opts.preferredSource;
  if (pref === 'active-buff' && buffRemaining > 0) consumeFrom = 'active-buff';
  else if (pref === 'stone-crit' && stone > 0) consumeFrom = 'stone-crit';
  else if (pref === 'passive-crit' && passive > 0) consumeFrom = 'passive-crit';
  else if (pref === 'special-crit' && special > 0) consumeFrom = 'special-crit';
  else if (buffRemaining > 0) consumeFrom = 'active-buff';
  else if (stone > 0) consumeFrom = 'stone-crit';
  else if (passive > 0) consumeFrom = 'passive-crit';
  else if (special > 0) consumeFrom = 'special-crit';

  const applyCritical = opts.declared === true && consumeFrom != null;
  if (!applyCritical) consumeFrom = null;

  return {
    criticalX,
    buffQuotaRemaining: buffRemaining,
    stoneCritCharges: stone,
    specialCritCharges: special,
    passiveCritCharges: passive,
    applyCritical,
    explodeOn78: applyCritical,
    explodeFaces: CRITICAL_ATTACK_EXPLODE_FACES,
    damageDiceExplode: CRITICAL_DAMAGE_DICE_EXPLODE,
    consumeFrom,
    sources: [
      ...(buffRemaining > 0 ? (['active-buff'] as CriticalSource[]) : []),
      ...(stone > 0 ? (['stone-crit'] as CriticalSource[]) : []),
      ...(passive > 0 ? (['passive-crit'] as CriticalSource[]) : []),
      ...(special > 0 ? (['special-crit'] as CriticalSource[]) : []),
    ],
  };
}

/** Available Crit charge pools for UI (Roll vs Roll with Crit). */
export function listAvailableCriticalSources(opts: {
  buffQuotaRemaining?: number;
  stoneCritCharges?: number;
  specialCritCharges?: number;
  passiveCritCharges?: number;
}): Array<{ source: CriticalSource; remaining: number; label: string }> {
  const out: Array<{ source: CriticalSource; remaining: number; label: string }> = [];
  const buff = Math.max(0, Math.floor(Number(opts.buffQuotaRemaining) || 0));
  const stone = Math.max(0, Math.floor(Number(opts.stoneCritCharges) || 0));
  const passive = Math.max(0, Math.floor(Number(opts.passiveCritCharges) || 0));
  const special = Math.max(0, Math.floor(Number(opts.specialCritCharges) || 0));
  if (buff > 0) out.push({ source: 'active-buff', remaining: buff, label: `Active Buff Critical (${buff})` });
  if (stone > 0) out.push({ source: 'stone-crit', remaining: stone, label: `Agility Stone Crit (${stone})` });
  if (passive > 0) out.push({ source: 'passive-crit', remaining: passive, label: `Passive: Critical (${passive})` });
  if (special > 0) out.push({ source: 'special-crit', remaining: special, label: `Special Crit (${special})` });
  return out;
}

/** Format for UI / chat — always Critical(X). */
export function formatCriticalLabel(criticalX: number): string {
  const x = Math.max(0, Math.floor(Number(criticalX) || 0));
  return `Critical(${x})`;
}
