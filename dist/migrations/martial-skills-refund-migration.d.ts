/**
 * Martial Skills were removed from the rules.
 *
 * A removed Skill's investment is split, never guessed into one pool:
 *
 * - Ranks from the original 40 Character Creation Skill Points, and ranks
 *   later placed from the unspent Skill Point pool, return to
 *   `system.skillPoints.unspent`. They stay Skill Points.
 * - Ranks bought with XP return as unrestricted Free XP (`system.points.xpFree`).
 *   `freeEarned` is not increased: a refund is not newly earned XP.
 *   The XP amount comes from XP history when that history accounts for the
 *   ranks. With no history, the unchanged Skill band table is used, because
 *   Skill costs did not change in v0.9.9.0. If history exists but does not
 *   match the ranks, the character is marked for review and nothing is refunded.
 *
 * Lifetime XP, Total XP earned, and Free XP earned are not changed.
 * The migration is idempotent: a flag plus `martialSkillsRefund.xpSettled`
 * stops a second run from refunding again.
 */
/** Legacy Skill keys. Migration-only; these are not Skills any more. */
export declare const LEGACY_MARTIAL_SKILL_KEYS: readonly ["handToHand", "meleeWeapons", "rangedWeapons", "defensiveCombat", "combatReflexes"];
export type LegacyMartialSkillKey = (typeof LEGACY_MARTIAL_SKILL_KEYS)[number];
export declare const MARTIAL_SKILLS_REFUND_FLAG = "martialSkillsRefunded";
export interface MartialSkillReview {
    key: string;
    reason: string;
}
export interface MartialSkillsRefundPlan {
    /** True when an earlier run already refunded this actor. */
    alreadyRefunded: boolean;
    /** True when the XP half of the refund was already settled. */
    xpSettled: boolean;
    /** Invested Rating per legacy Skill still stored on `system.skills`. */
    byKey: Partial<Record<LegacyMartialSkillKey, number>>;
    /** Skill Points returned to the unspent creation pool this run. */
    startingPoints: number;
    /** Post-creation ranks that were paid with XP. */
    xpRanks: number;
    /** Free XP (`system.points.xpFree`) returned this run. Never added to Lifetime XP or `freeEarned`. */
    xpRefund: number;
    /** Where `xpRefund` came from. `ambiguous` means the run must not apply it. */
    xpSource: 'none' | 'history' | 'canonical-band' | 'ambiguous';
    review: MartialSkillReview[];
    /**
     * Skill Points added to `system.skillPoints.unspent` this run.
     * Same as `startingPoints` on a first refund. 0 when already refunded
     * or while character creation's 40-point budget is still open.
     */
    refund: number;
    hasLegacyData: boolean;
    /**
     * Character creation is still open: its 40-point budget is the sum of
     * `system.skills`, so deleting the legacy keys already frees the points.
     */
    creationBudget: boolean;
    /** Skill redistribution is in progress: defer until it is finished or cancelled. */
    deferred: boolean;
}
export declare function planMartialSkillsRefund(actor: any): MartialSkillsRefundPlan;
/**
 * Update batch for one character, or `null` when nothing needs to change.
 * An ambiguous character is only marked for review; Skills and XP stay put.
 */
export declare function martialSkillsRefundUpdate(actor: any): Record<string, unknown> | null;
export declare function runMartialSkillsRefundMigration(actors: any[]): Promise<number>;
//# sourceMappingURL=martial-skills-refund-migration.d.ts.map