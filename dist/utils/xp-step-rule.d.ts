/**
 * Upgrade Step bookkeeping.
 *
 * Core 2026-11-04: there is **no** limit on how many times the same Attribute,
 * Specialization, Power, or Artifact may be increased during one Upgrade Step.
 * Characters may purchase multiple consecutive increases of the same value in
 * one step, paying every intermediate level and respecting MR / prerequisites.
 *
 * `system.xp.currentStep` still records which entities were touched this step
 * (for history / UI hints). It must **not** gate further legal increases.
 *
 * State shape (`system.xp.currentStep`):
 *
 *   {
 *     attributes: string[]; // attribute keys touched this step
 *     skills:     string[]; // skill / specialization keys touched this step
 *     powers:     string[]; // power item IDs touched this step
 *     artifacts:  string[]; // artifact item IDs touched this step
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
/**
 * True when `id` appears in this step's touch list (history / UI).
 * Does **not** forbid further increases — consecutive upgrades in one step are legal.
 */
export declare function isBumped(state: XpStepState, kind: UpgradeKind, id: string): boolean;
/**
 * Always allows another increase of the same entity in the current Upgrade Step.
 * Kept as an explicit helper so call sites stop inventing once-per-step gates.
 */
export declare function canIncreaseAgainInStep(_state: XpStepState, _kind: UpgradeKind, _id: string): boolean;
/** Return a new state with `id` recorded as touched this step. Idempotent. */
export declare function recordBump(state: XpStepState, kind: UpgradeKind, id: string): XpStepState;
/** Return a new state with `id` removed from the touched list. Idempotent. */
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
 * "End Step" action: clear all four touch lists and append a summary history
 * entry. Players typically call this at the end of a downtime block once
 * they have spent everything they intend to spend.
 */
export declare function endStep(actor: any): Promise<XpStepState>;
//# sourceMappingURL=xp-step-rule.d.ts.map