/**
 * Foundry presentation for the post-commit Stone resolution queue.
 * Healing and Stress Healing open a target dialog. Other interactive powers
 * keep the apply they already had.
 */
import { type ResolveHealingPending, type TriggerResolveHealingResult } from './resolve-healing-pending.js';
import { type StoneResolutionTicket, type StoneTargetCandidate } from './stone-resolution.js';
export declare function stoneTargetCandidates(source: any, preferred?: any): StoneTargetCandidate[];
export declare function postStonePowerChat(content: string, pendingCard?: {
    combatantId: string;
    round: number;
}): Promise<void>;
/** Raw pending heal on an actor (may be spent / stale). */
export declare function readActorResolveHealingPending(actor: any): ResolveHealingPending | null;
/** Pending heal that can be used right now, else null. */
export declare function getLiveResolveHealingPending(actor: any): ResolveHealingPending | null;
/**
 * Trigger the prepared Healing: choose target (unless preselected), offer Maximization on the
 * roll, roll, apply to the current Health Bar, mark spent. Safe against double-click.
 */
export declare function usePendingResolveHealing(source: any, combatant: any, opts?: {
    targetActor?: any;
}): Promise<TriggerResolveHealingResult>;
/**
 * Damage hook (R-05 §8): before incoming damage takes HP from `target`, offer any live prepared
 * Healing whose owner may legally heal that target (self, or an ally inside the rank's range).
 * Only the healer's owner (or the GM) is prompted. Returns total HP restored.
 */
export declare function offerPendingResolveHealingBeforeDamage(target: any, incomingDamage: number): Promise<{
    offered: number;
    used: number;
    restored: number;
}>;
/** Drop spent / stale prepared Healing (call on Round change and combat end). */
export declare function expireStaleResolveHealingPending(combat: any): Promise<number>;
/** Bind the "Use Healing now" button on prepared-Healing chat cards. */
export declare function registerResolveHealingChatHandlers(): void;
/** Resolve one committed ticket. False means the player still has to choose. */
export declare function presentStoneResolution(actor: any, combatant: any, ticket: StoneResolutionTicket): Promise<boolean>;
//# sourceMappingURL=stone-resolution-ui.d.ts.map