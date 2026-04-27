/**
 * Damage Mitigation — pure helpers for the post-roll pipeline.
 *
 * Pipeline order (per strike, per target):
 *   raw  →  −armorTotal (flat Armor)
 *         →  × (1 − DR%)  (percentage, after armor, clamped 0–100)
 *         →  8s-minimum-rule: if the reduced value would be ≤ 0 but the raw
 *            damage roll produced at least one natural "8", the strike still
 *            inflicts `count8s` damage — never zero.
 *         →  Temp-HP consumption (per-source bookkeeping via passive-triggers)
 *         →  Health-bar bleed-through
 *
 * This module is deliberately pure: it returns numbers, patches, and a
 * breakdown for chat logging. The caller (`applyDamageToTarget` in
 * `damage-dialog.ts`) owns the single atomic `actor.update`.
 */

import { logDrDebug } from '../utils/dr-debug.js';

/**
 * Describes the outcome of flat Armor + DR% mitigation.
 * `mitigatedDamage` is the value the caller forwards to Temp-HP/bars.
 */
export interface DefensiveMitigationResult {
  /** Raw damage passed in (unchanged). */
  rawDamage: number;
  /** Flat Armor subtracted before DR%. */
  armorApplied: number;
  /** Percentage DR that was applied (0–100, after passive/buff gating). */
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
   * Per-hit Reaction-DR bonus. Optional override the caller passes in when a
   * Reaction (Unyielding Intercept) fires for exactly this attack. The
   * aggregator deliberately keeps Reaction DR out of the continuous total.
   */
  reactionDrPct?: number;
}

/**
 * Pure helper — no actor mutations. See module docstring for pipeline order.
 */
export function applyDefensiveMitigation(input: DefensiveMitigationInput): DefensiveMitigationResult {
  const raw = Math.max(0, Math.floor(Number(input.rawDamage) || 0));
  const count8s = Math.max(0, Math.floor(Number(input.count8s) || 0));
  const armor = Math.max(0, Math.floor(Number(input.armorTotal) || 0));
  const drBase = Math.max(0, Math.min(100, Math.floor(Number(input.damageReductionPct) || 0)));
  const drReact = Math.max(0, Math.min(100, Math.floor(Number(input.reactionDrPct) || 0)));

  // Reaction DR stacks additively on top of the continuous DR total for this
  // single hit only (the Reaction itself enforces 1/round via its own slot).
  const drTotal = Math.max(0, Math.min(100, drBase + drReact));
  logDrDebug('mitigation-apply', {
    raw,
    armor,
    drBasePct: drBase,
    reactionDrPct: drReact,
    drTotalPct: drTotal,
  });

  // Step 1 — flat Armor.
  const afterArmor = Math.max(0, raw - armor);

  // Step 2 — DR%. Reduce damage by the percentage; round the *reduction amount*
  // with Math.ceil so any fractional % favors the defender (less HP lost), per
  // playtest rule: e.g. 10% of 18 → 2 off → 16 after (not 17 with floor(1.8)).
  const reduction = Math.min(afterArmor, Math.ceil((afterArmor * drTotal) / 100));
  const afterDr = Math.max(0, afterArmor - reduction);
  logDrDebug('mitigation-after-dr', {
    afterArmor,
    reductionFromDr: reduction,
    afterDr,
    min8sRuleWillApply: afterDr <= 0 && count8s > 0,
  });

  // Step 3 — 8s-minimum rule.
  let mitigated = afterDr;
  let min8sUsed = false;
  if (mitigated <= 0 && count8s > 0) {
    mitigated = count8s;
    min8sUsed = true;
  }

  const parts: string[] = [`Raw ${raw}`];
  if (armor > 0) parts.push(`Armor ${armor}`);
  if (drTotal > 0) parts.push(`DR ${drTotal}%`);
  if (min8sUsed) parts.push(`8s-min ${count8s}`);
  parts.push(`→ ${mitigated}`);
  const breakdownLine = parts.join(' → ');

  return {
    rawDamage: raw,
    armorApplied: armor,
    drPercent: drTotal,
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
