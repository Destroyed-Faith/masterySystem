/**
 * Read access to the printed PL 1–16 tables of docs/Rules/Canonical/Actives.md
 * (generated into canonical-actives.generated.ts).
 */
import { type CanonicalActiveRow } from './canonical-actives.generated.js';
export type ActiveFlavour = 'melee' | 'ranged';
export declare function canonicalActiveRow(canonId: string, level: number): CanonicalActiveRow | null;
/** Printed Special(X) for one Power Level; `undefined` when not printed. */
export declare function canonicalSpecialRank(canonId: string, key: string, level: number): number | undefined;
export declare function canonicalRadiusM(canonId: string, level: number): number | undefined;
/** PL 1–16 series of one printed Special (0 where the PL is unavailable or unprinted). */
export declare function canonicalSpecialSeries(canonId: string, key: string): number[];
/** PL 1–16 radius series (0 where the PL is unavailable or has no radius). */
export declare function canonicalRadiusSeries(canonId: string): number[];
export declare function singleTargetSpecialCanonId(flavour: ActiveFlavour, key: string): string;
export declare function aoeSpecialCanonId(flavour: ActiveFlavour, key: string): string;
/** Printed Ranged Persistent Special Zone table per Special tier. */
export declare const ZONE_CANON_ID_BY_TIER: Readonly<Record<3 | 4 | 5 | 6, string>>;
//# sourceMappingURL=canonical-active-lookup.d.ts.map