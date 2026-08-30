/**
 * Describes the outcome of flat Armor + DR% mitigation.
 * `mitigatedDamage` is the value the caller forwards to Temp-HP/bars.
 */
export interface DefensiveMitigationResult {
  /** Raw damage passed in (unchanged). */
  rawDamage: number;
  /** Flat Armor subtracted before DR%. */
  armorApplied: number;
  /** Effective DR% on the post-armor pool (0–100), after sequential base + reaction steps. */
  drPercent: number;
  /** Damage value fed into Temp-HP consumption after the 8s-floor. */
  mitigatedDamage: number;
  /** `true` if the 8s-minimum-rule kicked in (post-mitigation ≤ 0 but 8s > 0). */
  min8sUsed: boolean;
  /** Number of natural 8s that propagated into this mitigation call. */
  count8s: number;
  /**
   * Human-readable single-line summary for the chat card, e.g.
   *   "Raw 14 → Armor 4 → DR 20% → 8"
   */
  breakdownLine: string;
}

export interface DefensiveMitigationInput {
  rawDamage: number;
  /** Natural 8s rolled across all damage dice for this strike. */
  count8s: number;
  /** Flat Armor pool on the target (from `system.combat.armorTotal`). */
  armorTotal: number;
  /** Percentage DR on the target (from `system.combat.damageReductionPct`). */
  damageReductionPct: number;
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
  const count8s = Math.max(0, Math.floor(Number(input.count8s) || 0));
  const armorBase = Math.max(0, Math.floor(Number(input.armorTotal) || 0));
  const penetration = Math.max(0, Math.floor(Number(input.armorPenetration) || 0));
  const drBase = Math.max(0, Math.min(100, Math.floor(Number(input.damageReductionPct) || 0)));
  const drReact = Math.max(0, Math.min(100, Math.floor(Number(input.reactionDrPct) || 0)));

  // Step 1 — Penetration reduces Armor for this hit, then flat Armor applies.
  const armor = Math.max(0, armorBase - penetration);
  const afterArmor = Math.max(0, raw - armor);

  // Step 2 — DR% in sequence: continuous sheet DR first, then per-hit reaction DR
  // on the remainder (each step uses ceil on the reduction — defender-favorable).
  const reductionBase =
    drBase > 0 ? Math.min(afterArmor, Math.ceil((afterArmor * drBase) / 100)) : 0;
  const afterBaseDr = Math.max(0, afterArmor - reductionBase);
  const reductionReact =
    drReact > 0 && afterBaseDr > 0
      ? Math.min(afterBaseDr, Math.ceil((afterBaseDr * drReact) / 100))
      : 0;
  const afterDr = Math.max(0, afterBaseDr - reductionReact);
  const reductionTotal = reductionBase + reductionReact;
  const effectiveDrPct =
    afterArmor > 0 ? Math.min(100, Math.round((100 * reductionTotal) / afterArmor)) : 0;
  // Step 3 — 8s-minimum rule.
  let mitigated = afterDr;
  let min8sUsed = false;
  if (mitigated <= 0 && count8s > 0) {
    mitigated = count8s;
    min8sUsed = true;
  }

  const parts: string[] = [`Raw ${raw}`];
  if (penetration > 0 && armorBase > 0) {
    parts.push(`Armor ${armorBase} − Pen ${penetration} → ${armor}`);
  } else if (armor > 0) {
    parts.push(`Armor ${armor}`);
  }
  if (drBase > 0) parts.push(`DR ${drBase}%`);
  if (drReact > 0) parts.push(`Reaction DR ${drReact}%`);
  if (min8sUsed) parts.push(`8s-min ${count8s}`);
  parts.push(`→ ${mitigated}`);
  const breakdownLine = parts.join(' → ');

  return {
    rawDamage: raw,
    armorApplied: armor,
    drPercent: effectiveDrPct,
    mitigatedDamage: mitigated,
    min8sUsed,
    count8s,
    breakdownLine,
  };
}

/** Extract `count8s` from a Foundry Roll (sums natural 8s across all d8 terms). */
export function countNaturalEightsInRoll(roll: any): number {
  if (!roll) return 0;
  let n = 0;
  try {
    for (const term of roll.terms || roll.dice || []) {
      const faces = term?.faces;
      const results = term?.results;
      if (faces !== 8 || !Array.isArray(results)) continue;
      for (const r of results) {
        // Foundry marks exploded dice as `active` — we count every natural 8
        // that rolled, including the trigger dice of explosions, because the
        // rule reads "per rolled 8", not "per surviving 8".
        if (r && r.result === 8) n += 1;
      }
    }
  } catch {
    /* ignore mis-shaped rolls */
  }
  return n;
}

/** Sum `count8s` across a list of Foundry Rolls. */
export function countNaturalEights(rolls: Iterable<any>): number {
  let n = 0;
  for (const roll of rolls) n += countNaturalEightsInRoll(roll);
  return n;
}
