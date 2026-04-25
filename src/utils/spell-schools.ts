/**
 * @deprecated Spell Schools facade — legacy compatibility only.
 *
 * Spell Schools have been retired together with Mastery Trees. Spells are
 * now any Active template that the player opts into being a Spell during
 * character creation (see plan §6 and `EmbeddedPowerData.isSpell`). These
 * exports remain as empty stubs so remaining callsites compile.
 */

export interface SpellSchoolDefinition {
    name: string;
    fullName: string;
}

/** @deprecated — empty under the Templates system. */
export const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition> = {};

/** @deprecated — always empty under the Templates system. */
export function getAllSpellSchools(): SpellSchoolDefinition[] {
    return [];
}

/** @deprecated — always `undefined` under the Templates system. */
export function getSpellSchool(_key: string): SpellSchoolDefinition | undefined {
    return undefined;
}
