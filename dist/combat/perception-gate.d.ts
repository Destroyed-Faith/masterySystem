/**
 * Perception gating — can an observer perceive / target a creature through Combat Senses?
 */
import type { CombatSenseId } from './combat-senses.js';
export interface PerceptionGateResult {
    canTarget: boolean;
    needsPerceptionCheck: boolean;
    reason: string;
    /** Sense used if already perceived without a fresh check. */
    senseUsed?: CombatSenseId;
}
/** Perception TN to locate/read a hidden or invisible target. */
export declare function computePerceptionTn(target: any, observer?: any): number;
/**
 * Whether `observer` can directly perceive `target` for targeting without a new Perception check.
 * Does not prompt — use `ensureCanTarget` for interactive flow.
 */
export declare function evaluatePerceptionGate(observer: any, target: any, opts?: {
    observerToken?: any;
    targetToken?: any;
    combatRound?: number;
    /** Direct targeting attempt — triggers perception requirement when blocked. */
    forTargeting?: boolean;
}): PerceptionGateResult;
/** Filter token ids to those the attacker can attempt to target (may still need Perception). */
export declare function filterPerceivableTargetIds(attackerActor: any, candidateTokenIds: Iterable<string>, attackerToken?: any): Set<string>;
/**
 * Interactive gate before attack targeting. Returns true if targeting may proceed.
 * On failure without spending action, returns false (per rules).
 */
export declare function ensureCanTargetWithPerception(observer: any, target: any, opts?: {
    observerToken?: any;
    targetToken?: any;
}): Promise<boolean>;
/** For conditional passives: target perceived through non-sight sense? */
export declare function targetPerceivedByNonSightSense(observer: any, target: any): boolean;
/** For ambusher passive: target unseen by observer? */
export declare function targetUnseenByObserver(observer: any, target: any): boolean;
/** Half Evade when defender failed to perceive invisible attacker. */
export declare function shouldUseHalfEvadeVsAttacker(defender: any, attacker: any, round: number): boolean;
export declare function recordInvisibleAttackerPerception(defender: any, attacker: any, success: boolean, round: number): Promise<void>;
/**
 * Attacking from Invisibility — defender Perception vs attacker; half Evade on failure.
 * Returns multiplier 1 (full Evade) or 0.5 (half Evade).
 */
export declare function resolveEvadeVsInvisibleAttacker(defender: any, attacker: any, opts?: {
    defenderToken?: any;
    attackerToken?: any;
}): Promise<{
    evadeMultiplier: 1 | 0.5;
}>;
//# sourceMappingURL=perception-gate.d.ts.map