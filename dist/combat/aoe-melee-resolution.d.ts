/**
 * Melee weapon AoE — Body save escape for secondary targets + power-only damage.
 */
/** Body save DC to escape secondary AoE damage (attacker mastery rank). */
export declare function aoeSecondaryBodySaveDc(masteryRank: number): number;
/**
 * After primary damage is resolved: each secondary may spend a Reaction to roll Body vs DC; success skips AoE damage.
 */
export declare function resolveAoeMeleeSecondaries(params: {
    attacker: any;
    attackerMasteryRank: number;
    secondaryTokenIds: string[];
    powerBonusDice: number;
}): Promise<void>;
//# sourceMappingURL=aoe-melee-resolution.d.ts.map