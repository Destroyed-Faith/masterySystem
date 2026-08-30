/**
 * Canonical Summon Power purchases (PG "Purchasing Canonical Powers").
 *
 * Summons buy complete Powers from the canonical catalogues — the catalog is
 * open, not a curated allowlist. A small blocklist covers Powers whose written
 * requirements a Summon can never meet (wielded weapon / worn armor) per
 * PG: "A Power that requires an Attribute, resource, item, or subsystem the
 * Summon does not possess cannot be purchased or used."
 *
 * Movement Powers are legal purchases: they replace the using Body's normal
 * Movement for that Turn and do not add a second permanent Movement Mode.
 */
/** Powers whose requirements a Summon cannot satisfy (no weapons / worn armor). */
export declare const SUMMON_POWER_BLOCKLIST: readonly string[];
export type SummonPowerEval = {
    templateId: string;
    name: string;
    category: string;
    level: number;
    ppCost: number;
    tokenCost: number;
    legal: boolean;
    reason: string;
};
export declare function isSummonPowerAllowed(templateId: string): boolean;
/**
 * Written PP for a summon purchase. Active/Movement use the 30 PP/level curve;
 * Passive/Reaction 20/level; Active Buff 30/level + 10.
 */
export declare function summonPowerPpCost(category: string, level: number, explicitPp?: number): number;
export declare function summonPowerTokenCost(category: string, level: number, explicitPp?: number): number;
export declare function evaluateSummonPower(templateId: string, level: number, ownerMasteryRank: number): SummonPowerEval;
export declare function listSummonPowerCatalog(ownerMasteryRank: number, level?: number): SummonPowerEval[];
//# sourceMappingURL=summon-power-allowlist.d.ts.map