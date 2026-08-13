/**
 * Canonical Summon Power allowlist.
 * Movement Powers are excluded — they would bypass the Bond Movement upgrade.
 * Only listed Passives / Active Buffs / Reactions may be bought for a Body.
 */
export declare const SUMMON_POWER_ALLOWLIST: readonly string[];
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
/** Written PP for a summon purchase: Active uses 30×Level; others use the standard table ×10. */
export declare function summonPowerPpCost(category: string, level: number, explicitPp?: number): number;
export declare function summonPowerTokenCost(category: string, level: number, explicitPp?: number): number;
export declare function evaluateSummonPower(templateId: string, level: number, ownerMasteryRank: number): SummonPowerEval;
export declare function listSummonPowerCatalog(ownerMasteryRank: number, level?: number): SummonPowerEval[];
//# sourceMappingURL=summon-power-allowlist.d.ts.map