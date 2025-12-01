/**
 * Skills configuration for Mastery System
 * Organized by category with their associated attributes
 */
export interface SkillDefinition {
    name: string;
    attributes: string[];
    category: string;
}
export declare const SKILL_CATEGORIES: {
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
//# sourceMappingURL=skills.d.ts.map