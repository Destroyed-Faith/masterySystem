/**
 * R-05 §8 — Resolve Ability: Healing pending timing.
 *
 * Paying `resolve.healing` in Preparation does NOT roll. Confirm Stone
 * Assignment only *prepares* a pending heal for the Round:
 *
 *   actor flag `resolveHealingPending` = { combatId, round, rank, spent:false }
 *
 * The owner triggers it later in the same Round — during their turn, between
 * actions, or when incoming damage is about to take HP (see
 * `offerPendingResolveHealingBeforeDamage` in `stone-resolution-ui.ts`).
 * The roll, target choice and Maximization all happen at trigger time.
 *
 * A pending heal that is not used by the end of its Round expires. The Stones
 * stay spent.
 *
 * This file is pure (no Foundry globals) so the rules are unit-testable. The
 * Foundry presentation lives in `stone-resolution-ui.ts`.
 */
import { type HealthSnapshot, type StoneTargetCandidate } from './stone-resolution.js';
export declare const RESOLVE_HEALING_PENDING_FLAG = "resolveHealingPending";
/** Power id the pending heal belongs to. */
export declare const RESOLVE_HEALING_POWER_ID = "resolve.healing";
export interface ResolveHealingPending {
    combatId: string;
    round: number;
    /** Committed Healing rank (1–4). */
    rank: number;
    spent: boolean;
}
export interface PendingCombatRef {
    id?: string | null;
    round?: number | null;
}
export declare function isResolveHealingPowerId(powerId: string): boolean;
/** Normalise whatever is stored on the flag. Returns null for junk. */
export declare function readResolveHealingPending(raw: unknown): ResolveHealingPending | null;
/**
 * Prepare (or upgrade) the pending heal for this Round. A second Healing payment in the same
 * Round before the first was used keeps the higher rank; once spent, a new payment re-arms.
 */
export declare function armResolveHealingPending(existing: unknown, combatId: string, round: number, rank: number): ResolveHealingPending;
/** Same Round clock as Stone Assignment: Preparation (round 0) counts as Round 1. */
export declare function pendingHealingRound(combat: PendingCombatRef | null | undefined): number;
/** Usable right now: same combat, same Round, not yet spent. */
export declare function isResolveHealingPendingLive(pending: ResolveHealingPending | null | undefined, combat: PendingCombatRef | null | undefined): boolean;
/**
 * True once the flag no longer has any use and should be cleared:
 * spent, wrong combat, no combat, or the Round has moved on.
 */
export declare function isResolveHealingPendingExpired(pending: ResolveHealingPending | null | undefined, combat: PendingCombatRef | null | undefined): boolean;
export declare function markResolveHealingSpent(pending: ResolveHealingPending): ResolveHealingPending;
/** `4d8 within 2 m` style label for chat / prompts. */
export declare function describePendingHealing(rank: number): string;
export declare function pendingHealingChatContent(args: {
    sourceName: string;
    rank: number;
    round: number;
    actorId: string;
}): string;
export interface TriggerResolveHealingArgs {
    pending: ResolveHealingPending | null | undefined;
    combat: PendingCombatRef | null | undefined;
    sourceName: string;
    candidates: readonly StoneTargetCandidate[];
    /** When set (damage hook), heal this target without asking. Illegal targets resolve nothing. */
    preselectedTargetId?: string | null;
    choose: (legal: readonly StoneTargetCandidate[]) => Promise<string | null>;
    /**
     * Roll at trigger time. The UI layer asks for Maximization here
     * (`offerMaximization(actor, 'healing')`) so the decision belongs to the roll that happens.
     */
    roll: (formula: string) => Promise<number>;
    healthOf: (targetId: string) => HealthSnapshot | null;
    writeHealth: (targetId: string, health: HealthSnapshot) => Promise<void> | void;
    chat: (content: string) => Promise<void> | void;
    /** Persist the spent pending heal (flag write). Called once, only after a successful heal. */
    persist: (next: ResolveHealingPending) => Promise<void> | void;
}
export interface TriggerResolveHealingResult {
    ok: boolean;
    restored: number;
    targetId: string | null;
    reason?: 'none' | 'spent' | 'expired' | 'cancelled';
}
/**
 * Resolve a prepared heal. Cancelling the target choice keeps it pending.
 * A successful heal marks it spent so it can never run twice.
 */
export declare function triggerResolveHealing(args: TriggerResolveHealingArgs): Promise<TriggerResolveHealingResult>;
/** Candidate ids that could receive the prepared heal (self + allies in the rank's range). */
export declare function pendingHealingLegalTargetIds(pending: ResolveHealingPending, candidates: readonly StoneTargetCandidate[]): string[];
//# sourceMappingURL=resolve-healing-pending.d.ts.map