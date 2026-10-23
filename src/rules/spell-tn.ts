/**
 * Spell Casting TN — DF Players Guide 2026-10-23.
 * Spell Base TN = used Power Level × 4 (not caster MR).
 * Final Spell TN = Base + effective SR + 4 × Paid Combat Raises.
 */

export function spellBaseTnFromPowerLevel(powerLevel: number): number {
  const pl = Math.max(0, Math.floor(Number(powerLevel) || 0));
  return pl * 4;
}

/** effective SR = max(0, printed SR − piercing). */
export function effectiveSpellResistance(printedSr: number, piercing = 0): number {
  return Math.max(0, Math.floor(Number(printedSr) || 0) - Math.max(0, Math.floor(Number(piercing) || 0)));
}

/** Passive Spell Resistance Piercing = ceil(Passive PL / 2) when eligible. */
export function spellResistancePiercingFromPassivePl(passivePl: number): number {
  const pl = Math.max(0, Math.floor(Number(passivePl) || 0));
  return Math.ceil(pl / 2);
}

export function finalSpellTn(opts: {
  powerLevel: number;
  spellResistance?: number;
  piercing?: number;
  paidCombatRaises?: number;
}): number {
  const base = spellBaseTnFromPowerLevel(opts.powerLevel);
  const sr = effectiveSpellResistance(opts.spellResistance ?? 0, opts.piercing ?? 0);
  const paid = Math.max(0, Math.floor(Number(opts.paidCombatRaises) || 0));
  return base + sr + paid * 4;
}

/** Creation TN for placed / persistent zones. */
export function zoneCreationTn(powerLevel: number, paidRaises: number): number {
  return spellBaseTnFromPowerLevel(powerLevel) + Math.max(0, Math.floor(Number(paidRaises) || 0)) * 4;
}

export const LEGAL_CASTING_ATTRIBUTES = ['intellect', 'resolve', 'influence'] as const;
export type CastingAttributeName = (typeof LEGAL_CASTING_ATTRIBUTES)[number];

export function isLegalCastingAttribute(value: string | null | undefined): value is CastingAttributeName {
  return LEGAL_CASTING_ATTRIBUTES.includes(String(value || '').toLowerCase() as CastingAttributeName);
}
