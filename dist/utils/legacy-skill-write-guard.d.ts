/**
 * Legacy skill fields (`system.skills`, `system.skillsSpent`, `system.skillPoints`,
 * `system.creation.skillsRedistributing`) and the retired Echo Card picks
 * (`system.echo.selectedCardIds`, `system.echo.cardUses`) are not part of the active data model.
 * Professions (`system.specializations`) are the only skill structure. Writes to
 * the legacy fields are dropped; only `-=` deletions pass so the legacy-cleanup
 * migration can remove the archived data.
 */
/** Update option set only by the legacy-cleanup migration's apply/rollback writes. */
export declare const LEGACY_SKILL_MIGRATION_OPTION = "masteryLegacySkillMigration";
export declare const LEGACY_SKILL_SYSTEM_KEYS: readonly ["skills", "skillsSpent", "skillPoints"];
export declare const RETIRED_ECHO_CARD_KEYS: readonly ["selectedCardIds", "cardUses"];
/** Flag holding the archived legacy skill data (migration and homepage import). */
export declare const LEGACY_SKILLS_ARCHIVE_FLAG = "legacySkillsArchive";
/** Flag holding dropped legacy writes until the legacy-cleanup migration archives them. */
export declare const LEGACY_SKILL_QUARANTINE_FLAG = "legacySkillWriteQuarantine";
/** Removes legacy skill writes from an update/create payload in place. Returns the dropped values by path. */
export declare function stripLegacySkillWrites(changed: any): Record<string, unknown>;
/**
 * Strips legacy skill writes and, when they carry data, records them under
 * `flags.mastery-system.${LEGACY_SKILL_QUARANTINE_FLAG}` on the same payload so
 * nothing is lost silently (e.g. a JSON import of a pre-cleanup actor).
 */
export declare function quarantineLegacySkillWrites(changed: any, existingQuarantine?: unknown): string[];
//# sourceMappingURL=legacy-skill-write-guard.d.ts.map