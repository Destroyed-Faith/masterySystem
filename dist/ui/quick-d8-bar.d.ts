/**
 * Chat bar for a raw d8 pool: type a dice count, pick Keep (Mastery Rank 1–8), roll.
 * No Fear, Health, or other pool reductions — this is the manual fallback.
 */
export declare function quickD8Formula(diceRaw: unknown, keepRaw: unknown): {
    dice: number;
    keep: number;
    formula: string;
    shortLabel: string;
} | null;
/** One d8. An 8 is rolled again and added until the face is not 8. */
export declare function explodeD8Chain(rng?: () => number): number[];
export declare function resolveQuickD8Pool(dice: number, keep: number, rng?: () => number): {
    chains: number[][];
    totals: number[];
    keptIndices: number[];
    total: number;
};
/** The chat controls actually on screen. Foundry sometimes leaves an older copy in the DOM. */
export declare function canonicalChatControls(): HTMLElement | null;
/** Chat closed / sidebar collapsed: only the golden d8 above the chat tab. */
export declare function syncChatRollChrome(): void;
export declare function initializeQuickD8Bar(): void;
//# sourceMappingURL=quick-d8-bar.d.ts.map