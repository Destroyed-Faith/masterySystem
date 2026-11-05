/**
 * Shared reaction-kind predicates (K8.f / R3).
 * Eligibility, pool filtering and spend must use the same helpers so a reaction
 * cannot be offered under one rule and consumed under another.
 */
/** Parry + Weapon Damage (Riposte). */
export declare function isRiposteReaction(item: any): boolean;
/** Attack Reflection. */
export declare function isReflectionReaction(item: any): boolean;
/**
 * Explicit exception: Parry + Weapon Damage may be used again this round.
 * Each use still costs 1 Reaction.
 */
export declare function reactionMayRepeatThisRound(item: any): boolean;
//# sourceMappingURL=reaction-kind.d.ts.map