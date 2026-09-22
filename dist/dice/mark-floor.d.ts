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
export type UsefulMarkSpend = {
    spend: number;
    bonus: number;
};
/**
 * Spends of 1..markOnTarget that actually raise the damage total.
 * A higher spend that does not beat a cheaper option's bonus is omitted
 * (same damage for more Mark is never useful).
 */
export declare function listUsefulMarkSpends(damageChatRolls: Array<{
    terms?: any[];
} | null | undefined>, markOnTarget: number, existingFloor?: number): UsefulMarkSpend[];
//# sourceMappingURL=mark-floor.d.ts.map