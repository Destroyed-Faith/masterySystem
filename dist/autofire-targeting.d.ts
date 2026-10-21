/**
 * Autofire chain targeting — declare ordered attack slots before the roll.
 *
 * Stepped Attack Chain: first slot in Power Range; each next slot's target is
 * within 4 m of the preceding slot's target (the same creature may be chosen again,
 * 0 m) and still within Range; up to Attack Capacity. Each slot adds +4 TN
 * (slot 1: +0, slot 2: +4, slot 3: +8 …) — not a Paid Raise.
 */
import type { RadialCombatOption } from './radial-menu/types.js';
/**
 * Interactive Autofire chain picker. Returns ordered token ids — one entry per
 * attack slot, so the same id may appear several times — or null if cancelled.
 */
export declare function promptAutofireChain(attackerToken: any, option: RadialCombatOption): Promise<string[] | null>;
//# sourceMappingURL=autofire-targeting.d.ts.map