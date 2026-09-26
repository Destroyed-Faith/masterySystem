/**
 * Intellect Special Boost (DF Core 0.9.9.1).
 * Adds the Rank bonus to every numeric Special(X) the character applies
 * this round. Binary specials (no parentheses) are unchanged.
 * This is not Active Buff: Special Increase.
 */
export declare function readSpecialBoost(actor: any): number;
/** `Lacerate(3)` + 4 → `Lacerate(7)`. Labels without `(N)` stay as written. */
export declare function applySpecialBoostToLabel(label: string, bonus: number): string;
export declare function applySpecialBoostToLabels(labels: string[], bonus: number): string[];
//# sourceMappingURL=special-boost.d.ts.map