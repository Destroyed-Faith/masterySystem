/**
 * Autofire chain targeting — declare an ordered target list before the roll.
 *
 * Rules: first target in Power Range; each next target within 4 m of the previous
 * and still within Range; no duplicates; up to maxTargets.
 */
import type { RadialCombatOption } from './radial-menu/types.js';
/**
 * Interactive Autofire chain picker. Returns ordered token ids, or null if cancelled.
 */
export declare function promptAutofireChain(attackerToken: any, option: RadialCombatOption): Promise<string[] | null>;
//# sourceMappingURL=autofire-targeting.d.ts.map