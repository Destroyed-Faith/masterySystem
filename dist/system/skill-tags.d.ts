/**
 * Skill / Check Tag Registry
 *
 * Maps canonical skill names to semantic tags used by the Auto-Fail engine.
 * Currently the only consumer is Blinded, which forces `success: false` on
 * any check that carries the `sight` tag.
 *
 * This list is deliberately conservative: only skills whose core mechanic
 * requires sight land in the `sight` bucket. Non-sight variants (e.g.
 * "Perception (hearing)") should be tagged per-roll via the `checkContext`
 * hook passed into `masteryRoll`, not hardcoded here.
 *
 * GM-overridable via `CONFIG['mastery-system']?.skillTags` at runtime (merged
 * over these defaults; see `getSkillTags(name)`).
 */
export type SkillTag = 'sight' | 'hearing' | 'touch' | 'smell' | 'concentration';
/**
 * Lookup the tag list for a skill. Overrides from
 * `CONFIG['mastery-system'].skillTags` take precedence over the defaults.
 * Unknown skills yield an empty array (no tags → no auto-fail applies).
 */
export declare function getSkillTags(skillName: string): SkillTag[];
/** Expose the default table (useful for tests + settings UIs). */
export declare function getDefaultSkillTags(): Record<string, SkillTag[]>;
//# sourceMappingURL=skill-tags.d.ts.map