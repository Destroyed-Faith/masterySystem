/**
 * Describes the outcome of flat Armor + DR% mitigation.
 * `mitigatedDamage` is the value the caller forwards to Temp-HP/bars.
 * Damage reduced to 0 deals 0 (Core v0.9.9.6: there is no natural-8 minimum).
 */
export interface DefensiveMitigationResult {
  /** Raw damage passed in (unchanged). */
  rawDamage: number;
  /** Flat Armor subtracted before DR% (sheet + Guard / reaction armor). */
  armorApplied: number;
  /** Portion of `armorApplied` that came from Guard / reaction Armor this hit. */
  reactionArmorApplied: number;
  /** Effective DR% on the post-armor pool (0–100), after sequential base + reaction steps. */
  drPercent: number;
  /** Damage value fed into Temp-HP consumption. */
  mitigatedDamage: number;
  /**
   * Human-readable single-line summary for the chat card, e.g.
   *   "Raw 14 → Armor 4 → Guard +8 → DR 20% → 8"
   */
  breakdownLine: string;
}

export interface DefensiveMitigationInput {
  rawDamage: number;
  /** Flat Armor pool on the target (from `system.combat.armorTotal`). */
  armorTotal: number;
  /** Percentage DR on the target (from `system.combat.damageReductionPct`). */
  damageReductionPct: number;
  /**
   * Per-hit Reaction Armor (Basic Guard, Ally Armor, …). Added after sheet Armor
   * for this strike only; shown separately in the breakdown.
   */
  reactionArmorFlat?: number;
  /**
   * Per-hit Reaction-DR bonus (%). Applied **after** continuous `damageReductionPct`
   * on the post-armor remainder for this strike only.
   */
  reactionDrPct?: number;
  /**
   * Armor Penetration for THIS hit (Penetration(X) Special, weapon riders,
   * Might "Ignore Armor" stones). Rulebook defense sequence: "Penetration
   * reduces Armor first, then subtract the remaining Armor." Never reduces
   * Armor below 0 and never adds damage on its own.
   */
  armorPenetration?: number;
}

/**
 * Pure helper — no actor mutations. See module docstring for pipeline order.
 */
export function applyDefensiveMitigation(input: DefensiveMitigationInput): DefensiveMitigationResult {
  const raw = Math.max(0, Math.floor(Number(input.rawDamage) || 0));
  const armorBase = Math.max(0, Math.floor(Number(input.armorTotal) || 0));
  const reactionArmor = Math.max(0, Math.floor(Number(input.reactionArmorFlat) || 0));
  const penetration = Math.max(0, Math.floor(Number(input.armorPenetration) || 0));
  const drBase = Math.max(0, Math.min(100, Math.floor(Number(input.damageReductionPct) || 0)));
  const drReact = Math.max(0, Math.min(100, Math.floor(Number(input.reactionDrPct) || 0)));

  // Step 1 — Penetration reduces Armor for this hit (sheet first, then Guard), then flat Armor applies.
  let penLeft = penetration;
  const sheetAfterPen = Math.max(0, armorBase - penLeft);
  penLeft = Math.max(0, penLeft - armorBase);
  const guardAfterPen = Math.max(0, reactionArmor - penLeft);
  const armor = sheetAfterPen + guardAfterPen;
  const afterArmor = Math.max(0, raw - armor);

  // Step 2 — DR% in sequence: continuous sheet DR first, then per-hit reaction DR
  // on the remainder. Core: Final damage = ceil(max(0, Damage) × (1 − DR / 100)).
  // Round the remaining damage, not the subtracted reduction.
  const afterBaseDr =
    drBase > 0 ? Math.max(0, Math.ceil(afterArmor * (1 - drBase / 100))) : afterArmor;
  const afterDr =
    drReact > 0 && afterBaseDr > 0
      ? Math.max(0, Math.ceil(afterBaseDr * (1 - drReact / 100)))
      : afterBaseDr;
  const reductionTotal = Math.max(0, afterArmor - afterDr);
  const effectiveDrPct =
    afterArmor > 0 ? Math.min(100, Math.round((100 * reductionTotal) / afterArmor)) : 0;
  const mitigated = afterDr;

  const parts: string[] = [`Raw ${raw}`];
  if (penetration > 0 && armorBase > 0) {
    parts.push(`Armor ${armorBase} − Pen ${penetration} → ${sheetAfterPen}`);
  } else if (sheetAfterPen > 0) {
    parts.push(`Armor ${sheetAfterPen}`);
  }
  if (guardAfterPen > 0) {
    parts.push(`Guard +${guardAfterPen}`);
  }
  if (drBase > 0) parts.push(`DR ${drBase}%`);
  if (drReact > 0) parts.push(`Reaction DR ${drReact}%`);
  parts.push(`${mitigated}`);
  const breakdownLine = parts.join(' → ');

  return {
    rawDamage: raw,
    armorApplied: armor,
    reactionArmorApplied: guardAfterPen,
    drPercent: effectiveDrPct,
    mitigatedDamage: mitigated,
    breakdownLine,
  };
}
