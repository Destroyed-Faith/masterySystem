/**
 * Reaction trigger eligibility — when a reaction button may appear / stay enabled.
 *
 * Predicates are based on templateId / subfamily / mechanics shape (not free-text
 * trigger strings). Used by the Reaction Window card filters.
 */
/** Shared with the Reaction Window chat card. */
export type ReactionWindowPhase = 'defender' | 'allies' | 'others' | 'opportunity';
export interface ReactionTriggerContext {
    phase: ReactionWindowPhase;
    hit: boolean;
    attackTotal?: number | null;
    evadeTn?: number | null;
    attackType?: 'melee' | 'ranged' | null;
    /** Distance defender ↔ attacker in meters (null if unknown). */
    rangeToAttackerM?: number | null;
    /** Ally's distance to defender (ally role only). */
    allyDistanceM?: number | null;
    hasPassiveDR?: boolean;
    hasPassivePhasing?: boolean;
    /** Full Parry resolved for this attack (Riposte / Reflection). */
    hasParryThisHit?: boolean;
    /** Actual HP was lost from this damage instance (Overload). */
    hpLost?: boolean;
    /** Ongoing/status application surface (Cleanse) — not the attack window. */
    statusSurface?: boolean;
    isAoE?: boolean;
    suppressCounterattack?: boolean;
}
export interface ReactionEligibility {
    shown: boolean;
    enabled: boolean;
    reason?: string;
}
/** True when the reaction's only / primary defensive effect is Armor (hit/damage). */
export declare function isArmorAxisReaction(item: any): boolean;
/** Damage-buffer reactions that need a hit / incoming damage (Temp HP, Armor+Temp, DR). */
export declare function isDamageTriggerReaction(item: any): boolean;
export declare function isCounterDamageReaction(item: any): boolean;
export declare function isSpecialIncreaseReaction(item: any): boolean;
export declare function isRepositionReaction(item: any): boolean;
export declare function isGhostSlipReaction(item: any): boolean;
export declare function isCleanseReaction(item: any): boolean;
export declare function isOverloadReaction(item: any): boolean;
export declare function isParryFollowUpReaction(item: any): boolean;
export declare function isInterposeReaction(item: any): boolean;
export declare function actorHasPassiveDR(actor: any): boolean;
export declare function actorHasPassivePhasing(actor: any): boolean;
/** Meters between two actors' primary tokens, or null. */
export declare function distanceBetweenActorsMeters(a: Actor | null | undefined, b: Actor | null | undefined): number | null;
/**
 * Evaluate whether a reaction should appear (and be clickable) for this context.
 */
export declare function evaluateReactionEligibility(power: any, ctx: ReactionTriggerContext): ReactionEligibility;
/** Build a context snapshot for filtering a reaction window card. */
export declare function buildReactionTriggerContext(params: {
    phase: ReactionWindowPhase;
    hit: boolean;
    attackTotal?: number | null;
    evadeTn?: number | null;
    defender?: Actor | null;
    attacker?: Actor | null;
    allyDistanceM?: number | null;
    suppressCounterattack?: boolean;
    hasParryThisHit?: boolean;
    hpLost?: boolean;
    statusSurface?: boolean;
    isAoE?: boolean;
    attackType?: 'melee' | 'ranged' | null;
}): ReactionTriggerContext;
//# sourceMappingURL=reaction-eligibility.d.ts.map