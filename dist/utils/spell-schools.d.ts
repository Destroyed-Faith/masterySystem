/**
 * Spell Schools — thematic groupings for spells (short + full display names).
 */
export interface SpellSchoolDefinition {
    name: string;
    fullName: string;
}
export declare const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition>;
export declare function getAllSpellSchools(): SpellSchoolDefinition[];
export declare function getSpellSchool(key: string): SpellSchoolDefinition | undefined;
//# sourceMappingURL=spell-schools.d.ts.map