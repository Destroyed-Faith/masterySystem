/**
 * Canonical dice-pool finalization — single source of truth for the
 * Player's Guide "Order of Pool Reduction". Used by `masteryRoll` for the
 * actual roll AND by UI previews so both always agree.
 *
 * Input pool = base attribute pool + skill full-/half-pool rule + situational
 * caller modifiers (range band, split attack) + mechanics/manual flat dice.
 *
 * This stage then applies, in this exact order:
 *   (a) flat Special reductions — Disoriented (Auto-Fail engine),
 *       Weaken / Soulburn (by pool attribute), Challenge (attack targeting),
 *       Fear (1 die per accumulated Fear)
 *   (b) percentage-based Health / Encumbrance penalty (dice loss floored)
 *   (c) A pool of 0 dice fails. Keep cannot exceed the dice that remain.
 */
import { type CheckContext } from '../system/auto-fail.js';
export interface FinalizePoolOptions {
    /** 'attack' enables the Challenge reduction and attack-intent auto-fail. */
    rollKind?: 'attack' | 'skill' | 'damage' | 'contest' | 'generic';
    /** Attribute the pool is built from — drives Weaken / Soulburn. */
    poolAttribute?: string;
    /** Target refs of the attack (actor ids / uuids / token ids). */
    targetRefs?: string[];
    /** Auto-Fail engine context (Disoriented etc.). */
    checkContext?: CheckContext;
    autoFailIntent?: 'skill' | 'attack';
    /** Apply the percentage Health / Encumbrance penalty (default true). */
    applyPoolPenalties?: boolean;
    /** When omitted, Fear applies to attribute / attack / skill pools (see `shouldApplyFearToPool`). */
    applyFear?: boolean;
}
/** Whether Fear dice come off this pool (after flat specials, before Health %). */
export declare function shouldApplyFearToPool(options?: FinalizePoolOptions): boolean;
export interface FinalizePoolResult {
    numDice: number;
    /** Notes describing each applied stage (for flavor / preview tooltips). */
    notes: string[];
    /** Forced-failure reason from the Auto-Fail engine, if any. */
    autoFailReason?: string;
}
/**
 * Apply canonical stages (a)–(c) to `basePool`. Pure & synchronous so UI
 * previews can call it directly.
 */
export declare function finalizeRolledPool(actor: any, basePool: number, keepDice: number, options?: FinalizePoolOptions): FinalizePoolResult;
//# sourceMappingURL=pool-finalize.d.ts.map