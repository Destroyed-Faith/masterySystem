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
    readonly MARTIAL: "Martial";
};
export declare const SKILLS: Record<string, SkillDefinition>;
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