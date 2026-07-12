/**
 * Per-combat stealth, hidden, invisibility, and perception-check bookkeeping.
 * Stored on `actor.flags['mastery-system'].perceptionCombat`.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface PerceptionCombatState {
    /** Hidden from observers (Stealth success without Invisibility). */
    hidden?: boolean;
    /** +2 Perception TN per Raise on the Stealth check. */
    stealthRaiseBonus?: number;
    /** Base Invisibility Bonus (restores at start of owner's next turn). */
    invisibilityBonus?: number;
    /** Current Invisibility Bonus after Cloak Disruption this round. */
    currentInvisibilityBonus?: number;
    /** Senses blocked on this creature (from Invisibility / veils / effects). */
    blockedSenses?: CombatSenseId[];
    /**
     * Observer located target entries keyed by target actor id.
     * expiresRound: inclusive round through which location lasts.
     */
    locatedTargets?: Record<string, {
        targetId: string;
        round: number;
        expiresRound: number;
    }>;
    /** Observer has used their one Perception check vs target this round (key = targetId). */
    perceptionUsedVs?: Record<string, boolean>;
    /**
     * Defender vs invisible attacker this turn (key = attacker actor id).
     */
    perceivedInvisibleAttacker?: Record<string, {
        success: boolean;
        round: number;
    }>;
}
export declare function emptyPerceptionCombatState(): PerceptionCombatState;
export declare function getPerceptionCombatState(actor: any): PerceptionCombatState;
export declare function setPerceptionCombatState(actor: any, patch: Partial<PerceptionCombatState>): Promise<void>;
export declare function effectiveInvisibilityBonus(state: PerceptionCombatState): number;
export declare function isSenseBlockedOnTarget(target: any, senseId: CombatSenseId): boolean;
export declare function computeStealthRaiseBonus(raises: number): number;
/** Cloak Disruption — reduce current invisibility bonus; clears stealth raise bonus. */
export declare function applyCloakDisruption(state: PerceptionCombatState, amount: number): PerceptionCombatState;
export declare function resetInvisibilityAtTurnStart(actor: any): Promise<void>;
export declare function clearPerceptionRoundUsage(actor: any): Promise<void>;
export declare function hasLocatedTarget(observer: any, target: any, round: number): boolean;
export declare function markLocatedTarget(observer: any, target: any, round: number): Promise<void>;
//# sourceMappingURL=perception-state.d.ts.map