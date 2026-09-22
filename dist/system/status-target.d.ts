/**
 * Resolve the live scene token for status + damage writes.
 *
 * Unlinked NPCs share the world actor's id. `game.actors.get(id)` and
 * `canvas.tokens.find(t => t.actor.id === id)` both miss the token that
 * was actually hit. Scene TokenDocument flags survive ActorDelta; actor
 * `system.statusEffects` arrays with `{ id }` do not.
 */
export declare function tokenDocOfActor(actor: any): any;
export declare function tokenIdOfActor(actor: any, fallback?: unknown): string;
/** Prefer the placed token actor; world actor is last resort. */
export declare function resolveLiveActor(actorId?: unknown, tokenId?: unknown): any;
//# sourceMappingURL=status-target.d.ts.map