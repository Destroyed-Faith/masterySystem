/**
 * Training Advantage + Training Crit (Destroyed Faith Profession / Perception system).
 *
 * Profession Rank controls dice quality, never pool size:
 *   - Training Advantage: reroll initial faces ≤ N once (keep new face, then explode).
 *   - Training Crit: declare before roll → natural 7–8 explode; uses per Tyhran Day.
 *
 * Crit charges live only under actor flags keyed by existing Spec / situational
 * Skill ids — never rewrite `system.specializations` or XP for charge tracking.
 *
 * Day cycle: spent uses refresh when `currentDayIndex` advances (Tyhran Day).
 * Safe Haven / Day of Rest within the same Tyhran Day do not grant extra uses.
 */
export declare const SKILL_CRIT_USES_FLAG: "skillCritUses";
/** Tyhran day index the current `skillCritUses` map belongs to. */
export declare const SKILL_CRIT_DAY_FLAG: "skillCritDayIndex";
/** Max initial face that Training Advantage may reroll once (0 = no Advantage). */
export declare function skillAdvantageRerollMax(rank: number): 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** Daily Training Crit uses unlocked by Rank (0 below Rank 7). */
export declare function skillCritDailyAllowance(rank: number): 0 | 1 | 2;
export declare function skillAdvantageLabel(rank: number): string;
/** Current Tyhran calendar day (`mastery-system.currentDayIndex`). */
export declare function getSkillCritTyhranDayIndex(): number;
/**
 * Align Crit spends to the current Tyhran Day.
 * - Same day → no-op (idempotent; second call after calendar change or reload does nothing).
 * - Legacy actors with spends but no day stamp → stamp today without clearing (preserves data).
 * - Stamped day ≠ current → clear spends and stamp the new day.
 * Returns true when spends were cleared for a new day.
 */
export declare function syncSkillCritDayBoundary(actor: any): Promise<boolean>;
/** Uses already spent this Tyhran Day for this Profession / Perception id. */
export declare function getSkillCritUsesSpent(actor: any, skillId: string): number;
export declare function getSkillCritUsesRemaining(actor: any, skillId: string, rank: number): number;
/**
 * Spend one Training Crit charge for `skillId`. Returns false if none remain.
 * Does not mutate specializations or XP — only the Crit uses flag.
 * Syncs the Tyhran Day boundary first so a calendar advance cannot be double-spent.
 */
export declare function consumeSkillCritUse(actor: any, skillId: string, rank: number): Promise<boolean>;
/**
 * Flag updates that force a fresh Crit day (tests / explicit admin tools).
 * Not used by Safe Haven or Day of Rest — those must not grant mid-day extras.
 */
export declare function skillCritUsesResetFlagUpdate(dayIndex?: number): Record<string, unknown>;
export declare function resetSkillCritUses(actor: any): Promise<void>;
/** Sync Crit day for every world character (calendar day change). Idempotent per actor. */
export declare function syncAllCharacterSkillCritDayBoundaries(actors?: Iterable<any> | null | undefined): Promise<number>;
/** Pure snapshot helper for tests — never writes actor data. */
export declare function snapshotSpecializationIdentity(system: any): Array<{
    id: string;
    rank: number;
}>;
//# sourceMappingURL=skill-advantage.d.ts.map