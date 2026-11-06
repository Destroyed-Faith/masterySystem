/**
 * Retire Summon Skill Dice Token purchases.
 *
 * Existing Bonds may have spent Tokens on Skill Dice. This migration:
 * - computes Tokens invested (`skillDicePurchases × skillDiceTokenCost`)
 * - credits them as `skillDiceTokenCredit` (unspent budget; not Artifact bonus)
 * - clears selectedSkills / skillDiceAlloc / skillDicePurchases
 * - is idempotent via per-bond `skillDiceRefundStamp`
 *
 * Does not alter other upgrades, combat stats, XP, or owner Professions.
 */
export declare const SUMMON_SKILL_DICE_REFUND_ACTOR_FLAG: "summonSkillDiceRefunded";
export interface SummonSkillDiceBondRefund {
    bondId: string;
    bondName: string;
    purchases: number;
    tokensCredited: number;
    alreadyRefunded: boolean;
    clearedSelectedSkills: string[];
    clearedAlloc: Record<string, number>;
}
export interface SummonSkillDiceRefundPlan {
    actorId: string;
    actorName: string;
    alreadyFullyRefunded: boolean;
    bonds: SummonSkillDiceBondRefund[];
    totalTokensCredited: number;
    review: string[];
    hasLegacyData: boolean;
}
export declare function planSummonSkillDiceRefund(actor: any): SummonSkillDiceRefundPlan;
/** Build actor update payload. Idempotent — stamped bonds are left alone. */
export declare function buildSummonSkillDiceRefundUpdate(actor: any, now?: Date): {
    ok: boolean;
    update: Record<string, unknown>;
    plan: SummonSkillDiceRefundPlan;
};
export declare function applySummonSkillDiceRefund(actor: any): Promise<SummonSkillDiceRefundPlan>;
export declare function runSummonSkillDiceRefundMigration(actors?: Iterable<any>): Promise<{
    scanned: number;
    credited: number;
    review: string[];
}>;
//# sourceMappingURL=summon-skill-dice-refund-migration.d.ts.map