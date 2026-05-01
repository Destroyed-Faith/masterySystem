/**
 * Attribute Spend Limit — the **50% Rule** (Players Guide 7121–7132).
 *
 * > Whenever you spend XP (including banked XP), at most 50% of the XP
 * > you spend in that upgrade step may go to **Attributes**.  The rule
 * > applies to **each step** — you may split spending across multiple
 * > steps. If exact 50/50 splitting is impossible due to pricing, you
 * > may exceed the Attribute share by **up to 1 XP** in that step.
 *
 * The legacy implementation enforced a *lifetime* cap
 * (`spentAttributes ≤ floor(totalEarned / 2)`) which is conceptually
 * wrong: the cap is per **upgrade step**, not per character.
 *
 * The runtime represents an "upgrade step" as a transient bucket on the
 * actor (`system.xp.currentStep = { attrSpent, nonAttrSpent }`). Every
 * confirmed XP spend appends to the relevant bucket; an explicit
 * "End Step" action resets the bucket (typically at downtime end).
 */
export declare const XP_STEP_TOLERANCE = 1;
export interface XpStepState {
    /** XP spent on Attributes during the current upgrade step. */
    attrSpent: number;
    /** XP spent on everything else (Skills, Powers, Artifacts, …). */
    nonAttrSpent: number;
}
export declare function emptyStep(): XpStepState;
export declare function readStep(actor: any): XpStepState;
/**
 * Maximum Attribute XP that may be spent in a step whose total XP would
 * become `stepTotal`. Adds the documented `+1 XP` rounding tolerance.
 */
export declare function maxAttrInStep(stepTotal: number): number;
/**
 * Check whether the actor may spend `attrCost` more XP on Attributes
 * **without** also spending non-Attribute XP first. Returns the gap
 * (`> 0` means "you would over-spend by N XP on Attributes") and a
 * helper `requiredNonAttr` describing how much non-Attribute XP would
 * be needed to legalize the spend.
 */
export declare function checkAttrSpend(state: XpStepState, attrCost: number): {
    ok: boolean;
    over: number;
    requiredNonAttr: number;
    cap: number;
};
/** Apply a confirmed Attribute spend to the step bucket. */
export declare function applyAttrSpend(state: XpStepState, attrCost: number): XpStepState;
/** Apply a confirmed non-Attribute spend (Skills / Powers / Artifacts). */
export declare function applyNonAttrSpend(state: XpStepState, nonAttrCost: number): XpStepState;
/**
 * Refund support: a refund (negative spend) reduces the matching bucket
 * but never below zero. Used when a player decreases an attribute or
 * skill they purchased earlier in the same step.
 */
export declare function refundAttrSpend(state: XpStepState, refund: number): XpStepState;
export declare function refundNonAttrSpend(state: XpStepState, refund: number): XpStepState;
/**
 * Persist the step state on the actor and append a history entry. The
 * caller owns whatever else needs to change (XP totals, attribute
 * values, …). This helper is intentionally side-effect-light so the
 * existing confirm flows can wrap their own update batches around it.
 */
export declare function commitStep(actor: any, next: XpStepState, options?: {
    historyNote?: string;
}): Promise<void>;
/**
 * "End Step" action: clear the bucket and append a summary history
 * entry. Players typically call this at the end of a downtime block
 * once they have spent everything they intend to.
 */
export declare function endStep(actor: any): Promise<XpStepState>;
//# sourceMappingURL=xp-step-rule.d.ts.map