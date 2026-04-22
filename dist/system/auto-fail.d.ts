/**
 * Auto-Fail Engine — declarative mapping from conditions to forced outcomes.
 *
 * Current consumers:
 *   - `Blinded(X)` forces failure on `sight`-tagged checks AND subtracts
 *     `X` dice from any `sight`-tagged attack.
 *   - `Stunned(X)` locks `X` attack actions for the current round (enforced
 *     in `src/combat/action-economy.ts`, not here).
 *
 * Keep this module side-effect-free and purely declarative so roll-handler
 * and attack-roll-handler can call it without pulling in Foundry globals.
 */
import { type SkillTag } from './skill-tags.js';
export type CheckTag = SkillTag | 'sight' | string;
export interface CheckContext {
    /** Tags carried by this check / attack ("sight", "hearing", "concentration", …). */
    tags?: CheckTag[];
    /** Named skill (optional — looked up in `skill-tags.ts` when tags are empty). */
    skillKey?: string;
}
export interface AutoFailDecision {
    /** `true` when this check should be forced to `success: false`. */
    failed: boolean;
    /** Stable reason string stored on `MasteryRollResult.autoFailReason`. */
    reason?: string;
    /**
     * Dice pool penalty applied before the roll (subtracted from numDice).
     * Pools never go below 1 — the caller is responsible for clamping.
     */
    dicePenalty?: number;
    /** Human-readable note that gets appended to the roll flavor. */
    note?: string;
}
/**
 * Return the actor's Blinded rank (0 when not blinded). Reads Foundry's
 * `actor.statuses` set first, then the mastery-flag `conditions`, then
 * effect names — covers the three ways the system tracks conditions.
 */
export declare function getBlindedRank(actor: any): number;
/** Stunned rank (0 when not stunned). Same lookup as Blinded. */
export declare function getStunnedRank(actor: any): number;
/**
 * Resolve the effective tag list for a check. When `context.tags` is non-
 * empty, those tags win; otherwise we look up `context.skillKey` in the
 * skill-tag registry.
 */
export declare function resolveCheckTags(context: CheckContext | undefined): CheckTag[];
/**
 * Decide whether the given actor's conditions force an auto-fail or pool
 * penalty for the given check context. Called from `masteryRoll` right
 * before the dice are rolled (so the penalty lowers the pool first, and
 * the failure flag overrides `success` post-roll).
 *
 * Returns a flat decision object — the caller decides whether to honor the
 * `dicePenalty` alone (for attacks) or also the `failed` flag (for
 * sight-based skill checks).
 */
export declare function evaluateAutoFail(actor: any, context: CheckContext | undefined, intent: 'skill' | 'attack'): AutoFailDecision;
//# sourceMappingURL=auto-fail.d.ts.map