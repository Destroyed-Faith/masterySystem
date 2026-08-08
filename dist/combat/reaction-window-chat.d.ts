/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Two phases:
 *  1. `defender` — direct target, right after the attack Roll (before damage).
 *  2. `others` — allies / other reactors, after the damage roll is posted.
 *
 * Each actor may spend exactly one Reaction per event. After a reaction is used,
 * the card refreshes for remaining actors. Continue closes the window.
 */
import { type DefenderReactionMitigation } from './defender-reactions.js';
/** Defender = target after attack roll; others = allies after damage roll. */
export type ReactionWindowPhase = 'defender' | 'others';
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
 * - `others`: call after the damage roll chat is posted.
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