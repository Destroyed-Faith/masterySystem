/**
 * Retired fixed Skill keys (pre-DF 2026). Read-only lookup for migration
 * review screens that display archived Skill ratings; never used by runtime rules.
 */
export declare const LEGACY_SKILL_CATEGORIES: {
    readonly AWARENESS: "Perception";
    readonly PHYSICAL: "Physical";
    readonly KNOWLEDGE_CRAFT: "Knowledge & Craft";
    readonly SOCIAL: "Social";
    readonly SURVIVAL: "Survival";
};
export interface LegacySkillEntry {
    name: string;
    category: string;
}
export declare const LEGACY_SKILL_CATALOG: Record<string, LegacySkillEntry>;
//# sourceMappingURL=legacy-skill-catalog.d.ts.map