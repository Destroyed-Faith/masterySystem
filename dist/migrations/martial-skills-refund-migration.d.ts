/**
 * Martial Skills were removed from the rules. Every permanent Skill Point a
 * character had invested in Hand-to-Hand, Melee Weapons, Ranged Weapons,
 * Defensive Combat, or Combat Reflexes is refunded as an unspent Skill Point
 * (`system.skillPoints.unspent`) and the obsolete Skill data is deleted.
 *
 * The refund is the invested Rating (the permanent maximum), never the
 * remaining consumable value. The migration runs once per actor: a flag marks
 * refunded characters, and a later run only strips leftover legacy keys
 * without refunding again.
 */
/** Legacy Skill keys. Migration-only; these are not Skills any more. */
export declare const LEGACY_MARTIAL_SKILL_KEYS: readonly ["handToHand", "meleeWeapons", "rangedWeapons", "defensiveCombat", "combatReflexes"];
export type LegacyMartialSkillKey = (typeof LEGACY_MARTIAL_SKILL_KEYS)[number];
export declare const MARTIAL_SKILLS_REFUND_FLAG = "martialSkillsRefunded";
export interface MartialSkillsRefundPlan {
    /** True when the actor was already refunded by an earlier run. */
    alreadyRefunded: boolean;
    /** Invested Rating per legacy Skill (only keys with data). */
    byKey: Partial<Record<LegacyMartialSkillKey, number>>;
    /** Sum of `byKey` — the Skill Points refunded this run (0 when already refunded). */
    refund: number;
    /** Legacy keys still present anywhere on the actor (skills, spent, snapshot, backup). */
    hasLegacyData: boolean;
}
export declare function planMartialSkillsRefund(actor: any): MartialSkillsRefundPlan;
/**
 * Update batch for one character, or `null` when nothing needs to change.
 * Refunds once (flag), strips legacy keys every time they are found.
 */
export declare function martialSkillsRefundUpdate(actor: any): Record<string, unknown> | null;
export declare function runMartialSkillsRefundMigration(actors: any[]): Promise<number>;
//# sourceMappingURL=martial-skills-refund-migration.d.ts.map