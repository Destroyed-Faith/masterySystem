/**
 * End-of-Turn Save Ends pipeline (Players Guide ~6052–6067).
 *
 * At the end of each of their turns, an affected creature gets **one** free
 * save against an active diminishing effect:
 *   - Success → the effect's stack drops by 4 (or ends entirely when X ≤ 4).
 *   - Failure → no change; the standard 1-per-round auto-tick still applies.
 * Stunned, Brace, Stunning Strike and similar one-round timed effects do not
 * get a save (they expire at end-of-turn on their own).
 *
 * The pipeline is intentionally conservative: it never auto-rolls. It posts
 * a single chat card per turn listing the eligible effects with save
 * buttons (Body / Mind / Spirit). The player presses one and a normal save
 * roll fires through `masteryRoll`. The flag `saveEndsConsumedRound` on the
 * actor tracks that the free save for the round has been used so a second
 * save in the same end-of-turn step is not offered.
 */
type SaveCat = 'body' | 'mind' | 'spirit';
interface EligibleEffect {
    name: string;
    value: number | null;
    save: SaveCat;
    index: number;
}
/**
 * Inspect `system.statusEffects` and return the diminishing entries that
 * still have a positive stack and a Body/Mind/Spirit save category.
 */
export declare function listSaveEndsCandidates(actor: any): EligibleEffect[];
/**
 * Has this actor already used their free Save Ends this round?
 */
export declare function isSaveEndsConsumedThisRound(actor: any, round: number): Promise<boolean>;
/**
 * Roll the free Save Ends for `actor` against `effect`. Updates the actor's
 * `system.statusEffects[index].value` on success and records that the free
 * save for this round has been used.
 */
export declare function rollSaveEnd(actor: any, effect: EligibleEffect, options?: {
    sourceMR?: number;
    sourceIntellect?: number;
    round?: number;
}): Promise<{
    success: boolean;
    newValue: number | null;
    ended: boolean;
}>;
/**
 * Post a chat card listing the eligible Save Ends candidates for the
 * current combatant. The card has one button per effect; clicking it fires
 * `rollSaveEnd` and posts the result. No-op when the actor has nothing to
 * save against, or has already consumed their free save this round.
 */
export declare function postSaveEndsPromptForActor(actor: any, combat: any): Promise<void>;
/**
 * Wire the chat-button delegation. Idempotent — call once during
 * `init` / `ready` setup.
 */
export declare function registerSaveEndsChatHandlers(): void;
export {};
//# sourceMappingURL=save-ends.d.ts.map