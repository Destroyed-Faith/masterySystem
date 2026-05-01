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
export const XP_STEP_TOLERANCE = 1;
export function emptyStep() {
    return { attrSpent: 0, nonAttrSpent: 0 };
}
export function readStep(actor) {
    const raw = actor?.system?.xp?.currentStep;
    return {
        attrSpent: Math.max(0, Math.floor(Number(raw?.attrSpent) || 0)),
        nonAttrSpent: Math.max(0, Math.floor(Number(raw?.nonAttrSpent) || 0)),
    };
}
/**
 * Maximum Attribute XP that may be spent in a step whose total XP would
 * become `stepTotal`. Adds the documented `+1 XP` rounding tolerance.
 */
export function maxAttrInStep(stepTotal) {
    const total = Math.max(0, Math.floor(stepTotal));
    return Math.floor(total / 2) + XP_STEP_TOLERANCE;
}
/**
 * Check whether the actor may spend `attrCost` more XP on Attributes
 * **without** also spending non-Attribute XP first. Returns the gap
 * (`> 0` means "you would over-spend by N XP on Attributes") and a
 * helper `requiredNonAttr` describing how much non-Attribute XP would
 * be needed to legalize the spend.
 */
export function checkAttrSpend(state, attrCost) {
    const cost = Math.max(0, Math.floor(attrCost));
    const newAttr = state.attrSpent + cost;
    const newTotal = newAttr + state.nonAttrSpent;
    const cap = maxAttrInStep(newTotal);
    const over = Math.max(0, newAttr - cap);
    // requiredNonAttr: solve newAttr ≤ floor((newAttr + nonAttr) / 2) + tol
    // → 2*newAttr − 2*tol ≤ newAttr + nonAttr → nonAttr ≥ newAttr − 2*tol
    const requiredNonAttr = Math.max(0, newAttr - 2 * XP_STEP_TOLERANCE - state.nonAttrSpent);
    return { ok: over === 0, over, requiredNonAttr, cap };
}
/** Apply a confirmed Attribute spend to the step bucket. */
export function applyAttrSpend(state, attrCost) {
    return {
        attrSpent: state.attrSpent + Math.max(0, Math.floor(attrCost)),
        nonAttrSpent: state.nonAttrSpent,
    };
}
/** Apply a confirmed non-Attribute spend (Skills / Powers / Artifacts). */
export function applyNonAttrSpend(state, nonAttrCost) {
    return {
        attrSpent: state.attrSpent,
        nonAttrSpent: state.nonAttrSpent + Math.max(0, Math.floor(nonAttrCost)),
    };
}
/**
 * Refund support: a refund (negative spend) reduces the matching bucket
 * but never below zero. Used when a player decreases an attribute or
 * skill they purchased earlier in the same step.
 */
export function refundAttrSpend(state, refund) {
    const r = Math.max(0, Math.floor(refund));
    return { attrSpent: Math.max(0, state.attrSpent - r), nonAttrSpent: state.nonAttrSpent };
}
export function refundNonAttrSpend(state, refund) {
    const r = Math.max(0, Math.floor(refund));
    return { attrSpent: state.attrSpent, nonAttrSpent: Math.max(0, state.nonAttrSpent - r) };
}
/**
 * Persist the step state on the actor and append a history entry. The
 * caller owns whatever else needs to change (XP totals, attribute
 * values, …). This helper is intentionally side-effect-light so the
 * existing confirm flows can wrap their own update batches around it.
 */
export async function commitStep(actor, next, options) {
    if (!actor)
        return;
    await actor.update({
        'system.xp.currentStep.attrSpent': next.attrSpent,
        'system.xp.currentStep.nonAttrSpent': next.nonAttrSpent,
    });
    if (options?.historyNote) {
        const list = Array.isArray(actor.system?.xp?.history) ? [...actor.system.xp.history] : [];
        list.push({
            ts: Date.now(),
            kind: 'step',
            note: options.historyNote,
            after: next,
        });
        await actor.update({ 'system.xp.history': list.slice(-200) });
    }
}
/**
 * "End Step" action: clear the bucket and append a summary history
 * entry. Players typically call this at the end of a downtime block
 * once they have spent everything they intend to.
 */
export async function endStep(actor) {
    const before = readStep(actor);
    const next = emptyStep();
    if (actor) {
        await actor.update({
            'system.xp.currentStep.attrSpent': 0,
            'system.xp.currentStep.nonAttrSpent': 0,
        });
        const list = Array.isArray(actor.system?.xp?.history) ? [...actor.system.xp.history] : [];
        list.push({
            ts: Date.now(),
            kind: 'step-end',
            note: `Step closed (Attr: ${before.attrSpent} XP, Non-Attr: ${before.nonAttrSpent} XP)`,
            before,
            after: next,
        });
        await actor.update({ 'system.xp.history': list.slice(-200) });
    }
    return next;
}
//# sourceMappingURL=xp-step-rule.js.map