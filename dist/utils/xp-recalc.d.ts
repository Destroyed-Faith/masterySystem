/**
 * Ground-truth XP recalculation.
 *
 * Recomputes a character's *invested* XP directly from the current build
 * (attributes, skills, power levels) measured against the immutable
 * post-creation baseline, then derives the correct available XP as
 * `available = totalEarned − invested`.
 *
 * This deliberately ignores the XP history log, so it self-corrects accounting
 * drift caused by buggy / duplicated refund entries (e.g. the old Combat
 * Package Wizard "power upgrade refund" over-refund).
 */
export interface XpRecalcResult {
    ok: boolean;
    error?: string;
    totalEarned: number;
    freeEarned: number;
    freeAvailable: number;
    attributeSpent: number;
    skillSpent: number;
    powerSpent: number;
    totalSpent: number;
    available: number;
    previousAvailable: number;
    previousSpent: number;
    /** `available − previousAvailable` (negative means XP was removed). */
    delta: number;
}
/**
 * Recompute the correct XP balance for `actor` from its current build.
 * Returns `ok:false` with an `error` when no post-creation snapshot exists
 * (attributes / skills cannot be measured without a baseline).
 */
export declare function computeGroundTruthXp(actor: any): XpRecalcResult;
/** HTML breakdown for the GM confirm dialog. */
export declare function formatXpRecalcHtml(actorName: string, r: XpRecalcResult): string;
//# sourceMappingURL=xp-recalc.d.ts.map