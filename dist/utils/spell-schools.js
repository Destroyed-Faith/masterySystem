/**
 * @deprecated Spell Schools facade — legacy compatibility only.
 *
 * Spell Schools have been retired together with Mastery Trees. Spells are
 * now any Active template that the player opts into being a Spell during
 * character creation (see plan §6 and `EmbeddedPowerData.isSpell`). These
 * exports remain as empty stubs so remaining callsites compile.
 */
/** @deprecated — empty under the Templates system. */
export const SPELL_SCHOOLS = {};
/** @deprecated — always empty under the Templates system. */
export function getAllSpellSchools() {
    return [];
}
/** @deprecated — always `undefined` under the Templates system. */
export function getSpellSchool(_key) {
    return undefined;
}
//# sourceMappingURL=spell-schools.js.map