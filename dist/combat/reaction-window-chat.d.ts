/**
 * Interactive Reaction Window — chat card with per-actor buttons.
 *
 * Flow:
 *  - Posted AFTER the damage roll chat (hit) or after the attack roll (miss).
 *  - Each eligible actor may spend exactly one Reaction for this event.
 *  - After a reaction is used, the card refreshes for remaining actors.
 *  - GM / owners can Continue to close the window (damage apply resumes).
 */
import { type DefenderReactionMitigation } from './defender-reactions.js';
export interface ReactionWindowState {
    eventId: string;
    attackerId: string;
    defenderId: string;
    defenderTokenId?: string | null;
    attackTotal: number | null;
    evadeTn: number | null;
    rawDamage: number;
    hit: boolean;
    /** Actor ids that already spent a reaction on this event. */
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
}
/**
 * Post the interactive Reaction Window and wait until it is closed.
 * Call this AFTER the damage chat message on a hit (or after the attack roll on a miss).
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
}): Promise<DefenderReactionMitigation>;
export declare function registerReactionWindowChatHandlers(): void;
//# sourceMappingURL=reaction-window-chat.d.ts.map