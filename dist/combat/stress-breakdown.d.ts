/**
 * Stress Breakdown Check — Players Guide (~9214–9257).
 *
 * When the Stress Track fills (all bars empty / Breakdown reached):
 *  1. Meltdown (GM narrative: catatonia / panic / possession).
 *  2. Wits Attribute Check, keep = MR, TN = 8 × MR
 *     (no Skill Points, no Vitality expenditure).
 *  3. Success (Virtue) → reset track to Clear; next action +1 Keep.
 *  4. Failure (Affliction) → reset track; choose:
 *       A) Scar of Will — Mental Restriction (2 pts) + recover 2 Reroll Points
 *       B) Push It Down — GM gains 1d8 Misfortune Tokens
 */
export declare function registerStressBreakdownSettings(): void;
/**
 * Call after stress has been applied. If this hit collapsed the track for a
 * PC, post the Breakdown Check card (once).
 */
export declare function maybeTriggerStressBreakdown(actor: any, opts?: {
    wasCollapsed?: boolean;
}): Promise<boolean>;
/**
 * If the actor has a pending Virtue from a successful Breakdown, consume it
 * and return the Keep bonus (1). Otherwise 0.
 */
export declare function consumeStressBreakdownVirtueKeep(actor: any): Promise<number>;
export declare function registerStressBreakdownChatHandlers(): void;
//# sourceMappingURL=stress-breakdown.d.ts.map