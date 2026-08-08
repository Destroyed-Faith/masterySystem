/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Phases:
 *  1. `defender` — direct target, right after the attack Roll (before damage).
 *  2. `others` — after the original attack fully resolves: Threatened Ranged
 *     Opportunity Attacks + Ally reaction powers in one shrinking summary.
 *  3. `opportunity` — legacy/standalone OA-only window (same post-resolve rules).
 *
 * Each actor may spend exactly one Reaction per event. After a reaction is used
 * or declined, that actor drops off the card until nobody remains.
 * Post-attack OAs launch without pausing the summary (parallel OK).
 */
import { type DefenderReactionMitigation } from './defender-reactions.js';
/**
 * - defender: target after attack roll (before damage)
 * - others: OA + allies after the original attack fully resolves
 * - opportunity: OA-only window (same timing / parallel rules as others)
 */
export type ReactionWindowPhase = 'defender' | 'others' | 'opportunity';
export interface ReactionWindowState {
    eventId: string;
    phase: ReactionWindowPhase;
    attackerId: string;
    defenderId: string;
    defenderTokenId?: string | null;
    attackTotal: number | null;
    evadeTn: number | null;
    rawDamage: number;
    hit: boolean;
    /** Actor ids that already spent a reaction on this event (shared across phases). */
    spentActorIds: string[];
    /** Log of used reactions for the card. */
    used: Array<{
        actorId: string;
        actorName: string;
        powerId: string;
        powerName: string;
    }>;
    /** Accumulated defender mitigation (ally spends do not merge here). */
    mitigation: DefenderReactionMitigation;
    resolved: boolean;
    /** Message id of the preceding damage chat (hit path), for optional updates. */
    damageMessageId?: string | null;
    /** Threatened Ranged OA token ids (enemies who may strike the shooter). */
    opportunityEnemyTokenIds?: string[];
    /** Nested reaction-counterattack windows: hide Counterattack to avoid deep pauses. */
    suppressCounterattack?: boolean;
    /**
     * True when this chat card was replaced by a newer copy posted below
     * (post-attack summary repost). Not a real close — waiters must not resolve.
     */
    superseded?: boolean;
}
/** Result of a reaction phase (mitigation + who already spent). */
export interface ReactionPhaseResult {
    mitigation: DefenderReactionMitigation;
    eventId: string;
    spentActorIds: string[];
    used: Array<{
        actorId: string;
        actorName: string;
        powerId: string;
        powerName: string;
    }>;
}
/**
 * Post an interactive Reaction Window for one phase and wait until it is closed.
 *
 * - `defender`: call after the attack Roll (before damage dialog).
 * - `others` / `opportunity`: call after the attack fully resolves; each
 *   Use/Decline reposts a fresh summary at the bottom of chat.
 */
export declare function runInteractiveReactionWindow(params: {
    defender: Actor;
    attacker: Actor;
    combat: Combat | null;
    rawDamage: number;
    attackTotal?: number | null;
    evadeTn?: number | null;
    hit: boolean;
    damageMessageId?: string | null;
    /** Defaults to `defender` for backward compatibility. */
    phase?: ReactionWindowPhase;
    /** Carry over from a prior phase of the same attack event. */
    eventId?: string;
    spentActorIds?: string[];
    used?: ReactionWindowState['used'];
    priorMitigation?: DefenderReactionMitigation;
    /**
     * When true and nobody can act, skip posting a chat card (used for ally phase).
     * Defender phase still posts an info card so the table sees "no reactions left".
     */
    silentIfEmpty?: boolean;
    /** Threatened Ranged: token ids that may spend a Reaction for an Opportunity Attack. */
    opportunityEnemyTokenIds?: string[] | null;
    /** Hide Counterattack buttons (nested reaction-counterattack resolution). */
    suppressCounterattack?: boolean;
}): Promise<ReactionPhaseResult>;
export declare function registerReactionWindowChatHandlers(): void;
//# sourceMappingURL=reaction-window-chat.d.ts.map