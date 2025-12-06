/**
 * Reaction Trigger System for Mastery System
 *
 * Rules:
 * - Reactions triggered by specific events (e.g., "when attacked", "when ally damaged")
 * - Cost 1 Reaction per round
 * - Resolve immediately after trigger event
 * - Usually a contest or check vs triggering effect
 */
/**
 * Reaction trigger types
 */
export declare enum ReactionTrigger {
    WHEN_ATTACKED = "whenAttacked",// When you are targeted by an attack
    WHEN_HIT = "whenHit",// When an attack hits you
    WHEN_MISSED = "whenMissed",// When an attack misses you
    WHEN_DAMAGED = "whenDamaged",// When you take damage
    WHEN_ALLY_ATTACKED = "whenAllyAttacked",// When an ally is attacked
    WHEN_ALLY_DAMAGED = "whenAllyDamaged",// When an ally takes damage
    WHEN_ALLY_FAILS_SAVE = "whenAllyFailsSave",// When an ally fails a save
    WHEN_ENEMY_MOVES = "whenEnemyMoves",// When enemy moves (opportunity attack)
    WHEN_ENEMY_ENTERS_RANGE = "whenEnemyEntersRange",// When enemy enters your reach
    WHEN_ENEMY_LEAVES_RANGE = "whenEnemyLeavesRange",// When enemy leaves your reach
    WHEN_SPELL_CAST = "whenSpellCast",// When a spell is cast in range
    START_OF_TURN = "startOfTurn",// At start of your turn
    END_OF_TURN = "endOfTurn"
}
/**
 * Reaction data structure
 */
export interface ReactionData {
    id: string;
    name: string;
    trigger: ReactionTrigger;
    range: number;
    description: string;
    rollType?: 'attack' | 'contested' | 'save' | 'none';
    attribute?: string;
    tn?: number;
    effect: string;
    sourceItem?: string;
}
/**
 * Reaction trigger event
 */
export interface ReactionTriggerEvent {
    type: ReactionTrigger;
    actor: any;
    source?: any;
    data?: any;
}
/**
 * Get all available reactions for an actor
 */
export declare function getAvailableReactions(actor: any): ReactionData[];
/**
 * Check if actor has reactions available
 */
export declare function hasReactionAvailable(actor: any): boolean;
/**
 * Find reactions that match a trigger event
 */
export declare function findMatchingReactions(actor: any, event: ReactionTriggerEvent): ReactionData[];
/**
 * Trigger reactions for an event
 * Shows dialog to player if multiple reactions available
 */
export declare function triggerReactions(event: ReactionTriggerEvent): Promise<void>;
/**
 * Helper to trigger "when attacked" reactions
 * Call this from attack workflow before rolling
 */
export declare function triggerWhenAttackedReactions(target: any, attacker: any): Promise<void>;
/**
 * Helper to trigger "when hit" reactions
 * Call this from attack workflow after hit is confirmed
 */
export declare function triggerWhenHitReactions(target: any, attacker: any, attackResult: any): Promise<void>;
/**
 * Helper to trigger "when damaged" reactions
 * Call this from damage application
 */
export declare function triggerWhenDamagedReactions(target: any, attacker: any, damage: number): Promise<void>;
//# sourceMappingURL=reactions.d.ts.map