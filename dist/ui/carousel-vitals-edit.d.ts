export type VitalsPool = 'health' | 'stress';
/** Sync scarred count fields after bar edits. */
export declare function scarredCountFromBars(bars: Array<{
    current?: unknown;
    max?: unknown;
}>): number;
export declare function clampBarCurrent(current: number, max: number): number;
/**
 * Apply a GM vitals edit on the live combat actor (token actor when unlinked).
 * Scarred bars clear when current is raised above 0.
 */
export declare function applyCarouselVitalsEdit(actor: any, opts: {
    pool: VitalsPool;
    barIndex?: number;
    current?: number;
    fillBar?: boolean;
    tempHP?: number;
}): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=carousel-vitals-edit.d.ts.map