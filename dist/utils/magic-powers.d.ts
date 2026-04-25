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
import type { PowerDefinition } from './powers/types.js';
/** @deprecated — returns an empty list under the Templates system. */
export declare const ALL_MAGIC_POWERS: PowerDefinition[];
/** @deprecated — always returns an empty list under the Templates system. */
export declare function getMagicPowersBySchool(_schoolName: string): PowerDefinition[];
/** @deprecated — always returns `undefined` under the Templates system. */
export declare function getMagicPower(_schoolName: string, _powerName: string): PowerDefinition | undefined;
//# sourceMappingURL=magic-powers.d.ts.map