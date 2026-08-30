/**
 * Aid (Basic Reaction — Players Guide "Basic Reactions"):
 *
 *   Trigger:     an ally makes a Skill Check you can meaningfully assist.
 *   Requirement: the assistant has the SAME Skill at Rating ≥ 2 × their
 *                Mastery Rank (Full Pool Requirement).
 *   Effect:      the ally gains +4 to the Final Result of that Skill Check.
 *                Only ONE Aid may affect the same Skill Check. Aid does not
 *                spend the assistant's Skill Points. During combat, using
 *                Aid spends 1 Reaction.
 *
 * Rendered as an "Aid (+4)" button on Skill Check chat cards.
 */
export declare const AID_BONUS = 4;
/** Characters eligible to Aid this check: same skill ≥ 2×MR, not the roller. */
export declare function listEligibleAidCharacters(skillKey: string, rollerActorId: string): any[];
export declare function registerAidReactionClickHandler(): void;
//# sourceMappingURL=aid-reaction-handler.d.ts.map