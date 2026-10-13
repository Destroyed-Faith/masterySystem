/**
 * Session flags for Stone Powers encounter prompts.
 * Kept separate so close handlers can mark dismiss synchronously
 * without importing the full encounter pipeline (no cycles / no await).
 */
export declare function clearStonePowersSession(): void;
/** Explicit player/GM open (sheet, carousel, …) may reopen after ✕. */
export declare function allowStonePowersAutoOpen(): void;
export declare function stonePowersReopenBlocked(cooldownMs?: number): boolean;
/**
 * True after the player closed Stone Powers with ✕ this round.
 * Round advance clears the block automatically.
 */
export declare function stonePowersAutoOpenSuppressed(): boolean;
export declare function isStonePowersDismissed(combatId: string, actorId: string, round: number, combatantId?: string | null): boolean;
/**
 * Mark Stone Powers as dismissed for this combat round.
 * Call synchronously on ✕ / Escape — before any await — so a concurrent
 * encounter resume cannot reopen the dialog.
 */
export declare function dismissStonePowersPrompt(combat: Combat | null | undefined, actor: Actor | null | undefined, combatant?: Combatant | null): void;
export declare function logStonePowersGate(reason: string, detail?: Record<string, unknown>): void;
//# sourceMappingURL=stone-powers-session.d.ts.map