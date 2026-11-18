/**
 * Martial Skills were removed from the rules. Their refund now runs inside the
 * legacy-cleanup migration with every other legacy Skill; these keys and the
 * flag of the earlier refund stay for the XP audit and that migration.
 */
/** Legacy Skill keys. Migration-only; these are not Skills any more. */
export declare const LEGACY_MARTIAL_SKILL_KEYS: readonly ["handToHand", "meleeWeapons", "rangedWeapons", "defensiveCombat", "combatReflexes"];
export type LegacyMartialSkillKey = (typeof LEGACY_MARTIAL_SKILL_KEYS)[number];
/** Set by the earlier Martial Skills refund (pre legacy cleanup). */
export declare const MARTIAL_SKILLS_REFUND_FLAG = "martialSkillsRefunded";
//# sourceMappingURL=martial-skills-refund-migration.d.ts.map