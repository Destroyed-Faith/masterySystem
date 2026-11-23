/**
 * Pure helper — no actor mutations. See module docstring for pipeline order.
 */
export function applyDefensiveMitigation(input) {
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
    const afterBaseDr = drBase > 0 ? Math.max(0, Math.ceil(afterArmor * (1 - drBase / 100))) : afterArmor;
    const afterDr = drReact > 0 && afterBaseDr > 0
        ? Math.max(0, Math.ceil(afterBaseDr * (1 - drReact / 100)))
        : afterBaseDr;
    const reductionTotal = Math.max(0, afterArmor - afterDr);
    const effectiveDrPct = afterArmor > 0 ? Math.min(100, Math.round((100 * reductionTotal) / afterArmor)) : 0;
    const mitigated = afterDr;
    const parts = [`Raw ${raw}`];
    if (penetration > 0 && armorBase > 0) {
        parts.push(`Armor ${armorBase} − Pen ${penetration} → ${sheetAfterPen}`);
    }
    else if (sheetAfterPen > 0) {
        parts.push(`Armor ${sheetAfterPen}`);
    }
    if (guardAfterPen > 0) {
        parts.push(`Guard +${guardAfterPen}`);
    }
    if (drBase > 0)
        parts.push(`DR ${drBase}%`);
    if (drReact > 0)
        parts.push(`Reaction DR ${drReact}%`);
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
//# sourceMappingURL=damage-mitigation.js.map