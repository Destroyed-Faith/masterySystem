/**
 * Mark(X) Damage Floor — pure helpers (no Foundry dependency).
 *
 * Rules: when a creature hits a Marked target, it *may* spend any amount of
 * Mark. Spent Mark becomes the Damage Floor for that roll: each damage die
 * below the spent value is treated as that value. Mark is then reduced by
 * the amount spent.
 */
/**
 * Mark Damage Floor: each active damage-die face below `spend` is raised to
 * `spend`. Returns the flat bonus added to the damage total.
 * Spend 0 → no floor (attacker declined to use Mark).
 */
export declare function computeMarkFloorBonus(damageChatRolls: Array<{
    terms?: any[];
} | null | undefined>, spend: number, existingFloor?: number): number;
/** Clamp a chosen Mark spend to `[0, markOnTarget]`. */
export declare function clampMarkSpend(markOnTarget: number, chosen: number): number;
//# sourceMappingURL=mark-floor.d.ts.map