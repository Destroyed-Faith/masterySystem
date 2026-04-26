/**
 * Reset a character back to "creation mode" while preserving:
 *   - the actor document's `name` and `img` (portrait),
 *   - the lifetime `system.xp.totalEarned` XP pool (so the player can
 *     re-spend every XP they ever earned),
 *   - the `system.xp.history` audit log (for GM traceability).
 *
 * Everything else that lives on `system.*` or as an embedded Item (powers,
 * gear, weapons, armor, schticks, artifacts, conditions, echo items, …)
 * is wiped. `system.creation.complete` is set to `false` so the character
 * sheet drops back into creation mode, and `system.points.xp` is refilled
 * with the full `totalEarned` amount. Post-creation snapshot, attribute
 * baselines, and all roll/manual-adjustment data are cleared too.
 *
 * GM-only (callers enforce the permission check).
 */
export interface ResetCharacterResult {
    ok: boolean;
    error?: string;
    removedItemCount: number;
    returnedXp: number;
}
/**
 * Wipe the character back to creation-ready state. Keeps name, portrait,
 * ownership, folder, flags, prototype token, and the lifetime earned-XP
 * figure. Everything else (items, attributes, skills, powers, echo, bio
 * fields, passive slots, manual adjustments, health/stress overrides,
 * saves, faith fractures, minor expressions, disadvantages, schticks, and
 * derived bookkeeping) is reset to the template baseline.
 */
export declare function resetCharacterForRecreation(actor: any, options: {
    gmUserId: string;
    gmUserName: string;
}): Promise<ResetCharacterResult>;
//# sourceMappingURL=reset-character.d.ts.map