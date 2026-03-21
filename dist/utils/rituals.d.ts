/**
 * Ritual System - Foundation
 * Per Player's Guide: Out-of-combat casting, Stone Sealing, TN 20 + 4/Raise
 *
 * Rituals are a special type of power used outside of combat.
 * They require sealing stones (bound for the duration) and a
 * ritual roll against TN 20 + 4 per declared raise.
 */
export interface RitualDefinition {
    name: string;
    description: string;
    stoneCost: number;
    sealDuration: string;
    tn: number;
    raises: string[];
    attribute: string;
}
export declare const RITUAL_BASE_TN = 20;
export declare const RITUAL_RAISE_TN_INCREASE = 4;
/**
 * Calculate ritual TN based on declared raises
 */
export declare function calculateRitualTN(declaredRaises: number): number;
/**
 * Core ritual definitions from the Player's Guide
 */
export declare const RITUALS: RitualDefinition[];
//# sourceMappingURL=rituals.d.ts.map