/**
 * @deprecated Magic Powers facade — legacy compatibility only.
 *
 * The Trees/Spell-Schools system has been retired in favour of
 * Templates (see `src/utils/powers/templates/index.ts`). Every "Magic Power"
 * now lives as a normal Active template and becomes a Spell at character
 * creation via the `isSpell` flag — see plan §6 (Active-as-Spell).
 *
 * This module retains its public exports as no-op stubs so residual
 * consumers continue to compile until the final cleanup removes every
 * callsite.
 */
/** @deprecated — returns an empty list under the Templates system. */
export const ALL_MAGIC_POWERS = [];
/** @deprecated — always returns an empty list under the Templates system. */
export function getMagicPowersBySchool(_schoolName) {
    return [];
}
/** @deprecated — always returns `undefined` under the Templates system. */
export function getMagicPower(_schoolName, _powerName) {
    return undefined;
}
//# sourceMappingURL=magic-powers.js.map