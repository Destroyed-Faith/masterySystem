/**
 * Skills configuration for Mastery System
 * Organized by category with their associated attributes
 */
export interface SkillDefinition {
    name: string;
    attributes: string[];
    category: string;
    /** Player's Guide summary for hover tooltips. */
    description: string;
}
export declare const SKILL_CATEGORIES: {
    /** Perception / sensing skills (was "Awareness"; Sense Slot is separate). */
    readonly AWARENESS: "Perception";
    readonly PHYSICAL: "Physical";
    readonly KNOWLEDGE_CRAFT: "Knowledge & Craft";
    readonly SOCIAL: "Social";
    readonly SURVIVAL: "Survival";
};
export declare const SKILLS: Record<string, SkillDefinition>;
/** Canonical category order for sheets (Perception first — combat gate). */
export declare const SKILL_CATEGORY_ORDER: string[];
/**
 * Compact skill groups for NPC sheets: category → editable ratings.
 * Values are the same `system.skills.<key>` path used by Perception / skill rolls.
 */
export declare function buildNpcSkillGroups(skillValues?: Record<string, number> | null | undefined): Array<{
    category: string;
    skills: Array<{
        key: string;
        name: string;
        value: number;
    }>;
}>;
/**
 * Get all skills grouped by category
 */
export declare function getSkillsByCategory(): Record<string, SkillDefinition[]>;
/**
 * Get skill definition by key
 */
export declare function getSkill(key: string): SkillDefinition | undefined;
/** Hover tooltip text for a skill key (Player's Guide summary). */
export declare function getSkillDescription(key: string): string;
//# sourceMappingURL=skills.d.ts.map