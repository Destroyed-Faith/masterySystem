/**
 * Autofire attack mode — Stepped Attack Chain, one shared Attack Roll.
 *
 * Before rolling, declare ordered attack slots up to Attack Capacity
 * (`1 + extraTargets`). The same creature MAY appear in several slots. Every slot
 * after the first must be within 4 m of the preceding slot's target and within the
 * Power's Range.
 *
 * ONE Attack/Casting Roll. Slot i (1-based) needs
 *   TN(i) = Target Defense(i) + 4×(i−1) + 4×DeclaredPaidRaises.
 * The +4 steps are NOT Paid Raises. The first miss/resistance ends the chain;
 * earlier hits remain valid. Dive for Cover cannot be used.
 *
 * ONE shared Damage Roll (Martial Weapon Damage or Spell Focus + Power dice) is
 * rolled once in full; each successful slot is a separate hit with separate
 * Damage Negation (declared BEFORE the roll, applied as an omitted prefix of the same
 * ordered dice) and separate mitigation. Slots are never deduped by token id.
 * See `autofire-shared-damage.ts` for the dice-omit convention.
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
export { AUTOFIRE_CHAIN_LINK_M, autofireRequiredTn, autofireSlotTnSurcharge, isAutofireSlotLegal, evaluateAutofireChain, } from './autofire-stepped.js';
/** Detect Autofire mode from a radial option / power item. */
export declare function detectAutofire(option: RadialCombatOption): boolean;
/** Attack slots after the first (Autofire(X) → X). */
export declare function getAutofireExtraTargets(option: RadialCombatOption): number;
/** Attack Capacity: maximum number of declared attack slots. */
export declare function getAutofireMaxTargets(option: RadialCombatOption): number;
/**
 * Resolve an ordered Autofire chain after the shared Attack Roll.
 * `chainTokenIds` may contain the same token id more than once (one entry per slot).
 * The chain stops at the first miss / negated hit; earlier hits are never undone.
 *
 * Shared Damage Roll (Players Guide §Apply Damage Negation):
 *  1. Walk the chain: attack check + pre-damage reactions per slot (no dice yet).
 *  2. ONE damage card rolls the FULL common pool once. Before any die is revealed,
 *     every pending hit (repeats included) declares Damage Negation in chain order;
 *     the omit count per hit is recorded and the resources are spent per hit.
 *  3. Each hit applies the SAME ordered faces with its own first-N dice omitted.
 *  Cancelling the damage card applies nothing and refunds the Negation spends.
 */
export declare function resolveAutofireChain(params: {
    attacker: any;
    chainTokenIds: string[];
    attackTotal: number;
    declaredRaiseSlots?: number;
    flags: Record<string, any>;
    weaponId?: string | null;
}): Promise<void>;
//# sourceMappingURL=autofire.d.ts.map