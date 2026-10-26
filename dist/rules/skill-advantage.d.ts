/**
 * Skill Advantage + Skill Crit (Destroyed Faith Skill System).
 *
 * Skill Rank controls dice quality, never pool size:
 *   - Advantage: reroll initial faces ≤ N once (keep new face, then explode).
 *   - Crit: declare before roll → natural 7–8 explode; daily uses per Skill.
 *
 * Crit charges live only under actor flags keyed by existing Spec / situational
 * Skill ids — never rewrite `system.specializations` or XP for charge tracking.
 */
export declare const SKILL_CRIT_USES_FLAG: "skillCritUses";
/** Max initial face that Skill Advantage may reroll once (0 = no Advantage). */
export declare function skillAdvantageRerollMax(rank: number): 0 | 1 | 2 | 3 | 4 | 5;
/** Daily Skill Crit uses unlocked by Rank (0 below Rank 5). */
export declare function skillCritDailyAllowance(rank: number): 0 | 1 | 2;
export declare function skillAdvantageLabel(rank: number): string;
/** Uses already spent today for this Skill id (Spec id or NPC situational id). */
export declare function getSkillCritUsesSpent(actor: any, skillId: string): number;
export declare function getSkillCritUsesRemaining(actor: any, skillId: string, rank: number): number;
/**
 * Spend one Skill Crit charge for `skillId`. Returns false if none remain.
 * Does not mutate specializations or XP — only the Crit uses flag.
 */
export declare function consumeSkillCritUse(actor: any, skillId: string, rank: number): Promise<boolean>;
/** Clear all Skill Crit daily spends (Safe Haven / Day of Rest). */
export declare function skillCritUsesResetFlagUpdate(): Record<string, unknown>;
export declare function resetSkillCritUses(actor: any): Promise<void>;
/** Pure snapshot helper for tests — never writes actor data. */
export declare function snapshotSpecializationIdentity(system: any): Array<{
    id: string;
    rank: number;
}>;
//# sourceMappingURL=skill-advantage.d.ts.map