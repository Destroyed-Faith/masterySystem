/**
 * Chat bar for a raw d8 pool: type a dice count, pick Keep (Mastery Rank 1–8), roll.
 * No Fear, Health, or other pool reductions — this is the manual fallback.
 */
export declare function quickD8Formula(diceRaw: unknown, keepRaw: unknown): {
    dice: number;
    keep: number;
    formula: string;
} | null;
export declare function initializeQuickD8Bar(): void;
//# sourceMappingURL=quick-d8-bar.d.ts.map