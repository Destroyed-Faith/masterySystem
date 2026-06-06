/**
 * Upgrade Step rule — new spec.
 *
 * During each Upgrade Step, each individual upgrade may be increased only
 * once. You may bump several different Attributes, several different Skills,
 * several different Powers, and several different Artifacts, but the *same*
 * Attribute / Skill / Power / Artifact may not be bumped twice in the same
 * step.
 *
 * This replaces the old 50%-of-step Attribute spending cap. There is no
 * longer a fixed percentage limit on Attribute spending; progression is
 * controlled by the per-step bump limit, XP costs, Stone thresholds, and
 * the natural need to invest in Skills, Powers, and Artifacts.
 *
 * State shape (`system.xp.currentStep`):
 *
 *   {
 *     attributes: string[]; // attribute keys bumped this step
 *     skills:     string[]; // skill keys bumped this step
 *     powers:     string[]; // power item IDs bumped this step
 *     artifacts:  string[]; // artifact item IDs bumped this step
 *   }
 *
 * An "End Step" action clears all four lists.
 */
export type UpgradeKind = 'attribute' | 'skill' | 'power' | 'artifact';
export interface XpStepState {
    attributes: string[];
    skills: string[];
    powers: string[];
    artifacts: string[];
}
/** Fresh empty step bucket. */
export declare function emptyStep(): XpStepState;
/** Read the step bucket from an actor, tolerating legacy / missing shapes. */
export declare function readStep(actor: any): XpStepState;
/** Has the given Attribute / Skill / Power / Artifact already been bumped this step? */
export declare function isBumped(state: XpStepState, kind: UpgradeKind, id: string): boolean;
/** Return a new state with `id` recorded as bumped this step. Idempotent. */
export declare function recordBump(state: XpStepState, kind: UpgradeKind, id: string): XpStepState;
/** Return a new state with `id` removed from the bumped list. Idempotent. */
export declare function undoBump(state: XpStepState, kind: UpgradeKind, id: string): XpStepState;
/**
 * Persist a step state on the actor and (optionally) append a history note.
 * Side-effect-light: caller owns the rest of the update batch (XP totals,
 * attribute/skill/power values, …).
 */
export declare function commitStep(actor: any, next: XpStepState, options?: {
    historyNote?: string;
}): Promise<void>;
/**
 * "End Step" action: clear all four bump lists and append a summary history
 * entry. Players typically call this at the end of a downtime block once
 * they have spent everything they intend to spend.
 */
export declare function endStep(actor: any): Promise<XpStepState>;
//# sourceMappingURL=xp-step-rule.d.ts.map