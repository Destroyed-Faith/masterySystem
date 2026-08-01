/**
 * Critical resolution — isolated evaluation for Active Buff Critical(X) and stone Crit.
 *
 * Rules today define Crit(1) / Critical(1) as attack-pool explode-on-7–8.
 * Critical(2–4) are granted by Active Buff: Critical milestones but have **no**
 * distinct resolution in Rules/players-guide.md or Rules/active-buffs.md.
 *
 * Do NOT invent tier scaling here. Plug the final definition into
 * `resolveCriticalAttackModifier` when Rules decide Critical(2–4).
 *
 * @see docs/CRITICAL-RESOLUTION.md
 */

export type CriticalSource = 'active-buff' | 'stone-crit' | 'special-crit';

export type CriticalAttackModifier = {
  /** Highest evaluated Critical/Crit tier contributing to this attack. */
  tier: number;
  /** Explode attack-pool d8s on natural 7–8 (Crit(1) baseline). */
  explodeOn78: boolean;
  /**
   * Reserved for future Critical(2–4) effects. Always null until Rules define tiers.
   * Callers must not invent behaviour from this field.
   */
  pendingHigherTierEffect: null;
  /** True when tier ≥ 2 but no Rules resolution exists yet. */
  higherTierAwaitingRules: boolean;
  sources: CriticalSource[];
};

/**
 * Resolve Critical/Crit for an attack roll.
 * Current Rules-backed behaviour: any tier ≥ 1 → explodeOn78.
 * Tiers 2–4 are preserved on the result but do not add further modifiers.
 */
export function resolveCriticalAttackModifier(opts: {
  activeBuffCriticalTier?: number;
  stoneCritCharges?: number;
  specialCritValue?: number;
}): CriticalAttackModifier {
  const buff = Math.max(0, Math.floor(Number(opts.activeBuffCriticalTier) || 0));
  const stone = Math.max(0, Math.floor(Number(opts.stoneCritCharges) || 0));
  const special = Math.max(0, Math.floor(Number(opts.specialCritValue) || 0));
  const tier = Math.max(buff, stone > 0 ? 1 : 0, special);
  const sources: CriticalSource[] = [];
  if (buff > 0) sources.push('active-buff');
  if (stone > 0) sources.push('stone-crit');
  if (special > 0) sources.push('special-crit');

  return {
    tier,
    explodeOn78: tier >= 1,
    pendingHigherTierEffect: null,
    higherTierAwaitingRules: tier >= 2,
    sources,
  };
}

/** Documented open Rules decision — do not treat as implemented. */
export const CRITICAL_HIGHER_TIER_STATUS = 'requires-rule-decision' as const;
