export interface CanonicalActiveRow {
    range?: 'melee' | 'self';
    rangeM?: number;
    radiusM?: number;
    specials?: Readonly<Record<string, number>>;
    dice?: number;
}
export interface CanonicalActiveTable {
    title: string;
    /** Index 0 = PL 1. `null` = Unavailable at that Power Level. */
    rows: readonly (CanonicalActiveRow | null)[];
}
export declare const CANONICAL_ACTIVES: Readonly<Record<string, CanonicalActiveTable>>;
//# sourceMappingURL=canonical-actives.generated.d.ts.map