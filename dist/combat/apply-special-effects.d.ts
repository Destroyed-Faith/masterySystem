/**
 * Rules-based Special application shared by damage resolution, NPC reactions,
 * and the GM effect service (later: Region Behaviors).
 */
/**
 * Ward total on the defender: Passive `wardIncoming` plus the Stone
 * Special Negation. `tempWard` and `incomingSpecialReduction` store the
 * same grant, so the higher one counts once.
 */
export declare function getIncomingWardTotal(target: Actor | null | undefined): number;
/**
 * Ward — reduces every eligible hostile Special(X). `value: null` means fully
 * blocked. Positive effects (e.g. Regeneration) pass through unchanged.
 */
export declare function applyWardToIncomingSpecial(target: Actor, effectId: string | undefined, effectName: string, effectValue: number | null): {
    value: number | null;
    ward: number;
    before: number | null;
};
export interface ApplySpecialStringsOptions {
    /** Skip Reactive Cleanse chat (e.g. bulk GM apply). */
    skipReactiveCleanse?: boolean;
    /** Optional token hint for status reads on unlinked actors. */
    tokenHint?: unknown;
    /**
     * When true, require a source actor for Challenge; reject with a note if missing.
     * Combat damage always has an attacker; GM tools should set this.
     */
    requireChallengeSource?: boolean;
    /** Defer token icon sync / sheet render (region apply during movement). */
    deferVisuals?: boolean;
}
/**
 * Apply status effects from specials to a target actor.
 * Challenge uses challenger-bound merge rules (sourceUuid + stack/replace).
 * Instant Specials are skipped (they never persist as statuses).
 */
export declare function applySpecialStringsToTarget(target: Actor, specialsUsed: string[], attacker?: Actor | null, options?: ApplySpecialStringsOptions): Promise<string[]>;
/** Alias kept for damage-dialog call sites. */
export declare const applyStatusEffectsToTarget: typeof applySpecialStringsToTarget;
//# sourceMappingURL=apply-special-effects.d.ts.map