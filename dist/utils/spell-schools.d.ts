/**
 * Spell Schools (Mastery Spell Trees) configuration for Mastery System
 */
export interface SpellSchoolDefinition {
    name: string;
    fullName: string;
    focus: string;
    roles: string[];
    bonus?: string;
    requirements?: string;
}
export declare const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition>;
/**
 * Get all spell schools
 */
export declare function getAllSpellSchools(): SpellSchoolDefinition[];
/**
 * Get spell school by key
 */
export declare function getSpellSchool(key: string): SpellSchoolDefinition | undefined;
//# sourceMappingURL=spell-schools.d.ts.map