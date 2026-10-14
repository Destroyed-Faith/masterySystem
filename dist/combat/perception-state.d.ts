/**
 * Per-combat stealth, hidden, invisibility, and perception-check bookkeeping.
 * Stored on `actor.flags['mastery-system'].perceptionCombat`.
 */
import type { CombatSenseId } from './combat-senses.js';
export interface PerceptionCombatState {
    /** Hidden from observers (Stealth success without Invisibility). */
    hidden?: boolean;
    /**
     * Legacy: +2 Perception TN per Raise on a Stealth check (Hidden without Invis).
     * Kept for non-invis Hidden until a separate Stealth rewrite.
     */
    stealthRaiseBonus?: number;
    /**
     * Round-wide TN bonus from retroactive Stealth Skill Point spending
     * against Covered Combat Senses (Invisibility). Resets each Round.
     */
    stealthSpentThisRound?: number;
    /** Synced Invisibility Bonus from powers (informational; live bonus comes from powers). */
    invisibilityBonus?: number;
    /** @deprecated Cloak Disruption removed — ignored by effective bonus. */
    currentInvisibilityBonus?: number;
    /** Senses Obscured/Covered by Invisibility (from Passive/Buff selections). */
    blockedSenses?: CombatSenseId[];
    /**
     * Observer located target entries keyed by target actor id.
     * expiresRound: inclusive — location lasts until end of that round.
     */
    locatedTargets?: Record<string, {
        targetId: string;
        round: number;
        expiresRound: number;
    }>;
    /** Observer has used their one Perception check vs target this round (key = targetId). */
    perceptionUsedVs?: Record<string, boolean>;
    /**
     * Invisible creature attacked this round — position revealed to everyone
     * for the remainder of the round (no Perception needed).
     */
    revealedThisRound?: number;
}
export declare function emptyPerceptionCombatState(): PerceptionCombatState;
export declare function getPerceptionCombatState(actor: any): PerceptionCombatState;
export declare function setPerceptionCombatState(actor: any, patch: Partial<PerceptionCombatState>): Promise<void>;
/** Effective Invisibility Bonus from combat flags (powers preferred via profile layer). */
export declare function effectiveInvisibilityBonus(state: PerceptionCombatState): number;
/**
 * Sense Obscured by stored veil list, or by any live Invisibility Bonus
 * (Normal Combat Awareness + Darkvision). Special senses come from `blockedSenses`.
 */
export declare function isSenseBlockedOnTarget(target: any, senseId: CombatSenseId): boolean;
export declare function computeStealthRaiseBonus(raises: number): number;
/** @deprecated Cloak Disruption removed from rules — no-op identity. */
export declare function applyCloakDisruption(state: PerceptionCombatState, _amount: number): PerceptionCombatState;
export declare function markRevealedThisRound(actor: any, round?: number): Promise<void>;
export declare function isRevealedThisRound(actor: any, round?: number): boolean;
/** Clear only this observer's Perception attempts (call on their turn start). */
export declare function clearPerceptionRoundUsage(actor: any): Promise<void>;
/** New Round: attempts + attack-reveal + retroactive Stealth TN bonus. */
export declare function clearPerceptionRoundState(actor: any): Promise<void>;
export declare function hasLocatedTarget(observer: any, target: any, round: number): boolean;
/** Locate until end of the current Round (expiresRound = round). */
export declare function markLocatedTarget(observer: any, target: any, round: number): Promise<void>;
/**
 * Lost Health Bars for Invisibility TN (Healthy=0 … Broken=4).
 * Incapacitated is handled separately via `isInvisibilitySuppressedByHealth`.
 */
export declare function lostHealthBarsForInvis(actor: any): number;
export declare function isInvisibilitySuppressedByHealth(actor: any): boolean;
//# sourceMappingURL=perception-state.d.ts.map