/**
 * Stepped Autofire — pure rules helpers (no Foundry globals).
 *
 * Players Guide "Autofire — Stepped Attack Chain":
 * - Ordered attack slots up to Attack Capacity. The same creature MAY repeat.
 * - Every slot after the first is within 4 m of the preceding slot's target.
 * - ONE Attack/Casting Roll. TN(i) = Defense(i) + 4×(i−1) + 4×DeclaredPaidRaises.
 *   The +4 steps are NOT Paid Raises (no Raise effects; Free Raises cannot cancel them).
 * - First miss ends the chain; earlier hits remain valid.
 */
export declare const AUTOFIRE_CHAIN_LINK_M = 4;
/** Surcharge added to the TN for each step along the chain. */
export declare const AUTOFIRE_STEP_TN = 4;
/** Paid Raise increment (kept local so this module stays dependency-free). */
export declare const AUTOFIRE_PAID_RAISE_TN = 4;
/** Surcharge for a 0-based slot: slot 0 → +0, slot 1 → +4, slot 2 → +8 … */
export declare function autofireSlotTnSurcharge(slotIndex0Based: number): number;
/** Required TN for one slot: Defense + 4×slotIndex + 4×PaidRaises. */
export declare function autofireRequiredTn(params: {
    defense: number;
    slotIndex0Based: number;
    paidRaises?: number;
}): number;
/**
 * Can `candidateId` be appended as the next slot?
 * Repeats are allowed (same token = 0 m). Other tokens must be within 4 m of the
 * previous slot's target. The first slot has no link requirement.
 */
export declare function isAutofireSlotLegal(opts: {
    slotCount: number;
    capacity: number;
    previousTargetId: string | null;
    candidateId: string;
    /** Distance from the previous slot's target (m). Ignored for repeats / first slot. */
    distanceFromPreviousM?: number;
}): boolean;
export type AutofireSlotInput = {
    defense: number;
};
export type AutofireSlotEvaluation = {
    slotIndex: number;
    defense: number;
    requiredTn: number;
    surcharge: number;
    hit: boolean;
};
/**
 * Evaluate the chain against one shared attack total. Stops at the first miss;
 * slots after it are not evaluated. Pure — no reactions (those can end the chain
 * later without undoing earlier hits).
 */
export declare function evaluateAutofireChain(params: {
    attackTotal: number;
    slots: readonly AutofireSlotInput[];
    paidRaises?: number;
}): {
    slots: AutofireSlotEvaluation[];
    hits: number;
    endedAtSlot: number | null;
};
/**
 * Flags for the single shared Damage Roll. Autofire is NOT Instant AoE: weapon /
 * Spell Focus damage stays on, and no AoE flags are set.
 */
export declare function autofireDamageFlags(flags: Record<string, any>): Record<string, any>;
//# sourceMappingURL=autofire-stepped.d.ts.map