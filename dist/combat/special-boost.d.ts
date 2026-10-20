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
export declare function readSpecialBoost(actor: any): number;
/** Passive: Special Amplification from slotted Passive mechanics. */
export declare function readPassiveSpecialAmplification(actor: any): number;
/** `Lacerate(3)` + 4 → `Lacerate(7)`. Labels without `(N)` stay as written. */
export declare function applySpecialBoostToLabel(label: string, bonus: number): string;
export declare function applySpecialBoostToLabels(labels: string[], bonus: number): string[];
/**
 * Apply Stone Special Boost, then Passive Special Amplification, in that order.
 * Raise Special Increase is already folded into the printed label before this.
 */
export declare function applySpecialDeliveryBonuses(label: string, actor: any): string;
//# sourceMappingURL=special-boost.d.ts.map