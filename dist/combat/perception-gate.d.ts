/**
 * Perception gating — can an observer perceive / target a creature through Combat Senses?
 *
 * Mechanical perception only. Foundry Token Vision (sight range, vision
 * mode, enabled flag) and the scene lighting layer (`src/vision`) are
 * rendering for the user and are deliberately not consulted here.
 *
 * Invisibility TN (rules):
 *   (4 × MR) + Invisibility Bonus − (Lost Health Bars × MR) + Stealth Spent
 */
import type { CombatSenseId } from './combat-senses.js';
export interface PerceptionGateResult {
    canTarget: boolean;
    needsPerceptionCheck: boolean;
    reason: string;
    /** Sense used if already perceived without a fresh check. */
    senseUsed?: CombatSenseId;
}
/**
 * Perception TN vs an invisible (or hidden+invis) creature.
 * Hidden-only (no invis) still uses legacy stealthRaiseBonus on top of a flat base
 * so non-invis Stealth keeps working until a separate rewrite.
 */
export declare function computePerceptionTn(target: any, _observer?: any): number;
/**
 * Whether `observer` can directly perceive `target` for targeting without a new Perception check.
 */
export declare function evaluatePerceptionGate(observer: any, target: any, opts?: {
    observerToken?: any;
    targetToken?: any;
    combatRound?: number;
    forTargeting?: boolean;
}): PerceptionGateResult;
/** Filter token ids to those the attacker can attempt to target (may still need Perception). */
export declare function filterPerceivableTargetIds(attackerActor: any, candidateTokenIds: Iterable<string>, attackerToken?: any): Set<string>;
/**
 * Interactive gate before attack targeting. Returns true if targeting may proceed.
 * On failure the action is not spent.
 */
export declare function ensureCanTargetWithPerception(observer: any, target: any, opts?: {
    observerToken?: any;
    targetToken?: any;
}): Promise<boolean>;
/**
 * After the observer's final Perception result is known, the invisible creature
 * may spend Stealth Skill Points (min = MR, steps of MR, All-in ok) to raise TN.
 * Returns points actually spent this prompt (already added to stealthSpentThisRound).
 */
export declare function promptRetroactiveStealthSpend(invisibleActor: any, observerResult: number, currentTn: number): Promise<number>;
/** For conditional passives: target perceived through non-sight sense? */
export declare function targetPerceivedByNonSightSense(observer: any, target: any): boolean;
/** For ambusher passive: target unseen by observer? */
export declare function targetUnseenByObserver(observer: any, target: any): boolean;
/**
 * @deprecated Half-Evade vs invisible attackers removed — always full Evade.
 * Kept as a stub so older call sites compile until cleaned.
 */
export declare function shouldUseHalfEvadeVsAttacker(_defender: any, _attacker: any, _round: number): boolean;
/**
 * Attacking does not interrupt Invisibility. Evade is never halved.
 * Ordinary Stealth hiding still ends on the attacker's side.
 */
export declare function resolveEvadeVsInvisibleAttacker(_defender: any, attacker: any, _opts?: {
    defenderToken?: any;
    attackerToken?: any;
}): Promise<{
    evadeMultiplier: 1;
}>;
/**
 * Attacking does not interrupt Invisibility — the creature stays Obscured to
 * covered Combat Senses; observers use normal Perception to locate/target.
 * Ordinary Stealth hiding (no Invisibility) ends when attacking.
 */
export declare function endOrdinaryStealthOnAttack(attacker: any): Promise<void>;
/** @deprecated Use {@link endOrdinaryStealthOnAttack} — Invisibility is no longer revealed by attacking. */
export declare function revealInvisibleAttacker(attacker: any): Promise<void>;
//# sourceMappingURL=perception-gate.d.ts.map