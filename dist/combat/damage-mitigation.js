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
 * Pure helper — no actor mutations. See module docstring for pipeline order.
 */
export function applyDefensiveMitigation(input) {
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
    // Step 2 — DR%. Round toward the attacker (ceil) so fractional hits still
    // hurt; the rule text reads "take X% less damage" which in practice rounds
    // the *remaining* damage down, i.e. Math.floor of the post-DR value. Ceiling
    // the reduction is equivalent.
    const reduction = Math.floor((afterArmor * drTotal) / 100);
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
    const parts = [`Raw ${raw}`];
    if (armor > 0)
        parts.push(`Armor ${armor}`);
    if (drTotal > 0)
        parts.push(`DR ${drTotal}%`);
    if (min8sUsed)
        parts.push(`8s-min ${count8s}`);
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
export function countNaturalEightsInRoll(roll) {
    if (!roll)
        return 0;
    let n = 0;
    try {
        for (const term of roll.terms || roll.dice || []) {
            const faces = term?.faces;
            const results = term?.results;
            if (faces !== 8 || !Array.isArray(results))
                continue;
            for (const r of results) {
                // Foundry marks exploded dice as `active` — we count every natural 8
                // that rolled, including the trigger dice of explosions, because the
                // rule reads "per rolled 8", not "per surviving 8".
                if (r && r.result === 8)
                    n += 1;
            }
        }
    }
    catch {
        /* ignore mis-shaped rolls */
    }
    return n;
}
/** Sum `count8s` across a list of Foundry Rolls. */
export function countNaturalEights(rolls) {
    let n = 0;
    for (const roll of rolls)
        n += countNaturalEightsInRoll(roll);
    return n;
}
//# sourceMappingURL=damage-mitigation.js.map