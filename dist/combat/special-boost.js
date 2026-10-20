/**
 * Intellect Special Boost + Passive: Special Amplification.
 *
 * Delivery pipeline for eligible numeric Special(X) on the owner's attack:
 * printed X → Raise Special Increase → Stone Special Boost → Passive Amplification
 * → target Vulnerability → Special Negation → 4×MR application limit.
 *
 * Binary specials (no parentheses) are unchanged.
 * This is not Active Buff: Special Increase / Passive: Special Aura.
 */
export function readSpecialBoost(actor) {
    if (!actor)
        return 0;
    try {
        const rs = actor.getFlag?.('mastery-system', 'roundState');
        const raw = Number(rs?.stoneBonuses?.specialBoost ?? rs?.stoneBonuses?.spellSpecialBoost ?? 0);
        return Math.max(0, Math.floor(raw) || 0);
    }
    catch {
        return 0;
    }
}
/** Passive: Special Amplification from slotted Passive mechanics. */
export function readPassiveSpecialAmplification(actor) {
    if (!actor)
        return 0;
    try {
        return Math.max(0, Math.floor(Number(actor.system?.derived?.mechanicsBreakdown?.totals?.specialAmplification) || 0));
    }
    catch {
        return 0;
    }
}
/** `Lacerate(3)` + 4 → `Lacerate(7)`. Labels without `(N)` stay as written. */
export function applySpecialBoostToLabel(label, bonus) {
    const b = Math.max(0, Math.floor(Number(bonus) || 0));
    if (b <= 0)
        return String(label ?? '');
    return String(label ?? '').replace(/\((\d+)\)/g, (_m, n) => `(${Number(n) + b})`);
}
export function applySpecialBoostToLabels(labels, bonus) {
    if (!Array.isArray(labels) || bonus <= 0)
        return labels;
    return labels.map((label) => applySpecialBoostToLabel(label, bonus));
}
/**
 * Apply Stone Special Boost, then Passive Special Amplification, in that order.
 * Raise Special Increase is already folded into the printed label before this.
 */
export function applySpecialDeliveryBonuses(label, actor) {
    let out = String(label ?? '');
    out = applySpecialBoostToLabel(out, readSpecialBoost(actor));
    out = applySpecialBoostToLabel(out, readPassiveSpecialAmplification(actor));
    return out;
}
//# sourceMappingURL=special-boost.js.map